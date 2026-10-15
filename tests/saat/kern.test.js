// Saat · Tests der Kernlogik (ohne Browser): node --test tests/
import { test } from "node:test"
import assert from "node:assert/strict"
import { deckLesen, deckSchreiben, neuesDeck, neueKarte, kernAbdruck, tabelleZuDeck, FormatFehler, VERSION, medienVerweise } from "../../src/js/saat/format.js"
import { anwenden, vorschau, beherrschung, abrufJetzt, STANDARD, abruf } from "../../src/js/saat/planer.js"
import { TAG, MINUTE, tagesbeginn } from "../../src/js/saat/hilfen.js"
import { neuesProfil, profilLesen, anpassen, parameterFuer, anpassenFaellig } from "../../src/js/saat/profil.js"
import { ereignis, nachspielen, protokollLesen, vereinigen, zeile, letzteAbdruecke } from "../../src/js/saat/protokoll.js"
import { indexBauen, leereEntscheidungen } from "../../src/js/saat/identitaet.js"
import { auswahlBauen } from "../../src/js/saat/ablenker.js"
import { faelligkeit, sitzungsListe, Sitzung } from "../../src/js/saat/sitzung.js"

const T0 = new Date(2026, 9, 1, 10, 0).getTime()   // 1. Okt. 2026, 10:00 lokal

// ---------------- Format ----------------
test("Format: Version 2 schreiben und wieder lesen (verlustfrei)", () => {
    const d = neuesDeck({ titel: "Test" })
    const k = neueKarte({ vorne: { text: "食べる", zusatz: "たべる", bloecke: [] }, antwort: "essen" })
    k.hinten.push({ id: "b1", typ: "satz", text: "ご飯を食べる。" }, { id: "b2", typ: "zukunftsblock", wert: 42 })
    k.eigenesFeld = "bleibt"
    d.karten.push(k)
    d.erweiterung = { x: 1 }
    const { deck, warnungen, nurLesen } = deckLesen(deckSchreiben(d))
    assert.equal(nurLesen, false)
    assert.deepEqual(warnungen, [])
    assert.equal(deck.karten[0].vorne.text, "食べる")
    assert.equal(deck.karten[0].hinten[1].typ, "zukunftsblock")       // unbekannter Block bleibt
    assert.equal(deck.karten[0].hinten[1].wert, 42)
    assert.equal(deck.karten[0].eigenesFeld, "bleibt")
    assert.deepEqual(deck.erweiterung, { x: 1 })
})

test("Format: Version 1 wird angehoben, fehlende IDs sind stabil", () => {
    const v1 = JSON.stringify({ format: "grove-saat", version: 1, titel: "Alt", karten: [{ frage: "Hund", antwort: "dog", notiz: "Tier", bild: "medien/hund.png" }] })
    const a = deckLesen(v1, { dateiname: "alt.saat" })
    const b = deckLesen(v1, { dateiname: "alt.saat" })
    assert.equal(a.deck.version, VERSION)
    assert.equal(a.deck.karten[0].vorne.text, "Hund")
    assert.deepEqual(a.deck.karten[0].hinten.map((x) => x.typ), ["bild", "text"])
    assert.equal(a.deck.karten[0].id, b.deck.karten[0].id, "ID muss bei jedem Laden gleich sein")
    assert.equal(a.deck.id, b.deck.id)
    assert.ok(a.geaendert)
    assert.ok(a.warnungen.some((w) => w.includes("Ältere Formatversion")))
    assert.deepEqual(medienVerweise(a.deck), ["medien/hund.png"])
})

test("Format: neuere Version nur lesen, kaputtes JSON verständlich ablehnen", () => {
    const r = deckLesen({ format: "grove-saat", version: 9, id: "d-zukunft", titel: "Z", karten: [{ id: "a", vorne: { text: "x" }, antwort: "y" }] })
    assert.equal(r.nurLesen, true)
    assert.throws(() => deckLesen("{kaputt"), FormatFehler)
    assert.throws(() => deckLesen("[1,2]"), FormatFehler)
    assert.throws(() => deckLesen({ format: "anders" }), FormatFehler)
})

