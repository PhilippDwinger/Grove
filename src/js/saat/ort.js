// ==========================================================
// Saat · Wo liegt der Lernspeicher? (nur im Browser)
//   ordner  – ein echter Ordner auf dem PC (File System Access API, Chrome/Edge)
//   browser – privater Speicher des Browsers (OPFS, sonst IndexedDB) für alle anderen
// Gemerkt wird nur der ZUGRIFF auf den Ordner (IndexedDB dieses Browsers), nicht sein Inhalt.
// Nach einem Neustart fragt der Browser einmal per Klick nach, ob Saat weiter darf.
// ==========================================================
import { idb } from "../kern/idb.js"
import { handleVerzeichnis, idbVerzeichnis, opfsSchreibbar } from "./speicher.js"

const MERKER = "saat-ort"
const RECHT = { mode: "readwrite" }

export const ordnerMoeglich = () => typeof window.showDirectoryPicker === "function"

export async function gemerkterOrt() {
    try { return (await idb.holen(MERKER)) ?? null } catch { return null }
}
export async function ortMerken(ort) { await idb.setzen(MERKER, ort) }
export async function ortVergessen() { await idb.loeschen(MERKER) }

// Ordner wählen (nur nach einem Klick aufrufen). null = abgebrochen
export async function ordnerWaehlen() {
    try {
        const handle = await window.showDirectoryPicker({ id: "grove-saat", mode: "readwrite", startIn: "documents" })
        return { art: "ordner", handle, name: handle.name }
    } catch (f) {
        if (f?.name === "AbortError") return null
        throw f
    }
}

export async function browserOrt() {
    if (opfsSchreibbar()) {
        try {
            const wurzel = await navigator.storage.getDirectory()
            await wurzel.getDirectoryHandle("grove-saat", { create: true })
            return { art: "browser", name: "Browser-Speicher" }
        } catch { /* weiter mit IndexedDB */ }
    }
    return { art: "browser-idb", name: "Browser-Speicher" }
}

// Zugriff prüfen: "ok" | "fragen" (Klick nötig) | "weg" (Ordner nicht mehr da)
export async function zugriff(ort, { fragen = false } = {}) {
    if (ort.art !== "ordner") return "ok"
    try {
        let s = await ort.handle.queryPermission(RECHT)
        if (s !== "granted" && fragen) s = await ort.handle.requestPermission(RECHT)
        if (s !== "granted") return "fragen"
        // Gibt es den Ordner noch? (umbenannt/gelöscht → NotFoundError)
        for await (const _ of ort.handle.keys()) break
        return "ok"
    } catch (f) {
        return f?.name === "NotFoundError" ? "weg" : "fragen"
    }
}

export async function verzeichnisFuer(ort) {
    if (ort.art === "ordner") return handleVerzeichnis(ort.handle, { name: ort.name, art: "ordner" })
    if (ort.art === "browser") {
        const wurzel = await navigator.storage.getDirectory()
        return handleVerzeichnis(await wurzel.getDirectoryHandle("grove-saat", { create: true }), { name: "Browser-Speicher", art: "browser" })
    }
    return idbVerzeichnis("grove-saat")
}

// Browser bitten, den Speicher nicht von selbst aufzuräumen (wichtig für den Browser-Speicher)
export async function dauerhaftBitten() {
    try { return await navigator.storage?.persist?.() } catch { return false }
}
