// ==========================================================
// Harz · Speicher-Verwaltung
// Alle Speicher haben dieselbe Schnittstelle – Harz kennt nur diese:
//
//   { id, name, beschreibung,
//     moeglich()                → kann dieser Browser das überhaupt?
//     bereit({ fragen })        → Zugriff da? (fragen = nach Klick um Erlaubnis bitten)
//     liste()                   → [{ pfad, groesse, typ, geaendert }]
//     lesen(pfad)               → File
//     schreiben(pfad, blob)
//     loeschen(pfad)
//     umbenennen(alt, neu) }
//
// Neuer Speicher (z. B. später „Über Bridge von einem anderen Gerät“):
// Datei in ./speicher/ mit dieser Schnittstelle + Eintrag in SPEICHER.
// ==========================================================
import { idb } from "../kern/idb.js"
import browser from "./speicher/browser.js"
import ordner from "./speicher/ordner.js"

export const SPEICHER = [browser, ordner]
const WAHL = "harz-speicher"

export const speicherVon = (id) => SPEICHER.find((s) => s.id === id) ?? null

export async function aktiverSpeicher() {
    let id = null
    try { id = await idb.holen(WAHL) } catch { /* Standard */ }
    const s = speicherVon(id)
    return s?.moeglich() ? s : browser
}
export async function speicherWaehlen(id) { await idb.setzen(WAHL, id) }

// ---------- Hilfen ----------
// Zeichen, die Windows in Dateinamen nicht mag, ersetzen
export function sichererName(name) {
    const n = String(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().replace(/^\.+/, "")
    return n.slice(0, 180) || "Datei"
}
export function teilen(name) {
    const i = name.lastIndexOf(".")
    return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ""]
}
// "Foto.jpg" → "Foto (2).jpg", falls schon vorhanden
export function freierName(wunsch, belegt) {
    const klein = new Set([...belegt].map((n) => n.toLowerCase()))
    if (!klein.has(wunsch.toLowerCase())) return wunsch
    const [stamm, endung] = teilen(wunsch)
    for (let i = 2; ; i++) {
        const n = `${stamm} (${i})${endung}`
        if (!klein.has(n.toLowerCase())) return n
    }
}

// Art für Symbol + Vorschau
export function dateiArt(name = "", mime = "") {
    const e = teilen(name)[1].toLowerCase()
    if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif|bmp|heic)$/.test(e)) return "bild"
    if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(e)) return "video"
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|flac)$/.test(e)) return "audio"
    if (mime === "application/pdf" || e === ".pdf") return "pdf"
    if (mime.startsWith("text/") || /\.(txt|md|csv|json|js|py|html|css|xml|log|ini|yml|yaml|lua|cs|java|sql)$/.test(e)) return "text"
    if (/\.(zip|rar|7z|tar|gz)$/.test(e)) return "archiv"
    return "datei"
}

export function groesseText(bytes) {
    if (bytes == null) return "–"
    const einheiten = ["B", "KB", "MB", "GB", "TB"]
    let i = 0, n = bytes
    while (n >= 1024 && i < einheiten.length - 1) { n /= 1024; i++ }
    return `${n.toLocaleString("de-DE", { maximumFractionDigits: i ? 1 : 0 })} ${einheiten[i]}`
}