test("Format: doppelte IDs in einer Datei werden getrennt und gemeldet", () => {
    const r = deckLesen({ format: "grove-saat", version: 2, id: "d-x", titel: "D", karten: [{ id: "a", vorne: { text: "1" }, antwort: "1" }, { id: "a", vorne: { text: "2" }, antwort: "2" }] })
    assert.deepEqual(r.deck.karten.map((k) => k.id), ["a", "a~2"])
    assert.ok(r.warnungen.length)
})

test("Format: fremde einfache Formen und CSV", () => {
    const r = deckLesen({ title: "Anki-Export", cards: [{ front: "cat", back: "Katze" }] })
    assert.equal(r.deck.karten[0].antwort, "Katze")
    const d = tabelleZuDeck("Vorderseite;Antwort;Notiz\nHund;dog;Tier\n\"Ja; klar\";\"yes\"\n")
    assert.equal(d.karten.length, 2)
    assert.equal(d.karten[1].vorne.text, "Ja; klar")
    assert.equal(d.karten[0].hinten[0].text, "Tier")
})

test("Format: Kern-Abdruck ignoriert Rückseite, Groß/klein und Leerraum", () => {
    const a = { vorne: { text: "Der  Hund" }, antwort: "dog", hinten: [] }
    const b = { vorne: { text: "der hund" }, antwort: "Dog ", hinten: [{ typ: "text", text: "anders" }] }
    assert.equal(kernAbdruck(a), kernAbdruck(b))
    assert.notEqual(kernAbdruck(a), kernAbdruck({ vorne: { text: "Hund" }, antwort: "hound" }))
})

// ---------------- Planer ----------------
const kartenEreignis = (t, b) => ({ t, a: "karte", b, k: "x" })

test("Planer: vier Bewertungen führen zu klar unterschiedlichen Abständen", () => {
    const v = vorschau(null, T0)
    assert.ok(v[1] <= 10 * MINUTE, "nicht gewusst → gleich nochmal")
    assert.ok(v[2] <= 10 * MINUTE && v[2] >= v[1], "erkannt → bald nochmal")
    assert.ok(v[3] >= TAG && v[3] < v[4], "gewusst < leicht")
    // nach einigen Erfolgen: deutliche Staffelung
    let z = null
    for (const tag of [0, 3, 10]) z = anwenden(z, kartenEreignis(T0 + tag * TAG, 3))
    const v2 = vorschau(z, T0 + 30 * TAG)
    assert.ok(v2[1] < v2[2] && v2[2] < v2[3] && v2[3] < v2[4], JSON.stringify(v2))
    assert.ok(v2[2] < TAG, "erkannt ist ein Fehlversuch")
})

test("Planer: nicht gewusst senkt die Stabilität, erkannt milder", () => {
    let z = null
    for (const tag of [0, 3, 12, 40]) z = anwenden(z, kartenEreignis(T0 + tag * TAG, 3))
    const t = T0 + 120 * TAG
    const nicht = anwenden(z, kartenEreignis(t, 1))
    const erkannt = anwenden(z, kartenEreignis(t, 2))
    assert.ok(nicht.s < z.s && erkannt.s < z.s)
    assert.ok(erkannt.s > nicht.s)
    assert.ok(nicht.d > z.d && erkannt.d > z.d && nicht.d > erkannt.d)
    assert.equal(nicht.phase, "neu-lernen")
    assert.equal(nicht.fehler, 1)
})

test("Planer: Fälligkeit liegt am Lerntag-Anfang, Abstände wachsen", () => {
    let z = null, t = T0, vorher = 0
    for (let i = 0; i < 6; i++) {
        z = anwenden(z, kartenEreignis(t, 3))
        const tage = (z.faellig - tagesbeginn(t)) / TAG
        assert.ok(Number.isInteger(Math.round(tage)))
        assert.ok(tage > vorher, `Abstand ${tage} nach ${vorher}`)
        vorher = tage
        t = z.faellig + 2 * 3_600_000
    }
})

