// ==========================================================
// Saat · Wiederholungsplaner (Spaced Repetition)
//
// Grundlage ist FSRS-5 (Free Spaced Repetition Scheduler, J. Ye u. a.), ein offenes,
// an Millionen echter Wiederholungen geprüftes Gedächtnismodell. Jede Karte hat
//   S = Stabilität (Tage, bis die Abrufwahrscheinlichkeit auf 90 % fällt)
//   D = Schwierigkeit (1 = leicht … 10 = schwer)
//   R = Abrufwahrscheinlichkeit jetzt = (1 + 19/81 · t/S)^-0,5
// Die nächste Abfrage wird so gelegt, dass R genau auf die Ziel-Quote (Standard 90 %) fällt.
//
// Saat-Anpassungen gegenüber FSRS:
//   • Vier eigene Bewertungen: 1 „Nicht gewusst“ und 2 „Kam mir bekannt vor“ sind beide
//     Fehlversuche (freier Abruf gelang nicht) – 2 bestraft aber milder (Erinnerungsspur da).
//     3 „Nachgedacht und gewusst“ = Good, 4 „Ganz leicht“ = Easy.
//   • Auswahl-Modus (3 Möglichkeiten): falsch = Fehlversuch, richtig zählt nur mit dem
//     Gewicht `mcGewicht` (Standard 35 %) eines frei erinnerten „Gewusst“ – Wiedererkennen
//     und Ausschlussverfahren sind viel leichter als freier Abruf.
//   • Mehrfach-Abfragen am selben Lerntag: Erfolge dürfen die Stabilität insgesamt höchstens
//     um `kurzMax` (×1,5) über den Wert nach der ersten Abfrage des Tages heben, und sie
//     senken die Schwierigkeit nicht. Zehnmal hintereinander „leicht“ bringt also nichts.
//   • Persönlicher Gedächtnisfaktor `faktor` (aus dem Lernprofil, siehe profil.js):
//     wer länger behält, bekommt gestreckte Abstände (Zeit läuft für ihn „langsamer“).
// Alles hier ist rein rechnerisch (keine Seiteneffekte) → in tests/saat geprüft.
// ==========================================================
import { TAG, MINUTE, begrenzen, tagSchluessel, tagesbeginn, zufallAus } from "./hilfen.js"

// FSRS-5 Standardparameter (aus dem offenen FSRS-Optimierer, Version 5)
export const W_STANDARD = Object.freeze([0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621])
const ZERFALL = -0.5
const FAKTOR = 19 / 81

export const STANDARD = Object.freeze({
    w: W_STANDARD,
    faktor: 1,           // persönlicher Gedächtnisfaktor (Profil × Lerngebiet)
    zielQuote: 0.9,      // gewünschte Abrufwahrscheinlichkeit bei der nächsten Abfrage
    mcGewicht: 0.35,     // Anteil eines „Gewusst“, den eine richtige Auswahl-Antwort bringt
    erkanntBonus: 0.6,   // „Kam mir bekannt vor“: Stabilität nach dem Fehler +60 % gegenüber „Nicht gewusst“
    kurzMax: 1.5,        // Deckel für Erfolge am selben Lerntag
    maxIntervall: 36500, // Tage
    minIntervall: 1,     // nach einem Erfolg frühestens morgen wieder
})

// Bewertungen
export const BEWERTUNG = { NICHT: 1, ERKANNT: 2, GEWUSST: 3, LEICHT: 4 }
export const ERGEBNIS = { 1: "nicht", 2: "erkannt", 3: "gewusst", 4: "leicht" }

// ---------- Gedächtnisformeln ----------
export const abruf = (tage, s) => Math.pow(1 + FAKTOR * Math.max(0, tage) / s, ZERFALL)
export const intervallTage = (s, quote) => (s / FAKTOR) * (Math.pow(quote, 1 / ZERFALL) - 1)
const d0 = (w, g) => begrenzen(w[4] - Math.exp(w[5] * (g - 1)) + 1, 1, 10)
function dNeu(w, d, g) {
    const d1 = d + (-w[6] * (g - 3)) * (10 - d) / 9
    return begrenzen(w[7] * d0(w, 4) + (1 - w[7]) * d1, 1, 10)
}
const sErfolg = (w, s, d, r, g) =>
    s * (Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp(w[10] * (1 - r)) - 1) * (g === 2 ? w[15] : 1) * (g === 4 ? w[16] : 1) + 1)
const sFehler = (w, s, d, r) =>
    Math.min(s, w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r)))
const sKurz = (w, s, g) => s * Math.exp(w[17] * (g - 3 + w[18]))

// Ereignis → innere Bewertungsart
function art(e) {
    if (e.a === "auswahl") return e.ok ? "mc" : "fehler"
    if (e.b === 1) return "fehler"
    if (e.b === 2) return "erkannt"
    if (e.b === 4) return "leicht"
    return "gewusst"
}
const ERGEBNIS_VON = { fehler: "nicht", erkannt: "erkannt", gewusst: "gewusst", leicht: "leicht" }

