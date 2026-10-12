// ==========================================================
// Mühle · Archive (ZIP entpacken). Packen: siehe sammel.js („Als ZIP“).
// ==========================================================
import { istTyp } from "../hilfen.js"

export default {
    id: "archiv",
    name: "Archive",
    passt: (d) => istTyp(d, "application/zip", [".zip"]),
    ziele: [{ id: "entpacken", name: "Entpacken", endung: "", text: "alle Dateien herausholen", optionen: [] }],
    async umwandeln(datei, ziel, o, { fortschritt }) {
        const { unzipSync } = await import("fflate")
        fortschritt?.(0.2, "Entpacke …")
        const inhalt = unzipSync(new Uint8Array(await datei.arrayBuffer()))
        const raus = Object.entries(inhalt)
            .filter(([pfad, daten]) => !pfad.endsWith("/") && !pfad.startsWith("__MACOSX/") && !pfad.split("/").pop().startsWith("."))
            .map(([pfad, daten]) => ({ name: pfad.split("/").filter(Boolean).join(" - "), blob: new Blob([daten]) }))
        if (!raus.length) throw new Error("Das Archiv ist leer.")
        return raus
    },
}
