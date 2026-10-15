// ==========================================================
// Saat · Auswahl-Modus: drei faire Antwortmöglichkeiten
//
// Die richtige Antwort + zwei Ablenker. Ablenker kommen
//   1. aus dem Feld „ablenker“ der Karte (vom Autor gewählt), sonst
//   2. aus den Antworten anderer Karten – bevorzugt aus derselben Datei, mit gleichen Tags,
//      im gleichen Schriftsystem und ähnlich lang (damit nichts auf den ersten Blick „raussticht“).
// Ausgeschlossen wird alles, was mehrdeutig oder unfair wäre:
//   • gleiche Antwort (auch anders geschrieben) oder eine Alternative der richtigen Antwort,
//   • Karten mit derselben Vorderseite (z. B. „Bank“ = Geldinstitut / Sitzbank),
//   • Antworten, die die richtige enthalten oder in ihr enthalten sind („essen“ / „essen gehen“),
//   • zu lange Antworten (Auswahl zeigt nur Lösungen, keine Erklärungen).
// Reicht das nicht für zwei Ablenker, liefert die Funktion null – die Karte wird dann
// nicht als Auswahl-Aufgabe gestellt (statt eine irreführende Aufgabe zu bauen).
// ==========================================================
import { normal, normalAntwort, schriftGruppe, mischen } from "./hilfen.js"

export const MAX_LAENGE = 80

const enthaelt = (a, b) => a.length > 2 && b.length > 2 && (` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `))
const grossKlein = (t) => /^\p{Lu}/u.test(t.trim())

export function auswahlTauglich(karte) {
    const a = (karte?.antwort || "").trim()
    return !!a && a.length <= MAX_LAENGE && !!(karte.vorne?.text?.trim() || karte.vorne?.bloecke?.length)
}

// ziel: { karte, deckId } · pool: [{ karte, deckId }] (alle verfügbaren Karten)
// Ergebnis: { optionen: [{ text, richtig }] (gemischt), quelle: "autor"|"pool"|"gemischt" } oder null
export function auswahlBauen(ziel, pool, { zufall = Math.random } = {}) {
    const k = ziel.karte
    if (!auswahlTauglich(k)) return null
    const richtig = k.antwort.trim()
    const nRichtig = normalAntwort(richtig)
    const verboten = new Set([nRichtig, ...(k.alternativen || []).map(normalAntwort)])
    const vorne = normal(k.vorne?.text)
    const sGruppe = schriftGruppe(richtig)
    const tags = new Set(k.tags || [])
    const gewaehlt = []
    const gesehen = new Set(verboten)
    const passt = (text) => {
        const n = normalAntwort(text)
        if (!n || gesehen.has(n) || text.length > MAX_LAENGE) return false
        if ([...verboten].some((v) => enthaelt(v, n))) return false
        return true
    }

    // 1. vom Autor vorgegebene Ablenker
    for (const a of mischen(k.ablenker || [], zufall)) {
        if (gewaehlt.length >= 2) break
        if (passt(a)) { gewaehlt.push(a.trim()); gesehen.add(normalAntwort(a)) }
    }
    const vomAutor = gewaehlt.length

    // 2. aus anderen Karten
    if (gewaehlt.length < 2) {
        const kandidaten = []
        for (const p of pool) {
            const pk = p.karte
            if (pk === k || pk.id === k.id) continue
            const text = (pk.antwort || "").trim()
            if (!text || !passt(text)) continue
            if (vorne && normal(pk.vorne?.text) === vorne) continue                        // gleiche Frage → auch richtig
            if ((pk.alternativen || []).some((x) => verboten.has(normalAntwort(x)))) continue // Synonym der richtigen Antwort
            if (schriftGruppe(text) !== sGruppe) continue
            let punkte = 0
            if (p.deckId === ziel.deckId) punkte += 3
            punkte += Math.min(2, (pk.tags || []).filter((t) => tags.has(t)).length)
            const la = richtig.length, lb = text.length
            punkte -= (Math.abs(la - lb) / Math.max(la, lb)) * 2
            if (grossKlein(text) === grossKlein(richtig)) punkte += 0.6
            if (text.split(/\s+/).length === richtig.split(/\s+/).length) punkte += 0.4
            punkte += zufall() * 1.2
            kandidaten.push({ text, punkte })
        }
        kandidaten.sort((a, b) => b.punkte - a.punkte)
        for (const c of kandidaten) {
            if (gewaehlt.length >= 2) break
            const n = normalAntwort(c.text)
            if (gesehen.has(n) || gewaehlt.some((g) => enthaelt(normalAntwort(g), n))) continue
            gewaehlt.push(c.text)
            gesehen.add(n)
        }
    }
    if (gewaehlt.length < 2) return null
    const optionen = mischen([{ text: richtig, richtig: true }, ...gewaehlt.map((text) => ({ text, richtig: false }))], zufall)
    return { optionen, quelle: vomAutor === 2 ? "autor" : vomAutor ? "gemischt" : "pool" }
}
