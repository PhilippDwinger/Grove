// ==========================================================
// Saat · Gesprächsmodus mit Professor Uhu
// Der Lehrer stellt Aufgabe für Aufgabe – jedes Mal in einer passenden Lernart
// (Karteikarte, Auswahl, Schreiben, Zeichnen), abwechselnd und je nach Karte:
//   neue Karten eher Auswahl/Karteikarte (erst erkennen), bekannte eher Schreiben/Zeichnen (frei abrufen).
// Alle Antworten zählen wie in den einzelnen Modi (Protokoll-Feld mo: "gespraech").
// ==========================================================
import { esc } from "../../kern/html.js"
import { vorneIstBild } from "../format.js"
import { S } from "../symbole.js"
import { Sitzung } from "../sitzung.js"
import { eingabePruefen, loesungenVon, schreibTauglich } from "../eingabe.js"
import { aehnlichkeit, strichRaster, zaehlt, zeichenTauglich, zeichenAufgabe } from "../zeichnen-kern.js"
import { vorderseite, rueckseite, aktivieren } from "../darstellung.js"
import { streaks } from "../statistik.js"
import { fehlerMeldung } from "./ui.js"
import { ctxFuer, aufgabeAufloesen } from "./kontext.js"
import { auswahlFuer } from "./modi.js"
import { zeichenflaeche, schablonenRaster, schablonenHtml, vergleichBild } from "./zeichenflaeche.js"
import { UHU_SVG, NAME, satz, lobFuer, tageszeit, schreiben, stimmung } from "./lehrer.js"

const BEWERTUNGEN = [[1, "Nicht gewusst"], [2, "Kam mir bekannt vor"], [3, "Gewusst"], [4, "Ganz leicht"]]
let tasten = null
let aktiv = null

export function verlassen() {
    if (tasten) document.removeEventListener("keydown", tasten)
    tasten = null
    aktiv?.flaeche?.abbauen()
    aktiv = null
}

export function zeigen(el, app) {
    const cfg = app.sitzung
    if (!cfg.laufend) cfg.laufend = { sitzung: new Sitzung(cfg.aufgaben, { modus: "gespraech", titel: cfg.titel }), uebersprungen: 0 }
    const s = cfg.laufend.sitzung
    el.innerHTML = `
    <section class="sa-gespraech">
        <header class="sa-lernen__kopf">
            <button class="sa-symbolknopf" type="button" data-beenden aria-label="Gespräch beenden" title="Beenden (Esc)">${S.zu}</button>
            <div class="sa-lernen__titel"><strong>${esc(cfg.titel)}</strong><span>Gespräch mit ${NAME}</span></div>
            <div class="sa-lernen__stand" data-stand></div>
            <div class="sa-lernen__balken"><i data-balken></i></div>
        </header>
        <div class="sa-gespraech__raum">
            <div class="sa-gespraech__lehrer"><div class="sa-uhu" data-uhu data-stimmung="winkt">${UHU_SVG}</div><span class="sa-gespraech__name">${NAME}</span></div>
            <div class="sa-gespraech__verlauf" data-verlauf aria-live="polite"></div>
        </div>
        <div class="sa-gespraech__eingabe" data-eingabe></div>
    </section>`
    const lauf = {
        el, app, cfg, s, uhu: el.querySelector("[data-uhu]"), verlauf: el.querySelector("[data-verlauf]"), eingabe: el.querySelector("[data-eingabe]"),
        letzterModus: null, gleicheModi: 0, serie: 0, richtig: 0, gesamt: 0, phase: "start", zuletztFalsch: new Set(),
    }
    aktiv = lauf
    el.querySelector("[data-beenden]").addEventListener("click", () => beenden(app))
    tastenSetzen(lauf)
    standZeigen(lauf)
    begruessen(lauf)
}

function beenden(app) {
    const zurueck = app.sitzung?.zurueck || "heute"
    app.sitzung = null
    app.gehe(zurueck)
}

function standZeigen(lauf) {
    const { s, el } = lauf
    const fertig = Math.min(s.gesamt, s.erledigt)
    el.querySelector("[data-stand]").textContent = `${fertig} / ${s.gesamt}`
    el.querySelector("[data-balken]").style.width = `${s.gesamt ? (fertig / s.gesamt) * 100 : 100}%`
}

