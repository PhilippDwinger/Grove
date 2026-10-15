// ==========================================================
// Saat · Lernsitzung – Modi (siehe modi.js)
//   karte    – Karteikarte: Vorderseite → aufdecken → vier ehrliche Bewertungen
//   auswahl  – drei Antworten zur Wahl → richtig/falsch → danach die ganze Karte
//   tippen   – Antwort eintippen → geprüft (eingabe.js) → richtig = „Gewusst“, falsch = „Nicht gewusst“
//   zeichnen – Lösung ins Malfeld zeichnen → mit der Schablone verglichen (zeichnen-kern.js)
//   gespraech – eigene Ansicht (gespraech.js), Professor Uhu mischt alle Arten
// Bei Schreiben/Zeichnen kannst du das Urteil korrigieren („Doch richtig“ / „Doch falsch“).
// Tasten: Leertaste/Enter = aufdecken bzw. weiter · 1–4 Bewertung · 1–3 Auswahl
//         Strg+Z = letzte Antwort zurücknehmen · Esc = beenden
// ==========================================================
import { esc } from "../../kern/html.js"
import { S, STUFEN } from "../symbole.js"
import { Sitzung } from "../sitzung.js"
import { vorschau, beherrschung } from "../planer.js"
import { eingabePruefen, loesungenVon } from "../eingabe.js"
import { aehnlichkeit, strichRaster, zaehlt, zeichenAufgabe } from "../zeichnen-kern.js"
import { auswahlFuer, tauglich, modusName } from "./modi.js"
import { zeichenflaeche, schablonenRaster, schablonenHtml, vergleichBild } from "./zeichenflaeche.js"
import * as gespraech from "./gespraech.js"
import { dauerText, terminText } from "../hilfen.js"
import { vorderseite, rueckseite, aktivieren } from "../darstellung.js"
import { meldung, fehlerMeldung, stufeMarke, ringHtml } from "./ui.js"
import { ctxFuer, aufgabeAufloesen } from "./kontext.js"

export const ruhig = true

export const BEWERTUNGEN = [
    { b: 1, text: "Nicht gewusst", titel: "Ich konnte mich nicht erinnern." },
    { b: 2, text: "Kam mir bekannt vor", titel: "Nicht selbst gewusst – aber beim Aufdecken wiedererkannt." },
    { b: 3, text: "Gewusst", titel: "Nach etwas Nachdenken gewusst." },
    { b: 4, text: "Ganz leicht", titel: "Sofort und ohne Mühe gewusst." },
]

export const aufgabeTauglich = (lager, a, modus = "auswahl") => tauglich(lager, a, modus)

// ---------- Ansicht ----------
let tasten = null

export function zeigen(el, app) {
    const cfg = app.sitzung
    if (cfg.modus === "gespraech") return gespraech.zeigen(el, app)
    if (!cfg.laufend) cfg.laufend = { sitzung: new Sitzung(cfg.aufgaben, { modus: cfg.modus, titel: cfg.titel }), uebersprungen: cfg.ausgelassen || 0 }
    const s = cfg.laufend.sitzung
    el.innerHTML = `
    <section class="sa-lernen" data-modus="${cfg.modus}">
        <header class="sa-lernen__kopf">
            <button class="sa-symbolknopf" type="button" data-beenden aria-label="Sitzung beenden" title="Beenden (Esc)">${S.zu}</button>
            <div class="sa-lernen__titel"><strong>${esc(cfg.titel)}</strong><span>${esc(modusName(cfg.modus))}</span></div>
            <div class="sa-lernen__stand" data-stand></div>
            <div class="sa-lernen__balken"><i data-balken></i></div>
        </header>
        <div class="sa-lernen__buehne" data-buehne></div>
    </section>`
    el.querySelector("[data-beenden]").addEventListener("click", () => beenden(app))
    const buehne = el.querySelector("[data-buehne]")
    const lauf = { el, app, cfg, s, buehne, phase: "frage", start: performance.now(), auswahl: null }
    tastenSetzen(lauf)
    naechste(lauf)
}

