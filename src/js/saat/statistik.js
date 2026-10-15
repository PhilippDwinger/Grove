// ==========================================================
// Saat · Lerntage, Streaks und Kalender
//
// Pro Lerntag ein kleiner Eintrag im Lernprofil (profil.json → `tage`):
//   "2026-10-16": [abfragen, richtig, neu, sekunden]
// Ein Jahr ≈ 10 KB, behalten werden höchstens 3 Jahre. Die Werte werden aus dem Lernprotokoll
// berechnet und beim Laden abgeglichen – fehlen sie im Profil, entstehen sie neu; Tage aus einem
// importierten Profil (ohne passendes Protokoll) bleiben erhalten.
// ==========================================================
import { TAG, tagSchluessel, tagesbeginn } from "./hilfen.js"

export const MAX_TAGE = 1100

// ereignisse: sortiert · aufgehoben: Set · Ergebnis: { "JJJJ-MM-TT": [n, richtig, neu, sek] }
export function tageAusProtokoll(ereignisse, aufgehoben = new Set(), { alias = (k) => k } = {}) {
    const tage = {}
    const gesehen = new Set()
    const zurueck = new Set()
    for (const e of ereignisse) {
        if (e.a === "aufheben" || aufgehoben.has(e.id)) continue
        if (e.a === "zuruecksetzen") { zurueck.add(alias(e.k)); continue }
        if (e.a !== "karte" && e.a !== "auswahl") continue
        const k = alias(e.k)
        const tag = tagSchluessel(e.t)
        const w = (tage[tag] ??= [0, 0, 0, 0])
        w[0]++
        if (e.b >= 3 || e.ok) w[1]++
        if (!gesehen.has(k) || zurueck.has(k)) { w[2]++; gesehen.add(k); zurueck.delete(k) }
        w[3] += Math.min(120, Math.max(0, (e.ms ?? 8000) / 1000))
    }
    for (const w of Object.values(tage)) w[3] = Math.round(w[3])
    return tage
}

// Profil-Tage + aus dem Protokoll berechnete Tage. Beim Laden wird je Feld das Maximum genommen:
// Lernaktivität bleibt im Profil, auch wenn Abfragen später gelöscht werden (z. B. Kurs entfernt).
// Für den laufenden Tag (nach Antwort/Rückgängig) setzt das Lager den Wert direkt.
export function tageZusammen(profilTage = {}, berechnet = {}) {
    const out = { ...gueltigeTage(profilTage) }
    for (const [tag, w] of Object.entries(berechnet)) out[tag] = out[tag] ? out[tag].map((x, i) => Math.max(x, w[i])) : w
    return kuerzen(out)
}

export function gueltigeTage(roh) {
    const out = {}
    if (!roh || typeof roh !== "object") return out
    for (const [tag, w] of Object.entries(roh)) {
        if (!/^\d{4}-\d\d-\d\d$/.test(tag) || !Array.isArray(w)) continue
        const z = [0, 1, 2, 3].map((i) => Math.max(0, Math.round(Number(w[i]) || 0)))
        if (z[0] > 0) out[tag] = z
    }
    return out
}

function kuerzen(tage) {
    const schluessel = Object.keys(tage).sort()
    if (schluessel.length <= MAX_TAGE) return tage
    const out = {}
    for (const k of schluessel.slice(-MAX_TAGE)) out[k] = tage[k]
    return out
}

const tagVor = (schluessel, n = 1) => {
    const [j, m, t] = schluessel.split("-").map(Number)
    const d = new Date(j, m - 1, t - n, 12)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Streaks: aktuelle (bis heute; heute noch nicht gelernt → zählt bis gestern) und längste
export function streaks(tage, jetzt = Date.now()) {
    const heute = tagSchluessel(jetzt)
    let aktuell = 0
    let tag = tage[heute] ? heute : tagVor(heute)
    while (tage[tag]) { aktuell++; tag = tagVor(tag) }
    let laengste = 0, lauf = 0, vorher = null
    for (const t of Object.keys(tage).sort()) {
        lauf = vorher && tagVor(t) === vorher ? lauf + 1 : 1
        laengste = Math.max(laengste, lauf)
        vorher = t
    }
    return { aktuell, laengste: Math.max(laengste, aktuell), heuteGelernt: !!tage[heute], lerntage: Object.keys(tage).length }
}

// Kalender der letzten `wochen` Wochen (Spalten = Wochen Mo–So), Stufe 0–4 nach Menge
export function kalender(tage, jetzt = Date.now(), wochen = 26) {
    const heute = new Date(tagesbeginn(jetzt) + TAG / 2)
    const wochentag = (heute.getDay() + 6) % 7                 // Mo = 0
    const start = new Date(heute); start.setDate(heute.getDate() - wochentag - (wochen - 1) * 7)
    const werte = Object.values(tage).map((w) => w[0]).filter(Boolean).sort((a, b) => a - b)
    // Stufen relativ zum eigenen Lernen (Quartile), damit der Kalender für jede Lernmenge aussagekräftig ist
    const q = (p) => werte.length ? werte[Math.min(werte.length - 1, Math.floor(p * werte.length))] : 1
    const grenzen = [q(0.25), q(0.5), q(0.75)]
    const stufe = (n) => (!n ? 0 : n <= grenzen[0] ? 1 : n <= grenzen[1] ? 2 : n <= grenzen[2] ? 3 : 4)
    const spalten = []
    for (let w = 0; w < wochen; w++) {
        const spalte = []
        for (let t = 0; t < 7; t++) {
            const d = new Date(start); d.setDate(start.getDate() + w * 7 + t)
            const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
            const zukunft = d > heute
            const v = tage[k]
            spalte.push({ tag: k, datum: d, zukunft, stufe: zukunft ? -1 : stufe(v?.[0]), werte: v || null })
        }
        spalten.push(spalte)
    }
    return { spalten, grenzen }
}
