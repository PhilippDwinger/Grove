// ==========================================================
// Mühle · Register aller Wandler
// Alles läuft im Browser – Dateien verlassen dein Gerät nie.
// Die großen Bibliotheken (PDF, Word, Video …) werden erst geladen,
// wenn du sie wirklich brauchst (import() in der jeweiligen Datei).
//
// Ein Wandler ist eine Datei in ./wandler/ und sieht so aus:
//
//   export default {
//     id: "bild",                 name: "Bilder",
//     mehrere: false,             // true = nimmt ALLE Dateien zusammen (z. B. ZIP, PDFs zusammenfügen)
//     passt: (datei) => bool,     // bei mehrere: true → passt(dateien)
//     analysieren: async (datei) => info,          // optional, z. B. Tabellenblätter
//     ziele: [ { id, name, endung, text, optionen: [Feld …] } ]  oder  (info) => [ … ]
//     umwandeln: async (datei, ziel, optionen, { fortschritt, info }) => [{ name, blob }]
//   }
//
// Feld (Einstellung), daraus baut die Seite das Formular:
//   { id, name, art: "wahl" | "zahl" | "regler" | "schalter" | "text",
//     standard, werte: [[wert, "Name"], …] (wahl), min, max, schritt, einheit (zahl/regler),
//     hilfe: "kurzer Text", wenn: (optionen) => bool  (nur zeigen, wenn …) }
//
// Neuer Wandler = Datei in ./wandler/ + Eintrag in WANDLER (Reihenfolge = Anzeige).
// ==========================================================
import bild from "./wandler/bild.js"
import dokument from "./wandler/dokument.js"
import pdf from "./wandler/pdf.js"
import tabelle from "./wandler/tabelle.js"
import daten from "./wandler/daten.js"
import medien from "./wandler/medien.js"
import archiv from "./wandler/archiv.js"
import { bilderZuPdf, pdfsZusammen, alsZip } from "./wandler/sammel.js"
export * from "./hilfen.js"

export const WANDLER = [bild, dokument, pdf, tabelle, daten, medien, archiv, bilderZuPdf, pdfsZusammen, alsZip]

// Welche Wandler passen zu den gewählten Dateien?
//   einzeln: Wandler, die JEDE Datei für sich umwandeln (alle Dateien müssen passen)
//   sammel:  Wandler, die alle Dateien zusammen nehmen
export function passendeWandler(dateien) {
    if (!dateien.length) return []
    return WANDLER.filter((w) => w.mehrere ? w.passt(dateien) : dateien.every((d) => w.passt(d)))
}
