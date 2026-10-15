// ==========================================================
// Saat · Dateiformat für Lerninhalte („Saatgut“, Endung .saat)
//
// Eine .saat-Datei ist UTF-8-JSON und beschreibt NUR Inhalte – nie den Lernstand.
// Darum kann man sie bedenkenlos teilen. Vollständige Beschreibung: docs/saat-format.md
//
//   { format: "grove-saat", version: 2, id, titel, beschreibung, autor, gebiet,
//     sprachen: { vorne, hinten }, tags, erstellt, geaendert,
//     karten: [ { id, vorne: { text, zusatz, bloecke }, antwort, alternativen,
//                 ablenker, hinten: [Blöcke], verknuepft: [{ id, art }], tags, gebiet } ] }
//
// Ältere Fassungen werden beim Lesen angehoben (MIGRATIONEN), unbekannte Felder
// und Blocktypen bleiben erhalten. Neuere Fassungen öffnen wir nur lesend.
// ==========================================================
import { BLOECKE } from "./bloecke.js"
import { fnv, normal, neueId, idSauber } from "./hilfen.js"

export const FORMAT = "grove-saat"
export const VERSION = 2
export const ENDUNG = ".saat"
export const PAKET_ENDUNG = ".saatpaket"

export class FormatFehler extends Error {}

const istObjekt = (x) => x !== null && typeof x === "object" && !Array.isArray(x)
const text = (x) => (typeof x === "string" ? x : x == null ? "" : String(x))
const liste = (x) => (Array.isArray(x) ? x : x == null || x === "" ? [] : [x])
const jetztIso = () => new Date().toISOString()

// ---------- Neue Objekte ----------
export function neuesDeck({ titel = "Neue Lerndatei", gebiet = "", vorne = "", hinten = "de" } = {}) {
    const jetzt = jetztIso()
    return {
        format: FORMAT, version: VERSION, id: neueId("d"), titel, beschreibung: "", autor: "",
        gebiet, sprachen: { vorne, hinten }, tags: [], erstellt: jetzt, geaendert: jetzt, karten: [],
    }
}

export function neueKarte(teil = {}) {
    return { id: neueId("k"), vorne: { text: "", zusatz: "", bloecke: [] }, antwort: "", alternativen: [], ablenker: [], eingaben: [], hinten: [], verknuepft: [], tags: [], ...teil }
}

export function neuerBlock(typ) {
    const def = BLOECKE[typ]
    if (!def) throw new FormatFehler(`Unbekannter Blocktyp: ${typ}`)
    return { id: neueId("b", 6), typ, ...def.neu() }
}

// ---------- Fingerabdrücke ----------
// Kern = woran man erkennt, ob zwei Karten „dieselbe“ sind: Vorderseite + Antwort.
// Unterschiede nur auf der Rückseite (Beispiele, Merksätze …) sind KEIN Konflikt.
export function kernAbdruck(karte) {
    return fnv(normal(karte?.vorne?.text) + "\u0001" + normal(karte?.antwort))
}
export function inhaltAbdruck(karte) {
    return fnv(JSON.stringify([karte?.vorne, karte?.antwort, karte?.alternativen, karte?.hinten]))
}

// ---------- Migrationen ----------
// Version 1 („einfaches Saatgut“): zum schnellen Schreiben von Hand.
//   { format: "grove-saat", version: 1, titel, karten: [ { id?, frage, antwort, notiz?, bild?, beispiel? } ] }
// Ohne „format“ akzeptieren wir außerdem { cards: [ { front, back } ] } bzw. { karten: [ { vorne, hinten } ] } als Text.
const MIGRATIONEN = {
    1: (d) => ({
        ...d,
        version: 2,
        karten: liste(d.karten).map((k) => {
            if (!istObjekt(k)) return k
            const { frage, notiz, bild, beispiel, ...rest } = k
            const hinten = []
            if (bild) hinten.push({ typ: "bild", quelle: text(bild), alt: "", unterschrift: "" })
            if (beispiel) hinten.push({ typ: "satz", text: text(beispiel), markierung: "", lesung: "", sprache: "" })
            if (notiz) hinten.push({ typ: "text", text: text(notiz) })
            const vorne = istObjekt(rest.vorne) ? rest.vorne : { text: text(frage ?? rest.vorne) }
            return { ...rest, vorne, hinten: [...hinten, ...liste(rest.hinten).filter(istObjekt)] }
        }),
    }),
}

