// ==========================================================
// Grove · Thema-Engine
// Jede Seite importiert diese Datei als ALLERERSTES. Sie
//   1. liest die gespeicherte Gestaltung (sofort aus dem Browser,
//      danach aus Supabase – Tabelle "gestaltung"),
//   2. mischt: Standard → Dienst-Standard → Ganz Grove → dieser Dienst,
//   3. setzt daraus CSS-Variablen, Schriften, Animationen, Bilder.
//
// Welche Seite welcher Dienst ist, steht in <body data-dienst="…">.
// Die Laub-Seite ändert Einstellungen über aendern()/setzen().
//
// Konzept „Variablen statt fester Farben“: Alle Stylesheets benutzen
// var(--amber) usw. Ändert man die Variable an <html>, ändert sich
// sofort die ganze Seite – ohne ein einziges Stylesheet anzufassen.
// ==========================================================
import "../../css/animationen.css"
import "../../css/thema.css"
import { supabase } from "./supabase.js"
import {
    STANDARD, DIENST_STANDARD, SCHRIFTEN, ZEICHEN, KARTEN, SZENEN,
    HINTERGRUENDE, ZEICHEN_EFFEKTE, musterSvg,
} from "./thema-daten.js"

const SPEICHER = "grove-laub"
const TABELLE = "gestaltung"
export const dienstHier = document.body?.dataset.dienst || "grove"

// ---------- Zustand ----------
export const laub = {
    einstellungen: {},   // nur Änderungen: { grove: {…}, dienste: { mail: {…} } }
    presets: [],         // eigene Presets: [{ id, name, einstellungen, farben }]
    server: null,        // null = unbekannt, true = Tabelle da, false = nur dieses Gerät
    status: "lokal",
}
const verlauf = []       // für „Rückgängig“


// ==========================================================
// Mischen
// ==========================================================
const istObjekt = (x) => x && typeof x === "object" && !Array.isArray(x)

export function tiefMischen(...quellen) {
    const ziel = {}
    for (const q of quellen) {
        if (!istObjekt(q)) continue
        for (const [k, v] of Object.entries(q)) {
            if (v === undefined || v === null && k in ziel) continue
            ziel[k] = istObjekt(v) ? tiefMischen(ziel[k], v) : v
        }
    }
    return ziel
}

// Was gilt in einem Bereich? bereich = "grove" oder eine Dienst-ID
export function wirksam(bereich = dienstHier, einst = laub.einstellungen) {
    if (bereich === "grove") return tiefMischen(STANDARD, einst.grove)
    return tiefMischen(STANDARD, DIENST_STANDARD[bereich], einst.grove, einst.dienste?.[bereich])
}

// Was würde ein Dienst erben, wenn er selbst nichts ändert? (für „geerbt“ in Laub)
export function geerbt(bereich, einst = laub.einstellungen) {
    if (bereich === "grove") return tiefMischen(STANDARD)
    return tiefMischen(STANDARD, DIENST_STANDARD[bereich], einst.grove)
}

