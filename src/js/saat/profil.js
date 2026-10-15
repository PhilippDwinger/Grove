// ==========================================================
// Saat · Persönliches Lernprofil (adaptiv)
//
// Das Profil liegt als profil.json im Lernspeicher (nie auf einem Server) und enthält
//   • Einstellungen (Ziel-Quote, neue Karten pro Tag …)
//   • das Modell: FSRS-Parameter + persönlicher Gedächtnisfaktor + Faktoren je Lerngebiet
//   • den Anpassungsverlauf (wie sich die Erinnerungsleistung über die Zeit entwickelt)
//
// Wie es lernt (anpassen):
//   Beobachtungen = jede freie Abfrage (Karteikarten-Modus), die NICHT am selben Lerntag wie
//   die vorige war: Abstand t, Stabilität S davor, Ergebnis y (gewusst ja/nein).
//   Vorhersage p = R(t / (m · r_gebiet), S). Gesucht ist der Faktor m, der die tatsächlichen
//   Ergebnisse am besten erklärt (Maximum-Likelihood), mit
//     – Vorwissen: ln m ~ Normal(0; 0,3) → die bewährten Standardwerte bleiben die Grundlage,
//     – Vergessen alter Daten: Gewicht halbiert sich alle 120 Tage → langfristige Änderungen
//       der Erinnerungsleistung werden sichtbar,
//     – kleinen Schritten: pro Anpassung höchstens ±15 %, insgesamt 0,4 … 2,5,
//     – Mindestdaten: global ab 25, je Lerngebiet ab 15 (gewichteten) Beobachtungen; die
//       Gebietsfaktoren werden zusätzlich zum globalen Faktor hin gezogen (Normal(0; 0,25)).
//   Auswahl-Antworten (Multiple Choice) und Wiederholungen am selben Tag fließen bewusst
//   NICHT ein: sie sagen wenig über freien Abruf nach einer Pause.
//   Vorgezogene Abfragen fließen ein – sie sind echte Messungen bei hoher Vorhersage.
// ==========================================================
import { STANDARD, W_STANDARD, abruf } from "./planer.js"
import { TAG, begrenzen, neueId, tagSchluessel } from "./hilfen.js"

export const PROFIL_FORMAT = "grove-saat-profil"
export const PROFIL_VERSION = 1

export const GRENZEN = {
    faktor: [0.4, 2.5],
    gebiet: [0.5, 2.0],
    schritt: 1.15,
    halbwertTage: 120,
    minGlobal: 25,
    minGebiet: 15,
    sigmaGlobal: 0.3,
    sigmaGebiet: 0.25,
}

export const EINSTELLUNGEN_STANDARD = Object.freeze({
    zielQuote: 0.9,            // 0,80 … 0,95
    neuProTag: 20,
    maxProTag: 300,            // Obergrenze für Wiederholungen in einer Sitzung „Fällige lernen“
    neueReihenfolge: "datei",  // "datei" | "zufall"
    vorlesen: true,            // Aussprache per Sprachausgabe des Geräts anbieten
    tastenHilfe: true,
})

export function neuesProfil(jetzt = Date.now()) {
    const iso = new Date(jetzt).toISOString()
    return {
        format: PROFIL_FORMAT, version: PROFIL_VERSION, id: neueId("p"), erstellt: iso, aktualisiert: iso,
        einstellungen: { ...EINSTELLUNGEN_STANDARD },
        modell: {
            algorithmus: "saat-fsrs5",
            w: [...W_STANDARD],
            faktor: 1,
            gebiete: {},                 // { "Japanisch": { faktor: 1.1, n: 42 } }
            mcGewicht: STANDARD.mcGewicht,
            erkanntBonus: STANDARD.erkanntBonus,
            kurzMax: STANDARD.kurzMax,
        },
        anpassung: { letzte: null, beobachtungen: 0, verlauf: [] },
    }
}

const zahl = (x, std, [min, max] = [-Infinity, Infinity]) => (Number.isFinite(Number(x)) ? begrenzen(Number(x), min, max) : std)