test("Planer: viele Abfragen am selben Tag blähen nichts auf (Vorziehen-Schutz)", () => {
    let z = anwenden(null, kartenEreignis(T0, 3))
    const nachErster = z.s
    for (let i = 1; i <= 10; i++) z = anwenden(z, kartenEreignis(T0 + i * 60_000, 4))
    assert.ok(z.s <= nachErster * STANDARD.kurzMax + 1e-9, `${z.s} > ${nachErster * 1.5}`)
    // Schwierigkeit wird durch das Wiederholen am selben Tag nicht gesenkt
    assert.equal(z.d, anwenden(null, kartenEreignis(T0, 3)).d)
})

test("Planer: vorgezogene Abfrage bringt wenig, späte (richtige) viel", () => {
    let z = null
    for (const tag of [0, 3, 11]) z = anwenden(z, kartenEreignis(T0 + tag * TAG, 3))
    const frueh = anwenden(z, kartenEreignis(T0 + 13 * TAG, 3))
    const puenktlich = anwenden(z, kartenEreignis(z.faellig + 3_600_000, 3))
    assert.ok(frueh.s > z.s, "auch früh: kleiner Zuwachs")
    assert.ok(puenktlich.s - z.s > (frueh.s - z.s) * 2, "pünktlich deutlich mehr")
})

test("Planer: Auswahl richtig zählt weniger als frei gewusst, falsch wie nicht gewusst", () => {
    let z = null
    for (const tag of [0, 3, 11]) z = anwenden(z, kartenEreignis(T0 + tag * TAG, 3))
    const t = z.faellig + 3_600_000
    const frei = anwenden(z, kartenEreignis(t, 3))
    const mc = anwenden(z, { t, a: "auswahl", ok: true, k: "x" })
    const mcFalsch = anwenden(z, { t, a: "auswahl", ok: false, k: "x" })
    const nicht = anwenden(z, kartenEreignis(t, 1))
    assert.ok(mc.s > z.s && mc.s < frei.s)
    assert.ok((mc.s - z.s) <= (frei.s - z.s) * STANDARD.mcGewicht + 1e-9)
    assert.equal(mcFalsch.s, nicht.s)
    assert.equal(mc.frei, z.frei, "kein freier Abruf")
    // neue Karte nur per Auswahl gelernt: nie „gut“
    let m = null
    for (const tag of [0, 2, 6, 15, 35, 80]) m = anwenden(m, { t: T0 + tag * TAG, a: "auswahl", ok: true, k: "m" })
    assert.notEqual(beherrschung(m, T0 + 81 * TAG), "gut")
})

test("Planer: Beherrschung neu/schlecht/okay/gut", () => {
    assert.equal(beherrschung(null, T0), "neu")
    let z = anwenden(null, kartenEreignis(T0, 1))
    assert.equal(beherrschung(z, T0 + MINUTE), "schlecht")
    z = anwenden(z, kartenEreignis(T0 + 10 * MINUTE, 3))
    assert.equal(beherrschung(z, T0 + TAG), "okay")
    for (const tag of [1, 5, 18, 60]) z = anwenden(z, kartenEreignis(T0 + tag * TAG, 3))
    assert.equal(beherrschung(z, T0 + 61 * TAG), "gut")
    assert.equal(beherrschung(z, T0 + 2000 * TAG), "schlecht", "lange nicht gesehen → R sinkt")
})

test("Planer: persönlicher Faktor streckt die Abstände", () => {
    const p2 = { ...STANDARD, faktor: 1.5 }
    let a = null, b = null
    for (const tag of [0, 4, 14]) { a = anwenden(a, kartenEreignis(T0 + tag * TAG, 3)); b = anwenden(b, kartenEreignis(T0 + tag * TAG, 3), p2) }
    assert.ok(b.faellig > a.faellig)
    assert.ok(abrufJetzt(b, T0 + 30 * TAG, p2) > abrufJetzt(b, T0 + 30 * TAG, STANDARD))
})