// ---------- Sprechblasen ----------
async function lehrerSagt(lauf, text, { extra = "", stimmungArt = null } = {}) {
    const b = document.createElement("div")
    b.className = "sa-blase sa-blase--lehrer"
    b.innerHTML = `<p></p>${extra}`
    lauf.verlauf.append(b)
    aufraeumen(lauf)
    if (stimmungArt) stimmung(lauf.uhu, stimmungArt)
    await schreiben(b.querySelector("p"), text, lauf.uhu)
    b.querySelectorAll(".sa-blase__extra").forEach((x) => x.classList.add("ist-da"))
    rollen(lauf)
    return b
}
function duSagst(lauf, html) {
    const b = document.createElement("div")
    b.className = "sa-blase sa-blase--du"
    b.innerHTML = html
    lauf.verlauf.append(b)
    aufraeumen(lauf)
    rollen(lauf)
    return b
}
function rollen(lauf) {
    lauf.verlauf.scrollTo({ top: lauf.verlauf.scrollHeight, behavior: "smooth" })
}
function aufraeumen(lauf) {
    while (lauf.verlauf.children.length > 40) lauf.verlauf.firstElementChild.remove()
}
function eingabe(lauf, html) {
    lauf.flaeche?.abbauen()
    lauf.flaeche = null
    lauf.eingabe.innerHTML = html
}

// ---------- Ablauf ----------
async function begruessen(lauf) {
    const st = streaks(lauf.app.lager.profil.tage || {}, lauf.app.lager.jetzt())
    await lehrerSagt(lauf, satz("hallo", { tageszeit: tageszeit(), anzahl: lauf.s.gesamt }))
    if (st.aktuell >= 2) await lehrerSagt(lauf, satz("serieHallo", { streak: st.aktuell }), { stimmungArt: "freut" })
    naechste(lauf)
}

function modusWaehlen(lauf, karte, aufgabe) {
    const z = lauf.app.lager.zustand(aufgabe.schluessel)
    const neu = !z
    const gewichte = { karte: neu ? 2 : 3, auswahl: 0, tippen: 0, zeichnen: 0 }
    const auswahl = auswahlFuer(lauf.app.lager, aufgabe)
    if (auswahl) gewichte.auswahl = neu ? 4 : 2
    if (schreibTauglich(karte)) gewichte.tippen = neu ? 1 : 3
    if (zeichenTauglich(karte)) gewichte.zeichnen = neu ? 1 : 3
    if (lauf.gleicheModi >= 1 && lauf.letzterModus && Object.values(gewichte).filter(Boolean).length > 1) gewichte[lauf.letzterModus] = 0
    const summe = Object.values(gewichte).reduce((a, b) => a + b, 0)
    let r = Math.random() * summe
    for (const [m, g] of Object.entries(gewichte)) { r -= g; if (r < 0) return { modus: m, auswahl } }
    return { modus: "karte", auswahl }
}

async function naechste(lauf) {
    const { s, app } = lauf
    standZeigen(lauf)
    while (s.aktuell && !aufgabeAufloesen(app.lager, s.aktuell)) { s.offen.shift(); s.gesamt-- }
    if (!s.aktuell) return ende(lauf)
    const { karte, deck, eintrag } = aufgabeAufloesen(app.lager, s.aktuell)
    const { modus, auswahl } = modusWaehlen(lauf, karte, s.aktuell)
    lauf.gleicheModi = modus === lauf.letzterModus ? lauf.gleicheModi + 1 : 0
    lauf.letzterModus = modus
    Object.assign(lauf, { karte, deck, eintrag, modus, auswahl, ctx: ctxFuer(app, deck), phase: "frage" })
    eingabe(lauf, "")
    const werte = { vorne: karte.vorne?.text || "…", aufgabe: zeichenAufgabe(karte), antwort: karte.antwort }
    const zeigeKarte = modus !== "zeichnen" && (karte.vorne?.bloecke?.length || (karte.vorne?.text || "").length > 40)
    const bildfrage = vorneIstBild(karte) && modus !== "zeichnen"
    werte.frage = karte.vorne?.zusatz || "Was ist das?"
    await lehrerSagt(lauf, satz(bildfrage ? `${modus}Bild` : modus, werte), {
        extra: zeigeKarte ? `<div class="sa-blase__extra sa-blase__karte">${vorderseite(karte, lauf.ctx)}</div>` : "",
    })
    lauf.start = performance.now()
    if (lauf.verlauf.lastElementChild.querySelector(".sa-blase__karte")) aktivieren(lauf.verlauf.lastElementChild, lauf.ctx)
    stimmung(lauf.uhu, "denkt", 0)
    if (modus === "karte") karteFragen(lauf)
    else if (modus === "auswahl") auswahlFragen(lauf)
    else if (modus === "tippen") tippenFragen(lauf)
    else zeichnenFragen(lauf)
}

