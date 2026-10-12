// ==========================================================
// Harz · Speicher „Im Browser“
// Privater Speicher dieses Browsers (OPFS = „Origin Private File System“:
// ein eigenes kleines Dateisystem nur für Grove). Im Explorer unsichtbar,
// bleibt aber erhalten – mit speicherSchuetzen() auch, wenn Platz knapp wird.
// Kann ein Browser dort nicht schreiben (ältere Safari), nimmt er IndexedDB.
// Funktioniert überall: PC, Android, iPhone.
// ==========================================================
import { idb } from "../../kern/idb.js"

const ORDNER = "harz"
const ABLAGE = "harz-dateien"            // Ersatz in IndexedDB
const opfs = () => !!navigator.storage?.getDirectory && "createWritable" in (globalThis.FileSystemFileHandle?.prototype ?? {})

async function wurzel() {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle(ORDNER, { create: true })
}
const info = (pfad, datei) => ({ pfad, groesse: datei.size, typ: datei.type || "", geaendert: datei.lastModified || Date.now() })

export default {
    id: "browser",
    name: "Im Browser",
    beschreibung: "Privater Speicher dieser App. Unsichtbar im Explorer, bleibt aber erhalten. Geht auf jedem Gerät.",
    moeglich: () => opfs() || !!globalThis.indexedDB,
    async bereit() { return true },

    async liste() {
        if (opfs()) {
            const w = await wurzel()
            const out = []
            for await (const [name, h] of w.entries()) if (h.kind === "file") out.push(info(name, await h.getFile()))
            return out
        }
        const namen = await idb.schluessel(ABLAGE)
        return Promise.all(namen.map(async (n) => info(n, await idb.holen(n, ABLAGE))))
    },

    async lesen(pfad) {
        if (opfs()) return (await (await wurzel()).getFileHandle(pfad)).getFile()
        const blob = await idb.holen(pfad, ABLAGE)
        if (!blob) throw new Error("Datei nicht gefunden")
        return new File([blob], pfad, { type: blob.type, lastModified: blob.lastModified })
    },

    async schreiben(pfad, blob) {
        if (opfs()) {
            const h = await (await wurzel()).getFileHandle(pfad, { create: true })
            const w = await h.createWritable()
            await w.write(blob)
            await w.close()
            return
        }
        await idb.setzen(pfad, blob instanceof File ? blob : new File([blob], pfad, { type: blob.type }), ABLAGE)
    },

    async loeschen(pfad) {
        if (opfs()) return (await wurzel()).removeEntry(pfad)
        return idb.loeschen(pfad, ABLAGE)
    },

    async umbenennen(alt, neu) {
        if (opfs()) {
            const h = await (await wurzel()).getFileHandle(alt)
            if (typeof h.move === "function") return h.move(neu)
        }
        await this.schreiben(neu, await this.lesen(alt))
        await this.loeschen(alt)
    },
}
