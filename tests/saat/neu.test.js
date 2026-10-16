// Saat · Tests für Schreiben, Zeichnen, Lerntage/Streaks und Kurse
import { test } from "node:test"
import assert from "node:assert/strict"
import { eingabePruefen, loesungenVon, varianten } from "../../src/js/saat/eingabe.js"
import { strichRaster, aehnlichkeit, SCHWELLE, zaehlt, stricheKompakt, zeichenTauglich } from "../../src/js/saat/zeichnen-kern.js"
import { tageAusProtokoll, streaks, kalender, tageZusammen } from "../../src/js/saat/statistik.js"
import { ereignis } from "../../src/js/saat/protokoll.js"
import { Lager } from "../../src/js/saat/lager.js"
import { speicherVerzeichnis } from "../../src/js/saat/speicher.js"
import { deckSchreiben, deckLesen } from "../../src/js/saat/format.js"
import { BEISPIELE } from "../../src/js/saat/beispiele.js"
import { KURSE } from "../../src/js/saat/kurse.js"
import { TAG } from "../../src/js/saat/hilfen.js"

const T0 = new Date(2026, 9, 1, 10, 0).getTime()

// ---------- Schreiben ----------
test("Eingabe: Antwort, Alternativen, Romaji, Kana, Umlaute, Artikel, Tippfehler", () => {
    const taberu = { antwort: "essen", alternativen: ["speisen"], eingaben: ["taberu", "たべる"] }
    const l = loesungenVon(taberu)
    assert.equal(eingabePruefen("Essen!", l).ergebnis, "richtig")
    assert.equal(eingabePruefen("speisen", l).ergebnis, "richtig")
    assert.equal(eingabePruefen("TABERU", l).ergebnis, "richtig")
    assert.equal(eingabePruefen("タベル", l).ergebnis, "richtig", "Katakana = Hiragana")
    assert.equal(eingabePruefen("trinken", l).ergebnis, "falsch")
    assert.equal(eingabePruefen("  ", l).ergebnis, "leer")
    const tokyo = ["Tōkyō"]
    for (const e of ["tokyo", "toukyou", "tookyoo", "Tôkyô"]) assert.equal(eingabePruefen(e, tokyo).ergebnis, "richtig", e)
    assert.equal(eingabePruefen("Uebung", ["Übung"]).ergebnis, "richtig")
    assert.equal(eingabePruefen("Strasse", ["Straße"]).ergebnis, "richtig")
    assert.equal(eingabePruefen("Baum", ["der Baum"]).ergebnis, "richtig")
    assert.equal(eingabePruefen("Mahlzeit", ["Reis; Mahlzeit"]).ergebnis, "richtig")
    assert.equal(eingabePruefen("Guten Appetit", ["Guten Appetit (vor dem Essen)"]).ergebnis, "richtig")
    assert.equal(eingabePruefen("Quercus robus", ["Quercus robur"]).ergebnis, "fast")
    assert.equal(eingabePruefen("Fagus", ["Quercus robur"]).ergebnis, "falsch")
    assert.equal(eingabePruefen("食", ["食べる"]).ergebnis, "falsch", "kein Raten bei Kanji")
    assert.deepEqual(varianten("Reis; Mahlzeit"), ["reis mahlzeit", "reis", "mahlzeit"])
})

// ---------- Zeichnen ----------
const kreis = (cx, cy, r, n = 40, wackeln = 0, seed = 1) => {
    let x = seed; const z = () => ((x = (x * 16807) % 2147483647) / 2147483647 - 0.5) * wackeln
    const out = []
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; out.push(cx + Math.cos(a) * r + z(), cy + Math.sin(a) * r + z()) }
    return out
}
const kreuz = (s = 1, dx = 0) => [[0 + dx, 0, 100 * s + dx, 100 * s], [100 * s + dx, 0, 0 + dx, 100 * s]]
const wasser = () => [[50, 5, 50, 95, 42, 88], [10, 35, 40, 35, 12, 80], [90, 25, 60, 50, 92, 90]]   // grob „水“

