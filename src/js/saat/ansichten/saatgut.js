// ==========================================================
// Saat · Saatgut: alle Lerndateien – anlegen, öffnen, teilen, pausieren, löschen
// ==========================================================
import { esc } from "../../kern/html.js"
import { bestaetigen } from "../../kern/dialog.js"
import { S } from "../symbole.js"
import { spracheName } from "../bloecke.js"
import { herunterladen } from "../paket.js"
import { BEISPIELE } from "../beispiele.js"
import { deckSchreiben } from "../format.js"
import { sitzungsListe } from "../sitzung.js"
import { kursVon, KURSE } from "../kurse.js"
import { entfernen as kursEntfernen } from "./kurse.js"
import { verteilungHtml, leerHtml, BILD, meldung, fehlerMeldung, dateiWaehlen, dialog } from "./ui.js"

const ANNEHMEN = ".saat,.saatpaket,.saatstand,.saatprofil,.json,.zip,.csv,.tsv,.txt"

export function zeigen(el, app) {
    const l = app.lager
    const decks = [...l.decks.values()].sort((a, b) => a.deck.titel.localeCompare(b.deck.titel, "de"))
    el.innerHTML = `
    <section class="sa-saatgut">
        <header class="sa-kopf">
            <div><h1>Saatgut</h1><p>Deine Lerndateien. Sie enthalten nur Inhalte – dein Lernstand liegt getrennt davon. Darum kannst du sie gefahrlos teilen.</p></div>
            <div class="sa-kopf__knoepfe">
                <button class="g-knopf-leise" type="button" data-import>${S.holen} Öffnen …</button>
                <button class="g-knopf" type="button" data-neu>${S.plus} Neue Lerndatei</button>
            </div>
        </header>
        ${l.kaputt.length ? `<div class="sa-hinweise">${l.kaputt.map((k) => `<p class="sa-hinweis sa-hinweis--warm">${S.warnung}<span><strong>${esc(k.datei)}</strong> – ${esc(k.fehler)} Die Datei bleibt unverändert im Ordner <code>saatgut</code>.</span></p>`).join("")}</div>` : ""}
        ${decks.length ? `<div class="sa-decks">${decks.map((d) => deckKarte(l, d)).join("")}</div>`
            : leerHtml({ bild: BILD.beet, titel: "Noch kein Saatgut", text: "Leg eine Lerndatei an, öffne eine (.saat, .saatpaket, CSV) oder zieh sie hierher.", knoepfe: `<button class="g-knopf-leise" type="button" data-beispiele>${S.plus} Beispiele anlegen</button>` })}
        <p class="sa-klein sa-saatgut__fuss">Tipp: Du kannst .saat-Dateien auch direkt in den Ordner <code>saatgut</code> deines Lernspeichers legen – oder eine Tabelle (CSV: Vorderseite;Antwort;Notiz) öffnen. Eine .saat-Datei ist lesbares JSON: <button class="g-knopf-text" type="button" data-vorlage>Vorlage herunterladen</button></p>
        <div class="sa-ablegen" data-ablegen hidden><div>${S.holen}<span>Loslassen zum Öffnen</span></div></div>
    </section>`

    el.querySelector("[data-neu]").addEventListener("click", async () => {
        try {
            const d = await l.deckNeu({ titel: "Neue Lerndatei" })
            app.gehe(`editor/${encodeURIComponent(d.id)}`)
        } catch (f) { fehlerMeldung(f) }
    })
    el.querySelector("[data-import]").addEventListener("click", async () => {
        const dateien = await dateiWaehlen({ accept: ANNEHMEN, mehrere: true })
        if (dateien.length) app.importieren(dateien)
    })
    el.querySelector("[data-vorlage]").addEventListener("click", () => {
        const vorlage = { format: "grove-saat", version: 2, id: "d-meine-vorlage", titel: "Meine Lerndatei", beschreibung: "Worum geht es?", autor: "", gebiet: "Englisch", sprachen: { vorne: "en", hinten: "de" }, tags: [],
            karten: [
                { id: "en-tree", vorne: { text: "tree", zusatz: "noun" }, antwort: "Baum", alternativen: [], hinten: [
                    { typ: "satz", id: "s1", text: "The tree is old.", sprache: "en" }, { typ: "uebersetzung", text: "Der Baum ist alt.", bezug: "s1" }, { typ: "merksatz", text: "**Tree** klingt wie drei – drei Äste." }] },
                { id: "en-river", vorne: { text: "river" }, antwort: "Fluss", hinten: [{ typ: "text", text: "Freier Text mit **fett** und *kursiv*." }] },
            ] }
        herunterladen(new Blob([JSON.stringify(vorlage, null, 2)], { type: "application/json" }), "vorlage.saat")
    })
    el.querySelector("[data-beispiele]")?.addEventListener("click", async () => {
        for (const { datei, deck } of BEISPIELE) await l.verz.schreiben(`saatgut/${datei}`, deckSchreiben(deck))
        await l.laden()
        meldung("Drei Beispiel-Lerndateien angelegt")
    })

    el.querySelectorAll("[data-deck]").forEach((karte) => {
        const id = karte.dataset.deck
        const d = l.decks.get(id)
        karte.querySelector("[data-lernen]")?.addEventListener("click", () => deckLernen(app, id, "karte"))
        karte.querySelector("[data-auswahl]")?.addEventListener("click", () => deckLernen(app, id, "wahl"))
        karte.querySelector("[data-teilen]").addEventListener("click", async () => {
            try {
                const ex = await l.deckExport(id)
                herunterladen(ex.blob, ex.name)
                meldung(ex.fehlend.length ? `${ex.name} – ${ex.fehlend.length} Medium/Medien fehlten` : `${ex.name} heruntergeladen`)
            } catch (f) { fehlerMeldung(f) }
        })
        karte.querySelector("[data-pause]").addEventListener("click", async () => {
            await l.deckAktivSetzen(id, !l.deckAktiv(id))
            meldung(l.deckAktiv(id) ? "Wird wieder abgefragt" : "Pausiert – Karten nur aus dieser Datei werden nicht mehr fällig")
        })
        karte.querySelector("[data-loeschen]").addEventListener("click", async () => {
            const kurs = kursVon(d.deck)
            if (kurs) return kursEntfernen(app, KURSE.find((k) => k.id === kurs.id) ?? { id: kurs.id, titel: d.deck.titel })
            const ok = await bestaetigen({
                titel: `„${d.deck.titel}“ löschen?`,
                text: "Die Datei wandert in den Papierkorb deines Lernspeichers. Dein Lernstand bleibt erhalten – legst du die Datei wieder hinein, ist alles wieder da.",
                ja: "Löschen", gefahr: true,
            })
            if (!ok) return
            try { await l.deckLoeschen(id); meldung("In den Papierkorb gelegt") } catch (f) { fehlerMeldung(f) }
        })
    })

    // Hereinziehen
    const ablegen = el.querySelector("[data-ablegen]")
    let tiefe = 0
    const istDatei = (e) => [...(e.dataTransfer?.types || [])].includes("Files")
    el.addEventListener("dragenter", (e) => { if (!istDatei(e)) return; tiefe++; ablegen.hidden = false })
    el.addEventListener("dragleave", () => { if (--tiefe <= 0) { tiefe = 0; ablegen.hidden = true } })
    el.addEventListener("dragover", (e) => { if (istDatei(e)) e.preventDefault() })
    el.addEventListener("drop", (e) => {
        if (!istDatei(e)) return
        e.preventDefault(); tiefe = 0; ablegen.hidden = true
        app.importieren([...e.dataTransfer.files])
    })
}

