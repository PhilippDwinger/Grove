// ==========================================================
// Saat · kleine Hilfen (ohne Browser-Abhängigkeiten – laufen auch in Node-Tests)
// ==========================================================

export const TAG = 86_400_000
export const MINUTE = 60_000

// Text für Vergleiche: Unicode vereinheitlichen, Groß/klein egal, Leerraum zusammenfassen
export function normal(text) {
    return String(text ?? "")
        .normalize("NFKC")
        .toLocaleLowerCase("de-DE")
        .replace(/[​-‍﻿]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

// Für den Vergleich von Antworten zusätzlich Satzzeichen am Rand weglassen
export function normalAntwort(text) {
    return normal(text).replace(/^[\s.,;:!?¡¿"'„“”‚‘’«»()[\]-]+|[\s.,;:!?¡¿"'„“”‚‘’«»()[\]-]+$/g, "")
}

// FNV-1a (32 Bit) – kurzer, stabiler Fingerabdruck, überall gleich
export function fnv(text) {
    let h = 0x811c9dc5
    const s = String(text)
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(36).padStart(7, "0")
}

// Zufällige, gut lesbare Kennung (für neue Karten, Dateien, Ereignisse)
export function neueId(praefix = "k", laenge = 10) {
    const zeichen = "abcdefghijkmnopqrstuvwxyz23456789"
    const bytes = new Uint8Array(laenge)
    globalThis.crypto.getRandomValues(bytes)
    let out = ""
    for (const b of bytes) out += zeichen[b % zeichen.length]
    return `${praefix}-${out}`
}

// Erlaubte Zeichen für Karten-IDs (stabil, dateinamen- und URL-freundlich)
export const ID_MUSTER = /^[\p{L}\p{N}][\p{L}\p{N}._:~-]{0,79}$/u
export function idSauber(id) {
    return typeof id === "string" && ID_MUSTER.test(id)
}
// Macht aus beliebigem Text einen ID-Vorschlag ("Der Hund" → "der-hund")
export function idAusText(text) {
    return normal(text).normalize("NFKD").replace(/[̀-ͯ]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "karte"
}

// Schriftsystem eines Textes grob bestimmen (für faire Ablenker im Auswahl-Modus)
export function schrift(text) {
    for (const z of String(text ?? "")) {
        const c = z.codePointAt(0)
        if (/\p{N}/u.test(z) || /\s|\p{P}|\p{S}/u.test(z)) continue
        if (c >= 0x3040 && c <= 0x30ff) return "kana"
        if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf)) return "han"
        if (c >= 0xac00 && c <= 0xd7af) return "hangul"
        if (c >= 0x0400 && c <= 0x04ff) return "kyrillisch"
        if (c >= 0x0370 && c <= 0x03ff) return "griechisch"
        if (c >= 0x0590 && c <= 0x05ff) return "hebraeisch"
        if (c >= 0x0600 && c <= 0x06ff) return "arabisch"
        if (c >= 0x0900 && c <= 0x097f) return "devanagari"
        if (c >= 0x0e00 && c <= 0x0e7f) return "thai"
        if (/\p{Script=Latin}/u.test(z)) return "latein"
        return "andere"
    }
    return "zahlen"
}
// Han und Kana mischen sich im Japanischen ständig – für den Vergleich zusammenfassen
export const schriftGruppe = (text) => {
    const s = schrift(text)
    return s === "kana" || s === "han" ? "cjk" : s
}

// Deterministische Zufallszahl 0..1 aus einem Text (z. B. für die Streuung von Abständen)
export function zufallAus(text) {
    return parseInt(fnv(text), 36) / 0xffffffff
}

// Mischen (Fisher-Yates), optional mit eigener Zufallsquelle
export function mischen(liste, zufall = Math.random) {
    const a = [...liste]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(zufall() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Levenshtein-Abstand (für die Eintipp-Aufgabe: kleine Tippfehler verzeihen)
export function abstand(a, b) {
    a = [...a]; b = [...b]
    if (!a.length) return b.length
    if (!b.length) return a.length
    let vorher = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const jetzt = [i]
        for (let j = 1; j <= b.length; j++) {
            jetzt[j] = Math.min(vorher[j] + 1, jetzt[j - 1] + 1, vorher[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
        }
        vorher = jetzt
    }
    return vorher[b.length]
}

// Lokaler Tagesbeginn (Mitternacht) – „heute“ zählt nach der Uhr des Geräts
export function tagesbeginn(ms, stunde = 4) {
    // Der Lerntag beginnt um 4 Uhr (wer nach Mitternacht lernt, lernt noch „heute“)
    const d = new Date(ms - stunde * 3_600_000)
    d.setHours(0, 0, 0, 0)
    return d.getTime() + stunde * 3_600_000
}
export function tagSchluessel(ms, stunde = 4) {
    const d = new Date(tagesbeginn(ms, stunde))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// „in 3 Tagen“, „in 10 Min.“ – kurze Zeitangaben für Knöpfe und Listen
export function dauerText(ms, { kurz = false } = {}) {
    const min = Math.round(ms / MINUTE)
    if (min < 1) return kurz ? "<1 Min" : "gleich"
    if (min < 60) return `${min} Min`
    const std = Math.round(min / 60)
    if (std < 24) return `${std} Std`
    const tage = ms / TAG
    if (tage < 30) return `${Math.round(tage)} ${kurz ? "T" : Math.round(tage) === 1 ? "Tag" : "Tage"}`
    if (tage < 365) { const m = Math.round(tage / 30.4); return `${m} ${kurz ? "Mon" : m === 1 ? "Monat" : "Monate"}` }
    const j = Math.round(tage / 36.5) / 10
    return `${String(j).replace(".", ",")} ${kurz ? "J" : j === 1 ? "Jahr" : "Jahre"}`
}

export const begrenzen = (x, min, max) => Math.min(max, Math.max(min, x))

// Abstand bis zu einem Termin, ab einem Tag in Lerntagen gezählt („morgen“ = 1 T, egal wie spät es ist)
export function terminText(ziel, jetzt) {
    const d = ziel - jetzt
    if (d < 20 * 3_600_000) return dauerText(d, { kurz: true })
    const tage = Math.max(1, Math.round((tagesbeginn(ziel) - tagesbeginn(jetzt)) / TAG))
    return dauerText(tage * TAG, { kurz: true })
}
