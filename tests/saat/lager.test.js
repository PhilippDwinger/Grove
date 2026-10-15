// Saat · Tests des Lernspeichers (Ordner im Arbeitsspeicher statt echter Festplatte)
import { test } from "node:test"
import assert from "node:assert/strict"
import { Lager, PFAD } from "../../src/js/saat/lager.js"
import { speicherVerzeichnis, alleDateien } from "../../src/js/saat/speicher.js"
import { zipLesen } from "../../src/js/saat/paket.js"
import { deckSchreiben, deckLesen } from "../../src/js/saat/format.js"
import { BEISPIELE } from "../../src/js/saat/beispiele.js"
import { TAG } from "../../src/js/saat/hilfen.js"

const T0 = new Date(2026, 9, 1, 10, 0).getTime()
const uhr = (start = T0) => { const u = { t: start, jetzt: () => u.t }; return u }

async function mitBeispielen(u = uhr()) {
    const verz = speicherVerzeichnis("test")
    const lager = await Lager.oeffnen(verz, { jetzt: u.jetzt, kanal: false })
    for (const { datei, deck } of BEISPIELE) await verz.schreiben(`saatgut/${datei}`, deckSchreiben(deck))
    await lager.laden()
    return { verz, lager, u }
}
const sortiert = (m) => JSON.stringify([...m].sort((a, b) => a[0].localeCompare(b[0])))
const alsDatei = (blob, name) => Object.assign(blob, { name })

test("Lager: neuer Ordner wird eingerichtet (Kennung, Profil, Liesmich)", async () => {
    const verz = speicherVerzeichnis()
    const l = await Lager.oeffnen(verz, { kanal: false })
    assert.ok(await verz.existiert(PFAD.kennung))
    assert.ok(await verz.existiert(PFAD.profil))
    assert.ok(await verz.existiert(PFAD.liesmich))
    assert.equal(l.decks.size, 0)
})

test("Lager: Beispiele laden – geteilte Karten zählen einmal, keine Konflikte", async () => {
    const { lager } = await mitBeispielen()
    assert.equal(lager.decks.size, 3)
    assert.equal(lager.kaputt.length, 0)
    assert.equal(lager.index.konflikte.length, 0)
    const taberu = lager.eintrag("jp-taberu")
    assert.equal(taberu.vorkommen.length, 2)
    const gesamt = BEISPIELE.reduce((n, b) => n + b.deck.karten.length, 0)
    assert.equal(lager.index.eintraege.size, gesamt - 2)
    const f = lager.faelligkeit()
    assert.equal(f.faellig.length, 0)
    assert.equal(f.neu.length, 20)
})

test("Lager: Lernen in Datei A wirkt in Datei B, übersteht Neustart (neues Lager auf gleichem Ordner)", async () => {
    const { verz, lager, u } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-taberu", deckId: "d-bsp-jp-essen", kartenId: "jp-taberu" }, { b: 3 })
    await lager.bewerten({ schluessel: "jp-nomu", deckId: "d-bsp-jp-essen", kartenId: "jp-nomu" }, { b: 1 })
    await lager.bewerten({ schluessel: "jp-gohan" }, { ok: true })
    const vorher = sortiert(lager.zustaende)
    // „anderer Computer“: gleicher Ordnerinhalt, frisches Lager
    const neu = await Lager.oeffnen(verz, { jetzt: u.jetzt, kanal: false })
    assert.equal(sortiert(neu.zustaende), vorher)
    assert.equal(neu.verteilung({ nurDeck: "d-bsp-jp-verben" }).neu, 8, "zwei Verben-Karten sind schon angefangen")
    assert.equal(neu.beherrschung("jp-nomu"), "schlecht")
    assert.equal(neu.heute().abfragen, 3)
})

