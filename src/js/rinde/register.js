// Rinde meldet sich im Grove-Register an, damit Suche und "Verknüpfen" ihre Einträge kennen.
// Passwörter selbst tauchen nie in der Suche auf – nur Name und Benutzer.
// Ist Rinde gesperrt, findet die Suche nichts (die Daten sind ja verschlüsselt).

import { dienstRegistrieren } from '../kern/register.js';
import { zustand, filtern, hostVon } from './tresor.js';

const alsTreffer = (e) => ({
  id: e.id,
  titel: e.daten.name,
  untertitel: e.daten.benutzer || hostVon(e.daten.adresse),
});

dienstRegistrieren({
  typ: 'rinde',
  name: 'Rinde',
  url: (id) => `/dienste/rinde/?eintrag=${encodeURIComponent(id)}`,

  suchen: async (text) => (zustand.offen ? filtern(text).slice(0, 8).map(alsTreffer) : []),

  holen: async (id) => {
    if (!zustand.offen) return { id, titel: 'Passwort-Eintrag', untertitel: 'Rinde ist gesperrt' };
    const e = zustand.eintraege.find((x) => x.id === id);
    return e ? alsTreffer(e) : null;
  },
});
