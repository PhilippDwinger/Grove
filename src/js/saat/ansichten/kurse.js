// ==========================================================
// Saat · Kurse von Grove
// Herunterladen = Lerndatei in den AKTUELLEN Lernspeicher legen. Entfernen = Datei weg und
// Lernstand ihrer Karten aus diesem Speicher löschen (Karten, die auch in anderen eigenen
// Lerndateien stehen, behalten ihren Stand). Wechselst du den Speicher, gilt dort dessen Stand.
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { KURSE } from "../kurse.js"
import { kursVon } from "../kurse.js"
import { sitzungsListe } from "../sitzung.js"
import { verteilungHtml, meldung, fehlerMeldung, dialog } from "./ui.js"

const laeuft = new Set()       // Kurs-IDs, die gerade geladen werden

export function zeigen(el, app) {
    const l = app.lager
    el.innerHTML = `
    <section class="sa-kurse">
        <header class="sa-kopf"><div><h1>Kurse</h1><p>Fertige Lerndateien von Grove. Lade einen Kurs in deinen Lernspeicher „${esc(app.ort?.name || "")}“ – danach lernst du ihn wie dein eigenes Saatgut, offline und mit allen Lernarten.</p></div></header>
        <div class="sa-kurse__liste">${KURSE.map((k) => kursHtml(l, k)).join("")}</div>
        <p class="sa-klein sa-saatgut__fuss">Kurse liegen nur im gerade geöffneten Lernspeicher. Wechselst du den Speicher (Lernprofil → Speicher), lädst du sie dort bei Bedarf neu herunter.</p>
    </section>`
    for (const k of KURSE) {
        const karte = el.querySelector(`[data-kurs="${k.id}"]`)
        karte.querySelector("[data-laden]")?.addEventListener("click", () => herunterladen(app, k))
        karte.querySelector("[data-lernen]")?.addEventListener("click", () => lernen(app, k))
        karte.querySelector("[data-art]")?.addEventListener("click", () => lernen(app, k, true))
        karte.querySelector("[data-entfernen]")?.addEventListener("click", () => entfernen(app, k))
    }
}

function kursHtml(l, k) {
    const d = l.kursDeck(k.id)
    const installiert = kursVon(d?.deck)
    const update = installiert && installiert.version < k.version
    const v = d ? l.verteilung({ nurDeck: d.deck.id }) : null
    const f = d ? l.faelligkeit({ nurDeck: d.deck.id }) : null
    const offen = f ? f.faellig.length + Math.min(f.neu.length, l.profil.einstellungen.neuProTag) : 0
    const status = laeuft.has(k.id) ? `<span class="sa-marke">wird geladen …</span>`
        : d ? `<span class="sa-marke sa-marke--gut">${S.haken} in diesem Speicher</span>` : `<span class="sa-marke">nicht geladen</span>`
    return `<article class="sa-kurs${d ? " ist-geladen" : ""}" data-kurs="${esc(k.id)}">
        <div class="sa-kurs__bild">${S[k.symbol] || S.kurs}</div>
        <div class="sa-kurs__text">
            <header><h2>${esc(k.titel)}</h2>${status}${update ? `<span class="sa-marke sa-marke--warm">Update verfügbar</span>` : ""}</header>
            <p class="sa-kurs__unter">${esc(k.untertitel)}</p>
            <p>${esc(k.beschreibung)}</p>
            <p class="sa-deck__meta">${k.karten} Karten · ${esc(k.gebiet)} · von Grove · Version ${k.version}</p>
            ${v ? verteilungHtml(v, { legende: true, klein: true }) : ""}
            <footer>
                ${d ? `<button class="g-knopf" type="button" data-lernen>${S.spielen} ${offen ? `Lernen <b>${offen}</b>` : "Üben"}</button>
                       <button class="g-knopf-leise" type="button" data-art>${S.sprechblase} Andere Lernart</button>
                       ${update ? `<button class="g-knopf-leise" type="button" data-laden>${S.holen} Aktualisieren</button>` : ""}
                       <span class="sa-deck__platz"></span>
                       <button class="g-knopf-leise sa-gefahr" type="button" data-entfernen>${S.papierkorb} Entfernen</button>`
                    : `<button class="g-knopf" type="button" data-laden ${laeuft.has(k.id) ? "disabled" : ""}>${S.holen} Herunterladen</button>`}
            </footer>
        </div>
    </article>`
}

async function herunterladen(app, k) {
    const lager = app.lager            // genau dieser Speicher – auch falls währenddessen gewechselt wird
    const ortName = app.ort?.name
    laeuft.add(k.id)
    app.neuZeichnen()
    try {
        const inhalt = await k.laden()
        await lager.kursInstallieren(inhalt)
        meldung(lager === app.lager ? `„${k.titel}“ ist in deinem Lernspeicher` : `„${k.titel}“ wurde in „${ortName}“ geladen`)
    } catch (f) {
        fehlerMeldung(new Error(`Kurs konnte nicht geladen werden: ${f.message}`))
    } finally {
        laeuft.delete(k.id)
        if (app.aktuell?.name === "kurse") app.neuZeichnen()
    }
}

function lernen(app, k, artWaehlen = false) {
    const l = app.lager
    const d = l.kursDeck(k.id)
    if (!d) return
    const f = l.faelligkeit({ nurDeck: d.deck.id })
    let schluessel = sitzungsListe(f.faellig, f.neu.slice(0, Math.max(10, l.profil.einstellungen.neuProTag)), l.profil.einstellungen.maxProTag)
    if (!schluessel.length) schluessel = d.deck.karten.map((x) => l.index.schluessel(d.deck.id, x.id)).filter(Boolean)
    const aufgaben = schluessel.map((s) => ({ schluessel: s, deckId: d.deck.id }))
    if (artWaehlen) return app.modusWaehlen(aufgaben, { titel: k.titel, zurueck: "kurse" })
    app.lernen({ modus: "karte", aufgaben, titel: k.titel, zurueck: "kurse" })
}

export async function entfernen(app, k) {
    const l = app.lager
    const d = l.kursDeck(k.id)
    if (!d) return
    const mitStand = d.deck.karten.filter((x) => { const s = l.index.schluessel(d.deck.id, x.id); return s && l.zustand(s) }).length
    const w = await dialog({
        titel: `Kurs „${k.titel}“ entfernen?`,
        html: `<p>Der Kurs verschwindet aus dem Lernspeicher <strong>„${esc(app.ort?.name || "")}“</strong>${mitStand ? ` und der Lernstand von <strong>${mitStand} ${mitStand === 1 ? "Karte" : "Karten"}</strong> wird dort gelöscht` : ""}.</p>
            <p class="sa-klein">Karten, die auch in deinen eigenen Lerndateien stehen, behalten ihren Stand. Deine Lernserie bleibt. Andere Lernspeicher sind nicht betroffen. Du kannst den Kurs jederzeit neu herunterladen – dann beginnst du von vorn.</p>`,
        knoepfe: [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "ja", text: "Entfernen", art: "gefahr" }],
    })
    if (w !== "ja") return
    try {
        const r = await l.kursEntfernen(k.id)
        meldung(`Kurs entfernt${r.abfragen ? ` – ${r.abfragen} Abfragen gelöscht` : ""}`)
        if (app.aktuell?.name === "kurse") app.neuZeichnen()
    } catch (f) { fehlerMeldung(f) }
}