test("Zeichnen: gleiche Form (verschoben, skaliert, gewackelt) ist ähnlich, andere nicht", () => {
    const schablone = strichRaster(kreuz())
    const t0 = performance.now()
    const gleich = aehnlichkeit(strichRaster(kreuz(3, 400)), schablone)
    const wackel = aehnlichkeit(strichRaster([kreis(200, 200, 150, 40, 18)]), strichRaster([kreis(0, 0, 1, 40)]))
    const anders = aehnlichkeit(strichRaster([kreis(50, 50, 50)]), schablone)
    const halb = aehnlichkeit(strichRaster([kreuz()[0]]), schablone)
    const kritzel = aehnlichkeit(strichRaster([...kreuz(), [0, 50, 100, 50], [50, 0, 50, 100], [0, 0, 100, 0], [0, 100, 100, 100], [0, 0, 0, 100], [100, 0, 100, 100]]), schablone)
    const dauer = performance.now() - t0
    assert.ok(gleich.wert > 0.95, `gleich ${gleich.wert}`)
    assert.ok(wackel.wert >= SCHWELLE, `gewackelt ${wackel.wert}`)
    assert.ok(anders.wert < SCHWELLE, `anders ${anders.wert}`)
    assert.ok(!zaehlt(halb), `halb ${JSON.stringify(halb)}`)
    assert.ok(zaehlt(gleich) && zaehlt(wackel) && !zaehlt(anders) && !zaehlt(kritzel))

    assert.ok(aehnlichkeit(strichRaster(wasser()), strichRaster(wasser().map((s) => s.map((v) => v * 2 + 7)))).wert > 0.9)
    assert.ok(dauer < 200, `zu langsam: ${dauer} ms`)
    assert.equal(aehnlichkeit(strichRaster([]), schablone).wert, 0)
})

test("Zeichnen: Striche werden kompakt gespeichert, Tauglichkeit", () => {
    const k = stricheKompakt([[0, 0, 0.5, 0.5, 1, 1, 200, 200, 400, 400]], 400, 400)
    assert.deepEqual(k, [[0, 0, 500, 500, 1000, 1000]])
    assert.equal(zeichenTauglich({ vorne: { text: "水" }, zeichnen: {} }), true)
    assert.equal(zeichenTauglich({ vorne: { text: "水" } }), false)
    assert.equal(zeichenTauglich({ vorne: { text: "" }, zeichnen: { striche: [[1, 2, 3, 4]] } }), true)
    // Format behält die Schablone
    const d = deckLesen({ format: "grove-saat", version: 2, id: "d-z", titel: "Z", karten: [{ id: "a", vorne: { text: "水" }, antwort: "Wasser", eingaben: ["mizu"], zeichnen: { aufgabe: "Schreib Wasser", striche: [[1.4, 2, 3, 4]] } }] }).deck
    assert.deepEqual(d.karten[0].zeichnen.striche, [[1, 2, 3, 4]])
    assert.deepEqual(deckLesen(deckSchreiben(d)).deck.karten[0].eingaben, ["mizu"])
})

// ---------- Lerntage & Streaks ----------
test("Statistik: Lerntage aus dem Protokoll, Streaks, Kalender", () => {
    const es = []
    for (const tag of [0, 1, 2, 5, 6, 7, 8, 9]) {
        for (let i = 0; i < 3 + tag; i++) es.push(ereignis({ k: "k" + i, a: "karte", b: i % 2 ? 3 : 1, ms: 5000 }, T0 + tag * TAG + i * 1000))
    }
    const tage = tageAusProtokoll(es)
    const tag0 = Object.keys(tage).sort()[0]
    assert.deepEqual(tage[tag0], [3, 1, 3, 15])
    assert.equal(tage[Object.keys(tage).sort()[1]][2], 1, "am 2. Tag nur eine Karte neu")
    const s = streaks(tage, T0 + 9 * TAG + 3600_000)
    assert.equal(s.aktuell, 5)
    assert.equal(s.laengste, 5)
    assert.equal(streaks(tage, T0 + 10 * TAG + 3600_000).aktuell, 5, "heute noch nicht gelernt → Streak läuft weiter")
    assert.equal(streaks(tage, T0 + 11 * TAG + 3600_000).aktuell, 0)
    const k = kalender(tage, T0 + 9 * TAG, 4)
    assert.equal(k.spalten.length, 4)
    assert.equal(k.spalten.flat().filter((x) => x.werte).length, 8)
    assert.ok(k.spalten.flat().every((x) => x.stufe >= -1 && x.stufe <= 4))
    // Zusammenführen: Maximum je Feld, Profil-Tage bleiben
    assert.deepEqual(tageZusammen({ "2020-01-01": [5, 5, 5, 5], [tag0]: [9, 0, 0, 0] }, tage)[tag0], [9, 1, 3, 15])
})

// ---------- Lager: Tage im Profil, Modus im Protokoll ----------
async function lagerMitBeispielen(u) {
    const verz = speicherVerzeichnis("t")
    const lager = await Lager.oeffnen(verz, { jetzt: () => u.t, kanal: false })
    for (const { datei, deck } of BEISPIELE) await verz.schreiben(`saatgut/${datei}`, deckSchreiben(deck))
    await lager.laden()
    return { verz, lager }
}

