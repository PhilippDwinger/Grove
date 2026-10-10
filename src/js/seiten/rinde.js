// ==========================================================
// Rinde · Seite (src/dienste/rinde/index.html)
// Oberfläche: Einrichten, Entsperren, Liste, Bearbeiten, Generator.
// Tresor-Logik (Supabase + Verschlüsselung) steckt in js/rinde/tresor.js
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import '../kern/schutz.js';
import '../glocke.js';
import '../nutzermenue.js';
import '../kern/alle-dienste.js';
import { esc } from '../kern/html.js';
import { sucheEinrichten } from '../kern/suche.js';
import { verbindungsBereich } from '../kern/verknuepfen.js';
import * as tresor from '../rinde/tresor.js';
import { passwortErzeugen, staerkeBits, staerkeWort, zeichenArt, STANDARD } from '../rinde/generator.js';

const SPERRE_NACH_MS = 10 * 60 * 1000; // nach 10 Minuten ohne Aktivität sperren
const LEEREN_NACH_MS = 30 * 1000;      // Zwischenablage nach 30 Sekunden leeren

const app = document.getElementById('rinde');
const sperrKnopf = document.getElementById('sperren');
const params = new URLSearchParams(location.search);
const seite = params.get('seite') || ''; // vom Lesezeichen: Domain der Login-Seite

let filter = seite;
let gewaehlt = params.get('eintrag'); // ID, 'neu' oder null
let genOptionen = optionenLaden();
let sperrTimer = null;
let leerTimer = null;

sucheEinrichten();
sperrKnopf.addEventListener('click', sperrenUndZeigen);
for (const ereignis of ['pointerdown', 'keydown']) {
  document.addEventListener(ereignis, () => { if (tresor.zustand.offen) sperrTimerStarten(); }, { passive: true });
}

start();

// ---------- Ablauf ----------

async function start() {
  app.innerHTML = '<p class="r-status">Rinde wird geöffnet …</p>';
  try {
    (await tresor.tresorStatus()) === 'neu' ? zeigeEinrichten() : zeigeGesperrt();
  } catch (e) {
    app.innerHTML = `<p class="r-status g-fehler">Rinde ist gerade nicht erreichbar: ${esc(e.message)}</p>`;
  }
}

function zeigeEinrichten() {
  sperrKnopf.hidden = true;
  app.innerHTML = `
    <form class="r-tor" novalidate>
      <h2>Rinde einrichten</h2>
      <p>Rinde verschlüsselt deine Passwörter mit einem Master-Passwort, bevor sie deinen Browser verlassen. Nur du kannst sie lesen, auch die Datenbank nicht.</p>
      <p class="r-warnung">Das Master-Passwort lässt sich nicht zurücksetzen. Wenn du es vergisst, sind die gespeicherten Passwörter verloren.</p>
      <label class="r-feld"><span>Master-Passwort</span><input type="password" name="pw1" autocomplete="new-password"></label>
      <label class="r-feld"><span>Noch einmal</span><input type="password" name="pw2" autocomplete="new-password"></label>
      <p class="r-meldung" role="alert"></p>
      <button class="g-knopf" type="submit">Rinde einrichten</button>
    </form>`;

  const form = app.querySelector('form');
  const meldung = form.querySelector('.r-meldung');
  form.elements.pw1.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const a = form.elements.pw1.value;
    const b = form.elements.pw2.value;
    if (a.length < 12) {
      meldung.textContent = 'Nimm mindestens 12 Zeichen. Ein Satz, den du dir merken kannst, eignet sich gut.';
      return;
    }
    if (a !== b) {
      meldung.textContent = 'Die beiden Eingaben stimmen nicht überein.';
      return;
    }
    beschaeftigt(form, true, 'Wird eingerichtet …');
    try {
      await tresor.tresorEinrichten(a);
      zeigeOffen();
    } catch (err) {
      meldung.textContent = `Einrichten fehlgeschlagen: ${err.message}`;
      beschaeftigt(form, false);
    }
  });
}

function zeigeGesperrt() {
  sperrKnopf.hidden = true;
  app.innerHTML = `
    <form class="r-tor" novalidate>
      <h2>Rinde ist gesperrt</h2>
      ${seite ? `<p>Du willst dich bei <strong>${esc(seite)}</strong> anmelden.</p>` : ''}
      <label class="r-feld"><span>Master-Passwort</span><input type="password" name="pw" autocomplete="current-password"></label>
      <p class="r-meldung" role="alert"></p>
      <button class="g-knopf" type="submit">Entsperren</button>
    </form>`;

  const form = app.querySelector('form');
  const meldung = form.querySelector('.r-meldung');
  form.elements.pw.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.elements.pw.value) {
      meldung.textContent = 'Gib dein Master-Passwort ein.';
      return;
    }
    meldung.textContent = '';
    beschaeftigt(form, true, 'Wird entsperrt …');
    try {
      const ok = await tresor.entsperren(form.elements.pw.value);
      if (ok) return zeigeOffen();
      meldung.textContent = 'Das Master-Passwort stimmt nicht.';
      form.elements.pw.select();
    } catch (err) {
      meldung.textContent = `Entsperren fehlgeschlagen: ${err.message}`;
    }
    beschaeftigt(form, false);
  });
}