// Antwort speichern (zählt wie in den einzelnen Modi)
async function speichern(lauf, ergebnis) {
    const r = await lauf.app.lager.bewerten(lauf.s.aktuell, ergebnis, { ms: performance.now() - lauf.start, modus: "gespraech" })
    lauf.s.antworten(ergebnis, r.ereignis.id)
    lauf.letztesEreignis = r.ereignis.id
    const ok = ergebnis.ok ?? ergebnis.b >= 3
    lauf.gesamt++
    if (ok) lauf.richtig++
    standZeigen(lauf)
    return ok
}

async function reagieren(lauf, ok, { art = null, werte = {}, korrigierbar = false } = {}) {
    const k = lauf.karte
    const schluessel = lauf.eintrag.schluessel
    werte = { antwort: k.antwort, ...werte }
    let text
    if (ok) {
        lauf.serie++
        text = satz(art === "fast" ? "fast" : art === "zeichnen" ? "zeichnenRichtig" : "richtig", werte)
        if (lauf.zuletztFalsch.has(schluessel)) { text += " " + satz("wiedergut"); lauf.zuletztFalsch.delete(schluessel) }
        else if (lauf.serie === 3 || lauf.serie === 5 || (lauf.serie > 5 && lauf.serie % 5 === 0)) text += " " + satz("serie")
    } else {
        lauf.serie = 0
        lauf.zuletztFalsch.add(schluessel)
        text = satz(art === "zeichnen" ? "zeichnenFalsch" : "falsch", werte)
    }
    const extra = `<details class="sa-blase__extra sa-blase__mehr"><summary>Ganze Karte ansehen</summary><div class="sa-blase__karte">${vorderseite(k, lauf.ctx)}${rueckseite(k, lauf.ctx)}</div></details>`
    const blase = await lehrerSagt(lauf, text, { extra, stimmungArt: ok ? "freut" : "traurig" })
    aktivieren(blase, lauf.ctx)
    lauf.phase = "weiter"
    eingabe(lauf, `<div class="sa-gespraech__knoepfe">
        ${korrigierbar ? `<button class="g-knopf-leise" type="button" data-korrektur>${ok ? "Doch falsch" : "Ich lag richtig"}</button>` : ""}
        <button class="g-knopf" type="button" data-weiter>Weiter <kbd>Enter</kbd></button></div>`)
    lauf.eingabe.querySelector("[data-weiter]").addEventListener("click", () => naechste(lauf))
    lauf.eingabe.querySelector("[data-weiter]").focus({ preventScroll: true })
    lauf.eingabe.querySelector("[data-korrektur]")?.addEventListener("click", () => korrigieren(lauf, !ok))
}

async function korrigieren(lauf, neuOk) {
    if (lauf.phase !== "weiter") return
    lauf.phase = "speichern"
    try {
        await lauf.app.lager.aufheben(lauf.letztesEreignis)
        lauf.s.rueckgaengig()
        lauf.gesamt--
        if (!neuOk) lauf.richtig--
        await speichern(lauf, { b: neuOk ? 3 : 1 })
        if (neuOk) lauf.zuletztFalsch.delete(lauf.eintrag.schluessel)
        await lehrerSagt(lauf, satz(neuOk ? "korrigiert" : "korrigiertFalsch"), { stimmungArt: neuOk ? "freut" : "ruhig" })
        lauf.phase = "weiter"
        lauf.eingabe.querySelector("[data-korrektur]")?.remove()
    } catch (f) { lauf.phase = "weiter"; fehlerMeldung(f) }
}