function versionErkennen(roh) {
    if (!istObjekt(roh)) throw new FormatFehler("Die Datei enthält kein Saat-Objekt.")
    if (roh.format === FORMAT) {
        const v = Number(roh.version)
        if (!Number.isInteger(v) || v < 1) throw new FormatFehler("Unbekannte Formatversion.")
        return roh
    }
    // fremde, aber einfache Formen als Version 1 lesen
    const karten = roh.karten ?? roh.cards
    if (Array.isArray(karten)) {
        return {
            format: FORMAT, version: 1, titel: text(roh.titel ?? roh.title ?? roh.name ?? "Importierte Lerndatei"),
            karten: karten.map((k) => istObjekt(k) ? {
                id: k.id, frage: text(k.frage ?? k.front ?? (typeof k.vorne === "string" ? k.vorne : k.vorne?.text) ?? k.question),
                antwort: text(k.antwort ?? k.back ?? (typeof k.hinten === "string" ? k.hinten : "") ?? k.answer),
                notiz: text(k.notiz ?? k.note ?? k.notes ?? ""),
            } : k),
        }
    }
    throw new FormatFehler("Das ist keine Saat-Lerndatei (Feld „format“ fehlt).")
}

// ---------- Lesen ----------
// Ergebnis: { deck, warnungen: [...], nurLesen, geaendert (= beim Lesen ergänzt, z. B. IDs) }
export function deckLesen(eingabe, { dateiname = "" } = {}) {
    let roh = eingabe
    if (typeof eingabe === "string") {
        const t = eingabe.replace(/^﻿/, "")
        try { roh = JSON.parse(t) } catch (f) { throw new FormatFehler(`Die Datei ist kein gültiges JSON (${f.message}).`) }
    }
    roh = versionErkennen(roh)
    const warnungen = []
    let nurLesen = false
    let d = structuredClone(roh)
    const ausgangsVersion = d.version
    if (d.version > VERSION) {
        nurLesen = true
        warnungen.push(`Die Datei stammt aus einer neueren Saat-Version (${d.version}). Sie wird nur angezeigt, damit nichts verloren geht.`)
    }
    while (d.version < VERSION) {
        const m = MIGRATIONEN[d.version]
        if (!m) throw new FormatFehler(`Formatversion ${d.version} kann nicht gelesen werden.`)
        d = m(d)
    }
    if (ausgangsVersion < VERSION) warnungen.push(`Ältere Formatversion ${ausgangsVersion} – beim Speichern wird sie auf Version ${VERSION} angehoben.`)

    let geaendert = ausgangsVersion < VERSION
    if (!idSauber(d.id)) {
        // stabile Ersatz-ID aus dem Titel + Dateinamen, damit sie bei jedem Laden gleich bleibt
        d.id = "d-" + fnv(text(d.titel) + "|" + dateiname)
        geaendert = true
    }
    d.titel = text(d.titel).trim() || dateiname.replace(/\.[^.]+$/, "") || "Ohne Titel"
    d.beschreibung = text(d.beschreibung)
    d.autor = text(d.autor)
    d.gebiet = text(d.gebiet)
    d.sprachen = istObjekt(d.sprachen) ? { vorne: text(d.sprachen.vorne), hinten: text(d.sprachen.hinten) } : { vorne: "", hinten: "" }
    d.tags = liste(d.tags).map(text).filter(Boolean)
    d.erstellt = text(d.erstellt) || jetztIso()
    d.geaendert = text(d.geaendert) || d.erstellt

    const gesehen = new Map()
    const karten = []
    liste(d.karten).forEach((k, i) => {
        if (!istObjekt(k)) { warnungen.push(`Karte ${i + 1} ist kein Objekt und wurde übersprungen.`); return }
        const karte = karteSaeubern(k, warnungen, i)
        if (!idSauber(karte.id)) {
            // fehlende ID: deterministisch aus Datei + Inhalt, damit der Lernstand beim nächsten Laden passt
            const alt = karte.id
            karte.id = "k-" + fnv(d.id + "|" + normal(karte.vorne.text) + "|" + normal(karte.antwort))
            geaendert = true
            if (alt) warnungen.push(`Karte ${i + 1}: ungültige ID „${alt}“ ersetzt.`)
        }
        if (gesehen.has(karte.id)) {
            const n = gesehen.get(karte.id) + 1
            gesehen.set(karte.id, n)
            warnungen.push(`Karte ${i + 1}: ID „${karte.id}“ kommt in dieser Datei doppelt vor – die zweite heißt jetzt „${karte.id}~${n}“.`)
            karte.id = `${karte.id}~${n}`
            geaendert = true
        } else gesehen.set(karte.id, 1)
        karten.push(karte)
    })
    d.karten = karten
    d.version = Math.max(d.version, VERSION)
    if (!nurLesen) { d.format = FORMAT; d.version = VERSION }
    return { deck: d, warnungen, nurLesen, geaendert }
}