function zeigeOffen() {
  sperrKnopf.hidden = false;
  sperrTimerStarten();

  if (seite && !gewaehlt) {
    const passend = tresor.filtern(seite);
    if (passend.length === 1) gewaehlt = passend[0].id;
  }

  app.innerHTML = `
    <div class="r-offen">
      <aside class="r-liste">
        <div class="r-liste-kopf">
          <input type="search" class="r-filter" placeholder="Name oder Adresse" aria-label="Einträge filtern" value="${esc(filter)}">
          <button type="button" class="g-knopf" data-neu>Neu</button>
        </div>
        <ul class="r-eintraege"></ul>
        <details class="r-lesezeichen">
          <summary>Beim Anmelden schnell finden</summary>
          <p>Zieh diesen Link in deine Lesezeichenleiste. Klickst du ihn auf einer Login-Seite an, öffnet sich Rinde mit den passenden Einträgen.</p>
          <a class="r-lesezeichen-link" href="${esc(lesezeichenCode())}">Grove-Passwort</a>
        </details>
      </aside>
      <section class="r-detail"></section>
    </div>`;

  const feld = app.querySelector('.r-filter');
  feld.addEventListener('input', () => { filter = feld.value; listeZeichnen(); });
  app.querySelector('[data-neu]').addEventListener('click', () => { gewaehlt = 'neu'; listeZeichnen(); detailZeichnen(); });
  app.querySelector('.r-lesezeichen-link').addEventListener('click', (e) => e.preventDefault());

  listeZeichnen();
  detailZeichnen();
}

// ---------- Liste ----------

function listeZeichnen() {
  const ul = app.querySelector('.r-eintraege');
  if (!ul) return;
  const liste = tresor.filtern(filter);

  if (!tresor.zustand.eintraege.length) {
    ul.innerHTML = '<li class="r-leer">Noch keine Passwörter. Leg mit „Neu“ das erste an.</li>';
    return;
  }
  if (!liste.length) {
    ul.innerHTML = `<li class="r-leer">Nichts passt zu „${esc(filter)}“.</li>`;
    return;
  }

  ul.innerHTML = liste.map((e) => `
    <li>
      <button type="button" class="r-eintrag" data-id="${esc(e.id)}" aria-current="${e.id === gewaehlt}">
        <span class="r-eintrag-name">${esc(e.daten.name)}</span>
        <span class="r-eintrag-info">${esc(e.daten.benutzer || tresor.hostVon(e.daten.adresse) || 'Ohne Benutzer')}</span>
      </button>
    </li>`).join('');

  ul.querySelectorAll('.r-eintrag').forEach((b) => b.addEventListener('click', () => {
    gewaehlt = b.dataset.id;
    listeZeichnen();
    detailZeichnen();
  }));
}

// ---------- Detail / Bearbeiten ----------

