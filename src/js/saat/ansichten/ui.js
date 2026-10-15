// ==========================================================
// Saat · kleine Oberflächen-Bausteine (Meldungen, Dialoge, Balken, Ring)
// ==========================================================
import { esc } from "../../kern/html.js"
import { S, STUFEN, STUFEN_NAME } from "../symbole.js"
import { dauerText, terminText } from "../hilfen.js"

// ---------- Meldungen unten (wie M01/M04 aus dem Gewächshaus) ----------
export function meldung(text, { art = "", rueckgaengig = null, dauer = rueckgaengig ? 5000 : 2600, gruppe = "" } = {}) {
    const box = document.querySelector(".sa-meldungen")
    // gleiche Gruppe (z. B. Bewertungen): nur die neueste Meldung bleibt stehen
    if (gruppe) box.querySelectorAll(`[data-gruppe="${gruppe}"]`).forEach((x) => x.remove())
    const m = document.createElement("div")
    m.className = `sa-meldung${art ? " sa-meldung--" + art : ""}`
    if (gruppe) m.dataset.gruppe = gruppe
    m.style.setProperty("--dauer", dauer + "ms")
    m.innerHTML = `<span>${esc(text)}</span>${rueckgaengig ? `<button type="button">Rückgängig</button><i class="sa-meldung__zeit"></i>` : ""}`
    box.append(m)
    const weg = () => { m.classList.add("ist-weg"); setTimeout(() => m.remove(), 260) }
    const timer = setTimeout(weg, dauer)
    m.querySelector("button")?.addEventListener("click", async () => {
        clearTimeout(timer)
        m.querySelector("button").disabled = true
        try { await rueckgaengig(); m.querySelector("span").textContent = "Rückgängig gemacht" } catch (f) { m.querySelector("span").textContent = f.message }
        m.querySelector("button")?.remove(); m.querySelector("i")?.remove()
        setTimeout(weg, 1200)
    })
    while (box.children.length > 3) box.firstElementChild.remove()
    return m
}
export const fehlerMeldung = (f) => meldung(f?.message || String(f), { art: "fehler", dauer: 6000 })

// ---------- Dialog im Grove-Stil mit eigenem Inhalt ----------
// knoepfe: [{ wert, text, art: "haupt"|"leise"|"gefahr" }] → Promise mit dem Wert (null = geschlossen)
export function dialog({ titel, html = "", knoepfe = [{ wert: "ok", text: "OK", art: "haupt" }], breit = false, beimOeffnen }) {
    return new Promise((ok) => {
        const d = document.createElement("dialog")
        d.className = `g-dialog sa-dialog${breit ? " sa-dialog--breit" : ""}`
        d.innerHTML = `<form method="dialog" novalidate>
            <div class="sa-dialog__kopf"><h2>${esc(titel)}</h2><button type="submit" value="" class="sa-symbolknopf" aria-label="Schließen">${S.zu}</button></div>
            <div class="sa-dialog__inhalt">${html}</div>
            ${knoepfe.length ? `<div class="g-dialog__knoepfe">${knoepfe.map((k) =>
                `<button type="submit" value="${esc(k.wert)}" class="${k.art === "haupt" ? "g-knopf" : k.art === "gefahr" ? "g-knopf g-knopf--gefahr" : "g-knopf-leise"}">${esc(k.text)}</button>`).join("")}</div>` : ""}
        </form>`
        document.body.append(d)
        d.addEventListener("close", () => { ok(d.returnValue || null); setTimeout(() => d.remove(), 200) })
        d.showModal()
        beimOeffnen?.(d)
    })
}

// ---------- Beherrschung ----------
export const stufeMarke = (stufe, { text = true } = {}) =>
    `<span class="sa-stufe sa-stufe--${stufe}" title="${esc(STUFEN_NAME[stufe])}">${STUFEN[stufe]}${text ? `<span>${esc(STUFEN_NAME[stufe])}</span>` : ""}</span>`

// Gestapelter Balken Gut/Okay/Schlecht/Neu mit Legende (Zahlen + Symbole, nie nur Farbe)
export function verteilungHtml(v, { legende = true, klein = false } = {}) {
    const summe = v.gut + v.okay + v.schlecht + v.neu
    const teil = (k) => summe ? (v[k] / summe) * 100 : 0
    return `<div class="sa-verteilung${klein ? " sa-verteilung--klein" : ""}">
        <div class="sa-verteilung__balken" role="img" aria-label="${["gut", "okay", "schlecht", "neu"].map((k) => `${STUFEN_NAME[k]}: ${v[k]}`).join(", ")}">
            ${["gut", "okay", "schlecht", "neu"].filter((k) => v[k]).map((k) => `<i class="sa-v--${k}" style="flex-grow:${teil(k)}" title="${esc(STUFEN_NAME[k])}: ${v[k]}"></i>`).join("")}
        </div>
        ${legende ? `<ul class="sa-verteilung__legende">${["gut", "okay", "schlecht", "neu"].map((k) =>
            `<li class="sa-stufe--${k}">${STUFEN[k]}<span>${esc(STUFEN_NAME[k])}</span><b>${v[k]}</b></li>`).join("")}</ul>` : ""}
    </div>`
}