// ---------- Karteikarte ----------
function karteFragen(lauf) {
    eingabe(lauf, `<div class="sa-gespraech__knoepfe"><button class="g-knopf" type="button" data-zeigen>Ich hab's im Kopf – zeig die Lösung <kbd>Leertaste</kbd></button></div>`)
    lauf.eingabe.querySelector("[data-zeigen]").addEventListener("click", () => karteZeigen(lauf))
}
async function karteZeigen(lauf) {
    if (lauf.phase !== "frage") return
    lauf.phase = "bewerten"
    duSagst(lauf, `<p class="sa-blase__leise">Lösung zeigen</p>`)
    eingabe(lauf, "")
    const b = await lehrerSagt(lauf, `Die Lösung: „${lauf.karte.antwort}“. ${satz("aufdecken")}`, {
        extra: `<details class="sa-blase__extra sa-blase__mehr" open><summary>Ganze Karte</summary><div class="sa-blase__karte">${rueckseite(lauf.karte, lauf.ctx)}</div></details>`,
    })
    aktivieren(b, lauf.ctx)
    eingabe(lauf, `<div class="sa-gespraech__bewerten">${BEWERTUNGEN.map(([n, t]) => `<button type="button" class="sa-bewertung sa-bewertung--${n}" data-b="${n}"><span class="sa-bewertung__text">${t}</span><kbd>${n}</kbd></button>`).join("")}</div>`)
    lauf.eingabe.querySelectorAll("[data-b]").forEach((k) => k.addEventListener("click", () => karteBewerten(lauf, +k.dataset.b)))
}
async function karteBewerten(lauf, b) {
    if (lauf.phase !== "bewerten") return
    lauf.phase = "speichern"
    duSagst(lauf, `<p>${BEWERTUNGEN[b - 1][1]}</p>`)
    eingabe(lauf, "")
    try {
        const ok = await speichern(lauf, { b })
        if (ok) lauf.serie++; else { lauf.serie = 0; lauf.zuletztFalsch.add(lauf.eintrag.schluessel) }
        await lehrerSagt(lauf, satz(ok ? "bewertetGut" : "bewertetSchlecht"), { stimmungArt: ok ? "freut" : "ruhig" })
        naechste(lauf)
    } catch (f) { lauf.phase = "bewerten"; fehlerMeldung(f) }
}

// ---------- Auswahl ----------
function auswahlFragen(lauf) {
    eingabe(lauf, `<div class="sa-gespraech__optionen">${lauf.auswahl.optionen.map((o, i) => `<button type="button" class="sa-option" data-i="${i}"><kbd>${i + 1}</kbd><span>${esc(o.text)}</span></button>`).join("")}</div>`)
    lauf.eingabe.querySelectorAll("[data-i]").forEach((k) => k.addEventListener("click", () => auswahlAntwort(lauf, +k.dataset.i)))
}
async function auswahlAntwort(lauf, i) {
    if (lauf.phase !== "frage") return
    lauf.phase = "speichern"
    const opt = lauf.auswahl.optionen[i]
    duSagst(lauf, `<p>${esc(opt.text)}</p>`)
    eingabe(lauf, "")
    try {
        const ok = await speichern(lauf, { ok: opt.richtig })
        await reagieren(lauf, ok)
    } catch (f) { lauf.phase = "frage"; fehlerMeldung(f) }
}

// ---------- Schreiben ----------
function tippenFragen(lauf) {
    eingabe(lauf, `<form class="sa-tippfeld" novalidate><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Deine Antwort …" aria-label="Deine Antwort"><button class="g-knopf" type="submit">${S.weiter}<span>Senden</span></button></form>`)
    const form = lauf.eingabe.querySelector("form")
    form.addEventListener("submit", (e) => { e.preventDefault(); tippenAntwort(lauf, form.querySelector("input").value) })
    form.querySelector("input").focus({ preventScroll: true })
}
async function tippenAntwort(lauf, text) {
    if (lauf.phase !== "frage" || !text.trim()) return
    lauf.phase = "speichern"
    duSagst(lauf, `<p>${esc(text)}</p>`)
    eingabe(lauf, "")
    const r = eingabePruefen(text, loesungenVon(lauf.karte), { japanisch: [lauf.deck.sprachen?.vorne, lauf.deck.sprachen?.hinten].includes("ja") })
    try {
        const ok = await speichern(lauf, { b: r.ergebnis === "falsch" ? 1 : 3 })
        await reagieren(lauf, ok, { art: r.ergebnis === "fast" ? "fast" : null, werte: { antwort: r.ergebnis === "fast" ? r.loesung : lauf.karte.antwort }, korrigierbar: true })
    } catch (f) { lauf.phase = "frage"; fehlerMeldung(f) }
}