function detailZeichnen() {
  const box = app.querySelector('.r-detail');
  if (!box) return;
  const eintrag = gewaehlt && gewaehlt !== 'neu' ? tresor.zustand.eintraege.find((e) => e.id === gewaehlt) : null;

  if (!eintrag && gewaehlt !== 'neu') {
    box.innerHTML = '<div class="r-detail-leer"><p>Wähl links einen Eintrag oder leg einen neuen an.</p></div>';
    return;
  }

  const d = eintrag
    ? eintrag.daten
    : { name: '', adresse: seite ? `https://${seite}` : '', benutzer: '', passwort: passwortErzeugen(genOptionen), notiz: '' };

  box.innerHTML = `
    <form class="r-form" novalidate>
      <h2>${eintrag ? esc(d.name) : 'Neuer Eintrag'}</h2>
      <label class="r-feld"><span>Name</span><input name="name" value="${esc(d.name)}" placeholder="z. B. GitHub" autocomplete="off"></label>
      <label class="r-feld"><span>Adresse</span><input name="adresse" value="${esc(d.adresse)}" placeholder="github.com" autocomplete="off" spellcheck="false"></label>
      <div class="r-feld">
        <label for="r-benutzer">Benutzername oder E-Mail</label>
        <div class="r-zeile">
          <input id="r-benutzer" name="benutzer" value="${esc(d.benutzer)}" autocomplete="off" spellcheck="false">
          <button type="button" class="g-knopf-leise" data-kopieren="benutzer">Kopieren</button>
        </div>
      </div>
      <div class="r-feld">
        <label for="r-passwort">Passwort</label>
        <div class="r-zeile">
          <input id="r-passwort" name="passwort" type="password" value="${esc(d.passwort)}" autocomplete="new-password" spellcheck="false">
          <button type="button" class="g-knopf-leise" data-zeigen aria-pressed="false">Zeigen</button>
          <button type="button" class="g-knopf-leise" data-kopieren="passwort">Kopieren</button>
        </div>
        <div class="r-pw r-pw-ansicht" hidden></div>
        <button type="button" class="r-gen-schalter" data-gen aria-expanded="false">Neues Passwort erzeugen</button>
        <div class="r-gen" hidden></div>
      </div>
      <label class="r-feld"><span>Notiz</span><textarea name="notiz" rows="3">${esc(d.notiz)}</textarea></label>
      <p class="r-meldung" role="alert"></p>
      <div class="r-aktionen">
        <button type="submit" class="g-knopf">Speichern</button>
        ${eintrag ? '<button type="button" class="r-loeschen" data-loeschen>Löschen</button>' : ''}
      </div>
    </form>`;

  const form = box.querySelector('form');
  const feld = (n) => form.elements[n];
  const meldung = form.querySelector('.r-meldung');
  const ansicht = form.querySelector('.r-pw-ansicht');
  const zeigenKnopf = form.querySelector('[data-zeigen]');
  const genSchalter = form.querySelector('[data-gen]');
  const genPanel = form.querySelector('.r-gen');

  // Zeigen: Passwort mit eingefärbten Zeichenarten, damit man 0/O oder l/1 sicher unterscheidet
  const ansichtAktualisieren = () => { ansicht.innerHTML = pwHtml(feld('passwort').value); };
  zeigenKnopf.addEventListener('click', () => {
    const an = ansicht.hidden;
    ansicht.hidden = !an;
    zeigenKnopf.setAttribute('aria-pressed', an);
    zeigenKnopf.textContent = an ? 'Verbergen' : 'Zeigen';
    if (an) ansichtAktualisieren();
  });
  feld('passwort').addEventListener('input', () => { if (!ansicht.hidden) ansichtAktualisieren(); });

  form.querySelectorAll('[data-kopieren]').forEach((k) =>
    k.addEventListener('click', () => kopieren(feld(k.dataset.kopieren).value, k))
  );

  genSchalter.addEventListener('click', () => {
    const an = genPanel.hidden;
    genPanel.hidden = !an;
    genSchalter.setAttribute('aria-expanded', an);
    if (an) generatorZeichnen(genPanel, (pw) => {
      feld('passwort').value = pw;
      feld('passwort').dispatchEvent(new Event('input'));
      genPanel.hidden = true;
      genSchalter.setAttribute('aria-expanded', 'false');
      meldung.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const daten = {
      name: feld('name').value.trim(),
      adresse: feld('adresse').value.trim(),
      benutzer: feld('benutzer').value.trim(),
      passwort: feld('passwort').value,
      notiz: feld('notiz').value.trim(),
    };
    if (!daten.name) daten.name = tresor.hostVon(daten.adresse);
    if (!daten.name) { meldung.textContent = 'Gib dem Eintrag einen Namen oder eine Adresse.'; return; }
    if (!daten.passwort) { meldung.textContent = 'Das Passwort ist leer. Erzeug eins oder gib es ein.'; return; }

    beschaeftigt(form, true, 'Wird gespeichert …');
    try {
      gewaehlt = await tresor.speichern(eintrag ? eintrag.id : null, daten);
      listeZeichnen();
      detailZeichnen();
    } catch (err) {
      meldung.textContent = `Speichern fehlgeschlagen: ${err.message}`;
      beschaeftigt(form, false);
    }
  });

  const loeschKnopf = form.querySelector('[data-loeschen]');
  loeschKnopf?.addEventListener('click', async () => {
    if (loeschKnopf.dataset.sicher !== 'ja') { // erst nachfragen, ohne Browser-Popup
      loeschKnopf.dataset.sicher = 'ja';
      loeschKnopf.textContent = 'Wirklich löschen?';
      setTimeout(() => {
        if (loeschKnopf.isConnected) { loeschKnopf.dataset.sicher = ''; loeschKnopf.textContent = 'Löschen'; }
      }, 4000);
      return;
    }
    loeschKnopf.disabled = true;
    try {
      await tresor.loeschen(eintrag.id);
      gewaehlt = null;
      listeZeichnen();
      detailZeichnen();
    } catch (err) {
      meldung.textContent = `Löschen fehlgeschlagen: ${err.message}`;
      loeschKnopf.disabled = false;
    }
  });

  if (eintrag) verbindungsBereich(box, { typ: 'rinde', id: eintrag.id });
}

// ---------- Generator ----------

function generatorZeichnen(panel, beiUebernahme) {
  const optionenListe = [
    ['klein', 'Kleinbuchstaben'],
    ['gross', 'Großbuchstaben'],
    ['ziffern', 'Ziffern'],
    ['sonder', 'Sonderzeichen'],
    ['eindeutig', 'Verwechselbare Zeichen weglassen'],
  ];
  let vorschlag = passwortErzeugen(genOptionen);

  panel.innerHTML = `
    <div class="r-gen-vorschau">
      <span class="r-pw" data-vorschau></span>
      <button type="button" class="g-knopf-leise" data-wuerfeln>Neu würfeln</button>
    </div>
    <label class="r-gen-laenge">
      <span>Länge</span>
      <input type="range" min="8" max="64" value="${genOptionen.laenge}" data-laenge>
      <output>${genOptionen.laenge}</output>
    </label>
    <div class="r-gen-optionen">
      ${optionenListe.map(([k, t]) =>
        `<label><input type="checkbox" data-opt="${k}" ${genOptionen[k] ? 'checked' : ''}> ${t}</label>`).join('')}
    </div>
    <p class="r-gen-staerke"></p>
    <button type="button" class="g-knopf" data-uebernehmen>Übernehmen</button>`;

  const aktualisieren = (neu = true) => {
    if (neu) vorschlag = passwortErzeugen(genOptionen);
    panel.querySelector('[data-vorschau]').innerHTML = pwHtml(vorschlag);
    const bits = staerkeBits(genOptionen);
    panel.querySelector('.r-gen-staerke').textContent = `Etwa ${bits} Bit, ${staerkeWort(bits)}`;
  };

  panel.querySelector('[data-wuerfeln]').addEventListener('click', () => aktualisieren());

  const regler = panel.querySelector('[data-laenge]');
  regler.addEventListener('input', () => {
    genOptionen.laenge = Number(regler.value);
    panel.querySelector('output').textContent = regler.value;
    optionenSpeichern();
    aktualisieren();
  });

  panel.querySelectorAll('[data-opt]').forEach((c) => c.addEventListener('change', () => {
    genOptionen[c.dataset.opt] = c.checked;
    if (!['klein', 'gross', 'ziffern', 'sonder'].some((k) => genOptionen[k])) {
      genOptionen.klein = true; // mindestens eine Zeichenart bleibt an
      panel.querySelector('[data-opt="klein"]').checked = true;
    }
    optionenSpeichern();
    aktualisieren();
  }));

  panel.querySelector('[data-uebernehmen]').addEventListener('click', () => beiUebernahme(vorschlag));
  aktualisieren(false);
}

// ---------- Helfer ----------

function pwHtml(pw) {
  return [...pw].map((z) => `<span class="r-z-${zeichenArt(z)}">${esc(z)}</span>`).join('');
}

async function kopieren(text, knopf) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    knopf.textContent = 'Blockiert';
    setTimeout(() => { knopf.textContent = 'Kopieren'; }, 2000);
    return;
  }
  knopf.textContent = 'Kopiert';
  setTimeout(() => { if (knopf.isConnected) knopf.textContent = 'Kopieren'; }, 1500);
  clearTimeout(leerTimer);
  leerTimer = setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), LEEREN_NACH_MS);
}

function beschaeftigt(form, an, text = '') {
  const k = form.querySelector('button[type="submit"]');
  if (an) { k.dataset.text = k.textContent; k.textContent = text; }
  else if (k.dataset.text) k.textContent = k.dataset.text;
  k.disabled = an;
}

function sperrTimerStarten() {
  clearTimeout(sperrTimer);
  sperrTimer = setTimeout(sperrenUndZeigen, SPERRE_NACH_MS);
}

function sperrenUndZeigen() {
  clearTimeout(sperrTimer);
  tresor.sperren();
  zeigeGesperrt();
}

function lesezeichenCode() {
  const ziel = `${location.origin}${location.pathname}?seite=`;
  return `javascript:(()=>{window.open(${JSON.stringify(ziel)}+encodeURIComponent(location.hostname),'grove-rinde','width=480,height=720')})()`;
}

function optionenLaden() {
  try {
    return { ...STANDARD, ...JSON.parse(localStorage.getItem('rinde-generator') || '{}') };
  } catch {
    return { ...STANDARD };
  }
}

function optionenSpeichern() {
  try { localStorage.setItem('rinde-generator', JSON.stringify(genOptionen)); } catch { /* egal */ }
}