test("Lager: Lerntage landen im Profil, Rückgängig korrigiert, Neustart behält", async () => {
    const u = { t: T0 }
    const { verz, lager } = await lagerMitBeispielen(u)
    const r = await lager.bewerten({ schluessel: "jp-mizu" }, { b: 3 }, { ms: 4000, modus: "tippen" })
    assert.equal(r.ereignis.mo, "tippen")
    await lager.bewerten({ schluessel: "jp-niku" }, { ok: true }, { ms: 2000 })
    const tag = Object.keys(lager.profil.tage)[0]
    assert.deepEqual(lager.profil.tage[tag], [2, 2, 2, 6])
    await lager.aufheben(r.ereignis.id)
    assert.deepEqual(lager.profil.tage[tag], [1, 1, 1, 2])
    await lager.profilSpeichernJetzt()
    const neu = await Lager.oeffnen(verz, { jetzt: () => u.t, kanal: false })
    assert.deepEqual(neu.profil.tage[tag], [1, 1, 1, 2])
    // Profil-Datei enthält die Tage (gehört zum Nutzerprofil, wird mit exportiert)
    assert.ok(JSON.parse(await verz.lesenText("profil.json")).tage[tag])
})

// ---------- Kurse ----------
test("Kurs Bäume: 80 gültige Karten, eindeutige IDs, Verweise zeigen auf vorhandene Karten", async () => {
    const def = KURSE.find((k) => k.id === "grove-baeume")
    const kurs = await def.laden()
    const r = deckLesen(structuredClone(kurs))
    assert.deepEqual(r.warnungen, [])
    assert.equal(r.deck.karten.length, def.karten)
    const ids = new Set(r.deck.karten.map((k) => k.id))
    assert.equal(ids.size, def.karten)
    for (const k of r.deck.karten) {
        for (const b of k.hinten) if (b.typ === "verweis") for (const v of b.karten) assert.ok(ids.has(v), `${k.id} → ${v}`)
        assert.ok(k.antwort && (k.vorne.text || k.vorne.bloecke?.length))
    }
    assert.ok(r.deck.karten[0].tags.includes("stufe-1") && r.deck.karten.at(-1).tags.includes("stufe-5"), "von bekannt zu unbekannt")
    assert.equal(r.deck.kurs.id, "grove-baeume")
})

test("Kurs: herunterladen, lernen, entfernen löscht den Stand nur in DIESEM Speicher, geteilte Karten bleiben", async () => {
    const u = { t: T0 }
    const a = await lagerMitBeispielen(u)
    const b = await lagerMitBeispielen(u)
    const kurs = await KURSE[0].laden()
    // eine Kurs-Karte auch in einer eigenen Datei (gleiche ID) → bleibt beim Entfernen erhalten
    const eigen = { format: "grove-saat", version: 2, id: "d-eigen", titel: "Eigen", karten: [structuredClone(kurs.karten[1])] }
    await a.verz.schreiben("saatgut/eigen.saat", JSON.stringify(eigen))
    await a.lager.laden()
    await a.lager.kursInstallieren(kurs)
    await b.lager.kursInstallieren(kurs)
    assert.ok(a.lager.kursDeck("grove-baeume"))
    await a.lager.bewerten({ schluessel: "baum-stieleiche" }, { b: 3 })
    await a.lager.bewerten({ schluessel: "baum-rotbuche" }, { b: 3 })
    await b.lager.bewerten({ schluessel: "baum-stieleiche" }, { b: 4 })
    await a.lager.bewerten({ schluessel: "jp-mizu" }, { b: 3 })
    const tagVorher = structuredClone(a.lager.profil.tage)
    // erneutes Herunterladen (Update) ändert nichts am Stand
    await a.lager.kursInstallieren(kurs)
    assert.equal(a.lager.zustand("baum-stieleiche").wdh, 1)
    const r = await a.lager.kursEntfernen("grove-baeume")
    assert.equal(a.lager.kursDeck("grove-baeume"), null)
    assert.equal(r.abfragen, 1, "nur die Stieleiche-Abfrage wurde gelöscht")
    assert.equal(a.lager.zustand("baum-stieleiche"), null)
    assert.equal(a.lager.zustand("baum-rotbuche").wdh, 1, "Rotbuche steht auch in „Eigen“")
    assert.equal(a.lager.zustand("jp-mizu").wdh, 1)
    assert.equal(a.lager.ereignisse.filter((e) => e.k === "baum-stieleiche").length, 0)
    assert.deepEqual(a.lager.profil.tage, tagVorher, "Lerntage (Streak) bleiben")
    // anderer Speicher unberührt
    assert.ok(b.lager.kursDeck("grove-baeume"))
    assert.equal(b.lager.zustand("baum-stieleiche").wdh, 1)
    // nach Neustart bleibt der Stand gelöscht
    const neu = await Lager.oeffnen(a.verz, { jetzt: () => u.t, kanal: false })
    assert.equal(neu.zustand("baum-stieleiche"), null)
    assert.equal(neu.kursDeck("grove-baeume"), null)
    // Sicherung der alten Protokolldatei existiert
    assert.ok((await a.verz.liste("sicherung")).length)
})