function karteSaeubern(k, warnungen, i) {
    const vorneRoh = typeof k.vorne === "string" ? { text: k.vorne } : istObjekt(k.vorne) ? k.vorne : {}
    const karte = {
        ...k,
        id: typeof k.id === "number" ? String(k.id) : k.id,
        vorne: { ...vorneRoh, text: text(vorneRoh.text), zusatz: text(vorneRoh.zusatz), bloecke: bloeckeSaeubern(vorneRoh.bloecke, warnungen, i) },
        antwort: text(k.antwort),
        alternativen: liste(k.alternativen).map(text).filter((x) => x.trim()),
        ablenker: liste(k.ablenker).map(text).filter((x) => x.trim()),
        eingaben: liste(k.eingaben).map(text).filter((x) => x.trim()),
        hinten: bloeckeSaeubern(k.hinten, warnungen, i),
        verknuepft: liste(k.verknuepft).map((v) => typeof v === "string" ? { id: v, art: "verwandt" } : v)
            .filter((v) => istObjekt(v) && typeof v.id === "string").map((v) => ({ ...v, art: text(v.art) || "verwandt" })),
        tags: liste(k.tags).map(text).filter(Boolean),
    }
    if (k.gebiet != null) karte.gebiet = text(k.gebiet)
    if (k.zeichnen != null) {
        if (istObjekt(k.zeichnen)) {
            const z = k.zeichnen
            karte.zeichnen = { ...z, aufgabe: text(z.aufgabe), text: text(z.text),
                striche: liste(z.striche).filter((s) => Array.isArray(s) && s.length >= 2 && s.every((x) => Number.isFinite(x))).map((s) => s.map((x) => Math.round(x))) }
        } else delete karte.zeichnen
    }
    if (!karte.vorne.text.trim() && !karte.vorne.bloecke.length) warnungen.push(`Karte ${i + 1}: Die Vorderseite ist leer.`)
    return karte
}

function bloeckeSaeubern(roh, warnungen, i) {
    const ids = new Set()
    return liste(roh).filter((b, j) => {
        if (istObjekt(b) && typeof b.typ === "string") return true
        warnungen.push(`Karte ${i + 1}: Block ${j + 1} ist ungültig und wurde weggelassen.`)
        return false
    }).map((b) => {
        const block = { ...b }
        if (!block.id || ids.has(block.id)) block.id = "b-" + fnv(JSON.stringify(b) + ids.size)
        ids.add(block.id)
        return block
    })
}