test("Lager: Vorziehen wird markiert, Rückgängig macht die Abfrage ungeschehen", async () => {
    const { lager, u } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-mizu" }, { b: 3 })
    u.t += 60_000
    const r = await lager.bewerten({ schluessel: "jp-mizu" }, { b: 4 })
    assert.equal(r.ereignis.vz, true)
    assert.equal(lager.zustand("jp-mizu").wdh, 2)
    await lager.aufheben(r.ereignis.id)
    assert.equal(lager.zustand("jp-mizu").wdh, 1)
})

test("Lager: ID-Konflikt wird erkannt und lässt sich entscheiden – ohne Verlust", async () => {
    const { verz, lager } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-sakana" }, { b: 3 })
    // fremde Datei: gleiche ID, andere Antwort
    const fremd = { format: "grove-saat", version: 2, id: "d-fremd", titel: "Fremd", karten: [{ id: "jp-sakana", vorne: { text: "魚" }, antwort: "Fischgericht" }] }
    await verz.schreiben("saatgut/fremd.saat", JSON.stringify(fremd))
    await lager.laden()
    const k = lager.index.konflikte.find((x) => x.id === "jp-sakana")
    assert.ok(k && !k.geloest)
    assert.equal(lager.index.schluessel("d-bsp-jp-essen", "jp-sakana"), "jp-sakana", "gelernte Variante behält den Stand")
    const fremderSchluessel = lager.index.schluessel("d-fremd", "jp-sakana")
    assert.notEqual(fremderSchluessel, "jp-sakana")
    assert.equal(lager.zustand(fremderSchluessel), null)
    await lager.bewerten({ schluessel: fremderSchluessel, deckId: "d-fremd", kartenId: "jp-sakana" }, { b: 1 })
    // „dieselbe Karte“ → beide Abfragen zählen für jp-sakana
    await lager.konfliktEntscheiden(fremderSchluessel, "gleich", "jp-sakana")
    assert.equal(lager.zustand("jp-sakana").wdh, 2)
    assert.equal(lager.index.konflikte.find((x) => x.id === "jp-sakana").geloest, true)
    // Entscheidung übersteht Neustart
    const neu = await Lager.oeffnen(verz, { kanal: false })
    assert.equal(neu.index.schluessel("d-fremd", "jp-sakana"), "jp-sakana")
})

test("Lager: Export Lernstand → Import in leeren Speicher → gleicher Stand; doppelter Import ändert nichts", async () => {
    const { lager, u } = await mitBeispielen()
    for (const k of ["jp-taberu", "jp-nomu", "jp-iku"]) await lager.bewerten({ schluessel: k }, { b: 3 })
    await lager.einstellungenSetzen({ neuProTag: 7 })
    const stand = await lager.standExport()

    const ziel = await mitBeispielen(u)
    const plan = await ziel.lager.importPruefen(alsDatei(stand.blob, stand.name))
    assert.equal(plan.typ, "speicher")
    assert.equal(plan.neueEreignisse, 3)
    const bericht = await ziel.lager.importAusfuehren(plan, { profil: "uebernehmen" })
    assert.equal(bericht.ereignisseNeu, 3)
    assert.equal(ziel.lager.profil.einstellungen.neuProTag, 7)
    assert.equal(sortiert(ziel.lager.zustaende), sortiert(lager.zustaende))
    // nochmal → keine Duplikate
    const plan2 = await ziel.lager.importPruefen(alsDatei(stand.blob, stand.name))
    assert.equal(plan2.neueEreignisse, 0)
    const b2 = await ziel.lager.importAusfuehren(plan2, { profil: "behalten" })
    assert.equal(b2.ereignisseNeu, 0)
    assert.equal(ziel.lager.ereignisse.length, 3)
})