function deckKarte(l, d) {
    const id = d.deck.id
    const v = l.verteilung({ nurDeck: id })
    const f = l.faelligkeit({ nurDeck: id })
    const aktiv = l.deckAktiv(id)
    const spr = [d.deck.sprachen?.vorne, d.deck.sprachen?.hinten].filter(Boolean).map(spracheName)
    const n = d.deck.karten.length
    return `<article class="sa-deck${aktiv ? "" : " ist-pausiert"}" data-deck="${esc(id)}">
        <header>
            <h2><a href="#editor/${encodeURIComponent(id)}">${esc(d.deck.titel)}</a></h2>
            ${!aktiv ? `<span class="sa-marke">pausiert</span>` : ""}
            ${d.nurLesen ? `<span class="sa-marke sa-marke--warm" title="Aus einer neueren Saat-Version">nur lesen</span>` : ""}
            ${kursVon(d.deck) ? `<a class="sa-marke" href="#kurse" title="Kurs von Grove">${S.kurs} Kurs</a>` : ""}
        </header>
        ${d.deck.beschreibung ? `<p class="sa-deck__text">${esc(d.deck.beschreibung)}</p>` : ""}
        <p class="sa-deck__meta">${n} ${n === 1 ? "Karte" : "Karten"}${d.deck.gebiet ? ` · ${esc(d.deck.gebiet)}` : ""}${spr.length === 2 ? ` · ${esc(spr[0])} → ${esc(spr[1])}` : ""}${d.deck.autor ? ` · ${esc(d.deck.autor)}` : ""}</p>
        ${n ? verteilungHtml(v, { legende: false, klein: true }) : ""}
        ${d.warnungen.length ? `<details class="sa-warnliste"><summary>${d.warnungen.length} Hinweis(e) beim Lesen</summary><ul>${d.warnungen.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>` : ""}
        <footer>
            ${n ? `<button class="g-knopf" type="button" data-lernen>${S.spielen} ${f.faellig.length + f.neu.length ? `Lernen <b>${f.faellig.length + f.neu.length}</b>` : "Üben"}</button>
            <button class="sa-symbolknopf" type="button" data-auswahl title="Andere Lernart: Auswahl, Schreiben, Zeichnen, Gespräch" aria-label="Andere Lernart wählen">${S.sprechblase}</button>` : `<a class="g-knopf" href="#editor/${encodeURIComponent(id)}">${S.plus} Karten anlegen</a>`}
            <span class="sa-deck__platz"></span>
            <a class="sa-symbolknopf" href="#editor/${encodeURIComponent(id)}" title="Bearbeiten" aria-label="Bearbeiten">${S.stift}</a>
            <button class="sa-symbolknopf" type="button" data-teilen title="Teilen (herunterladen)" aria-label="Teilen">${S.teilen}</button>
            <button class="sa-symbolknopf" type="button" data-pause title="${aktiv ? "Pausieren" : "Fortsetzen"}" aria-label="${aktiv ? "Pausieren" : "Fortsetzen"}">${aktiv ? S.pause : S.spielen}</button>
            <button class="sa-symbolknopf sa-gefahr" type="button" data-loeschen title="Löschen" aria-label="Löschen">${S.papierkorb}</button>
        </footer>
    </article>`
}

// Datei lernen: erst das Fällige (inkl. neuer Karten dieser Datei), sonst auf Wunsch alle Karten üben
async function deckLernen(app, id, modus) {
    const l = app.lager
    const d = l.decks.get(id)
    const f = l.faelligkeit({ nurDeck: id })
    let schluessel = sitzungsListe(f.faellig, f.neu.slice(0, Math.max(10, l.profil.einstellungen.neuProTag)), l.profil.einstellungen.maxProTag)
    if (!schluessel.length) {
        const w = await dialog({
            titel: "Nichts fällig",
            html: `<p>In „${esc(d.deck.titel)}“ ist gerade nichts fällig. Du kannst trotzdem üben – die Abfragen zählen als vorgezogen, Saat plant die Abstände entsprechend.</p>`,
            knoepfe: [{ wert: "", text: "Lieber nicht", art: "leise" }, { wert: "ja", text: "Alle Karten üben", art: "haupt" }],
        })
        if (w !== "ja") return
        schluessel = [...new Set(d.deck.karten.map((k) => l.index.schluessel(id, k.id)).filter(Boolean))]
    }
    const zuordnung = new Map(d.deck.karten.map((k) => [l.index.schluessel(id, k.id), k.id]))
    const aufgaben = schluessel.map((s) => ({ schluessel: s, deckId: id, kartenId: zuordnung.get(s) }))
    if (modus === "wahl") return app.modusWaehlen(aufgaben, { titel: d.deck.titel, zurueck: "saatgut" })
    app.lernen({ modus, aufgaben, titel: d.deck.titel, zurueck: "saatgut" })
}
