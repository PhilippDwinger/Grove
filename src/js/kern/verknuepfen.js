// Grove-Kern: Bereich "Verbunden mit" – kann in jede Detailansicht jedes Dienstes.
//
//   verbindungsBereich(container, { typ: 'myzel', id: notiz.id });
//
// Zeigt alle verbundenen Objekte (mit Link in ihren Dienst),
// erlaubt neue Verknüpfungen über alle Dienste und das Lösen bestehender.

import '../../css/kern.css';
import { esc } from './html.js';
import { auswahlDialog } from './auswahl.js';
import { objektHolen } from './register.js';
import { verbindungenVon, verknuepfen, verbindungLoesen } from './verbindungen.js';

export function verbindungsBereich(container, obj) {
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
          zeichnen();
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
      zeichnen();
    } catch {
      knopf.disabled = false;
      knopf.textContent = 'Nochmal versuchen';
    }
  });

  async function zeichnen() {
    ul.innerHTML = '<li class="g-leise">Lade …</li>';
    let liste;
    try {
      liste = await verbindungenVon(obj);
    } catch {
      ul.innerHTML = '<li class="g-fehler">Verbindungen konnten nicht geladen werden.</li>';
      return;
    }
    if (!liste.length) {
      ul.innerHTML = '<li class="g-leise">Noch nichts verknüpft.</li>';
      return;
    }
    const mitObjekt = await Promise.all(
      liste.map(async (v) => ({ ...v, objekt: await objektHolen(v.typ, v.id) }))
    );
    ul.innerHTML = mitObjekt.map(({ verbindungId, objekt: o }) => `
      <li class="g-verbindung">
        <span class="g-verbindung-dienst">${esc(o.dienstName)}</span>
        ${o.url && !o.geloescht
          ? `<a href="${esc(o.url)}">${esc(o.titel)}</a>`
          : `<span class="g-verbindung-tot">${esc(o.titel)}</span>`}
        <button type="button" class="g-knopf-text" data-loesen="${esc(verbindungId)}"
                aria-label="Verbindung zu ${esc(o.titel)} lösen">Lösen</button>
      </li>`).join('');
  }

  zeichnen();
  return { neuLaden: zeichnen };
}
