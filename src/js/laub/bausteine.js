// ==========================================================
// Laub · Bausteine für die Einstellungs-Oberfläche
// Kleine Helfer, die Zeilen, Kacheln, Regler und Schalter bauen.
// Jeder Baustein kennt seinen „Pfad“ in den Einstellungen
// (z. B. "bewegung.tempo") und schreibt über thema.js dorthin.
// ==========================================================
import { wirksam, eigenerWert, wertSetzen, geerbt } from "../kern/thema.js"

// Für welchen Bereich gerade eingestellt wird (setzt seiten/laub.js)
export const ctx = { bereich: "grove" }

export const holen = (obj, pfad) => pfad.split(".").reduce((o, k) => o?.[k], obj)
export const wert = (pfad) => holen(wirksam(ctx.bereich), pfad)
export const setze = (pfad, v) => wertSetzen(ctx.bereich, pfad, v)
export const zuruecksetzen = (pfad) => wertSetzen(ctx.bereich, pfad, undefined)

// Mini-Helfer zum Bauen von HTML-Elementen: el("button", { class: "x", onclick }, "Text")
export function el(tag, attrs = {}, ...kinder) {
    const e = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
        if (v === undefined || v === null || v === false) continue
        if (k.startsWith("on")) e.addEventListener(k.slice(2), v)
        else if (k === "class") e.className = v
        else if (k === "html") e.innerHTML = v
        else if (k === "style" && typeof v === "object") Object.assign(e.style, v)
        else if (k === "dataset") Object.assign(e.dataset, v)
        else e.setAttribute(k, v === true ? "" : v)
    }
    for (const k of kinder.flat()) if (k !== null && k !== undefined && k !== false) e.append(k.nodeType ? k : String(k))
    return e
}

export const SYMBOL = {
    zurueck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
}

// ---------- Zeile: Titel + Hinweis + „eigen/geerbt“ + Zurücksetzen ----------
export function zeile({ titel, hinweis, pfad, inhalt, klasse = "" }) {
    const reset = pfad ? el("button", {
        type: "button", class: "lz__reset", title: "Zurücksetzen", "aria-label": `${titel} zurücksetzen`,
        html: SYMBOL.zurueck, onclick: () => zuruecksetzen(pfad),
    }) : null
    return el("div", { class: "lz " + klasse, dataset: pfad ? { pfad } : {} },
        el("div", { class: "lz__kopf" },
            el("div", { class: "lz__titel" }, el("strong", {}, titel), pfad ? el("span", { class: "lz__marke" }) : null),
            reset),
        hinweis ? el("p", { class: "lz__hinweis" }, hinweis) : null,
        el("div", { class: "lz__inhalt" }, inhalt),
    )
}

// ---------- Kacheln (eine aus mehreren wählen) ----------
export function kacheln({ pfad, optionen, klasse = "", inhalt, beschriftung = (o) => o.name, nachWahl }) {
    const gruppe = el("div", { class: "kacheln " + klasse, role: "radiogroup", dataset: { wahlPfad: pfad } })
    for (const o of optionen) {
        gruppe.append(el("button", {
            type: "button", class: "kachel", role: "radio", dataset: { wahl: String(o.id) },
            onclick: () => { setze(pfad, o.id); nachWahl?.(o) },
        }, inhalt ? el("span", { class: "kachel__bild" }, inhalt(o)) : null, el("span", { class: "kachel__name" }, beschriftung(o))))
    }
    return gruppe
}

// ---------- Segmente (wenige Optionen nebeneinander) ----------
export function segmente({ pfad, optionen }) {
    const g = el("div", { class: "segmente", role: "radiogroup", dataset: { wahlPfad: pfad } })
    for (const o of optionen) {
        g.append(el("button", { type: "button", role: "radio", dataset: { wahl: String(o.id) }, onclick: () => setze(pfad, o.id) }, o.name))
    }
    return g
}

// ---------- Schieberegler ----------
export function schieber({ pfad, min, max, schritt = 1, format = (v) => v, links, rechts }) {
    const eingabe = el("input", { type: "range", min, max, step: schritt, dataset: { reglerPfad: pfad } })
    const ausgabe = el("output", {})
    eingabe.addEventListener("input", () => { ausgabe.textContent = format(Number(eingabe.value)); setze(pfad, Number(eingabe.value)) })
    eingabe._format = format
    eingabe._ausgabe = ausgabe
    return el("div", { class: "schieber" },
        links ? el("span", { class: "schieber__ende" }, links) : null,
        eingabe,
        rechts ? el("span", { class: "schieber__ende" }, rechts) : null,
        ausgabe)
}

// ---------- Schalter (an/aus) ----------
export function schalter({ pfad, text }) {
    const box = el("input", { type: "checkbox", role: "switch", dataset: { schalterPfad: pfad } })
    box.addEventListener("change", () => setze(pfad, box.checked))
    return el("label", { class: "schalter" }, box, el("span", { class: "schalter__spur", "aria-hidden": "true" }), el("span", {}, text))
}

// ---------- Alles auf den aktuellen Stand bringen ----------
// Nach jeder Änderung: Auswahl markieren, Regler setzen, „eigen/geerbt“ zeigen.
export function aktualisieren(wurzel) {
    const w = wirksam(ctx.bereich)
    const aktiv = document.activeElement
    wurzel.querySelectorAll("[data-wahl-pfad]").forEach((g) => {
        const v = String(holen(w, g.dataset.wahlPfad))
        g.querySelectorAll("[data-wahl]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.wahl === v)))
    })
    wurzel.querySelectorAll("[data-regler-pfad]").forEach((r) => {
        const v = holen(w, r.dataset.reglerPfad)
        if (r !== aktiv) r.value = v
        r._ausgabe.textContent = r._format(Number(r.value))
    })
    wurzel.querySelectorAll("[data-schalter-pfad]").forEach((s) => { s.checked = !!holen(w, s.dataset.schalterPfad) })
    wurzel.querySelectorAll(".lz[data-pfad]").forEach((z) => {
        const eigen = eigenerWert(ctx.bereich, z.dataset.pfad) !== undefined
        z.classList.toggle("ist-eigen", eigen)
        const marke = z.querySelector(".lz__marke")
        if (marke) marke.textContent = eigen ? (ctx.bereich === "grove" ? "geändert" : "nur hier") : (ctx.bereich === "grove" ? "Standard" : "geerbt")
    })
}

// Wert, den ein Dienst erben würde (für Hinweise)
export const geerbterWert = (pfad) => holen(geerbt(ctx.bereich), pfad)
