// ==========================================================
// Mühle · Strukturierte Daten (JSON ↔ YAML, schön ↔ kompakt)
// ==========================================================
import { istTyp, neuerName, endung, alsText } from "../hilfen.js"

const EINGANG = [".json", ".yaml", ".yml"]
const lesen = async (datei) => {
    const text = await alsText(datei)
    if (endung(datei.name) === ".json") return JSON.parse(text)
    const yaml = await import("js-yaml")
    return (yaml.load ?? yaml.default.load)(text)
}

export default {
    id: "daten",
    name: "Daten",
    passt: (d) => istTyp(d, "application/json", EINGANG),
    ziele: [
        { id: "json", name: "JSON", endung: ".json", text: "schön oder kompakt", optionen: [
            { id: "einrueckung", name: "Einrückung", art: "wahl", standard: "2", werte: [["2", "2 Leerzeichen"], ["4", "4 Leerzeichen"], ["tab", "Tabulator"], ["0", "kompakt (eine Zeile)"]] }] },
        { id: "yaml", name: "YAML", endung: ".yaml", text: "gut lesbar, für Einstellungen", optionen: [] },
    ],
    async umwandeln(datei, ziel, o) {
        let daten
        try { daten = await lesen(datei) } catch (f) { throw new Error(`Datei ist kein gültiges ${endung(datei.name).slice(1).toUpperCase()}: ${f.message}`) }
        if (ziel.id === "yaml") {
            const yaml = await import("js-yaml")
            const text = (yaml.dump ?? yaml.default.dump)(daten, { lineWidth: 120, noRefs: true })
            return [{ name: neuerName(datei.name, ".yaml"), blob: new Blob([text], { type: "application/yaml" }) }]
        }
        const ein = o.einrueckung === "tab" ? "\t" : +o.einrueckung
        const zusatz = endung(datei.name) === ".json" ? (ein ? " (schön)" : " (kompakt)") : ""
        return [{ name: neuerName(datei.name, ".json", zusatz), blob: new Blob([JSON.stringify(daten, null, ein) + "\n"], { type: "application/json" }) }]
    },
}
