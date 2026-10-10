// Rinde: Tresor-Logik. Alles, was mit Supabase und Verschlüsselung zu tun hat.
// Die Oberfläche (js/seiten/rinde.js) kennt nur diese Funktionen.

import { supabase } from '../kern/supabase.js';
import {
  STANDARD_ITERATIONEN, neuesSalz, schluesselAbleiten,
  verschluesseln, entschluesseln, zuBase64, ausBase64,
} from '../kern/krypto.js';
import { alleVerbindungenLoeschen } from '../kern/verbindungen.js';

let schluessel = null; // lebt nur im Arbeitsspeicher, solange Rinde offen ist
let eintraege = [];    // entschlüsselt: [{ id, geaendertAm, daten: { name, adresse, benutzer, passwort, notiz } }]

export const zustand = {
  get offen() { return schluessel !== null; },
  get eintraege() { return eintraege; },
};

// 'neu' = noch kein Master-Passwort angelegt, 'gesperrt', 'offen'
export async function tresorStatus() {
  const { data, error } = await supabase.from('rinde_schluessel').select('user_id').maybeSingle();
  if (error) throw error;
  if (!data) return 'neu';
  return schluessel ? 'offen' : 'gesperrt';
}

export async function tresorEinrichten(masterPasswort) {
  const salz = neuesSalz();
  const key = await schluesselAbleiten(masterPasswort, salz, STANDARD_ITERATIONEN);
  const pruefwert = await verschluesseln(key, { grove: 'rinde' });
  const { error } = await supabase
    .from('rinde_schluessel')
    .insert({ salz: zuBase64(salz), iterationen: STANDARD_ITERATIONEN, pruefwert });
  if (error) throw error;
  schluessel = key;
  eintraege = [];
}

// Gibt false zurück, wenn das Master-Passwort falsch ist.
export async function entsperren(masterPasswort) {
  const { data, error } = await supabase
    .from('rinde_schluessel')
    .select('salz, iterationen, pruefwert')
    .single();
  if (error) throw error;

  const key = await schluesselAbleiten(masterPasswort, ausBase64(data.salz), data.iterationen);
  try {
    await entschluesseln(key, data.pruefwert);
  } catch {
    return false;
  }
  schluessel = key;
  await laden();
  return true;
}

export function sperren() {
  schluessel = null;
  eintraege = [];
}

async function laden() {
  const { data, error } = await supabase
    .from('rinde_eintraege')
    .select('id, daten, geaendert_am');
  if (error) throw error;

  eintraege = [];
  for (const zeile of data) {
    try {
      eintraege.push({
        id: zeile.id,
        geaendertAm: zeile.geaendert_am,
        daten: await entschluesseln(schluessel, zeile.daten),
      });
    } catch {
      // beschädigter Eintrag – überspringen statt alles abbrechen
    }
  }
  sortieren();
}

function sortieren() {
  eintraege.sort((a, b) => a.daten.name.localeCompare(b.daten.name, 'de', { sensitivity: 'base' }));
}

// id = null legt neu an. Gibt die ID des gespeicherten Eintrags zurück.
export async function speichern(id, daten) {
  if (!schluessel) throw new Error('Rinde ist gesperrt.');
  const verschluesselt = await verschluesseln(schluessel, daten);
  const jetzt = new Date().toISOString();

  if (id) {
    const { error } = await supabase
      .from('rinde_eintraege')
      .update({ daten: verschluesselt, geaendert_am: jetzt })
      .eq('id', id);
    if (error) throw error;
    const e = eintraege.find((x) => x.id === id);
    if (e) { e.daten = daten; e.geaendertAm = jetzt; }
  } else {
    const { data, error } = await supabase
      .from('rinde_eintraege')
      .insert({ daten: verschluesselt })
      .select('id, geaendert_am')
      .single();
    if (error) throw error;
    id = data.id;
    eintraege.push({ id, geaendertAm: data.geaendert_am, daten });
  }
  sortieren();
  return id;
}

export async function loeschen(id) {
  const { error } = await supabase.from('rinde_eintraege').delete().eq('id', id);
  if (error) throw error;
  eintraege = eintraege.filter((e) => e.id !== id);
  try {
    await alleVerbindungenLoeschen({ typ: 'rinde', id });
  } catch {
    // Eintrag ist weg; verwaiste Verbindungen werden später als "Gelöscht" angezeigt
  }
}

export function hostVon(adresse) {
  if (!adresse) return '';
  try {
    const url = new URL(adresse.includes('://') ? adresse : `https://${adresse}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Passt der Eintrag zur Seite? login.github.com findet auch einen Eintrag für github.com.
export function passtZuSeite(eintrag, seite) {
  const h = hostVon(eintrag.daten.adresse);
  const s = String(seite).replace(/^www\./, '').toLowerCase();
  if (!h || !s) return false;
  return h === s || s.endsWith(`.${h}`) || h.endsWith(`.${s}`);
}

export function filtern(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return eintraege;
  return eintraege.filter((e) =>
    passtZuSeite(e, t) ||
    [e.daten.name, e.daten.benutzer, e.daten.adresse].some((f) => (f || '').toLowerCase().includes(t))
  );
}