// ---------------- Protokoll ----------------
test("Protokoll: kaputte Zeilen werden übersprungen, Vereinigung ohne Duplikate", () => {
    const e1 = ereignis({ k: "a", a: "karte", b: 3 }, T0)
    const e2 = ereignis({ k: "a", a: "karte", b: 4 }, T0 + 4 * TAG)
    const text = zeile(e1) + "{kaputt\n" + zeile(e2) + JSON.stringify({ id: "x", t: 1, a: "karte", k: "a", b: 9 }) + "\n"
    const { ereignisse, kaputt } = protokollLesen(text)
    assert.equal(ereignisse.length, 2)
    assert.equal(kaputt, 2)
    const v = vereinigen([e2, e1], [e1], [e2])
    assert.deepEqual(v.map((e) => e.id), [e1.id, e2.id])
})

test("Protokoll: Nachspielen = schrittweises Anwenden, Aufheben und Zurücksetzen", () => {
    const profil = neuesProfil(T0)
    const es = [
        ereignis({ k: "a", a: "karte", b: 3 }, T0),
        ereignis({ k: "a", a: "karte", b: 3 }, T0 + 3 * TAG),
        ereignis({ k: "b", a: "karte", b: 1 }, T0),
    ]
    const r = nachspielen(es, { profil })
    let z = anwenden(null, { ...es[0] }, parameterFuer(profil, null))
    z = anwenden(z, { ...es[1] }, parameterFuer(profil, null))
    assert.deepEqual(r.zustaende.get("a"), z)
    assert.equal(r.beobachtungen.length, 1)
    // Aufheben der zweiten Abfrage
    const auf = ereignis({ a: "aufheben", ref: es[1].id }, T0 + 3 * TAG + 1000)
    const r2 = nachspielen([...es, auf], { profil })
    assert.equal(r2.zustaende.get("a").wdh, 1)
    // Zurücksetzen
    const zu = ereignis({ a: "zuruecksetzen", k: "b" }, T0 + TAG)
    assert.equal(nachspielen([...es, zu], { profil }).zustaende.has("b"), false)
})

// ---------------- Identität ----------------
const deck = (id, karten) => ({ deck: { id, titel: id, gebiet: "", sprachen: { vorne: "ja" }, karten }, aktiv: true })
const karte = (id, vorne, antwort, hinten = []) => ({ id, vorne: { text: vorne }, antwort, hinten, tags: [] })

test("Identität: gleiche ID in drei Dateien = ein Eintrag, Rückseiten-Unterschiede kein Konflikt", () => {
    const i = indexBauen([
        deck("d1", [karte("jp-taberu", "食べる", "essen")]),
        deck("d2", [karte("jp-taberu", "食べる", "essen", [{ typ: "merksatz", text: "Tablett" }])]),
        deck("d3", [karte("jp-taberu", "食べる", "essen"), karte("jp-nomu", "飲む", "trinken")]),
    ])
    assert.equal(i.eintraege.size, 2)
    assert.equal(i.eintraege.get("jp-taberu").vorkommen.length, 3)
    assert.equal(i.konflikte.length, 0)
    assert.equal(i.schluessel("d2", "jp-taberu"), "jp-taberu")
})