// Robust lesen: fehlende/kaputte Felder werden mit Standardwerten ergänzt, nichts wirft
export function profilLesen(roh) {
    const p = neuesProfil()
    if (!roh || typeof roh !== "object") return { profil: p, warnungen: ["Kein gültiges Lernprofil – Standardprofil wird verwendet."] }
    const warnungen = []
    if (roh.format && roh.format !== PROFIL_FORMAT) warnungen.push("Unbekanntes Profilformat – lesbare Werte übernommen.")
    if (roh.version > PROFIL_VERSION) warnungen.push("Profil aus einer neueren Saat-Version – unbekannte Felder bleiben erhalten.")
    const e = roh.einstellungen || {}, m = roh.modell || {}, a = roh.anpassung || {}
    const out = {
        ...roh,
        format: PROFIL_FORMAT, version: Math.max(PROFIL_VERSION, Number(roh.version) || 1),
        id: typeof roh.id === "string" ? roh.id : p.id,
        erstellt: roh.erstellt || p.erstellt, aktualisiert: roh.aktualisiert || p.aktualisiert,
        einstellungen: {
            ...e,
            zielQuote: zahl(e.zielQuote, 0.9, [0.75, 0.97]),
            neuProTag: Math.round(zahl(e.neuProTag, 20, [0, 500])),
            maxProTag: Math.round(zahl(e.maxProTag, 300, [10, 5000])),
            neueReihenfolge: e.neueReihenfolge === "zufall" ? "zufall" : "datei",
            vorlesen: e.vorlesen !== false,
            tastenHilfe: e.tastenHilfe !== false,
        },
        modell: {
            ...m,
            algorithmus: m.algorithmus || "saat-fsrs5",
            w: Array.isArray(m.w) && m.w.length === 19 && m.w.every((x) => Number.isFinite(x)) ? [...m.w] : [...W_STANDARD],
            faktor: zahl(m.faktor, 1, GRENZEN.faktor),
            gebiete: Object.fromEntries(Object.entries(m.gebiete && typeof m.gebiete === "object" ? m.gebiete : {})
                .filter(([, v]) => v && Number.isFinite(Number(v.faktor)))
                .map(([g, v]) => [g, { faktor: zahl(v.faktor, 1, GRENZEN.gebiet), n: Math.max(0, Number(v.n) || 0) }])),
            mcGewicht: zahl(m.mcGewicht, STANDARD.mcGewicht, [0.05, 0.8]),
            erkanntBonus: zahl(m.erkanntBonus, STANDARD.erkanntBonus, [0, 2]),
            kurzMax: zahl(m.kurzMax, STANDARD.kurzMax, [1, 3]),
        },
        anpassung: {
            letzte: Number.isFinite(a.letzte) ? a.letzte : null,
            beobachtungen: Math.max(0, Number(a.beobachtungen) || 0),
            verlauf: Array.isArray(a.verlauf) ? a.verlauf.filter((v) => v && typeof v.datum === "string").slice(-400) : [],
        },
    }
    if (!Array.isArray(m.w) || m.w.length !== 19) if (roh.modell) warnungen.push("Modellparameter fehlten – Standardwerte eingesetzt.")
    return { profil: out, warnungen }
}

// Parameter für den Planer, für eine Karte aus einem bestimmten Lerngebiet
export function parameterFuer(profil, gebiet) {
    const m = profil.modell
    const g = gebiet && m.gebiete[gebiet] ? m.gebiete[gebiet].faktor : 1
    return {
        ...STANDARD,
        w: m.w,
        faktor: m.faktor * g,
        zielQuote: profil.einstellungen.zielQuote,
        mcGewicht: m.mcGewicht,
        erkanntBonus: m.erkanntBonus,
        kurzMax: m.kurzMax,
    }
}

// ---------- Anpassung ----------
const ll = (y, p) => {
    const q = begrenzen(p, 1e-4, 1 - 1e-4)
    return y ? Math.log(q) : Math.log(1 - q)
}

// Goldener Schnitt: Maximum einer (unimodalen) Funktion auf [a, b]
function maximum(f, a, b, schritte = 60) {
    const g = (Math.sqrt(5) - 1) / 2
    let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d)
    for (let i = 0; i < schritte; i++) {
        if (fc < fd) { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d) }
        else { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c) }
    }
    return (a + b) / 2
}