test("Kurs Bäume: jede Karte hat einen Fun Fact; Fotos (falls vorhanden) mit Urheber und Lizenz", async () => {
    const kurs = await KURSE.find((k) => k.id === "grove-baeume").laden()
    for (const k of kurs.karten) {
        const fakt = k.hinten.find((b) => b.typ === "funfakt")
        assert.ok(fakt?.text?.length > 30, `${k.id} ohne Fun Fact`)
        // Foto auf der Vorderseite, gefragt wird der deutsche Name; der botanische zählt auch
        const bild = (k.vorne.bloecke || []).find((b) => b.typ === "bild")
        if (bild) {
            assert.equal(k.vorne.text, "")
            assert.equal(bild.quelle, `medien/kurs-baeume-${k.id.slice(5)}.jpg`)
            assert.ok(!`${bild.alt} ${bild.unterschrift}`.toLowerCase().includes(k.antwort.toLowerCase().split(" ").at(-1)), `${k.id}: Name verrät sich vorn`)
            assert.ok(k.hinten.some((b) => b.typ === "text" && /^\*Foto: .+ · .+ · Wikimedia Commons\*$/.test(b.text)), `${k.id}: Bildnachweis fehlt`)
        } else assert.equal(k.vorne.text, k.alternativen[0])
        assert.match(k.alternativen[0], /^[A-Z][a-z]+ [×a-z]/, `${k.id}: botanischer Name als Alternative`)
        assert.ok(!k.hinten.some((b) => b.typ === "bild"))
    }
})

test("Kurs: mitgelieferte Bilder landen im Speicher und verschwinden beim Entfernen (geteilte bleiben)", async () => {
    const u = { t: T0 }
    const a = await lagerMitBeispielen(u)
    const kurs = structuredClone(await KURSE[0].laden())
    const mitBild = (k, p) => k.hinten.unshift({ id: "foto", typ: "bild", quelle: p, alt: "", unterschrift: "" })
    mitBild(kurs.karten[0], "medien/kurs-baeume-stieleiche.jpg")
    mitBild(kurs.karten[1], "medien/kurs-baeume-rotbuche.jpg")
    const medien = new Map([
        ["medien/kurs-baeume-stieleiche.jpg", new Blob(["eiche"], { type: "image/jpeg" })],
        ["medien/kurs-baeume-rotbuche.jpg", new Blob(["buche"], { type: "image/jpeg" })],
        ["../boese.jpg", new Blob(["x"])],
    ])
    // Rotbuche (mit Foto) steht auch in einer eigenen Datei → ihr Foto bleibt
    const eigen = { format: "grove-saat", version: 2, id: "d-eigen", titel: "Eigen", karten: [structuredClone(kurs.karten[1])] }
    await a.verz.schreiben("saatgut/eigen.saat", JSON.stringify(eigen))
    await a.lager.laden()
    await a.lager.kursInstallieren(kurs, medien)
    assert.ok(await a.verz.existiert("medien/kurs-baeume-stieleiche.jpg"))
    assert.equal(await (await a.lager.medienDatei("medien/kurs-baeume-rotbuche.jpg")).text(), "buche")
    assert.equal(await a.verz.existiert("../boese.jpg").catch(() => false), false)
    const fehlend = (await a.lager.fehlendeMedien()).map((m) => m.pfad)
    assert.ok(!fehlend.includes("medien/kurs-baeume-stieleiche.jpg") && !fehlend.includes("medien/kurs-baeume-rotbuche.jpg"))
    await a.lager.kursEntfernen("grove-baeume")
    assert.equal(await a.verz.existiert("medien/kurs-baeume-stieleiche.jpg"), false)
    assert.ok(await a.verz.existiert("medien/kurs-baeume-rotbuche.jpg"), "von eigener Datei benutzt")
})