test("Lager: ganze Sicherung (ZIP) in neuen Speicher übertragen", async () => {
    const { lager } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-taberu" }, { b: 4 })
    const bild = await lager.medienSpeichern(alsDatei(new Blob([new Uint8Array([137, 80, 78, 71, 1, 2, 3])], { type: "image/png" }), "Katze Foto.png"))
    assert.match(bild, /^medien\/[0-9a-f]{12}-Katze-Foto\.png$/)
    const sich = await lager.sicherungExport()
    const verz = speicherVerzeichnis("neu")
    const leer = await Lager.oeffnen(verz, { kanal: false })
    const plan = await leer.importPruefen(alsDatei(sich.blob, sich.name))
    const bericht = await leer.importAusfuehren(plan, { profil: "uebernehmen" })
    assert.equal(bericht.decksNeu.length, 3)
    assert.equal(bericht.medienNeu, 1)
    assert.ok(await verz.existiert(bild))
    assert.equal(leer.zustand("jp-taberu").wdh, 1)
})

test("Lager: Lerndatei teilen (Paket mit Medien) und importieren – vorhanden → Kopie teilt Lernstand", async () => {
    const { lager } = await mitBeispielen()
    const bild = await lager.medienSpeichern(alsDatei(new Blob(["bilddaten"], { type: "image/png" }), "a.png"))
    const deck = structuredClone(lager.decks.get("d-bsp-jp-verben").deck)
    deck.karten[2].hinten.push({ id: "bx", typ: "bild", quelle: bild, alt: "" })
    deck.karten[3].hinten.push({ id: "by", typ: "bild", quelle: "medien/fehlt.png", alt: "" })
    await lager.deckSpeichern(deck)
    const ex = await lager.deckExport("d-bsp-jp-verben")
    assert.match(ex.name, /\.saatpaket$/)
    assert.deepEqual(ex.fehlend, ["medien/fehlt.png"])
    await lager.bewerten({ schluessel: "jp-iku" }, { b: 3 })

    const plan = await lager.importPruefen(alsDatei(ex.blob, ex.name))
    assert.equal(plan.typ, "deck")
    assert.ok(plan.vorhanden)
    assert.equal(plan.mitStand, 1)
    assert.deepEqual(plan.fehlendeMedien, ["medien/fehlt.png"])
    await assert.rejects(() => lager.importAusfuehren(plan, {}))
    const { deck: kopie } = await lager.importAusfuehren(plan, { modus: "kopie" })
    assert.notEqual(kopie.id, "d-bsp-jp-verben")
    assert.equal(lager.decks.size, 4)
    assert.equal(lager.eintrag("jp-iku").vorkommen.length, 2)
    assert.ok(lager.zustand("jp-iku"))
    const fehlend = await lager.fehlendeMedien()
    assert.deepEqual(fehlend.map((f) => f.pfad), ["medien/fehlt.png"])
})

test("Lager: beschädigte Dateien – kaputte Lerndatei, kaputte Protokollzeile, kaputtes Profil", async () => {
    const { verz, lager, u } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-taberu" }, { b: 3 })
    await lager.einstellungenSetzen({ neuProTag: 12 })
    await lager.einstellungenSetzen({ neuProTag: 13 })              // erzeugt profil.json.bak mit 12
    await verz.schreiben("saatgut/kaputt.saat", "{ das ist kein json")
    const prot = (await alleDateien(verz)).find((p) => p.startsWith("fortschritt/protokoll-"))
    await verz.anhaengen(prot, "{halbe zeile\n")
    await verz.schreiben(PFAD.profil, "{kaputt")
    const neu = await Lager.oeffnen(verz, { jetzt: u.jetzt, kanal: false })
    assert.equal(neu.kaputt.length, 1)
    assert.equal(neu.kaputteZeilen, 1)
    assert.equal(neu.zustand("jp-taberu").wdh, 1)
    assert.equal(neu.profil.einstellungen.neuProTag, 12, "aus profil.json.bak")
    assert.ok(neu.warnungen.some((w) => w.includes("profil.json")))
    assert.equal(neu.decks.size, 3)
})

