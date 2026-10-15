// ==========================================================
// Saat · Malfeld (Zeichnen-Modus, Editor-Schablone, Gespräch)
//   zeichenflaeche(el, optionen) → { striche(), leer(), leeren(), sperren(), groesse() }
//   schablonenRaster(karte)      → Raster der Schablone (Striche oder Text, per Canvas gerendert)
//   vergleichBild(zeichnung, schablone) → kleines Bild: Schablone hell, deine Linien in Akzentfarbe
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { N, strichRaster, bildRaster, schablonenText } from "../zeichnen-kern.js"

const SCHRIFT = `600 200px "Noto Sans JP", "Yu Gothic", "YuGothic", "Hiragino Sans", "Meiryo", "Microsoft YaHei", system-ui, sans-serif`
const farbe = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

export function zeichenflaeche(el, { hoehe = 280, hinweis = "Hier zeichnen", beiAenderung = () => {} } = {}) {
    el.innerHTML = `<div class="sa-malfeld" style="--hoehe:${hoehe}px">
        <canvas aria-label="Zeichenfläche" role="img"></canvas>
        <span class="sa-malfeld__hilfe">${esc(hinweis)}</span>
        <div class="sa-malfeld__knoepfe">
            <button type="button" class="sa-symbolknopf" data-mal-zurueck title="Letzten Strich zurücknehmen" aria-label="Letzten Strich zurücknehmen">${S.zurueck}</button>
            <button type="button" class="sa-symbolknopf" data-mal-leeren title="Alles löschen" aria-label="Alles löschen">${S.papierkorb}</button>
        </div>
    </div>`
    const feld = el.querySelector(".sa-malfeld")
    const canvas = feld.querySelector("canvas")
    const ctx = canvas.getContext("2d")
    let striche = [], aktuell = null, gesperrt = false, w = 0, h = 0

    function groesseSetzen() {
        const r = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        w = r.width; h = r.height
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        neuMalen()
    }
    function neuMalen() {
        ctx.clearRect(0, 0, w, h)
        ctx.lineCap = "round"; ctx.lineJoin = "round"
        ctx.strokeStyle = farbe("--text", "#EFE6D6")
        ctx.lineWidth = Math.max(5, Math.min(w, h) * 0.03)
        for (const s of striche) {
            ctx.beginPath()
            ctx.moveTo(s[0], s[1])
            if (s.length === 2) ctx.lineTo(s[0] + 0.1, s[1] + 0.1)
            for (let i = 2; i < s.length; i += 2) ctx.lineTo(s[i], s[i + 1])
            ctx.stroke()
        }
        feld.classList.toggle("ist-leer", !striche.length)
    }
    const punkt = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    canvas.addEventListener("pointerdown", (e) => {
        if (gesperrt || (e.pointerType === "mouse" && e.button !== 0)) return
        e.preventDefault()
        canvas.setPointerCapture(e.pointerId)
        aktuell = [...punkt(e)]
        striche.push(aktuell)
        neuMalen()
    })
    canvas.addEventListener("pointermove", (e) => {
        if (!aktuell) return
        for (const x of e.getCoalescedEvents?.() || [e]) aktuell.push(...punkt(x))
        neuMalen()
    })
    const ende = () => { if (aktuell) { aktuell = null; beiAenderung() } }
    canvas.addEventListener("pointerup", ende)
    canvas.addEventListener("pointercancel", ende)
    feld.querySelector("[data-mal-zurueck]").addEventListener("click", () => { if (!gesperrt) { striche.pop(); neuMalen(); beiAenderung() } })
    feld.querySelector("[data-mal-leeren]").addEventListener("click", () => { if (!gesperrt) { striche = []; neuMalen(); beiAenderung() } })
    const beobachter = new ResizeObserver(() => groesseSetzen())
    beobachter.observe(canvas)
    groesseSetzen()

    return {
        striche: () => striche.map((s) => [...s]),
        leer: () => !striche.length,
        leeren: () => { striche = []; neuMalen() },
        setzen: (neu, breite = 1000) => {         // gespeicherte Striche (0..1000) einzeichnen
            const f = Math.min(w, h) / breite
            const dx = (w - breite * f) / 2, dy = (h - breite * f) / 2
            striche = neu.map((s) => s.map((v, i) => v * f + (i % 2 ? dy : dx)))
            neuMalen()
        },
        sperren: (an = true) => { gesperrt = an; feld.classList.toggle("ist-gesperrt", an) },
        groesse: () => ({ w, h }),
        abbauen: () => beobachter.disconnect(),
    }
}

// Text → Raster (über ein unsichtbares Canvas, mit den Schriften des Geräts)
const textCache = new Map()
export function textRaster(text) {
    if (textCache.has(text)) return textCache.get(text)
    const c = document.createElement("canvas")
    const g = c.getContext("2d", { willReadFrequently: true })
    g.font = SCHRIFT
    const breite = Math.ceil(g.measureText(text).width) + 40
    c.width = Math.max(64, Math.min(2400, breite)); c.height = 280
    g.font = SCHRIFT
    g.fillStyle = "#000"
    g.textBaseline = "middle"
    g.fillText(text, 20, 140)
    const daten = g.getImageData(0, 0, c.width, c.height).data
    const alpha = new Uint8Array(c.width * c.height)
    for (let i = 0; i < alpha.length; i++) alpha[i] = daten[i * 4 + 3]
    const r = bildRaster(alpha, c.width, c.height)
    textCache.set(text, r)
    return r
}

export function schablonenRaster(karte) {
    const z = karte.zeichnen || {}
    if (z.striche?.length) return strichRaster(z.striche)
    return textRaster(schablonenText(karte))
}

// Vorschau der Schablone als HTML (Text groß oder Striche als SVG)
export function schablonenHtml(karte, { klein = false } = {}) {
    const z = karte.zeichnen || {}
    if (z.striche?.length) {
        const pfade = z.striche.map((s) => s.length === 2 ? `M${s[0]} ${s[1]}l.1 .1` : `M${s[0]} ${s[1]}` + s.slice(2).map((v, i) => (i % 2 ? `,${v}` : ` L${v}`)).join("")).join(" ")
        return `<svg class="sa-schablone${klein ? " sa-schablone--klein" : ""}" viewBox="0 0 1000 1000" aria-label="Schablone"><path d="${pfade}"/></svg>`
    }
    return `<span class="sa-schablone sa-schablone--text${klein ? " sa-schablone--klein" : ""}" lang="ja">${esc(schablonenText(karte))}</span>`
}

// Überlagerung als Bild (data:-URL): Schablone gedämpft, Zeichnung in Akzentfarbe
export function vergleichBild(zeichnung, schablone, n = N, pixel = 4) {
    const c = document.createElement("canvas")
    c.width = c.height = n * pixel
    const g = c.getContext("2d")
    const akzent = farbe("--amber", "#E3A15A"), leise = farbe("--muted", "#A8957F")
    for (let i = 0; i < n * n; i++) {
        const x = (i % n) * pixel, y = Math.floor(i / n) * pixel
        if (schablone[i]) { g.globalAlpha = 0.35; g.fillStyle = leise; g.fillRect(x, y, pixel, pixel) }
        if (zeichnung[i]) { g.globalAlpha = 1; g.fillStyle = akzent; g.fillRect(x, y, pixel, pixel) }
    }
    return c.toDataURL()
}