test("Identität: Konflikt → getrennte Schlüssel, Entscheidung führt zusammen", () => {
    const decks = [deck("d1", [karte("x", "Bank", "Geldinstitut")]), deck("d2", [karte("x", "Bank", "Sitzbank")])]
    const fpSitz = kernAbdruck(decks[1].deck.karten[0])
    // ohne Protokoll: Tie → d1 gewinnt
    let i = indexBauen(decks)
    assert.equal(i.konflikte.length, 1)
    assert.equal(i.konflikte[0].geloest, false)
    assert.equal(i.schluessel("d1", "x"), "x")
    assert.equal(i.schluessel("d2", "x"), "x#" + fpSitz)
    // Protokoll sagt: zuletzt wurde die Sitzbank-Variante unter „x“ gelernt → sie behält den Lernstand
    i = indexBauen(decks, { abdruecke: new Map([["x", fpSitz]]) })
    assert.equal(i.schluessel("d2", "x"), "x")
    // Entscheidung „dieselbe Karte“
    const ent = leereEntscheidungen()
    ent.aliase["x#" + fpSitz] = "x"
    i = indexBauen(decks, { entscheidungen: ent })
    assert.equal(i.schluessel("d2", "x"), "x")
    assert.equal(i.konflikte[0].geloest, true)
    assert.equal(i.alias("x#" + fpSitz), "x")
    // Entscheidung „verschieden“
    const ent2 = leereEntscheidungen()
    ent2.getrennt["x#" + fpSitz] = true
    i = indexBauen(decks, { entscheidungen: ent2 })
    assert.equal(i.konflikte[0].geloest, true)
    assert.equal(i.eintraege.size, 2)
})

test("Identität: Lernstand aus Datei A gilt in Datei B (über das Protokoll)", () => {
    const decks = [deck("a", [karte("v1", "猫", "Katze")]), deck("b", [karte("v1", "猫", "Katze")])]
    const i = indexBauen(decks)
    const e = ereignis({ k: i.schluessel("a", "v1"), a: "karte", b: 3, d: "a" }, T0)
    const r = nachspielen([e], { profil: neuesProfil(), alias: i.alias })
    assert.ok(r.zustaende.get(i.schluessel("b", "v1")))
})

// ---------------- Auswahl ----------------
test("Auswahl: drei eindeutige Optionen, keine Synonyme oder gleichen Vorderseiten", () => {
    const pool = [
        { deckId: "d", karte: { id: "1", vorne: { text: "犬" }, antwort: "Hund", tags: [] } },
        { deckId: "d", karte: { id: "2", vorne: { text: "猫" }, antwort: "Katze", tags: [] } },
        { deckId: "d", karte: { id: "3", vorne: { text: "鳥" }, antwort: "Vogel", tags: [] } },
        { deckId: "d", karte: { id: "4", vorne: { text: "犬" }, antwort: "Rüde", tags: [] } },            // gleiche Frage
        { deckId: "d", karte: { id: "5", vorne: { text: "わんこ" }, antwort: "hund ", tags: [] } },        // gleiche Antwort
        { deckId: "d", karte: { id: "6", vorne: { text: "x" }, antwort: "Köter", alternativen: ["Hund"], tags: [] } }, // Synonym
        { deckId: "d", karte: { id: "7", vorne: { text: "y" }, antwort: "ねこ", tags: [] } },               // anderes Schriftsystem
    ]
    for (let n = 0; n < 50; n++) {
        const a = auswahlBauen(pool[0], pool)
        assert.equal(a.optionen.length, 3)
        assert.equal(a.optionen.filter((o) => o.richtig).length, 1)
        const texte = a.optionen.map((o) => o.text)
        assert.equal(new Set(texte.map((t) => t.toLowerCase().trim())).size, 3)
        for (const t of texte) assert.ok(["Hund", "Katze", "Vogel"].includes(t), t)
    }
})

test("Auswahl: zu wenig passende Ablenker → null statt irreführender Aufgabe", () => {
    const pool = [
        { deckId: "d", karte: { id: "1", vorne: { text: "a" }, antwort: "eins", tags: [] } },
        { deckId: "d", karte: { id: "2", vorne: { text: "b" }, antwort: "Eins", tags: [] } },
    ]
    assert.equal(auswahlBauen(pool[0], pool), null)
    // mit Ablenkern vom Autor geht es
    const k = { deckId: "d", karte: { id: "3", vorne: { text: "c" }, antwort: "drei", ablenker: ["vier", "fünf"], tags: [] } }
    assert.equal(auswahlBauen(k, pool).quelle, "autor")
    // lange Erklär-Antworten taugen nicht
    assert.equal(auswahlBauen({ deckId: "d", karte: { id: "9", vorne: { text: "?" }, antwort: "x".repeat(100) } }, pool), null)
})