// beobachtungen: [{ t (Tage seit letzter Abfrage), s, y (1/0), g (Gebiet), zeit (ms) }]
// Ergebnis: { profil (neu), geaendert, bericht }
export function anpassen(profil, beobachtungen, jetzt = Date.now(), { schritte = 1 } = {}) {
    const G = GRENZEN
    let neu = structuredClone(profil)
    const gew = beobachtungen.map((b) => Math.pow(0.5, Math.max(0, jetzt - b.zeit) / TAG / G.halbwertTage))
    const summe = gew.reduce((a, b) => a + b, 0)
    const bericht = { n: beobachtungen.length, gewichtet: summe, global: null, gebiete: {} }
    let geaendert = false

    for (let runde = 0; runde < schritte; runde++) {
        const m = neu.modell
        const r = (g) => m.gebiete[g]?.faktor ?? 1
        if (summe >= G.minGlobal) {
            const ziel = (th) => {
                let s = -(th * th) / (2 * G.sigmaGlobal ** 2)
                const f = Math.exp(th)
                for (let i = 0; i < beobachtungen.length; i++) {
                    const b = beobachtungen[i]
                    s += gew[i] * ll(b.y, abruf(b.t / (f * r(b.g)), b.s))
                }
                return s
            }
            const best = Math.exp(maximum(ziel, Math.log(G.faktor[0]), Math.log(G.faktor[1])))
            const schritt = begrenzen(best / m.faktor, 1 / G.schritt, G.schritt)
            const f = begrenzen(m.faktor * schritt, ...G.faktor)
            bericht.global = { optimum: best, vorher: m.faktor, nachher: f }
            if (Math.abs(f - m.faktor) > 1e-4) { m.faktor = f; geaendert = true }
        }
        // Lerngebiete
        const nachGebiet = new Map()
        beobachtungen.forEach((b, i) => {
            if (!b.g) return
            if (!nachGebiet.has(b.g)) nachGebiet.set(b.g, [])
            nachGebiet.get(b.g).push(i)
        })
        for (const [g, idx] of nachGebiet) {
            const n = idx.reduce((a, i) => a + gew[i], 0)
            if (n < G.minGebiet) continue
            const ziel = (rho) => {
                let s = -(rho * rho) / (2 * G.sigmaGebiet ** 2)
                const f = m.faktor * Math.exp(rho)
                for (const i of idx) s += gew[i] * ll(beobachtungen[i].y, abruf(beobachtungen[i].t / f, beobachtungen[i].s))
                return s
            }
            const best = Math.exp(maximum(ziel, Math.log(G.gebiet[0]), Math.log(G.gebiet[1])))
            const alt = m.gebiete[g]?.faktor ?? 1
            const f = begrenzen(alt * begrenzen(best / alt, 1 / G.schritt, G.schritt), ...G.gebiet)
            bericht.gebiete[g] = { optimum: best, vorher: alt, nachher: f, n: Math.round(n) }
            if (Math.abs(f - alt) > 1e-4 || !m.gebiete[g]) geaendert = true
            m.gebiete[g] = { faktor: f, n: idx.length }
        }
    }

    // Verlauf: ein Eintrag pro Tag (letzte 30 Tage: tatsächliche vs. erwartete Quote)
    const seit = jetzt - 30 * TAG
    const juengst = beobachtungen.filter((b) => b.zeit >= seit)
    const m = neu.modell
    const pFuer = (b) => abruf(b.t / (m.faktor * (m.gebiete[b.g]?.faktor ?? 1)), b.s)
    const eintrag = {
        datum: tagSchluessel(jetzt),
        faktor: Math.round(m.faktor * 1000) / 1000,
        n: juengst.length,
        quote: juengst.length ? juengst.reduce((a, b) => a + b.y, 0) / juengst.length : null,
        erwartet: juengst.length ? juengst.reduce((a, b) => a + pFuer(b), 0) / juengst.length : null,
    }
    const verlauf = neu.anpassung.verlauf.filter((v) => v.datum !== eintrag.datum)
    verlauf.push(eintrag)
    neu.anpassung = { letzte: jetzt, beobachtungen: beobachtungen.length, verlauf: verlauf.slice(-400) }
    neu.aktualisiert = new Date(jetzt).toISOString()
    return { profil: neu, geaendert, bericht }
}

// Soll jetzt angepasst werden? (nicht nach jeder einzelnen Antwort – das wäre zu nervös)
export function anpassenFaellig(profil, anzahlBeobachtungen, jetzt = Date.now()) {
    const a = profil.anpassung
    const neu = anzahlBeobachtungen - (a.beobachtungen || 0)
    if (neu <= 0) return false
    if (neu >= 20) return true
    return neu >= 5 && (!a.letzte || tagSchluessel(a.letzte) !== tagSchluessel(jetzt))
}

// Für die Anzeige: tatsächliche vs. erwartete Erinnerungsquote je Monat
export function kalibrierung(profil, beobachtungen) {
    const m = profil.modell
    const monate = new Map()
    for (const b of beobachtungen) {
        const d = new Date(b.zeit)
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const x = monate.get(k) || { monat: k, n: 0, gewusst: 0, erwartet: 0 }
        x.n++; x.gewusst += b.y
        x.erwartet += abruf(b.t / (m.faktor * (m.gebiete[b.g]?.faktor ?? 1)), b.s)
        monate.set(k, x)
    }
    return [...monate.values()].sort((a, b) => a.monat.localeCompare(b.monat))
        .map((x) => ({ ...x, quote: x.gewusst / x.n, erwartet: x.erwartet / x.n }))
}
