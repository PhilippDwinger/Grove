// ==========================================================
// Saat · ZIP-Pakete
//   .saatpaket  = Lerndatei + ihre lokalen Medien (zum Teilen)
//   .saatstand  = Lernstand: Protokoll + Entscheidungen + Profil (ohne Lerndateien)
//   .zip        = ganze Speicher-Sicherung (alles)
// Alle drei sind normale ZIP-Dateien – man kann sie auch von Hand öffnen.
// ==========================================================
import { zipSync, unzipSync, strToU8 } from "fflate"
import { speicherVerzeichnis, alleDateien } from "./speicher.js"

const SCHON_GEPACKT = /\.(png|jpe?g|gif|webp|avif|mp3|m4a|ogg|opus|mp4|webm|zip)$/i

// dateien: { pfad: string | Blob | Uint8Array } → Blob (application/zip)
export async function zipBauen(dateien) {
    const eintraege = {}
    for (const [pfad, inhalt] of Object.entries(dateien)) {
        const daten = typeof inhalt === "string" ? strToU8(inhalt)
            : inhalt instanceof Uint8Array ? inhalt
            : new Uint8Array(await inhalt.arrayBuffer())
        eintraege[pfad] = [daten, { level: SCHON_GEPACKT.test(pfad) ? 0 : 6 }]
    }
    return new Blob([zipSync(eintraege)], { type: "application/zip" })
}

// ZIP → Verzeichnis im Arbeitsspeicher (wirft bei kaputten Dateien eine verständliche Meldung)
export async function zipLesen(blob, name = "ZIP") {
    let roh
    try { roh = unzipSync(new Uint8Array(await blob.arrayBuffer())) }
    catch { throw new Error("Die ZIP-Datei ist beschädigt oder unvollständig.") }
    const start = {}
    for (const [pfad, daten] of Object.entries(roh)) {
        if (pfad.endsWith("/") || pfad.includes("..") || pfad.startsWith("__MACOSX")) continue
        start[pfad.replace(/^\/+/, "")] = new Blob([daten])
    }
    // Liegt alles in einem einzigen Unterordner (z. B. „Saat/…“ beim Packen im Explorer)? → hochziehen
    const pfade = Object.keys(start)
    const ersterOrdner = pfade[0]?.split("/")[0]
    if (pfade.length && pfade.every((p) => p.includes("/") && p.split("/")[0] === ersterOrdner)
        && !pfade.some((p) => p === "saat.json" || p.startsWith("saatgut/"))) {
        const neu = {}
        for (const p of pfade) neu[p.slice(ersterOrdner.length + 1)] = start[p]
        return speicherVerzeichnis(name, neu)
    }
    return speicherVerzeichnis(name, start)
}

export async function verzeichnisZuZip(verz, { ohne = [] } = {}) {
    const dateien = {}
    for (const p of await alleDateien(verz)) {
        if (ohne.some((x) => p === x || p.startsWith(x + "/"))) continue
        dateien[p] = await verz.lesen(p)
    }
    return zipBauen(dateien)
}

export function herunterladen(blob, name) {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
}
