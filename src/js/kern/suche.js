// Grove-Kern: Suche über alle Dienste, überall mit Strg+K (Mac: Cmd+K).

import { auswahlDialog } from './auswahl.js';

let eingerichtet = false;

export function sucheOeffnen() {
  auswahlDialog({
    titel: 'Grove durchsuchen',
    platzhalter: 'Notizen, Mails, Passwörter …',
    beiWahl: (t) => { if (t.url) location.href = t.url; },
  });
}

export function sucheEinrichten() {
  if (eingerichtet) return;
  eingerichtet = true;
  // Jeder Knopf mit data-suche öffnet die Suche (z. B. die Lupe in der Kopfzeile)
  document.querySelectorAll('[data-suche]').forEach((k) => k.addEventListener('click', sucheOeffnen));
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      sucheOeffnen();
    }
  });
}
