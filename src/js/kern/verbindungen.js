// Grove-Kern: Verbindungen zwischen Objekten aller Dienste.
//
// Ein Objekt wird überall gleich beschrieben: { typ: 'myzel', id: '…' }
// typ = Kürzel des Dienstes, id = ID des Objekts in seiner eigenen Tabelle.
// Verbindungen sind ungerichtet: verknuepfen(A, B) ist dasselbe wie verknuepfen(B, A).

import { supabase } from './supabase.js';

const TABELLE = 'verbindungen';

// Werte für PostgREST-Filter in Anführungszeichen setzen (schützt vor Kommas/Klammern in IDs).
const q = (wert) => `"${String(wert).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// Verbindet zwei Objekte. Gibt die neue Verbindung zurück,
// oder null, wenn die beiden schon verbunden waren.
export async function verknuepfen(von, nach, notiz = null) {
  const { data, error } = await supabase
    .from(TABELLE)
    .insert({
      von_typ: von.typ,
      von_id: String(von.id),
      nach_typ: nach.typ,
      nach_id: String(nach.id),
      notiz,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return null; // Paar existiert schon
    throw error;
  }
  return data;
}

// Alle Objekte, die mit obj verbunden sind – immer aus Sicht von obj.
// Ergebnis: [{ verbindungId, typ, id, notiz, erstelltAm }]
export async function verbindungenVon(obj) {
  const typ = obj.typ;
  const id = String(obj.id);

  const { data, error } = await supabase
    .from(TABELLE)
    .select('*')
    .or(
      `and(von_typ.eq.${q(typ)},von_id.eq.${q(id)}),` +
      `and(nach_typ.eq.${q(typ)},nach_id.eq.${q(id)})`
    )
    .order('erstellt_am', { ascending: false });

  if (error) throw error;

  return data.map((v) => {
    const ichBinVon = v.von_typ === typ && v.von_id === id;
    return {
      verbindungId: v.id,
      typ: ichBinVon ? v.nach_typ : v.von_typ,
      id: ichBinVon ? v.nach_id : v.von_id,
      notiz: v.notiz,
      erstelltAm: v.erstellt_am,
    };
  });
}

export async function verbindungLoesen(verbindungId) {
  const { error } = await supabase.from(TABELLE).delete().eq('id', verbindungId);
  if (error) throw error;
}

// Aufräumen, wenn ein Objekt gelöscht wird. Jeder Dienst ruft das beim Löschen auf.
export async function alleVerbindungenLoeschen(obj) {
  const id = String(obj.id);
  const [a, b] = await Promise.all([
    supabase.from(TABELLE).delete().eq('von_typ', obj.typ).eq('von_id', id),
    supabase.from(TABELLE).delete().eq('nach_typ', obj.typ).eq('nach_id', id),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
}