// ---------- Eine Abfrage anwenden ----------
// z = bisheriger Zustand (oder null für neue Karten), e = { t, a: "karte"|"auswahl", b?, ok?, k? }
// p = Parameter (STANDARD + Profil). Ergebnis: neuer Zustand (z bleibt unverändert).
export function anwenden(z, e, p = STANDARD) {
    const w = p.w
    const t = e.t
    const tag = tagSchluessel(t)
    const was = art(e)
    const fehler = was === "fehler" || was === "erkannt"
    let s, d, kurz = false

    if (!z) {
        if (was === "fehler") { s = w[0]; d = d0(w, 1) }
        else if (was === "erkannt") { s = w[0] + (w[1] - w[0]) * 0.5; d = d0(w, 1.5) }
        else if (was === "mc") { s = w[0] + (w[2] - w[0]) * p.mcGewicht; d = d0(w, 3) }
        else { const g = was === "leicht" ? 4 : 3; s = w[g - 1]; d = d0(w, g) }
    } else {
        kurz = z.tag === tag
        const tageEff = (t - z.letzte) / TAG / p.faktor
        const r = abruf(tageEff, z.s)
        d = z.d
        if (kurz) {
            const g = { fehler: 1, erkannt: 1.5, gewusst: 3, leicht: 4, mc: 3 }[was]
            let neu = sKurz(w, z.s, g)
            if (was === "mc") neu = z.s + (neu - z.s) * p.mcGewicht
            if (!fehler) neu = Math.min(neu, Math.max(z.s, z.tagS * p.kurzMax))
            s = neu
            if (fehler) d = dNeu(w, d, g)            // Erfolge am selben Tag senken die Schwierigkeit nicht
        } else if (was === "fehler") {
            s = sFehler(w, z.s, d, r); d = dNeu(w, d, 1)
        } else if (was === "erkannt") {
            s = Math.min(z.s, sFehler(w, z.s, d, r) * (1 + p.erkanntBonus)); d = dNeu(w, d, 1.5)
        } else if (was === "mc") {
            s = z.s + (sErfolg(w, z.s, d, r, 3) - z.s) * p.mcGewicht
        } else {
            const g = was === "leicht" ? 4 : 3
            s = sErfolg(w, z.s, d, r, g); d = dNeu(w, d, g)
        }
    }
    s = begrenzen(s, 0.01, p.maxIntervall)

    // nächster Termin
    let faellig
    if (fehler) {
        faellig = t + (was === "fehler" ? 5 : 10) * MINUTE           // gleich nochmal (Lernschritt)
    } else {
        let tage = intervallTage(s, p.zielQuote) * p.faktor
        if (tage >= 2.5) tage *= 1 + (zufallAus(`${e.k || ""}|${t}`) - 0.5) * 0.1   // ±5 %, damit nicht alles am selben Tag fällig wird
        tage = begrenzen(Math.round(tage), p.minIntervall, p.maxIntervall)
        faellig = tagesbeginn(t) + tage * TAG
    }

    const erster = !z
    const neu = {
        s, d,
        letzte: t,
        faellig,
        erstes: z?.erstes ?? t,
        wdh: (z?.wdh ?? 0) + 1,
        fehler: (z?.fehler ?? 0) + (fehler && z && z.phase === "wiederholen" ? 1 : 0),
        frei: (z?.frei ?? 0) + (was === "gewusst" || was === "leicht" ? 1 : 0),
        mc: (z?.mc ?? 0) + (e.a === "auswahl" ? 1 : 0),
        ergebnis: e.a === "auswahl" ? (e.ok ? "mc-richtig" : "mc-falsch") : ERGEBNIS_VON[was],
        phase: fehler ? (z?.phase === "wiederholen" || z?.phase === "neu-lernen" ? "neu-lernen" : "lernen") : "wiederholen",
        tag,
        tagS: kurz ? z.tagS : s,
    }
    if (erster) neu.phase = fehler ? "lernen" : "wiederholen"
    return neu
}

// Abrufwahrscheinlichkeit jetzt
export function abrufJetzt(z, jetzt, p = STANDARD) {
    if (!z) return 0
    return abruf((jetzt - z.letzte) / TAG / p.faktor, z.s)
}

// Was würde jede der vier Bewertungen bewirken? → Millisekunden bis zur nächsten Abfrage
export function vorschau(z, jetzt, p = STANDARD, k = "") {
    const out = {}
    for (const b of [1, 2, 3, 4]) out[b] = anwenden(z, { t: jetzt, a: "karte", b, k }, p).faellig - jetzt
    return out
}

// ---------- Beherrschung (für die Kartenübersicht) ----------
// gut   = sicher frei abrufbar und schon stabil (≥ 2 Wochen), mind. einmal frei gewusst, mehr als eine Abfrage
// okay  = gelernt, aber noch nicht gefestigt
// schlecht = zuletzt nicht gewusst oder Abrufwahrscheinlichkeit unter 70 %
// neu   = noch nie abgefragt
export const BEHERRSCHUNG = ["gut", "okay", "schlecht", "neu"]
export function beherrschung(z, jetzt, p = STANDARD) {
    if (!z || !z.wdh) return "neu"
    const r = abrufJetzt(z, jetzt, p)
    if (z.phase !== "wiederholen" || r < 0.7) return "schlecht"
    if (z.frei > 0 && z.wdh >= 2 && z.s * p.faktor >= 14 && r >= 0.85) return "gut"
    return "okay"
}
