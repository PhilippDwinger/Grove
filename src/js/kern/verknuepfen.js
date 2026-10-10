// Grove-Kern: Bereich "Verbunden mit" – kann in jede Detailansicht jedes Dienstes.
//
//   verbindungsBereich(container, { typ: 'myzel', id: notiz.id }, { zusatz, beiAenderung });
//
// Zeigt alle verbundenen Objekte (mit Link in ihren Dienst),
// erlaubt neue Verknüpfungen über alle Dienste und das Lösen bestehender.
//
// Optionen:
//   zusatz:        async () => [{ typ, id }] – Verbindungen, die ein Dienst selbst kennt
//                  (z. B. Myzel: [[Links]] im Text). Sie erscheinen mit der Marke „[[ ]]“,
//                  lassen sich hier nicht lösen (das geht nur im Text) und werden nicht
//                  gespeichert. Gibt es dasselbe Paar auch manuell, erscheint es nur einmal.
//   beiAenderung:  () => {} – nach Verknüpfen/Lösen (z. B. damit das Netz neu zeichnet)

import '../../css/kern.css';
import { esc } from './html.js';
import { auswahlDialog } from './auswahl.js';
import { objektHolen } from './register.js';
import { verbindungenVon, verknuepfen, verbindungLoesen } from './verbindungen.js';

export function verbindungsBereich(container, obj, { zusatz = null, beiAenderung = null } = {}) {
  const wurzel = document.createElement('section');
  wurzel.className = 'g-verbindungen';
  wurzel.innerHTML = `
    <div class="g-verbindungen-kopf">
      <h3>Verbunden mit</h3>
      <button type="button" class="g-knopf-leise" data-neu>Verknüpfen</button>
    </div>
    <ul class="g-verbindungen-liste"></ul>`;
  container.appendChild(wurzel);

  const ul = wurzel.querySelector('ul');

  wurzel.querySelector('[data-neu]').addEventListener('click', () => {
    auswahlDialog({
      titel: 'Verknüpfen mit …',
      platzhalter: 'In allen Diensten suchen',
      ausnehmen: obj,
      beiWahl: async (ziel) => {
        try {
          await verknuepfen(obj, { typ: ziel.typ, id: ziel.id });
          await zeichnen();
          beiAenderung?.();
        } catch (e) {
          ul.insertAdjacentHTML('afterbegin', `<li class="g-fehler">Verknüpfen fehlgeschlagen: ${esc(e.message)}</li>`);
        }
      },
    });
  });

  ul.addEventListener('click', async (e) => {
    const knopf = e.target.closest('[data-loesen]');
    if (!knopf) return;
    knopf.disabled = true;
    try {
      await verbindungLoesen(knopf.dataset.loesen);
      await zeichnen();
      beiAenderung?.();
    } catch {
      knopf.disabled = false;
      knopf.textContent = 'Nochmal versuchen';
    }
  });

  let letzterStand = null;   // nichts neu zeichnen, wenn sich nichts geändert hat (z. B. beim Autosave)

  async function zeichnen() {
    if (letzterStand === null) ul.innerHTML = '<li class="g-leise">Lade …</li>';
    let manuell, ausText;
    try {
      [manuell, ausText] = await Promise.all([verbindungenVon(obj), zusatz ? zusatz() : []]);
    } catch {
      ul.innerHTML = '<li class="g-fehler">Verbindungen konnten nicht geladen werden.</li>';
      letzterStand = null;
      return;
    }

    // Zusammenführen: jedes Objekt nur einmal, Herkunft merken
    const nachObjekt = new Map();
    for (const v of manuell) nachObjekt.set(`${v.typ}:${v.id}`, { typ: v.typ, id: v.id, verbindungId: v.verbindungId, text: false });
    for (const t of ausText || []) {
      const k = `${t.typ}:${t.id}`;
      if (nachObjekt.has(k)) nachObjekt.get(k).text = true;
      else nachObjekt.set(k, { typ: t.typ, id: String(t.id), verbindungId: null, text: true });
    }
    const liste = [...nachObjekt.values()];
    const stand = JSON.stringify(liste);
    if (stand === letzterStand) return;
    letzterStand = stand;

    if (!liste.length) {
      ul.innerHTML = '<li class="g-leise">Noch nichts verknüpft.</li>';
      return;
    }
    const mitObjekt = await Promise.all(liste.map(async (v) => ({ ...v, objekt: await objektHolen(v.typ, v.id) })));
    ul.innerHTML = mitObjekt.map(({ verbindungId, text, objekt: o }) => `
      <li class="g-verbindung">
        <span class="g-verbindung-dienst">${esc(o.dienstName)}</span>
        ${o.url && !o.geloescht
          ? `<a href="${esc(o.url)}">${esc(o.titel)}</a>`
          : `<span class="g-verbindung-tot">${esc(o.titel)}</span>`}
        ${text ? `<span class="g-verbindung-quelle" title="Kommt aus einem [[Link]] im Text – verschwindet, wenn du den Link löschst">[[ ]]</span>` : ''}
        ${verbindungId
          ? `<button type="button" class="g-knopf-text" data-loesen="${esc(verbindungId)}"
                aria-label="Verbindung zu ${esc(o.titel)} lösen">Lösen</button>`
          : ''}
      </li>`).join('');
  }

  zeichnen();
  return { neuLaden: zeichnen };
}
