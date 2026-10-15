// ==========================================================
// Saat · Identität von Lernkarten über Dateien hinweg
//
// Der Lernstand hängt an der Karten-ID – nicht an der Datei. Steht dieselbe ID in
// drei Lerndateien, ist es EINE Karte mit EINEM Lernstand.
//
// Konflikt = gleiche ID, aber unterschiedlicher Kern (Vorderseite oder Antwort).
// Dann gilt (nichts geht still verloren, nichts wird still vermischt):
//   • Die Variante, die zuletzt gelernt wurde (Abdruck im Protokoll), behält den Lernstand
//     unter der ID. Ohne Protokoll: die Variante aus den meisten Dateien.
//   • Jede andere Variante bekommt vorläufig einen eigenen Schlüssel „id#abdruck“ mit
//     eigenem Lernstand und erscheint als Konflikt, bis du entscheidest:
//       „Dieselbe Karte“  → Alias auf die ID (Lernstände werden zusammengeführt)
//       „Verschiedene Karten“ → bleibt dauerhaft getrennt
//   Entscheidungen liegen in fortschritt/identitaeten.json – die Lerndateien bleiben unberührt.
// Unterschiede nur auf der Rückseite sind kein Konflikt (z. B. eine Datei hat mehr Beispiele).
// ==========================================================
import { kernAbdruck } from "./format.js"

export const leereEntscheidungen = () => ({ version: 1, aliase: {}, getrennt: {} })

export function entscheidungenLesen(roh) {
    const e = leereEntscheidungen()
    if (roh && typeof roh === "object") {
        for (const [k, v] of Object.entries(roh.aliase || {})) if (typeof v === "string") e.aliase[k] = v
        for (const [k, v] of Object.entries(roh.getrennt || {})) if (v) e.getrennt[k] = true
    }
    return e
}

// Zwei Entscheidungs-Sammlungen vereinigen (Import): vorhandene Entscheidungen gewinnen
export function entscheidungenVereinigen(alt, neu) {
    const out = entscheidungenLesen(alt)
    for (const [k, v] of Object.entries(neu.aliase || {})) if (!(k in out.aliase) && !out.getrennt[k]) out.aliase[k] = v
    for (const k of Object.keys(neu.getrennt || {})) if (!(k in out.aliase)) out.getrennt[k] = true
    return out
}

export const gebietVon = (karte, deck) => karte.gebiet || deck.gebiet || deck.sprachen?.vorne || "allgemein"

// decks: [{ deck, aktiv }] in fester Reihenfolge
// Ergebnis: { eintraege: Map<schluessel, eintrag>, schluessel(deckId, kartenId), konflikte: [...], alias(k) }
export function indexBauen(decks, { abdruecke = new Map(), entscheidungen = leereEntscheidungen() } = {}) {
    // 1. alle Karten nach ID sammeln
    const nachId = new Map()
    for (const { deck, aktiv } of decks) {
        for (const karte of deck.karten) {
            const fp = kernAbdruck(karte)
            if (!nachId.has(karte.id)) nachId.set(karte.id, [])
            nachId.get(karte.id).push({ deck, karte, fp, aktiv: aktiv !== false })
        }
    }

    const eintraege = new Map()
    const zuordnung = new Map()             // `${deckId}\u0000${kartenId}` → schluessel
    const konflikte = []
    const alias = (k) => entscheidungen.aliase[k] ?? k

    const eintragen = (schluessel, vorkommen, primaer) => {
        let e = eintraege.get(schluessel)
        if (!e) {
            e = { schluessel, id: vorkommen.karte.id, karte: vorkommen.karte, deck: vorkommen.deck, fp: vorkommen.fp,
                gebiet: gebietVon(vorkommen.karte, vorkommen.deck), vorkommen: [], aktiv: false, konflikt: null, primaer }
            eintraege.set(schluessel, e)
        }
        e.vorkommen.push({ deckId: vorkommen.deck.id, karte: vorkommen.karte, fp: vorkommen.fp })
        e.aktiv ||= vorkommen.aktiv
        zuordnung.set(vorkommen.deck.id + "\u0000" + vorkommen.karte.id, schluessel)
    }

    for (const [id, vorkommen] of nachId) {
        const varianten = new Map()
        for (const v of vorkommen) {
            if (!varianten.has(v.fp)) varianten.set(v.fp, [])
            varianten.get(v.fp).push(v)
        }
        if (varianten.size === 1) {
            for (const v of vorkommen) eintragen(id, v, true)
            continue
        }
        // Konflikt: Hauptvariante bestimmen
        // Bereits entschiedene Varianten („dieselbe“/„verschieden“) können nie Hauptvariante sein –
        // sonst würde eine später gelernte zusammengeführte Variante die Entscheidung umkippen.
        const entschieden = (fp) => !!(entscheidungen.aliase[`${id}#${fp}`] || entscheidungen.getrennt[`${id}#${fp}`])
        const offen = [...varianten.entries()].filter(([fp]) => !entschieden(fp))
        const kandidaten = offen.length ? offen : [...varianten.entries()]
        let haupt = abdruecke.get(id)
        if (!kandidaten.some(([fp]) => fp === haupt)) {
            haupt = [...kandidaten].sort((a, b) =>
                b[1].length - a[1].length || (a[1][0].deck.id < b[1][0].deck.id ? -1 : 1))[0][0]
        }
        const konflikt = { id, varianten: [], geloest: true }
        // Hauptvariante zuerst eintragen → sie bestimmt, wie die gemeinsame Karte angezeigt wird
        const reihenfolge = [...varianten.entries()].sort((a, b) => (a[0] === haupt ? -1 : b[0] === haupt ? 1 : 0))
        for (const [fp, liste] of reihenfolge) {
            const eigen = `${id}#${fp}`
            let schluessel, status
            if (fp === haupt) { schluessel = id; status = "haupt" }
            else if (entscheidungen.aliase[eigen]) { schluessel = entscheidungen.aliase[eigen]; status = "gleich" }
            else if (entscheidungen.getrennt[eigen]) { schluessel = eigen; status = "getrennt" }
            else { schluessel = eigen; status = "offen"; konflikt.geloest = false }
            for (const v of liste) eintragen(schluessel, v, fp === haupt)
            konflikt.varianten.push({ fp, schluessel: eigen, status, decks: liste.map((v) => v.deck.id), karte: liste[0].karte })
        }
        for (const v of konflikt.varianten) {
            const e = eintraege.get(v.status === "haupt" ? id : v.status === "gleich" ? entscheidungen.aliase[v.schluessel] : v.schluessel)
            if (e) e.konflikt = konflikt
        }
        konflikte.push(konflikt)
    }

    return {
        eintraege,
        konflikte,
        alias,
        schluessel: (deckId, kartenId) => zuordnung.get(deckId + "\u0000" + kartenId) ?? null,
    }
}
