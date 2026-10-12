// ==========================================================
// Mühle · Tabellen (Excel, LibreOffice, CSV, JSON-Listen ↔ …)
// Die eigentliche Arbeit (SheetJS) läuft abgeschottet in tabelle-arbeiter.js (Web Worker).
// Hier stehen nur Formate + Einstellungen und der Bote zum Worker.
// ==========================================================
import { istTyp, endung } from "../hilfen.js"

const EINGANG = [".xlsx", ".xlsm", ".xls", ".ods", ".csv", ".tsv", ".json"]
const ZEITLIMIT = 60_000            // hängt eine Datei länger, wird der Worker beendet

// Eine Aufgabe an einen frischen Worker geben (jedes Mal neu → nichts bleibt hängen)
function imArbeiter(nachricht) {
    return new Promise((ok, fehler) => {
        const w = new Worker(new URL("./tabelle-arbeiter.js", import.meta.url), { type: "module" })
        const uhr = setTimeout(() => { w.terminate(); fehler(new Error("Die Tabelle braucht zu lange – sie ist zu groß oder beschädigt.")) }, ZEITLIMIT)
        w.onmessage = ({ data }) => {
            clearTimeout(uhr); w.terminate()
            data.fehler ? fehler(new Error(data.fehler)) : ok(data)
        }
        w.onerror = (e) => { clearTimeout(uhr); w.terminate(); fehler(new Error(e.message || "Tabelle konnte nicht gelesen werden.")) }
        w.postMessage(nachricht)
    })
}

const TRENNER = { id: "trenner", name: "Trennzeichen", art: "wahl", standard: ";", werte: [[";", "Semikolon ; (deutsches Excel)"], [",", "Komma ,"], ["\t", "Tabulator"]] }
const ZAHLEN = { id: "zahlen", name: "Kommazahlen", art: "wahl", standard: "de", werte: [["de", "10,5 (deutsch)"], ["en", "10.5 (englisch)"]] }
const blattWahl = (info) => info?.blaetter?.length > 1
    ? [{ id: "blatt", name: "Blatt", art: "wahl", standard: info.blaetter[0], werte: info.blaetter.map((b) => [b, b]) }] : []

export default {
    id: "tabelle",
    name: "Tabellen",
    passt: (d) => istTyp(d, "", EINGANG) && !(endung(d.name) === ".json" && d.size > 30_000_000),
    async analysieren(datei) { return (await imArbeiter({ aufgabe: "analysieren", datei })).info },
    ziele: (info) => info?.unpassend ? [] : [
        { id: "xlsx", name: "Excel", endung: ".xlsx", text: "alle Blätter, für Excel", optionen: [] },
        { id: "ods", name: "LibreOffice", endung: ".ods", text: "alle Blätter, für LibreOffice Calc", optionen: [] },
        { id: "csv", name: "CSV", endung: ".csv", text: "einfache Liste, ein Blatt", optionen: [...blattWahl(info), TRENNER, ZAHLEN] },
        { id: "json", name: "JSON", endung: ".json", text: "Liste von Einträgen (für Programme)", optionen: [...blattWahl(info),
            { id: "einrueckung", name: "Schön formatiert", art: "schalter", standard: true }] },
        { id: "md", name: "Markdown-Tabelle", endung: ".md", text: "zum Einfügen in Myzel", optionen: blattWahl(info) },
        { id: "html", name: "HTML-Tabelle", endung: ".html", text: "als Webseite", optionen: blattWahl(info) },
    ],
    async umwandeln(datei, ziel, o, { fortschritt }) {
        fortschritt?.(0.2, "Lese Tabelle …")
        // Nur einfache Daten an den Worker schicken (keine Funktionen)
        const { ergebnisse } = await imArbeiter({ aufgabe: "umwandeln", datei, ziel: { id: ziel.id, endung: ziel.endung }, optionen: { ...o } })
        return ergebnisse.map((e) => ({ name: e.name, blob: new Blob([e.daten], { type: e.mime }) }))
    },
}