test("Lager: Profil fehlt ganz → wird aus dem Protokoll neu berechnet", async () => {
    const { verz, lager, u } = await mitBeispielen()
    for (let tag = 0; tag < 40; tag++) {
        u.t = T0 + tag * TAG
        for (const k of lager.faelligkeit().faellig.slice(0, 30)) await lager.bewerten({ schluessel: k }, { b: 4 })
        for (const k of lager.faelligkeit().neu.slice(0, 3)) await lager.bewerten({ schluessel: k }, { b: 3 })
    }
    assert.ok(lager.beobachtungen.length > 25)
    await verz.loeschen(PFAD.profil)
    await verz.loeschen(PFAD.profil + ".bak")
    const neu = await Lager.oeffnen(verz, { jetzt: u.jetzt, kanal: false })
    assert.ok(neu.warnungen.some((w) => w.includes("neu berechnet")))
    assert.ok(await verz.existiert(PFAD.profil))
    assert.ok(neu.profil.anpassung.verlauf.length >= 1)
})

test("Lager: Datei pausieren, löschen (Papierkorb), Lernstand bleibt im Protokoll", async () => {
    const { verz, lager } = await mitBeispielen()
    await lager.bewerten({ schluessel: "jp-iku" }, { b: 3 })
    await lager.deckAktivSetzen("d-bsp-jp-verben", false)
    assert.equal(lager.eintrag("jp-iku").aktiv, false)
    assert.equal(lager.eintrag("jp-taberu").aktiv, true, "steckt auch in einer aktiven Datei")
    await lager.deckLoeschen("d-bsp-jp-verben")
    assert.equal(lager.eintrag("jp-iku"), null)
    assert.ok((await verz.liste("papierkorb")).length === 1)
    // Datei zurücklegen → Lernstand ist wieder da
    const pk = (await verz.liste("papierkorb"))[0].name
    await verz.schreiben("saatgut/zurueck.saat", await verz.lesen("papierkorb/" + pk))
    await lager.laden()
    assert.equal(lager.zustand("jp-iku").wdh, 1)
})

test("Lager: CSV-Import und alte Formatversion", async () => {
    const { lager } = await mitBeispielen()
    const csv = alsDatei(new Blob(["Vorderseite;Antwort\nhouse;Haus\ntree;Baum\n"]), "englisch.csv")
    const p = await lager.importPruefen(csv)
    await lager.importAusfuehren(p)
    const v1 = alsDatei(new Blob([JSON.stringify({ format: "grove-saat", version: 1, titel: "Alt", karten: [{ frage: "rot", antwort: "red" }] })]), "alt.saat")
    const p2 = await lager.importPruefen(v1)
    assert.ok(p2.warnungen.some((w) => w.includes("Ältere")))
    await lager.importAusfuehren(p2)
    assert.equal(lager.decks.size, 5)
    // Profil-Datei erkennt der Import als Profil
    const pd = lager.profilDatei()
    const p3 = await lager.importPruefen(alsDatei(pd.blob, pd.name))
    assert.equal(p3.typ, "profil")
})

test("Lager: tägliche Sicherung entsteht und wird begrenzt", async () => {
    const { verz, lager, u } = await mitBeispielen()
    for (let i = 0; i < 20; i++) { u.t = T0 + i * TAG; await lager.taeglichSichern() }
    const tage = (await verz.liste("sicherung")).filter((e) => e.art === "ordner")
    assert.equal(tage.length, 14)
})

test("Paket: ZIP mit Unterordner wird hochgezogen", async () => {
    const { zipBauen } = await import("../../src/js/saat/paket.js")
    const z = await zipBauen({ "Saat/saat.json": "{}", "Saat/saatgut/a.saat": deckSchreiben(deckLesen(BEISPIELE[2].deck).deck) })
    const v = await zipLesen(z)
    assert.ok(await v.existiert("saat.json"))
    assert.ok(await v.existiert("saatgut/a.saat"))
})