// ---------- Schreiben ----------
export function deckSchreiben(deck) {
    const { format, version, id, titel, beschreibung, autor, gebiet, sprachen, tags, erstellt, geaendert, karten, ...rest } = deck
    const sauber = {
        format: FORMAT, version: VERSION, id, titel, beschreibung, autor, gebiet, sprachen, tags, erstellt, geaendert,
        ...rest,
        karten: karten.map(karteKompakt),
    }
    return JSON.stringify(sauber, null, 2) + "\n"
}

// Leere Felder weglassen – die Datei bleibt dadurch gut lesbar und klein
function karteKompakt(k) {
    const out = {}
    for (const [schl, wert] of Object.entries(k)) {
        if (wert === "" || wert == null) continue
        if (Array.isArray(wert) && !wert.length) continue
        if (schl === "zeichnen" && wert && typeof wert === "object") {
            const z = {}
            for (const [a, b] of Object.entries(wert)) if (!(b === "" || b == null || (Array.isArray(b) && !b.length))) z[a] = b
            out.zeichnen = z
            continue
        }
        if (schl === "vorne") {
            const v = {}
            for (const [a, b] of Object.entries(wert)) if (!(b === "" || b == null || (Array.isArray(b) && !b.length))) v[a] = b
            out.vorne = v
            continue
        }
        out[schl] = wert
    }
    return out
}

// ---------- Tabellen (CSV/TSV) → Lerndatei ----------
// Spalten: Vorderseite ; Antwort ; Notiz (optional) – Trenner wird erkannt (Tab, ;, ,)
export function tabelleZuDeck(inhalt, { titel = "Importierte Tabelle" } = {}) {
    const zeilen = inhalt.replace(/^﻿/, "").split(/\r?\n/).filter((z) => z.trim() && !z.startsWith("#"))
    if (!zeilen.length) throw new FormatFehler("Die Tabelle ist leer.")
    const trenner = ["\t", ";", ","].find((t) => zeilen.every((z) => z.includes(t))) ?? (zeilen[0].includes("\t") ? "\t" : ";")
    const zellen = zeilen.map((z) => csvZeile(z, trenner))
    const kopf = zellen[0].map((x) => normal(x))
    const hatKopf = kopf.some((x) => ["vorderseite", "vorne", "front", "frage", "begriff"].includes(x))
    const deck = neuesDeck({ titel })
    for (const [vorne, antwort, notiz] of hatKopf ? zellen.slice(1) : zellen) {
        if (!vorne?.trim()) continue
        const karte = neueKarte({ vorne: { text: vorne.trim(), zusatz: "", bloecke: [] }, antwort: (antwort || "").trim() })
        karte.id = "k-" + fnv(deck.id + "|" + normal(vorne) + "|" + normal(antwort))
        if (notiz?.trim()) karte.hinten.push({ id: neueId("b", 6), typ: "text", text: notiz.trim() })
        deck.karten.push(karte)
    }
    if (!deck.karten.length) throw new FormatFehler("In der Tabelle wurden keine Karten gefunden.")
    return deck
}

function csvZeile(zeile, trenner) {
    const out = []
    let feld = "", inQ = false
    for (let i = 0; i < zeile.length; i++) {
        const c = zeile[i]
        if (inQ) {
            if (c === '"' && zeile[i + 1] === '"') { feld += '"'; i++ }
            else if (c === '"') inQ = false
            else feld += c
        } else if (c === '"' && !feld) inQ = true
        else if (c === trenner) { out.push(feld); feld = "" }
        else feld += c
    }
    out.push(feld)
    return out
}

// ---------- Medien-Verweise einer Datei ----------
// Liefert alle lokalen Medienpfade ("medien/…"), die in den Karten vorkommen
export function medienVerweise(deck) {
    const out = new Set()
    const pruefen = (wert) => { if (typeof wert === "string" && wert.startsWith("medien/")) out.add(wert) }
    for (const k of deck.karten) {
        for (const b of [...(k.vorne?.bloecke || []), ...(k.hinten || [])]) {
            pruefen(b.quelle); pruefen(b.audio)
        }
    }
    return [...out]
}

export const istExtern = (quelle) => /^https?:\/\//i.test(quelle || "")