// ---------------- Profil ----------------
function simulieren(faktorEcht, tage = 200, karten = 60, seed = 1) {
    // Simuliert einen Lernenden, dessen Gedächtnis um faktorEcht besser/schlechter ist als das Modell
    let x = seed
    const zufall = () => (x = (x * 16807) % 2147483647) / 2147483647
    let profil = neuesProfil(T0)
    const es = []
    const echt = new Map()
    for (let tag = 0; tag < tage; tag++) {
        const t = T0 + tag * TAG
        const { zustaende, beobachtungen } = nachspielen(es, { profil })
        for (let k = 0; k < karten; k++) {
            const key = "k" + k
            const z = zustaende.get(key)
            if (z && z.faellig > t + TAG / 2) continue
            if (!z && k > tag * 3 + 10) continue
            let b = 3
            if (z) {
                const r = abruf((t - z.letzte) / TAG / faktorEcht, (echt.get(key) ?? z.s))
                b = zufall() < r ? 3 : 1
            }
            es.push(ereignis({ k: key, a: "karte", b }, t + k * 1000))
            echt.set(key, null)
        }
        if (anpassenFaellig(profil, beobachtungen.length, t)) profil = anpassen(profil, beobachtungen, t).profil
    }
    return profil
}

test("Profil: lernt einen besseren Gedächtnisfaktor – schrittweise und begrenzt", () => {
    const gut = simulieren(1.8)
    assert.ok(gut.modell.faktor > 1.2, `Faktor ${gut.modell.faktor}`)
    assert.ok(gut.modell.faktor <= 2.5)
    const schwach = simulieren(0.6, 200, 60, 7)
    assert.ok(schwach.modell.faktor < 0.9, `Faktor ${schwach.modell.faktor}`)
    const normal = simulieren(1.0, 200, 60, 3)
    assert.ok(Math.abs(normal.modell.faktor - 1) < 0.25, `Faktor ${normal.modell.faktor}`)
    assert.ok(gut.anpassung.verlauf.length > 5)
})

test("Profil: einzelne Fehler kippen nichts, wenige Daten ändern nichts", () => {
    const p = neuesProfil(T0)
    const wenig = Array.from({ length: 10 }, (_, i) => ({ t: 5, s: 5, y: 0, g: "x", zeit: T0 + i }))
    assert.equal(anpassen(p, wenig, T0 + TAG).profil.modell.faktor, 1)
    // 200 gute + 3 schlechte Beobachtungen: höchstens 15 % Schritt
    const viel = Array.from({ length: 200 }, (_, i) => ({ t: 10, s: 5, y: i < 3 ? 0 : 1, g: "x", zeit: T0 }))
    const r = anpassen(p, viel, T0 + TAG)
    assert.ok(r.profil.modell.faktor <= 1.15 + 1e-9 && r.profil.modell.faktor > 1)
})

test("Profil: Lerngebiete bekommen eigene Faktoren erst mit genug Daten", () => {
    const p = neuesProfil(T0)
    const obs = [
        ...Array.from({ length: 80 }, () => ({ t: 8, s: 8, y: 1, g: "Japanisch", zeit: T0 })),
        ...Array.from({ length: 80 }, (_, i) => ({ t: 8, s: 8, y: i % 2, g: "Chemie", zeit: T0 })),
        ...Array.from({ length: 5 }, () => ({ t: 8, s: 8, y: 0, g: "Selten", zeit: T0 })),
    ]
    let q = p
    for (let i = 0; i < 6; i++) q = anpassen(q, obs, T0 + i * TAG).profil
    assert.ok(q.modell.gebiete.Japanisch.faktor > q.modell.gebiete.Chemie.faktor)
    assert.equal(q.modell.gebiete.Selten, undefined)
})