// Ring (wie P02 „Jahresring füllt sich“)
export function ringHtml(anteil, mitte = "", unten = "") {
    const p = Math.round(Math.max(0, Math.min(1, anteil)) * 100)
    return `<div class="sa-ring"${p ? "" : " data-leer"} role="img" aria-label="${p} Prozent">
        <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="spur"/><circle cx="40" cy="40" r="26" class="innen"/><circle cx="40" cy="40" r="18" class="innen"/><circle cx="40" cy="40" r="34" class="bogen" pathLength="100" style="stroke-dasharray:${p} 100"/></svg>
        <strong>${mitte}</strong>${unten ? `<span>${unten}</span>` : ""}</div>`
}

// ---------- Zeit ----------
const tagFormat = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })
const zeitFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
export const datumKurz = (ms) => tagFormat.format(ms)
export const datumZeit = (ms) => zeitFormat.format(ms)
export function faelligText(z, jetzt) {
    if (!z) return "neu"
    const d = z.faellig - jetzt
    if (d <= 0) return "fällig"
    return "in " + terminText(z.faellig, jetzt)
}
export const prozent = (x) => (x == null ? "–" : `${Math.round(x * 100)} %`)
export const zahl = (x, stellen = 1) => (x == null ? "–" : x.toLocaleString("de-DE", { maximumFractionDigits: stellen }))

// Datei-Auswahl öffnen (ohne sichtbares Feld)
export function dateiWaehlen({ accept = "", mehrere = false } = {}) {
    return new Promise((ok) => {
        const f = document.createElement("input")
        f.type = "file"
        f.accept = accept
        f.multiple = mehrere
        f.addEventListener("change", () => ok([...f.files]), { once: true })
        f.addEventListener("cancel", () => ok([]), { once: true })
        f.click()
    })
}

export function leerHtml({ bild = "", titel, text = "", knoepfe = "" }) {
    return `<div class="sa-leer">${bild}<strong>${esc(titel)}</strong>${text ? `<span>${esc(text)}</span>` : ""}${knoepfe ? `<div class="sa-leer__knoepfe">${knoepfe}</div>` : ""}</div>`
}

// Bilder für leere Zustände (Linien in Palettenfarben, wie das Gewächshaus-Abteil „Leere Zustände“)
export const BILD = {
    bluete: `<svg class="sa-leer__bild" viewBox="0 0 120 80" aria-hidden="true"><path d="M60 74V44"/><path d="M60 62c-8 0-12-4-14-8 6-2 11 0 14 4"/>${[0, 72, 144, 216, 288].map((w) => `<ellipse class="flaeche" cx="60" cy="24" rx="7" ry="11" transform="rotate(${w} 60 36)"/>`).join("")}<circle class="mitte" cx="60" cy="36" r="5"/><circle class="pollen" cx="84" cy="18" r="1.6"/><circle class="pollen p2" cx="92" cy="30" r="1.2"/><circle class="pollen p3" cx="30" cy="22" r="1.4"/></svg>`,
    beet: `<svg class="sa-leer__bild" viewBox="0 0 120 80" aria-hidden="true"><path d="M8 66c18-6 34-6 52 0s34 6 52 0" class="erde"/><path d="M8 54c18-6 34-6 52 0s34 6 52 0" class="erde" opacity=".5"/><ellipse class="flaeche" cx="34" cy="50" rx="3.4" ry="4.6"/><path d="M60 56v-10"/><path class="flaeche" d="M60 48c0-5-4-8-9-8 0 5 4 8 9 8zM60 46c0-5 4-8 9-8 0 5-4 8-9 8z"/><path d="M88 58V36"/><path d="M88 42c-2-.5-3.2-2-3.2-4 2 .3 3.2 1.8 3.2 4zM88 42c2-.5 3.2-2 3.2-4-2 .3-3.2 1.8-3.2 4zM88 47c-2-.5-3.2-2-3.2-4 2 .3 3.2 1.8 3.2 4zM88 47c2-.5 3.2-2 3.2-4-2 .3-3.2 1.8-3.2 4z"/></svg>`,
    lupe: `<svg class="sa-leer__bild" viewBox="0 0 120 80" aria-hidden="true"><path class="erde" d="M6 68c8-8 14 0 20-6s12 2 18-4 12 4 18-2 12 2 18-4 14 4 20 0 12 2 14 4"/><circle class="flaeche" cx="56" cy="34" r="16"/><path d="M68 46l16 16"/></svg>`,
}
