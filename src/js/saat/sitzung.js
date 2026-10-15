// ==========================================================
// Saat · Was ist fällig? + Ablauf einer Lernsitzung
// ==========================================================
import { abrufJetzt } from "./planer.js"
import { tagesbeginn, mischen } from "./hilfen.js"
import { heuteNeu } from "./protokoll.js"

// eintraege: Iterable der Index-Einträge, zustaende: Map, pFuer(eintrag) → Planer-Parameter
// Ergebnis: { faellig: [schluessel] (unsicherste zuerst), neu: [schluessel] (bis zur Tagesgrenze),
//            ueberfaellig, neuOffen (alle ungelernten), heuteNeu, naechste (ms|null), lernend }
export function faelligkeit(eintraege, zustaende, jetzt, { neuProTag = 20, reihenfolge = "datei", pFuer, nurDeck = null, zufall = Math.random } = {}) {
    const start = tagesbeginn(jetzt)
    const faellig = [], neu = []
    let ueberfaellig = 0, naechste = null, lernend = 0
    for (const e of eintraege) {
        if (!e.aktiv && !nurDeck) continue
        if (nurDeck && !e.vorkommen.some((v) => v.deckId === nurDeck)) continue
        const z = zustaende.get(e.schluessel)
        if (!z) { neu.push(e.schluessel); continue }
        if (z.faellig <= jetzt) {
            faellig.push({ k: e.schluessel, r: abrufJetzt(z, jetzt, pFuer(e)) })
            if (z.faellig < start) ueberfaellig++
            if (z.phase !== "wiederholen") lernend++
        } else if (naechste === null || z.faellig < naechste) naechste = z.faellig
    }
    faellig.sort((a, b) => a.r - b.r)
    const schonNeu = heuteNeu(zustaende, start)
    const frei = Math.max(0, neuProTag - schonNeu)
    const neuListe = reihenfolge === "zufall" ? mischen(neu, zufall) : neu
    return {
        faellig: faellig.map((x) => x.k),
        neu: neuListe.slice(0, frei),
        neuOffen: neu.length,
        heuteNeu: schonNeu,
        ueberfaellig,
        lernend,
        naechste,
    }
}

// Reihenfolge einer Sitzung: Wiederholungen, dazwischen nach jeder dritten eine neue Karte
export function sitzungsListe(faellig, neu, max = Infinity) {
    const out = []
    let i = 0, j = 0
    while ((i < faellig.length || j < neu.length) && out.length < max) {
        for (let n = 0; n < 3 && i < faellig.length && out.length < max; n++) out.push(faellig[i++])
        if (j < neu.length && out.length < max) out.push(neu[j++])
    }
    return out
}

// Ablauf: Liste von Aufgaben { schluessel, deckId? }. Nicht gewusste Karten kommen
// nach ein paar anderen Karten noch einmal dran (höchstens 3× pro Sitzung).
export class Sitzung {
    constructor(aufgaben, { modus = "karte", titel = "" } = {}) {
        this.modus = modus
        this.titel = titel
        this.offen = aufgaben.map((a) => ({ ...a, runde: 0 }))
        this.gesamt = this.offen.length
        this.fertig = []           // { aufgabe, ergebnis, ereignisId }
        this.stapel = []           // für Rückgängig
        this.zaehler = { 1: 0, 2: 0, 3: 0, 4: 0, richtig: 0, falsch: 0 }
    }
    get aktuell() { return this.offen[0] ?? null }
    get erledigt() { return this.fertig.filter((f) => !f.wieder).length }
    get vorbei() { return this.offen.length === 0 }

    // ergebnis: { b } (Karteikarte) oder { ok } (Auswahl); ereignisId zum Rückgängigmachen
    antworten(ergebnis, ereignisId) {
        const a = this.offen.shift()
        if (!a) return
        this.stapel.push({ offen: this.offen.map((x) => ({ ...x })), fertig: this.fertig.length, zaehler: { ...this.zaehler }, gesamt: this.gesamt, aufgabe: a })
        const fehl = ergebnis.ok === false || ergebnis.b === 1 || ergebnis.b === 2
        if ("b" in ergebnis) this.zaehler[ergebnis.b]++
        else this.zaehler[ergebnis.ok ? "richtig" : "falsch"]++
        const wieder = fehl && a.runde < 3
        if (wieder) {
            const pos = Math.min(this.offen.length, 3 + Math.floor(Math.random() * 3))
            this.offen.splice(pos, 0, { ...a, runde: a.runde + 1 })
        }
        this.fertig.push({ aufgabe: a, ergebnis, ereignisId, wieder })
    }

    rueckgaengig() {
        const s = this.stapel.pop()
        if (!s) return null
        const letzte = this.fertig.pop()
        // Stand vor der Antwort: die Warteschlange ohne die eben beantwortete Karte (und ohne ihre Wiederholung)
        this.offen = [s.aufgabe, ...s.offen]
        this.zaehler = s.zaehler
        this.gesamt = s.gesamt
        return letzte
    }

    // Karte während der Sitzung entfernen (z. B. weil die Datei gelöscht wurde)
    entfernen(schluessel) {
        this.offen = this.offen.filter((a) => a.schluessel !== schluessel)
    }
}
