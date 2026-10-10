// Grove-Kern: Auswahl-Dialog über alle Dienste.
// Wird von der Suche (Strg+K) und von "Verknüpfen" benutzt.

import '../../css/kern.css';
import { esc } from './html.js';
import { ueberallSuchen } from './register.js';

let offenerDialog = null;

export function auswahlDialog({ titel, platzhalter = 'Suchen …', ausnehmen = null, beiWahl }) {
  if (offenerDialog) offenerDialog.close();

  const d = document.createElement('dialog');
  d.className = 'g-auswahl';
  d.innerHTML = `
    <div class="g-auswahl-kopf">
      <span class="g-auswahl-titel">${esc(titel)}</span>
      <input type="text" class="g-auswahl-feld" placeholder="${esc(platzhalter)}"
             autocomplete="off" spellcheck="false" aria-label="${esc(titel)}">
    </div>
    <ul class="g-auswahl-liste" role="listbox"></ul>
    <p class="g-auswahl-fuss">Pfeiltasten wählen, Enter übernimmt, Esc schließt</p>`;
  document.body.appendChild(d);
  offenerDialog = d;

  const feld = d.querySelector('.g-auswahl-feld');
  const liste = d.querySelector('.g-auswahl-liste');
  let treffer = [];
  let aktiv = 0;
  let laufNr = 0;
  let timer = null;

  async function suchen() {
    const nr = ++laufNr;
    let erg = await ueberallSuchen(feld.value.trim());
    if (nr !== laufNr) return; // inzwischen weitergetippt
    if (ausnehmen) {
      erg = erg.filter((e) => !(e.typ === ausnehmen.typ && String(e.id) === String(ausnehmen.id)));
    }
    treffer = erg;
    aktiv = 0;
    zeichnen();
  }

  function zeichnen() {
    if (!treffer.length) {
      liste.innerHTML = `<li class="g-leise">${
        feld.value.trim() ? 'Nichts gefunden.' : 'Tippe, um in allen Diensten zu suchen.'
      }</li>`;
      return;
    }
    let html = '';
    let gruppe = null;
    treffer.forEach((t, i) => {
      if (t.dienstName !== gruppe) {
        gruppe = t.dienstName;
        html += `<li class="g-auswahl-gruppe" role="presentation">${esc(gruppe)}</li>`;
      }
      html += `<li class="g-auswahl-treffer" role="option" data-i="${i}" aria-selected="${i === aktiv}">
          <span>${esc(t.titel)}</span>${t.untertitel ? `<small>${esc(t.untertitel)}</small>` : ''}
        </li>`;
    });
    liste.innerHTML = html;
  }

  function markieren(neu) {
    if (!treffer.length) return;
    aktiv = (neu + treffer.length) % treffer.length;
    liste.querySelectorAll('[data-i]').forEach((li) => {
      const an = Number(li.dataset.i) === aktiv;
      li.setAttribute('aria-selected', an);
      if (an) li.scrollIntoView({ block: 'nearest' });
    });
  }

  function waehlen(i) {
    const t = treffer[i];
    if (!t) return;
    d.close();
    beiWahl(t);
  }

  feld.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(suchen, 150);
  });
  feld.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); markieren(aktiv + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); markieren(aktiv - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); waehlen(aktiv); }
  });
  liste.addEventListener('click', (e) => {
    const li = e.target.closest('[data-i]');
    if (li) waehlen(Number(li.dataset.i));
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // Klick neben den Dialog
  d.addEventListener('close', () => {
    d.remove();
    if (offenerDialog === d) offenerDialog = null;
  });

  d.showModal();
  feld.focus();
  suchen();
}
