// ==========================================================
// Gewächshaus · Liste der Abteile (NUR ZUM TESTEN)
// Neues Abteil: Datei in ./abteile/ anlegen (Vorlage: ladeanimationen.js
// oder – einfacher – knoepfe.js mit dem Baustein ./kacheln.js) und hier eintragen.
// Reihenfolge = Anzeige.
// Ein Abteil = { id, name, kurz, beschreibung, vorschau (HTML), anzahl, bauen(container) }
// ==========================================================
import ladeanimationen from "./abteile/ladeanimationen.js"
import knoepfe from "./abteile/knoepfe.js"
import eingaben from "./abteile/eingaben.js"
import symbole from "./abteile/symbole.js"
import banner from "./abteile/banner.js"
import karten from "./abteile/karten.js"
import meldungen from "./abteile/meldungen.js"
import uebergaenge from "./abteile/uebergaenge.js"
import hintergruende from "./abteile/hintergruende.js"
import schrift from "./abteile/schrift.js"
import leer from "./abteile/leer.js"
import fortschritt from "./abteile/fortschritt.js"
import mikro from "./abteile/mikro.js"

export const ABTEILE = [
  ladeanimationen,
  knoepfe,
  eingaben,
  symbole,
  banner,
  karten,
  meldungen,
  uebergaenge,
  hintergruende,
  schrift,
  leer,
  fortschritt,
  mikro,
]
