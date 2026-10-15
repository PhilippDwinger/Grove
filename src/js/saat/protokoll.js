// ==========================================================
// Saat · Lernprotokoll
//
// Der Lernstand wird NICHT als „Zustand pro Karte“ gespeichert, sondern als Protokoll:
// jede Abfrage ist eine Zeile (JSON Lines) in fortschritt/protokoll-JJJJ-MM.jsonl.
// Der Zustand jeder Karte wird daraus berechnet (nachspielen).
//
// Warum? – Robust und gut zusammenführbar:
//   • Es wird nur angehängt, nie überschrieben → ein Absturz kostet höchstens die letzte Zeile.
//   • Eine kaputte Zeile betrifft nur eine Abfrage, nicht den ganzen Lernstand.
//   • Zwei Lernstände zusammenführen = Zeilen vereinigen (jede hat eine eindeutige id) →
//     keine Duplikate, nichts wird überschrieben, Reihenfolge ergibt sich aus der Zeit.
//   • Rückgängig = ein „aufheben“-Ereignis, Karte zurücksetzen = ein „zuruecksetzen“-Ereignis.
//
// Ereignis (Felder kurz, weil es viele werden):
//   { v: 1, id, t (ms), k (Karten-Schlüssel), a: "karte"|"auswahl"|"zuruecksetzen"|"aufheben",
//     b (1–4, Karteikarte), ok (Auswahl), ms (Antwortzeit), d (Datei-ID), fp (Kern-Abdruck),
//     g (Lerngebiet), vz (vorgezogen), ref (bei „aufheben“) }
// ==========================================================
import { anwenden } from "./planer.js"
import { TAG, neueId } from "./hilfen.js"
import { parameterFuer } from "./profil.js"

export const ARTEN = new Set(["karte", "auswahl", "zuruecksetzen", "aufheben"])

export function ereignis(teil, jetzt = Date.now()) {
    const e = { v: 1, id: neueId("e", 12), t: jetzt, ...teil }
    if (!gueltig(e)) throw new Error("Ungültiges Ereignis")
    return e
}

export function gueltig(e) {
    if (!e || typeof e !== "object" || typeof e.id !== "string" || !Number.isFinite(e.t) || !ARTEN.has(e.a)) return false
    if (e.a === "aufheben") return typeof e.ref === "string"
    if (typeof e.k !== "string" || !e.k) return false
    if (e.a === "karte") return [1, 2, 3, 4].includes(e.b)
    if (e.a === "auswahl") return typeof e.ok === "boolean"
    return true
}

// Monatsdatei, in die ein Ereignis gehört
export function dateiFuer(t) {
    const d = new Date(t)
    return `protokoll-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}.jsonl`
}

export const zeile = (e) => JSON.stringify(e) + "\n"

// Text einer Protokolldatei lesen – kaputte Zeilen werden gezählt, nicht geworfen
export function protokollLesen(text) {
    const ereignisse = []
    let kaputt = 0
    for (const z of String(text).split("\n")) {
        if (!z.trim()) continue
        try {
            const e = JSON.parse(z)
            if (gueltig(e)) ereignisse.push(e)
            else kaputt++
        } catch { kaputt++ }
    }
    return { ereignisse, kaputt }
}

// Mehrere Listen vereinigen (gleiche id = gleiches Ereignis)
export function vereinigen(...listen) {
    const m = new Map()
    for (const l of listen) for (const e of l) if (!m.has(e.id)) m.set(e.id, e)
    return sortieren([...m.values()])
}
export const sortieren = (l) => l.sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

// Neueste Kern-Abdrücke je Karten-ID (nur Ereignisse, deren Schlüssel genau die ID ist)
export function letzteAbdruecke(ereignisse) {
    const m = new Map()
    for (const e of ereignisse) if (e.fp && (e.a === "karte" || e.a === "auswahl") && !e.k.includes("#")) m.set(e.k, e.fp)
    return m
}

// ---------- Nachspielen ----------
// optionen: profil, alias(k) → k, gebietVon(k) → Gebiet
// Ergebnis: { zustaende: Map<schluessel, z>, beobachtungen: [...], verlauf: Map<schluessel, [ereignisse]> , aufgehoben: Set }
export function nachspielen(ereignisse, { profil, alias = (k) => k, gebietVon = () => null } = {}) {
    const aufgehoben = new Set(ereignisse.filter((e) => e.a === "aufheben").map((e) => e.ref))
    const zustaende = new Map()
    const beobachtungen = []
    const verlauf = new Map()
    const params = new Map()
    const pFuer = (g) => {
        if (!params.has(g)) params.set(g, parameterFuer(profil, g))
        return params.get(g)
    }
    for (const e of ereignisse) {
        if (e.a === "aufheben" || aufgehoben.has(e.id)) continue
        const k = alias(e.k)
        if (e.a === "zuruecksetzen") { zustaende.delete(k); verlauf.delete(k); continue }
        const g = gebietVon(k) ?? e.g ?? null
        const z = zustaende.get(k) ?? null
        const p = pFuer(g)
        const neu = anwenden(z, { ...e, k }, p)
        if (e.a === "karte" && z && neu.tag !== z.tag) {
            beobachtungen.push({ t: (e.t - z.letzte) / TAG, s: z.s, y: e.b >= 3 ? 1 : 0, g, zeit: e.t })
        }
        zustaende.set(k, neu)
        if (!verlauf.has(k)) verlauf.set(k, [])
        verlauf.get(k).push(e)
    }
    return { zustaende, beobachtungen, verlauf, aufgehoben }
}

// Wie oft wurde heute schon etwas zum ersten Mal gelernt? (Grenze „neue Karten pro Tag“)
export function heuteNeu(zustaende, tagesStart) {
    let n = 0
    for (const z of zustaende.values()) if (z.erstes >= tagesStart) n++
    return n
}