// ==========================================================
// Farben rechnen
// ==========================================================
const hexZuRgb = (h) => { const n = parseInt(String(h).replace("#", "").slice(0, 6), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
const rgbZuHex = (r) => "#" + r.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("").toUpperCase()
export function mischen(a, b, anteilB) {
    const x = hexZuRgb(a), y = hexZuRgb(b)
    return rgbZuHex(x.map((v, i) => v + (y[i] - v) * anteilB))
}
export function leuchtkraft(hex) {   // relative Helligkeit nach WCAG
    const [r, g, b] = hexZuRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function kontrast(a, b) {
    const [x, y] = [leuchtkraft(a), leuchtkraft(b)].sort((m, n) => n - m)
    return (x + 0.05) / (y + 0.05)
}

// Alle Farben inkl. abgeleiteter – als echte Hex-Werte (für Bilder und Leinwände)
export function palette(w) {
    const f = { ...STANDARD.farben, ...w.farben }
    const S = STANDARD.farben
    const gleich = (...k) => k.every((x) => String(f[x]).toUpperCase() === S[x].toUpperCase())
    const dunkel = leuchtkraft(f.ground) < 0.4
    const p = { ...f }
    p["auf-akzent"] = gleich("amber", "ground") ? "#1C1420"
        : [f.ground, f.text, "#FFFFFF", "#141414"].sort((a, b) => kontrast(f.amber, b) - kontrast(f.amber, a))[0]
    p["fehler-hell"] = gleich("fehler") ? "#F2B3A3" : mischen(f.fehler, dunkel ? "#FFFFFF" : "#000000", dunkel ? 0.35 : 0.25)
    p["fehler-tief"] = gleich("fehler") ? "#D66A54" : mischen(f.fehler, "#000000", dunkel ? 0.1 : 0.2)
    p["gut-hell"] = gleich("gut") ? "#CFE8C6" : mischen(f.gut, dunkel ? "#FFFFFF" : "#000000", dunkel ? 0.25 : 0.2)
    p.himmel = gleich("ground-deep") ? "#140E17" : mischen(f["ground-deep"], dunkel ? "#000000" : "#FFFFFF", dunkel ? 0.1 : 0.35)
    p.glanz = gleich("amber-light") ? "#FFE6C2" : mischen(f["amber-light"], "#FFFFFF", dunkel ? 0.55 : 0.75)
    if (gleich("ground", "ground-deep", "surface-hi", "border-hi")) {
        Object.assign(p, { "wald-tief": "#0F0A11", wald: "#2B2030", "wald-mitte": "#211824" })
    } else if (dunkel) {
        p["wald-tief"] = mischen(f["ground-deep"], "#000000", 0.3)
        p.wald = mischen(f["surface-hi"], f["border-hi"], 0.15)
        p["wald-mitte"] = mischen(f.ground, f.surface, 0.5)
    } else {
        p["wald-tief"] = mischen(f.ground, f["text-soft"], 0.55)
        p.wald = mischen(f.ground, f["text-soft"], 0.22)
        p["wald-mitte"] = mischen(f.ground, f["text-soft"], 0.38)
    }
    p.nebel = dunkel ? f["text-soft"] : "#FFFFFF"   // Nebel (Animation 34): hell im dunklen Thema, weiß im hellen
    p.dunkel = dunkel
    return p
}

export const schrift = (id) => SCHRIFTEN.find((s) => s.id === id) || SCHRIFTEN[0]

// CSS-Variablen für einen wirksamen Stand
export function variablen(w, { nurFarben = false } = {}) {
    const p = palette(w)
    const v = {}
    for (const [k, wert] of Object.entries(p)) if (k !== "dunkel") v["--" + k] = wert
    v["--farbschema"] = p.dunkel ? "dark" : "light"
    v["--ecken"] = String(w.form.ecken)
    v["--line"] = `color-mix(in srgb, ${p.amber} 18%, transparent)`
    if (nurFarben) return v
    v["--font-display"] = schrift(w.schrift.titel).familie
    v["--font-body"] = schrift(w.schrift.text).familie
    v["--schrift-faktor"] = String((w.schrift.groesse || 100) / 100)
    v["--korn"] = String((w.flaeche.korn ?? 6) / 100)
    v["--schein-farbe"] = `color-mix(in srgb, ${p["surface-hi"]} ${w.flaeche.schein ?? 100}%, ${p.ground})`
    v["--muster"] = musterSvg(w.flaeche.muster, p.amber, (w.flaeche.musterStaerke ?? 7) / 100)
    v["--muster-groesse"] = (w.flaeche.musterGroesse || 48) + "px"
    v["--symbol-strich"] = String(w.symbole.strich || 1.8)
    v["--atmo-staerke"] = String((w.bewegung.hintergrundStaerke ?? 100) / 100)
    return v
}

export function variablenSetzen(el, vars) {
    for (const [k, wert] of Object.entries(vars)) el.style.setProperty(k, wert)
}

// ==========================================================
// Anwenden auf die Seite
// ==========================================================
export function anwenden() {
    const w = wirksam()
    const root = document.documentElement
    variablenSetzen(root, variablen(w))
    root.dataset.bewegung = w.bewegung.stufe
    root.dataset.eingang = w.bewegung.eingang
    root.dataset.hover = w.bewegung.hover
    root.dataset.enden = w.symbole.enden
    root.toggleAttribute("data-symbole", !!w.symbole.strich)

    schriftenLaden([w.schrift.titel, w.schrift.text])
    tempo = w.bewegung.stufe === "aus" ? 1 : w.bewegung.tempo || 1
    tempoAnwenden()
    seitenwechsel(w)
    if (document.body) seiteAnwenden(w)
    window.dispatchEvent(new CustomEvent("grove-thema", { detail: w }))
}

function seiteAnwenden(w) {
    // Hintergrund-Animation: auf der Lichtung im Hero ([data-atmo]), sonst als Ebene hinter der Seite
    let atmo = document.querySelector("[data-atmo]")
    if (!atmo && !document.body.hasAttribute("data-ohne-atmo")) {
        atmo = document.createElement("div")
        atmo.className = "atmo-seite"
        atmo.setAttribute("data-atmo", "")
        atmo.setAttribute("aria-hidden", "true")
        document.body.prepend(atmo)
    }
    if (atmo) atmoSetzen(atmo, w.bewegung.hintergrund)

    // Zeichen + Logo in der Kopfzeile
    const effekt = ZEICHEN_EFFEKTE.find((e) => e.id === w.bewegung.zeichen)
    document.querySelectorAll("img[data-zeichen], img[data-logo]").forEach((img) => {
        const id = img.hasAttribute("data-logo") ? w.bilder.logo : w.bilder.zeichen
        const z = ZEICHEN.find((x) => x.id === id)
        if (z) bildQuelle(img, z.datei)
        for (const e of ZEICHEN_EFFEKTE) if (e.klasse) img.classList.remove(e.klasse)
        if (effekt?.klasse) img.classList.add(effekt.klasse)
    })

    // „Gestaltung“ im Nutzermenü öffnet Laub gleich für diesen Dienst
    if (DIENST_STANDARD[dienstHier] || dienstHier === "lichtung")
        document.querySelectorAll("a[data-laub-link]").forEach((a) => { a.href = "/dienste/laub/?fuer=" + dienstHier })

    // Szene (Lichtung, 404)
    document.querySelectorAll("img[data-szene]").forEach((img) => {
        const s = SZENEN.find((x) => x.id === w.bilder.szene) || SZENEN[0]
        img.hidden = !s.datei
        if (s.datei) bildQuelle(img, s.datei)
    })

    // Bereiche, die zu einem bestimmten Dienst gehören (z. B. Karten auf der Lichtung)
    document.querySelectorAll("[data-thema-dienst]").forEach(bereichAnwenden)

    // Karten beim Drüberfahren
    document.querySelectorAll(".dienst").forEach(hoverKlasse)

    clearTimeout(faerbeTimer)
    faerbeTimer = setTimeout(() => { einfaerbenAlle(); faviconFaerben() }, ersterLauf ? 0 : 120)
    ersterLauf = false
}
let faerbeTimer = null
let ersterLauf = true

// Ein Element bekommt die Farben/Bilder eines bestimmten Dienstes
export function bereichAnwenden(el) {
    const id = el.dataset.themaDienst
    const w = wirksam(id)
    variablenSetzen(el, variablen(w, { nurFarben: true }))
    el.querySelectorAll("img[data-karte]").forEach((img) => {
        const k = KARTEN.find((x) => x.id === w.bilder.karte)
        if (k) bildQuelle(img, k.datei)
    })
}

function hoverKlasse(el) {
    const h = wirksam(el.dataset.themaDienst || dienstHier).bewegung.hover
    el.classList.toggle("a40", h === "leuchten")
    el.classList.toggle("a41", h === "kippen")
}

// Karten-Bild eines Dienstes (für hauptmenue.js)
export function karteFuer(dienstId, fallback) {
    const k = KARTEN.find((x) => x.id === wirksam(dienstId).bilder.karte)
    return k?.datei || fallback
}
export const zeichenDatei = (id) => ZEICHEN.find((z) => z.id === id)?.datei

// ---------- Hintergrund-Animation ----------
export function atmoSetzen(el, id) {
    if (el.dataset.atmoId === id) return            // nicht neu starten, wenn gleich
    el.dataset.atmoId = id
    const h = HINTERGRUENDE.find((x) => x.id === id) || HINTERGRUENDE[0]
    el.innerHTML = h.html()
}

// ---------- Schriften ----------
const geladeneSchriften = new Set()
export function schriftenLaden(ids) {
    const neu = ids.map(schrift).filter((s) => s.laden && !geladeneSchriften.has(s.id))
    if (!neu.length) return
    neu.forEach((s) => geladeneSchriften.add(s.id))
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://fonts.googleapis.com/css2?" + neu.map((s) => "family=" + s.laden).join("&") + "&display=swap"
    document.head.append(link)
}

// ---------- Tempo ----------
// Alle CSS-Animationen laufen über die Web-Animations-Schnittstelle;
// playbackRate = 2 heißt doppelt so schnell. So braucht keine Animation
// eine eigene Tempo-Einstellung.
let tempo = 1
function tempoAnwenden() {
    if (!document.getAnimations) return
    document.getAnimations().forEach((a) => { if (a.playbackRate !== tempo) a.playbackRate = tempo })
}
document.addEventListener("animationstart", (e) => {
    if (tempo === 1) return
    e.target.getAnimations?.().forEach((a) => { if (a.playbackRate !== tempo) a.playbackRate = tempo })
}, true)

// ---------- Seitenwechsel (View Transitions) ----------
function seitenwechsel(w) {
    let tag = document.getElementById("thema-wechsel")
    const art = w.bewegung.stufe === "aus" ? "keiner" : w.bewegung.seitenwechsel
    if (art === "keiner") { tag?.remove(); return }
    if (!tag) { tag = document.createElement("style"); tag.id = "thema-wechsel"; document.head.append(tag) }
    tag.textContent = "@view-transition { navigation: auto; }" + (art === "gleiten" ? `
        ::view-transition-old(root) { animation: .35s cubic-bezier(.4,0,.2,1) both thema-raus; }
        ::view-transition-new(root) { animation: .45s cubic-bezier(.2,.8,.2,1) both thema-rein; }` : "")
}

// ---------- Begrüßung (Lichtung) ----------
// Setzt Text in ein Element und wendet den gewählten Effekt an.
export function begruessungSetzen(el, text, art = wirksam().bewegung.begruessung) {
    el.className = el.className.replace(/\bgruss--\S+/g, "").trim()
    el.removeAttribute("aria-label")
    const buchstaben = (cls = "") => [...text].map((z, i) => `<span class="${cls}" style="--i:${i}" aria-hidden="true">${esc(z)}</span>`).join("")
    if (art === "schreibmaschine") {
        el.innerHTML = buchstaben() + '<span class="gruss__cursor" aria-hidden="true"></span>'
    } else if (art === "nebel") {
        el.innerHTML = buchstaben()
        el.classList.add("a42")
    } else if (art === "welle") {
        el.innerHTML = buchstaben()
    } else if (art === "worte") {
        el.innerHTML = text.split(" ").map((w, i) => `<span class="gruss__wort" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(" ")
    } else {
        el.textContent = text
    }
    if (el.children.length) el.setAttribute("aria-label", text)
    el.classList.add("gruss--" + art)
}
const esc = (t) => String(t).replace(/[&<>"]/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[z]))

// ---------- 3D-Kippen (Animation 41) ----------
document.addEventListener("pointermove", (e) => {
    const k = e.target.closest?.(".a41")
    if (!k) return
    const r = k.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
    k.style.setProperty("--kx", ((x - 0.5) * 10).toFixed(2) + "deg")
    k.style.setProperty("--ky", ((0.5 - y) * 10).toFixed(2) + "deg")
    k.style.setProperty("--mx", (x * 100).toFixed(1) + "%")
    k.style.setProperty("--my", (y * 100).toFixed(1) + "%")
})
document.addEventListener("pointerout", (e) => {
    const k = e.target.closest?.(".a41")
    if (k && !k.contains(e.relatedTarget)) { k.style.setProperty("--kx", "0deg"); k.style.setProperty("--ky", "0deg") }
})

// ==========================================================
// Bilder einfärben
// Die SVGs sind in den Standardfarben gezeichnet. Für ein anderes Thema
// tauschen wir die Farbwerte im SVG-Text aus und zeigen das Ergebnis
// als „Blob“ (eine Datei, die nur im Arbeitsspeicher existiert).
// ==========================================================
const ORIGINAL = {
    "#E3A15A": "amber", "#F2C08A": "amber-light", "#1C1420": "ground", "#160F19": "ground-deep",
    "#241A27": "surface", "#2A1F2C": "surface-hi", "#2E2231": "border", "#3A2C3D": "border-hi",
    "#EFE6D6": "text", "#CDBFAE": "text-soft", "#A8957F": "muted", "#C9A7D1": "flieder",
    "#0F0A11": "wald-tief", "#2B2030": "wald", "#211824": "wald-mitte", "#BFE3B4": "gut", "#E8907E": "fehler",
}
const texte = new Map()     // Datei → SVG-Text
const blobs = new Map()     // Datei + Farben → Blob-Adresse

const istSvgBild = (pfad) => typeof pfad === "string" && pfad.startsWith("/bilder/") && pfad.endsWith(".svg")

// Neue Quelle setzen (merkt sich das Original für das Einfärben)
export function bildQuelle(img, pfad) {
    if (img.dataset.orig === pfad && img.dataset.gefaerbt) { einfaerben(img); return }
    img.dataset.orig = pfad
    delete img.dataset.gefaerbt
    einfaerben(img)
}

function einfaerbenAlle() {
    document.querySelectorAll("img").forEach((img) => {
        if (!img.dataset.orig) {
            const src = img.getAttribute("src")
            if (!istSvgBild(src)) return
            img.dataset.orig = src
        }
        einfaerben(img)
    })
}

export async function einfaerben(img) {
    const orig = img.dataset.orig
    if (!istSvgBild(orig)) return
    const bereich = img.closest("[data-thema-dienst]")?.dataset.themaDienst || img.closest("[data-thema-vorschau]")?.dataset.themaVorschau || dienstHier
    const w = wirksam(bereich)
    const p = palette(w)
    const zuordnung = {}
    let anders = false
    for (const [hex, name] of Object.entries(ORIGINAL)) {
        zuordnung[hex] = p[name]
        if (p[name].toUpperCase() !== hex) anders = true
    }
    if (!w.bilder.einfaerben || !anders) { setzeSrc(img, orig); return }
    const schluessel = orig + JSON.stringify(zuordnung)
    let url = blobs.get(schluessel)
    if (!url) {
        let text = texte.get(orig)
        if (text === undefined) {
            try {
                text = await (await fetch(orig)).text()
                text = text.replace(/<metadata>[\s\S]*?<\/metadata>/, "")
            } catch { text = null }
            texte.set(orig, text)
        }
        if (!text) { setzeSrc(img, orig); return }
        const neu = text.replace(/#[0-9a-fA-F]{6}\b/g, (h) => zuordnung[h.toUpperCase()] || h)
        url = URL.createObjectURL(new Blob([neu], { type: "image/svg+xml" }))
        blobs.set(schluessel, url)
        if (blobs.size > 150) {                 // älteste wieder freigeben (Arbeitsspeicher)
            const [alt, altUrl] = blobs.entries().next().value
            blobs.delete(alt); URL.revokeObjectURL(altUrl)
        }
    }
    if (img.dataset.orig === orig) setzeSrc(img, url)   // inzwischen nicht umgestellt?
}
function setzeSrc(img, url) {
    img.dataset.gefaerbt = url
    if (img.getAttribute("src") !== url) img.setAttribute("src", url)
}

// Neue Bilder (z. B. Karten, die ein Script baut) automatisch mitnehmen
new MutationObserver((liste) => {
    for (const m of liste) {
        if (m.type === "attributes") {
            const img = m.target
            const src = img.getAttribute("src")
            if (src !== img.dataset.gefaerbt && istSvgBild(src)) { img.dataset.orig = src; einfaerben(img) }
            continue
        }
        for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue
            if (n.matches("[data-thema-dienst]")) bereichAnwenden(n)
            n.querySelectorAll?.("[data-thema-dienst]").forEach(bereichAnwenden)
            if (n.matches(".dienst")) hoverKlasse(n)
            n.querySelectorAll?.(".dienst").forEach(hoverKlasse)
            const bilder = n.tagName === "IMG" ? [n] : n.querySelectorAll?.("img") || []
            bilder.forEach((img) => {
                const src = img.dataset.orig || img.getAttribute("src")
                if (istSvgBild(src)) { img.dataset.orig = src; einfaerben(img) }
            })
        }
    }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] })

async function faviconFaerben() {
    const link = document.querySelector('link[rel="icon"]')
    if (!link) return
    if (!link.dataset.orig) link.dataset.orig = link.getAttribute("href")
    const probe = new Image()
    probe.dataset.orig = link.dataset.orig
    await einfaerben(probe)
    if (probe.getAttribute("src")) link.href = probe.getAttribute("src")
}

// ==========================================================
// Ändern, Speichern, Laden
// ==========================================================
function leereEntfernen(o) {
    for (const k of Object.keys(o)) {
        if (istObjekt(o[k])) { leereEntfernen(o[k]); if (!Object.keys(o[k]).length) delete o[k] }
        else if (o[k] === undefined) delete o[k]
    }
    return o
}

// Neue Einstellungen übernehmen (anwenden + speichern)
let letzteAenderung = 0
export function setzen(einstellungen, { merken = true } = {}) {
    // Änderungen kurz hintereinander (Regler ziehen) = ein Rückgängig-Schritt
    if (merken && Date.now() - letzteAenderung > 800) {
        verlauf.push(JSON.stringify(laub.einstellungen))
        if (verlauf.length > 60) verlauf.shift()
    }
    letzteAenderung = merken ? Date.now() : 0
    laub.einstellungen = leereEntfernen(structuredClone(einstellungen))
    lokalSchreiben()
    anwenden()
    serverPlanen()
}

// Bequem: aendern((e) => { e.grove.farben.amber = "#…" }) – fehlende Ebenen werden angelegt
export function aendern(fn, optionen) {
    const e = structuredClone(laub.einstellungen)
    e.grove ??= {}
    e.dienste ??= {}
    fn(e)
    setzen(e, optionen)
}

// Pfad in einem Bereich setzen oder (wert = undefined) zurücksetzen
export function wertSetzen(bereich, pfad, wert, optionen) {
    aendern((e) => {
        let o = bereich === "grove" ? e.grove : (e.dienste[bereich] ??= {})
        const teile = pfad.split(".")
        const letzter = teile.pop()
        for (const t of teile) o = (o[t] ??= {})
        if (wert === undefined) delete o[letzter]
        else o[letzter] = wert
    }, optionen)
}

// Hat ein Bereich an dieser Stelle selbst etwas eingestellt?
export function eigenerWert(bereich, pfad) {
    let o = bereich === "grove" ? laub.einstellungen.grove : laub.einstellungen.dienste?.[bereich]
    for (const t of pfad.split(".")) { if (!istObjekt(o)) return undefined; o = o[t] }
    return o
}

export function bereichZuruecksetzen(bereich) {
    aendern((e) => { if (bereich === "grove") e.grove = {}; else delete e.dienste[bereich] })
}
export function allesZuruecksetzen() { setzen({}) }

export function rueckgaengig() {
    if (!verlauf.length) return false
    setzen(JSON.parse(verlauf.pop()), { merken: false })
    return true
}
export const kannRueckgaengig = () => verlauf.length > 0

// ---------- eigene Presets ----------
export function presetSpeichern(name) {
    const preset = {
        id: crypto.randomUUID(), name: name.trim() || "Mein Preset",
        einstellungen: structuredClone(laub.einstellungen),
        erstellt: new Date().toISOString(),
    }
    laub.presets = [preset, ...laub.presets]
    lokalSchreiben(); serverPlanen(); melden()
    return preset
}
export function presetHinzufuegen(name, einstellungen) {
    const preset = { id: crypto.randomUUID(), name: name.trim() || "Geteiltes Preset", einstellungen: structuredClone(einstellungen), erstellt: new Date().toISOString() }
    laub.presets = [preset, ...laub.presets]
    lokalSchreiben(); serverPlanen(); melden()
    return preset
}
export function presetUeberschreiben(id) {
    laub.presets = laub.presets.map((p) => p.id === id ? { ...p, einstellungen: structuredClone(laub.einstellungen) } : p)
    lokalSchreiben(); serverPlanen(); melden()
}
export function presetLoeschen(id) {
    laub.presets = laub.presets.filter((p) => p.id !== id)
    lokalSchreiben(); serverPlanen(); melden()
}
export function presetUmbenennen(id, name) {
    laub.presets = laub.presets.map((p) => p.id === id ? { ...p, name: name.trim() || p.name } : p)
    lokalSchreiben(); serverPlanen(); melden()
}

// Preset als Text zum Teilen: "GROVE-LAUB:" + Base64(JSON)
export function presetCode(einstellungen, name = "") {
    const json = JSON.stringify({ n: name, e: einstellungen })
    return "GROVE-LAUB:" + btoa(String.fromCharCode(...new TextEncoder().encode(json)))
}
export function presetAusCode(code) {
    const roh = String(code).trim().replace(/^GROVE-LAUB:/, "")
    const bytes = Uint8Array.from(atob(roh), (z) => z.charCodeAt(0))
    const daten = JSON.parse(new TextDecoder().decode(bytes))
    if (!istObjekt(daten?.e)) throw new Error("Kein gültiger Preset-Code")
    return { name: daten.n || "Geteiltes Preset", einstellungen: daten.e }
}

// ---------- Browser-Speicher ----------
function lokalLesen() {
    try {
        const d = JSON.parse(localStorage.getItem(SPEICHER) || "{}")
        laub.einstellungen = istObjekt(d.einstellungen) ? d.einstellungen : {}
        laub.presets = Array.isArray(d.presets) ? d.presets : []
    } catch { /* kein Speicher (z. B. privates Fenster) – dann eben Standard */ }
}
function lokalSchreiben() {
    try {
        localStorage.setItem(SPEICHER, JSON.stringify({ einstellungen: laub.einstellungen, presets: laub.presets, geaendert: Date.now() }))
    } catch { /* egal */ }
}

// ---------- Supabase ----------
function melden(status) {
    if (status) laub.status = status
    window.dispatchEvent(new CustomEvent("grove-laub", { detail: { status: laub.status } }))
}

async function serverLaden() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const { data, error } = await supabase.from(TABELLE).select("einstellungen, presets").maybeSingle()
        if (error) { laub.server = false; melden("lokal"); return }
        laub.server = true
        if (data) {
            const vorher = JSON.stringify([laub.einstellungen, laub.presets])
            laub.einstellungen = istObjekt(data.einstellungen) ? data.einstellungen : {}
            laub.presets = Array.isArray(data.presets) ? data.presets : []
            lokalSchreiben()
            if (vorher !== JSON.stringify([laub.einstellungen, laub.presets])) anwenden()
            melden("gespeichert")
        } else if (Object.keys(laub.einstellungen).length || laub.presets.length) {
            serverSpeichern()          // erstes Mal: was im Browser liegt, hochladen
        } else melden("gespeichert")
    } catch { laub.server = false; melden("lokal") }
}

let speicherTimer = null
function serverPlanen() {
    if (laub.server === false) { melden("lokal"); return }
    melden("speichert")
    clearTimeout(speicherTimer)
    speicherTimer = setTimeout(serverSpeichern, 700)
}
async function serverSpeichern() {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { melden("lokal"); return }
        const { error } = await supabase.from(TABELLE).upsert({
            user_id: session.user.id,
            einstellungen: laub.einstellungen,
            presets: laub.presets,
            geaendert_am: new Date().toISOString(),
        })
        if (error) { laub.server = false; melden("lokal"); return }
        laub.server = true
        melden("gespeichert")
    } catch { melden("fehler") }
}

// ==========================================================
// Start (am Ende, damit alle Hilfsfunktionen oben schon bereitstehen)
// ==========================================================
lokalLesen()
anwenden()
serverLaden()
window.addEventListener("storage", (e) => {   // anderer Tab hat etwas geändert
    if (e.key === SPEICHER) { lokalLesen(); anwenden() }
})