// ---------- Zeichnen ----------
function zeichnenFragen(lauf) {
    eingabe(lauf, `<div class="sa-gespraech__mal"><div data-mal></div><div class="sa-gespraech__knoepfe">
        <button class="g-knopf-text" type="button" data-weiss-nicht>Weiß ich nicht</button>
        <button class="g-knopf" type="button" data-abgeben>Abgeben <kbd>Enter</kbd></button></div></div>`)
    lauf.flaeche = zeichenflaeche(lauf.eingabe.querySelector("[data-mal]"), { hoehe: 220, hinweis: "Hier zeichnen" })
    lauf.eingabe.querySelector("[data-abgeben]").addEventListener("click", () => zeichnenAntwort(lauf))
    lauf.eingabe.querySelector("[data-weiss-nicht]").addEventListener("click", () => zeichnenAntwort(lauf, true))
}
async function zeichnenAntwort(lauf, aufgegeben = false) {
    if (lauf.phase !== "frage") return
    if (!aufgegeben && lauf.flaeche.leer()) return
    lauf.phase = "speichern"
    const schablone = schablonenRaster(lauf.karte)
    const zeichnung = strichRaster(lauf.flaeche.striche())
    const e = aufgegeben ? { wert: 0, abdeckung: 0, treffsicherheit: 0 } : aehnlichkeit(zeichnung, schablone)
    duSagst(lauf, aufgegeben ? `<p class="sa-blase__leise">Weiß ich nicht</p>` : `<img class="sa-blase__bild" src="${vergleichBild(zeichnung, new Uint8Array(zeichnung.length))}" alt="Deine Zeichnung">`)
    eingabe(lauf, "")
    try {
        const ok = await speichern(lauf, { b: !aufgegeben && zaehlt(e) ? 3 : 1 })
        await reagieren(lauf, ok, { art: "zeichnen", werte: { prozent: Math.round(e.wert * 100) }, korrigierbar: !aufgegeben })
        lauf.verlauf.lastElementChild.insertAdjacentHTML("beforeend", `<div class="sa-blase__vorlage">${schablonenHtml(lauf.karte, { klein: true })}${aufgegeben ? "" : `<img src="${vergleichBild(zeichnung, schablone)}" alt="Deine Zeichnung über der Vorlage">`}</div>`)
        rollen(lauf)
    } catch (f) { lauf.phase = "frage"; fehlerMeldung(f) }
}

// ---------- Ende ----------
async function ende(lauf) {
    lauf.phase = "ende"
    eingabe(lauf, "")
    const quote = lauf.gesamt ? lauf.richtig / lauf.gesamt : 1
    await lehrerSagt(lauf, lauf.gesamt ? satz("ende", { richtig: lauf.richtig, gesamt: lauf.gesamt, lob: lobFuer(quote) }) : "Für heute habe ich keine Aufgaben mehr. Bis bald!", { stimmungArt: "winkt" })
    eingabe(lauf, `<div class="sa-gespraech__knoepfe"><button class="g-knopf" type="button" data-fertig>Zur Übersicht</button></div>`)
    lauf.eingabe.querySelector("[data-fertig]").addEventListener("click", () => beenden(lauf.app))
    lauf.eingabe.querySelector("[data-fertig]").focus({ preventScroll: true })
}

// ---------- Tastatur ----------
function tastenSetzen(lauf) {
    if (tasten) document.removeEventListener("keydown", tasten)
    tasten = (e) => {
        if (document.querySelector("dialog[open]")) return
        if (e.key === "Escape") { e.preventDefault(); return beenden(lauf.app) }
        if (e.target.closest?.("input, textarea, select")) return
        if (e.ctrlKey || e.metaKey || e.altKey) return
        if (lauf.phase === "weiter" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); naechste(lauf) }
        else if (lauf.phase === "frage" && lauf.modus === "karte" && e.key === " ") { e.preventDefault(); karteZeigen(lauf) }
        else if (lauf.phase === "frage" && lauf.modus === "zeichnen" && e.key === "Enter") { e.preventDefault(); zeichnenAntwort(lauf) }
        else if (lauf.phase === "frage" && lauf.modus === "auswahl" && ["1", "2", "3"].includes(e.key)) { e.preventDefault(); auswahlAntwort(lauf, +e.key - 1) }
        else if (lauf.phase === "bewerten" && ["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); karteBewerten(lauf, +e.key) }
    }
    document.addEventListener("keydown", tasten)
}