test("Profil: robust lesen", () => {
    const { profil, warnungen } = profilLesen({ einstellungen: { zielQuote: 5, neuProTag: "abc" }, modell: { w: [1, 2] } })
    assert.equal(profil.einstellungen.zielQuote, 0.97)
    assert.equal(profil.einstellungen.neuProTag, 20)
    assert.equal(profil.modell.w.length, 19)
    assert.ok(warnungen.length)
    assert.equal(profilLesen(null).profil.modell.faktor, 1)
})

// ---------------- Sitzung ----------------
test("Fälligkeit: zählt fällige, überfällige, neue mit Tagesgrenze", () => {
    const profil = neuesProfil(T0)
    const i = indexBauen([deck("d", Array.from({ length: 30 }, (_, n) => karte("k" + n, "v" + n, "a" + n)))])
    const es = [
        ereignis({ k: "k0", a: "karte", b: 3 }, T0 - 10 * TAG),          // längst fällig (überfällig)
        ereignis({ k: "k1", a: "karte", b: 4 }, T0),                     // gerade gelernt → nicht fällig
        ereignis({ k: "k2", a: "karte", b: 1 }, T0 - 20 * MINUTE),       // Lernschritt, fällig
    ]
    const { zustaende } = nachspielen(es, { profil })
    const f = faelligkeit(i.eintraege.values(), zustaende, T0, { neuProTag: 5, pFuer: (e) => parameterFuer(profil, e.gebiet) })
    assert.deepEqual(new Set(f.faellig), new Set(["k0", "k2"]))
    assert.equal(f.ueberfaellig, 1)
    assert.equal(f.heuteNeu, 2, "k1 und k2 sind heute neu (gleicher Lerntag)")
    assert.equal(f.neu.length, 5 - f.heuteNeu)
    assert.equal(f.neuOffen, 27)
})

test("Sitzung: nicht gewusste Karten kommen wieder, Rückgängig stellt her", () => {
    const s = new Sitzung(["a", "b", "c", "d", "e", "f"].map((k) => ({ schluessel: k })))
    s.antworten({ b: 1 }, "e1")
    assert.equal(s.offen.filter((x) => x.schluessel === "a").length, 1)
    assert.notEqual(s.aktuell.schluessel, "a")
    const vorher = s.offen.map((x) => x.schluessel).join()
    s.antworten({ b: 3 }, "e2")
    s.rueckgaengig()
    assert.equal(s.offen.map((x) => x.schluessel).join(), vorher)
    assert.equal(s.zaehler[3], 0)
    assert.deepEqual(sitzungsListe(["1", "2", "3", "4"], ["n1", "n2"]), ["1", "2", "3", "n1", "4", "n2"])
})

test("Identität: zusammengeführte Variante kippt die Entscheidung nicht, auch wenn sie zuletzt gelernt wurde", () => {
    const decks = [deck("a-fremd", [karte("x", "tree", "Strauch")]), deck("b-eigen", [karte("x", "tree", "Baum")])]
    const fpBaum = kernAbdruck(decks[1].deck.karten[0]), fpStrauch = kernAbdruck(decks[0].deck.karten[0])
    const ent = leereEntscheidungen()
    ent.aliase["x#" + fpStrauch] = "x"
    // Protokoll: zuletzt wurde (unter „x“) die Strauch-Variante gelernt
    const i = indexBauen(decks, { abdruecke: new Map([["x", fpStrauch]]), entscheidungen: ent })
    assert.equal(i.konflikte[0].geloest, true)
    assert.equal(i.eintraege.get("x").fp, fpBaum, "angezeigt wird die Hauptvariante")
    assert.equal(i.eintraege.get("x").vorkommen.length, 2)
})
