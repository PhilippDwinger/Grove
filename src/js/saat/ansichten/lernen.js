// ==========================================================
// Saat · Lernsitzung – zwei Modi
//   karte   – Karteikarte: Vorderseite → aufdecken → vier ehrliche Bewertungen
//   auswahl – drei Antworten zur Wahl → richtig/falsch → danach die ganze Karte
// Tasten: Leertaste/Enter = aufdecken bzw. weiter · 1–4 Bewertung · 1–3 Auswahl
//         Strg+Z = letzte Antwort zurücknehmen · Esc = beenden
// ==========================================================
import { esc } from "../../kern/html.js"
import { S, STUFEN } from "../symbole.js"
import { Sitzung } from "../sitzung.js"
import { vorschau, beherrschung } from "../planer.js"
import { auswahlBauen } from "../ablenker.js"
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

// ---------- Auswahl-Hilfen ----------
let poolCache = { index: null, liste: [] }
function pool(lager) {
    if (poolCache.index !== lager.index) {
        poolCache = { index: lager.index, liste: [...lager.index.eintraege.values()].map((e) => ({ karte: e.karte, deckId: e.deck.id })) }
    }
    return poolCache.liste
}
function auswahlFuer(lager, a) {
    const r = aufgabeAufloesen(lager, a)
    return r ? auswahlBauen({ karte: r.karte, deckId: r.deck.id }, pool(lager)) : null
}
export const aufgabeTauglich = (lager, a) => !!auswahlFuer(lager, a)

// ---------- Ansicht ----------
let tasten = null

export function zeigen(el, app) {
    const cfg = app.sitzung
    if (!cfg.laufend) cfg.laufend = { sitzung: new Sitzung(cfg.aufgaben, { modus: cfg.modus, titel: cfg.titel }), uebersprungen: cfg.ausgelassen || 0 }
    const s = cfg.laufend.sitzung
    el.innerHTML = `
    <section class="sa-lernen" data-modus="${cfg.modus}">
        <header class="sa-lernen__kopf">
            <button class="sa-symbolknopf" type="button" data-beenden aria-label="Sitzung beenden" title="Beenden (Esc)">${S.zu}</button>
            <div class="sa-lernen__titel"><strong>${esc(cfg.titel)}</strong><span>${cfg.modus === "auswahl" ? "Auswahl-Modus" : "Karteikarten"}</span></div>
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
    buehne.innerHTML = `
        <article class="sa-lernkarte" data-stufe="${stufe}">
            <div class="sa-lernkarte__meta">${marken}<span class="sa-lernkarte__datei">${esc(deck.titel)}</span>
                <a class="sa-symbolknopf" href="#editor/${encodeURIComponent(deck.id)}/${encodeURIComponent(karte.id)}" title="Karte bearbeiten (beendet die Sitzung)" aria-label="Karte bearbeiten">${S.stift}</a></div>
            <div class="sa-lernkarte__vorne">${vorderseite(karte, lauf.ctx)}</div>
            ${lauf.cfg.modus === "auswahl" ? auswahlHtml(lauf.auswahl) : ""}
            <div class="sa-lernkarte__hinten" data-hinten hidden></div>
        </article>
        <div class="sa-lernen__fuss" data-fuss></div>`
    aktivieren(buehne.querySelector(".sa-lernkarte__vorne"), lauf.ctx)
    lauf.karte = karte
    lauf.eintrag = eintrag
    if (lauf.cfg.modus === "auswahl") auswahlAktivieren(lauf)
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

async function antworten(lauf, ergebnis) {
    if (lauf.phase === "speichern") return
    const vorher = lauf.phase
    lauf.phase = "speichern"
    const { app, s } = lauf
    try {
        const ms = "b" in ergebnis ? lauf.ms : lauf.ms ?? performance.now() - lauf.start
        const r = await app.lager.bewerten(s.aktuell, ergebnis, { ms })
        s.antworten(ergebnis, r.ereignis.id)
        rueckgaengigAnbieten(lauf, r.ereignis.id, ergebnis)
        if ("b" in ergebnis) naechste(lauf)
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

// ---------- Ende ----------
function ende(lauf) {
    const { s, app, cfg } = lauf
    standZeigen(lauf)
    const l = app.lager
    const f = l.faelligkeit()
    const nochOffen = f.faellig.length + f.neu.length
    const z = s.zaehler
    const auswahl = cfg.modus === "auswahl"
    const gesamt = auswahl ? z.richtig + z.falsch : z[1] + z[2] + z[3] + z[4]
    lauf.phase = "ende"
    lauf.buehne.innerHTML = `
        <article class="sa-ende">
            ${ringHtml(gesamt ? (auswahl ? z.richtig : z[3] + z[4]) / gesamt : 1, `${s.erledigt}`, s.erledigt === 1 ? "Karte" : "Karten")}
            <h1>${s.erledigt ? "Geschafft." : "Nichts mehr zu tun."}</h1>
            ${auswahl
                ? `<ul class="sa-ende__zahlen"><li><b>${z.richtig}</b> richtig</li><li><b>${z.falsch}</b> falsch</li></ul>`
                : `<ul class="sa-ende__zahlen">${BEWERTUNGEN.map((x) => `<li class="sa-ende--${x.b}"><b>${z[x.b]}</b> ${esc(x.text)}</li>`).join("")}</ul>`}
            ${cfg.laufend.uebersprungen ? `<p class="sa-klein">${cfg.laufend.uebersprungen} Karte(n) ohne passende Antwortmöglichkeiten wurden ausgelassen – lern sie im Karteikarten-Modus.</p>` : ""}
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
        } else {
            if (lauf.phase === "frage" && ["1", "2", "3"].includes(e.key)) { e.preventDefault(); waehlen(lauf, +e.key - 1) }
            else if (lauf.phase === "weiter" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); naechste(lauf) }
        }
    }
    document.addEventListener("keydown", tasten)
}

export { STUFEN }
