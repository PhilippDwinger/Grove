// ==========================================================
// Harz · Speicher „Ordner auf diesem Gerät“
// Ein ganz normaler Ordner (z. B. Dokumente\Grove-Harz) – die Dateien siehst
// du auch im Explorer, und was du dort hineinlegst, taucht in Harz auf.
// Technik: File System Access API. Geht in Chrome/Edge am PC, nicht am Handy.
// Den gewählten Ordner merkt sich Grove (IndexedDB). Nach einem Neustart fragt
// der Browser einmal nach, ob Grove weiter darauf zugreifen darf.
// ==========================================================
import { idb } from "../../kern/idb.js"

const MERKER = "harz-ordner"
const RECHT = { mode: "readwrite" }
let ordner = null

async function holen() {
    if (!ordner) { try { ordner = await idb.holen(MERKER) } catch { ordner = null } }
    return ordner
}
// Versteckte Dateien und halbfertige Downloads des Browsers überspringen
const sichtbar = (name) => !name.startsWith(".") && !/\.(crswap|tmp|part|crdownload)$/i.test(name) && name !== "desktop.ini" && name !== "Thumbs.db"
const info = (pfad, datei) => ({ pfad, groesse: datei.size, typ: datei.type || "", geaendert: datei.lastModified || Date.now() })

export default {
    id: "ordner",
    name: "Ordner auf diesem Gerät",
    beschreibung: "Ein normaler Ordner, z. B. Dokumente\\Grove-Harz. Die Dateien siehst du auch im Explorer. Nur am PC (Chrome/Edge).",
    moeglich: () => typeof window.showDirectoryPicker === "function",

    async ordnerWaehlen() {
        const h = await window.showDirectoryPicker({ id: "grove-harz", mode: "readwrite", startIn: "documents" })
        await idb.setzen(MERKER, h)
        ordner = h
        return h.name
    },
    async ordnerName() { return (await holen())?.name ?? null },

    // fragen = true nur nach einem Klick (der Browser verlangt das)
    async bereit({ fragen = false } = {}) {
        const h = await holen()
        if (!h) return false
        if ((await h.queryPermission(RECHT)) === "granted") return true
        if (!fragen) return false
        return (await h.requestPermission(RECHT)) === "granted"
    },

    async liste() {
        const out = []
        for await (const [name, h] of (await holen()).entries()) if (h.kind === "file" && sichtbar(name)) out.push(info(name, await h.getFile()))
        return out
    },
    async lesen(pfad) { return (await (await holen()).getFileHandle(pfad)).getFile() },
    async schreiben(pfad, blob) {
        const h = await (await holen()).getFileHandle(pfad, { create: true })
        const w = await h.createWritable()
        await w.write(blob)
        await w.close()
    },
    async loeschen(pfad) { return (await holen()).removeEntry(pfad) },
    async umbenennen(alt, neu) {
        const h = await (await holen()).getFileHandle(alt)
        if (typeof h.move === "function") return h.move(neu)
        await this.schreiben(neu, await this.lesen(alt))
        await this.loeschen(alt)
    },
}