export function verlassen() {
    gespraech.verlassen()
    if (tasten) document.removeEventListener("keydown", tasten)
    tasten = null
    window.speechSynthesis?.cancel()
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

function naechste(lauf) {
    const { s, app, buehne } = lauf
    standZeigen(lauf)
    window.speechSynthesis?.cancel()
    // nicht mehr vorhandene Karten (Datei gelöscht) und – im Auswahl-Modus – untaugliche überspringen
    while (s.aktuell) {
        const r = aufgabeAufloesen(app.lager, s.aktuell)
        if (!r) { s.offen.shift(); s.gesamt--; continue }
        if (lauf.cfg.modus === "auswahl") {
            lauf.auswahl = auswahlFuer(app.lager, s.aktuell)
            if (!lauf.auswahl) { s.offen.shift(); s.gesamt--; lauf.cfg.laufend.uebersprungen++; continue }
        } else if (lauf.cfg.modus !== "karte" && !tauglich(app.lager, s.aktuell, lauf.cfg.modus)) {
            s.offen.shift(); s.gesamt--; lauf.cfg.laufend.uebersprungen++; continue
        }
        break
    }
    if (!s.aktuell) return ende(lauf)
    lauf.phase = "frage"
    lauf.start = performance.now()
    const { eintrag, karte, deck } = aufgabeAufloesen(app.lager, s.aktuell)
    const l = app.lager
    const jetzt = l.jetzt()
    const z = l.zustand(eintrag.schluessel)
    const stufe = beherrschung(z, jetzt, l.pFuer(eintrag))
    const marken = [
        stufeMarke(stufe),
        z && z.faellig > jetzt ? `<span class="sa-marke">vorgezogen</span>` : "",
        s.aktuell.runde ? `<span class="sa-marke">nochmal</span>` : "",
        eintrag.vorkommen.length > 1 ? `<span class="sa-marke" title="${esc(eintrag.vorkommen.map((v) => l.decks.get(v.deckId)?.deck.titel).join(", "))}">in ${eintrag.vorkommen.length} Dateien</span>` : "",
    ].join("")
    lauf.ctx = ctxFuer(app, deck)
    lauf.flaeche?.abbauen()
    lauf.flaeche = null
    const zeichnen = lauf.cfg.modus === "zeichnen"
    buehne.innerHTML = `
        <article class="sa-lernkarte" data-stufe="${stufe}">
            <div class="sa-lernkarte__meta">${marken}<span class="sa-lernkarte__datei">${esc(deck.titel)}</span>
                <a class="sa-symbolknopf" href="#editor/${encodeURIComponent(deck.id)}/${encodeURIComponent(karte.id)}" title="Karte bearbeiten (beendet die Sitzung)" aria-label="Karte bearbeiten">${S.stift}</a></div>
            ${zeichnen
                ? `<div class="sa-lernkarte__vorne"><p class="sa-ueber">Zeichne</p><p class="sk-begriff sk-begriff--aufgabe">${esc(zeichenAufgabe(karte))}</p></div>
                   <div class="sa-lernkarte__mal" data-mal></div>
                   <div class="sa-lernkarte__vorne" data-loesung-vorne hidden>${vorderseite(karte, lauf.ctx)}</div>`
                : `<div class="sa-lernkarte__vorne">${vorderseite(karte, lauf.ctx)}</div>`}
            ${lauf.cfg.modus === "auswahl" ? auswahlHtml(lauf.auswahl) : ""}
            ${lauf.cfg.modus === "tippen" ? `<form class="sa-tippfeld" data-tippen novalidate><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Deine Antwort …" aria-label="Deine Antwort" lang="${esc(deck.sprachen?.hinten || "")}"><button class="g-knopf" type="submit">Prüfen <kbd>Enter</kbd></button></form><p class="sa-urteil-platz" data-urteil></p>` : ""}
            <div class="sa-lernkarte__hinten" data-hinten hidden></div>
        </article>
        <div class="sa-lernen__fuss" data-fuss></div>`
    if (!zeichnen) aktivieren(buehne.querySelector(".sa-lernkarte__vorne"), lauf.ctx)
    lauf.karte = karte
    lauf.eintrag = eintrag
    lauf.deck = deck
    if (lauf.cfg.modus === "auswahl") auswahlAktivieren(lauf)
    else if (lauf.cfg.modus === "tippen") tippenAktivieren(lauf)
    else if (zeichnen) zeichnenAktivieren(lauf)
    else fussFrage(lauf)
    buehne.querySelector(".sa-lernkarte").focus?.()
}

// ---------- Karteikarte ----------
function fussFrage(lauf) {
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `<button class="g-knopf sa-knopf-gross sa-aufdecken" type="button" data-aufdecken>Aufdecken <kbd>Leertaste</kbd></button>`
    fuss.querySelector("[data-aufdecken]").addEventListener("click", () => aufdecken(lauf))
    fuss.querySelector("[data-aufdecken]").focus({ preventScroll: true })
}

function hintenZeigen(lauf) {
    const hinten = lauf.buehne.querySelector("[data-hinten]")
    hinten.innerHTML = rueckseite(lauf.karte, lauf.ctx)
    hinten.hidden = false
    aktivieren(hinten, lauf.ctx)
    lauf.buehne.querySelector(".sa-lernkarte").classList.add("ist-offen")
}

function aufdecken(lauf) {
    if (lauf.phase !== "frage") return
    lauf.phase = "bewerten"
    lauf.ms = performance.now() - lauf.start
    hintenZeigen(lauf)
    const l = lauf.app.lager
    const jetzt = l.jetzt()
    const v = vorschau(l.zustand(lauf.eintrag.schluessel), jetzt, l.pFuer(lauf.eintrag), lauf.eintrag.schluessel)
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `<div class="sa-bewerten" role="group" aria-label="Wie gut wusstest du es?">
        ${BEWERTUNGEN.map((x) => `<button type="button" class="sa-bewertung sa-bewertung--${x.b}" data-b="${x.b}" title="${esc(x.titel)}">
            <span class="sa-bewertung__text">${esc(x.text)}</span>
            <span class="sa-bewertung__wann">${v[x.b] < 3_600_000 ? "gleich nochmal" : terminText(jetzt + v[x.b], jetzt)}</span>
            <kbd>${x.b}</kbd></button>`).join("")}
    </div>`
    fuss.querySelectorAll("[data-b]").forEach((k) => k.addEventListener("click", () => antworten(lauf, { b: +k.dataset.b })))
}

async function antworten(lauf, ergebnis, { bleiben = false } = {}) {
    if (lauf.phase === "speichern") return
    const vorher = lauf.phase
    lauf.phase = "speichern"
    const { app, s } = lauf
    try {
        const ms = lauf.ms ?? performance.now() - lauf.start
        const modus = ["tippen", "zeichnen"].includes(lauf.cfg.modus) ? lauf.cfg.modus : null
        const r = await app.lager.bewerten(s.aktuell, ergebnis, { ms, modus })
        s.antworten(ergebnis, r.ereignis.id)
        lauf.letzteAntwort = { ereignisId: r.ereignis.id, aufgabe: s.fertig.at(-1).aufgabe }
        if (!bleiben) rueckgaengigAnbieten(lauf, r.ereignis.id, ergebnis)
        if ("b" in ergebnis && !bleiben) naechste(lauf)
        else { lauf.phase = "weiter"; standZeigen(lauf) }
    } catch (f) {
        lauf.phase = vorher
        fehlerMeldung(f)
    }
}

function rueckgaengigAnbieten(lauf, ereignisId, ergebnis) {
    const text = "b" in ergebnis ? `„${BEWERTUNGEN[ergebnis.b - 1].text}“ gespeichert` : ergebnis.ok ? "Richtig – gespeichert" : "Falsch – gespeichert"
    lauf.rueckgaengig = async () => {
        if (lauf.app.sitzung?.laufend?.sitzung !== lauf.s) throw new Error("Die Sitzung ist schon vorbei.")
        if (lauf.s.fertig.at(-1)?.ereignisId !== ereignisId) throw new Error("Nur die letzte Antwort lässt sich zurücknehmen.")
        await lauf.app.lager.aufheben(ereignisId)
        lauf.s.rueckgaengig()
        naechste(lauf)
    }
    meldung(text, { rueckgaengig: lauf.rueckgaengig, dauer: 4500, gruppe: "bewertung" })
}

// ---------- Auswahl ----------
function auswahlHtml(a) {
    return `<div class="sa-optionen" role="group" aria-label="Wähle die richtige Antwort">
        ${a.optionen.map((o, i) => `<button type="button" class="sa-option" data-i="${i}"><kbd>${i + 1}</kbd><span>${esc(o.text)}</span></button>`).join("")}
    </div>`
}

function auswahlAktivieren(lauf) {
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `<p class="sa-klein sa-lernen__tipp">Wähle eine Antwort – richtig zählt hier weniger als frei gewusst.</p>`
    lauf.buehne.querySelectorAll(".sa-option").forEach((k) => k.addEventListener("click", () => waehlen(lauf, +k.dataset.i)))
}

async function waehlen(lauf, i) {
    if (lauf.phase !== "frage") return
    lauf.ms = performance.now() - lauf.start
    const opt = lauf.auswahl.optionen[i]
    const knoepfe = lauf.buehne.querySelectorAll(".sa-option")
    knoepfe.forEach((k, j) => {
        k.disabled = true
        if (lauf.auswahl.optionen[j].richtig) k.dataset.ergebnis = "richtig"
    })
    if (!opt.richtig) knoepfe[i].dataset.ergebnis = "falsch"
    knoepfe[i].classList.add("ist-gewaehlt")
    await antworten(lauf, { ok: opt.richtig })
    if (lauf.phase !== "weiter") return
    hintenZeigen(lauf)
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `
        <p class="sa-urteil sa-urteil--${opt.richtig ? "richtig" : "falsch"}" role="status">${opt.richtig ? `${S.haken} Richtig` : `${S.zu} Leider nicht – richtig ist „${esc(lauf.karte.antwort)}“`}</p>
        <button class="g-knopf sa-knopf-gross" type="button" data-weiter>Weiter <kbd>Enter</kbd></button>`
    fuss.querySelector("[data-weiter]").addEventListener("click", () => naechste(lauf))
    fuss.querySelector("[data-weiter]").focus({ preventScroll: true })
}

// ---------- Schreiben ----------
function tippenAktivieren(lauf) {
    const form = lauf.buehne.querySelector("[data-tippen]")
    const feld = form.querySelector("input")
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `<p class="sa-klein sa-lernen__tipp">${lauf.karte.eingaben?.length ? `Auch möglich: ${esc(lauf.karte.eingaben.join(" · ").slice(0, 60))}${lauf.karte.eingaben.join("").length > 60 ? " …" : ""} · ` : ""}Groß/klein und kleine Tippfehler sind egal.</p>`
    form.addEventListener("submit", (e) => { e.preventDefault(); tippenPruefen(lauf) })
    feld.focus({ preventScroll: true })
}

async function tippenPruefen(lauf) {
    if (lauf.phase !== "frage") return
    const feld = lauf.buehne.querySelector("[data-tippen] input")
    const r = eingabePruefen(feld.value, loesungenVon(lauf.karte), { japanisch: lauf.deck.sprachen?.vorne === "ja" || lauf.deck.sprachen?.hinten === "ja" })
    if (r.ergebnis === "leer") { feld.focus(); return }
    lauf.ms = performance.now() - lauf.start
    const richtig = r.ergebnis !== "falsch"
    feld.readOnly = true
    feld.dataset.ergebnis = r.ergebnis
    lauf.buehne.querySelector("[data-tippen] button").disabled = true
    await antworten(lauf, { b: richtig ? 3 : 1 }, { bleiben: true })
    if (lauf.phase !== "weiter") return
    lauf.urteil = { richtig, text: r.ergebnis === "fast" ? `Fast – richtig geschrieben: „${r.loesung}“` : richtig ? "Richtig" : `Leider nicht – richtig ist „${lauf.karte.antwort}“` }
    hintenZeigen(lauf)
    urteilZeigen(lauf)
}

// ---------- Zeichnen ----------
function zeichnenAktivieren(lauf) {
    lauf.flaeche = zeichenflaeche(lauf.buehne.querySelector("[data-mal]"), { hoehe: 300, hinweis: "Hier zeichnen – mit Maus, Finger oder Stift" })
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    fuss.innerHTML = `<button class="g-knopf sa-knopf-gross" type="button" data-fertig-gemalt>Fertig <kbd>Enter</kbd></button>
        <button class="g-knopf-text" type="button" data-weiss-nicht>Weiß ich nicht</button>`
    fuss.querySelector("[data-fertig-gemalt]").addEventListener("click", () => zeichnenPruefen(lauf))
    fuss.querySelector("[data-weiss-nicht]").addEventListener("click", () => zeichnenPruefen(lauf, { aufgegeben: true }))
}

async function zeichnenPruefen(lauf, { aufgegeben = false } = {}) {
    if (lauf.phase !== "frage") return
    const f = lauf.flaeche
    if (f.leer() && !aufgegeben) { meldung("Zeichne zuerst etwas – oder wähle „Weiß ich nicht“."); return }
    lauf.ms = performance.now() - lauf.start
    const schablone = schablonenRaster(lauf.karte)
    const zeichnung = strichRaster(f.striche())
    const e = aufgegeben ? { wert: 0, treffsicherheit: 0, abdeckung: 0 } : aehnlichkeit(zeichnung, schablone)
    const richtig = !aufgegeben && zaehlt(e)
    f.sperren()
    await antworten(lauf, { b: richtig ? 3 : 1 }, { bleiben: true })
    if (lauf.phase !== "weiter") return
    const mal = lauf.buehne.querySelector("[data-mal]")
    mal.insertAdjacentHTML("beforeend", `<div class="sa-vergleich">
        <figure>${schablonenHtml(lauf.karte)}<figcaption>Schablone</figcaption></figure>
        ${aufgegeben ? "" : `<figure><img src="${vergleichBild(zeichnung, schablone)}" alt="Deine Zeichnung über der Schablone"><figcaption>übereinander · ${Math.round(e.wert * 100)} % ähnlich</figcaption></figure>`}
    </div>`)
    lauf.buehne.querySelector("[data-loesung-vorne]").hidden = false
    lauf.urteil = { richtig, text: aufgegeben ? "Kein Problem – so sieht es aus." : richtig ? `Richtig erkannt (${Math.round(e.wert * 100)} % ähnlich)` : `Noch nicht ähnlich genug (${Math.round(e.wert * 100)} %)` }
    hintenZeigen(lauf)
    urteilZeigen(lauf, { korrigierbar: !aufgegeben })
}

// Urteil + „Doch richtig/falsch“ + Weiter (Schreiben & Zeichnen)
function urteilZeigen(lauf, { korrigierbar = true } = {}) {
    const fuss = lauf.buehne.querySelector("[data-fuss]")
    const { richtig, text } = lauf.urteil
    fuss.innerHTML = `
        <p class="sa-urteil sa-urteil--${richtig ? "richtig" : "falsch"}" role="status">${richtig ? S.haken : S.zu} ${esc(text)}</p>
        <div class="sa-held__knoepfe">
            ${korrigierbar ? `<button class="g-knopf-leise" type="button" data-korrektur title="Wenn die Prüfung danebenlag">${richtig ? "Doch falsch" : "Doch richtig"}</button>` : ""}
            <button class="g-knopf sa-knopf-gross" type="button" data-weiter>Weiter <kbd>Enter</kbd></button>
        </div>`
    fuss.querySelector("[data-weiter]").addEventListener("click", () => naechste(lauf))
    fuss.querySelector("[data-korrektur]")?.addEventListener("click", () => korrigieren(lauf))
    fuss.querySelector("[data-weiter]").focus({ preventScroll: true })
}

async function korrigieren(lauf) {
    if (lauf.phase !== "weiter" || !lauf.letzteAntwort) return
    lauf.phase = "speichern"
    try {
        await lauf.app.lager.aufheben(lauf.letzteAntwort.ereignisId)
        lauf.s.rueckgaengig()
        lauf.phase = "frage"
        lauf.urteil = { richtig: !lauf.urteil.richtig, text: lauf.urteil.richtig ? "Als falsch gezählt" : "Als richtig gezählt" }
        await antworten(lauf, { b: lauf.urteil.richtig ? 3 : 1 }, { bleiben: true })
        urteilZeigen(lauf, { korrigierbar: false })
    } catch (f) { lauf.phase = "weiter"; fehlerMeldung(f) }
}

// ---------- Ende ----------
function ende(lauf) {
    const { s, app, cfg } = lauf
    standZeigen(lauf)
    const l = app.lager
    const f = l.faelligkeit()
    const nochOffen = f.faellig.length + f.neu.length
    const z = s.zaehler
    const auswahl = cfg.modus === "auswahl"
    const binaer = ["tippen", "zeichnen"].includes(cfg.modus)
    if (binaer) { z.richtig = z[3] + z[4]; z.falsch = z[1] + z[2] }
    const gesamt = auswahl || binaer ? z.richtig + z.falsch : z[1] + z[2] + z[3] + z[4]
    lauf.phase = "ende"
    lauf.buehne.innerHTML = `
        <article class="sa-ende">
            ${ringHtml(gesamt ? (auswahl || binaer ? z.richtig : z[3] + z[4]) / gesamt : 1, `${s.erledigt}`, s.erledigt === 1 ? "Karte" : "Karten")}
            <h1>${s.erledigt ? "Geschafft." : "Nichts mehr zu tun."}</h1>
            ${auswahl || binaer
                ? `<ul class="sa-ende__zahlen"><li><b>${z.richtig}</b> richtig</li><li><b>${z.falsch}</b> falsch</li></ul>`
                : `<ul class="sa-ende__zahlen">${BEWERTUNGEN.map((x) => `<li class="sa-ende--${x.b}"><b>${z[x.b]}</b> ${esc(x.text)}</li>`).join("")}</ul>`}
            ${cfg.laufend.uebersprungen ? `<p class="sa-klein">${cfg.laufend.uebersprungen} Karte(n) passten nicht zu dieser Lernart (${cfg.modus === "zeichnen" ? "keine Zeichen-Schablone" : cfg.modus === "auswahl" ? "keine fairen Antwortmöglichkeiten" : "keine kurze Lösung"}) und wurden ausgelassen.</p>` : ""}
            <p class="sa-klein">${nochOffen ? `Es warten noch ${nochOffen} Karten.` : f.naechste ? `Nächste Karte fällig in ${dauerText(f.naechste - l.jetzt())}.` : ""}</p>
            <div class="sa-held__knoepfe">
                <button class="g-knopf" type="button" data-fertig>Zur Übersicht</button>
                ${nochOffen && cfg.titel === "Fällige Karten" ? `<button class="g-knopf-leise" type="button" data-weiter>${S.spielen} Weiterlernen</button>` : ""}
            </div>
        </article>`
    lauf.buehne.querySelector("[data-fertig]").addEventListener("click", () => beenden(app))
    lauf.buehne.querySelector("[data-weiter]")?.addEventListener("click", () => {
        const neu = [...f.faellig, ...f.neu].slice(0, l.profil.einstellungen.maxProTag).map((schluessel) => ({ schluessel }))
        app.sitzung = null
        app.lernen({ modus: cfg.modus, aufgaben: neu, titel: cfg.titel, zurueck: cfg.zurueck })
    })
    lauf.buehne.querySelector("[data-fertig]").focus()
}

// ---------- Tastatur ----------
function tastenSetzen(lauf) {
    if (tasten) document.removeEventListener("keydown", tasten)
    tasten = (e) => {
        if (e.target.closest?.("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return
        if (e.key === "Escape") { e.preventDefault(); return beenden(lauf.app) }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); lauf.rueckgaengig?.().catch(fehlerMeldung); lauf.rueckgaengig = null; return }
        if (e.ctrlKey || e.metaKey || e.altKey) return
        if (lauf.cfg.modus === "karte") {
            if (lauf.phase === "frage" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); aufdecken(lauf) }
            else if (lauf.phase === "bewerten" && ["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); antworten(lauf, { b: +e.key }) }
        } else if (lauf.cfg.modus === "tippen" || lauf.cfg.modus === "zeichnen") {
            if (lauf.phase === "frage" && e.key === "Enter" && lauf.cfg.modus === "zeichnen") { e.preventDefault(); zeichnenPruefen(lauf) }
            else if (lauf.phase === "weiter" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); naechste(lauf) }
        } else {
            if (lauf.phase === "frage" && ["1", "2", "3"].includes(e.key)) { e.preventDefault(); waehlen(lauf, +e.key - 1) }
            else if (lauf.phase === "weiter" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); naechste(lauf) }
        }
    }
    document.addEventListener("keydown", tasten)
}

export { STUFEN }
