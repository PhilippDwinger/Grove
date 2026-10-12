// ==========================================================
// Mühle · Bilder (PNG, JPG, WebP, AVIF, GIF, BMP, SVG, ICO → …)
// Über das Canvas des Browsers – keine extra Bibliothek.
// Nebenbei: Kamera-/GPS-Daten (EXIF) fallen dabei immer weg.
// ==========================================================
import { istTyp, neuerName } from "../hilfen.js"

const EINGANG = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".svg", ".ico", ".heic", ".heif", ".tif", ".tiff"]

const GROESSE = { id: "breite", name: "Breite", art: "zahl", standard: 0, min: 0, max: 8000, schritt: 10, einheit: "px", hilfe: "0 = Originalgröße. Höhe passt sich an." }
const DREHEN = { id: "drehen", name: "Drehen", art: "wahl", standard: "0", werte: [["0", "nicht"], ["90", "90° rechts"], ["180", "180°"], ["270", "90° links"]] }
const SPIEGELN = { id: "spiegeln", name: "Spiegeln", art: "schalter", standard: false }
const QUALITAET = { id: "qualitaet", name: "Qualität", art: "regler", standard: 85, min: 10, max: 100, schritt: 5, einheit: "%", hilfe: "Weniger = kleinere Datei." }
const HINTERGRUND = { id: "hintergrund", name: "Transparente Stellen", art: "wahl", standard: "#FFFFFF", werte: [["#FFFFFF", "weiß"], ["#000000", "schwarz"], ["#1C1420", "Grove-Dunkel"]], hilfe: "JPG kann keine Transparenz." }
const ALLGEMEIN = [GROESSE, DREHEN, SPIEGELN]

// Kann dieser Browser AVIF schreiben? (Chrome liest AVIF, schreibt es aber nicht)
let avifGeht = null
function avifPruefen() {
    avifGeht ??= new Promise((ok) => {
        const c = document.createElement("canvas")
        c.width = c.height = 2
        c.toBlob((b) => ok(b?.type === "image/avif"), "image/avif")
    })
    return avifGeht
}

export default {
    id: "bild",
    name: "Bilder",
    passt: (d) => istTyp(d, "image/", EINGANG),
    async analysieren() { return { avif: await avifPruefen() } },
    ziele: (info) => ZIELE.filter((z) => z.id !== "avif" || info?.avif),
    async umwandeln(datei, ziel, o) { return umwandeln(datei, ziel, o) },
}

const ZIELE = [
    { id: "png", name: "PNG", endung: ".png", mime: "image/png", text: "verlustfrei, mit Transparenz", optionen: [...ALLGEMEIN] },
    { id: "jpg", name: "JPG", endung: ".jpg", mime: "image/jpeg", text: "klein, für Fotos", optionen: [...ALLGEMEIN, QUALITAET, HINTERGRUND] },
    { id: "webp", name: "WebP", endung: ".webp", mime: "image/webp", text: "klein, fürs Web, mit Transparenz", optionen: [...ALLGEMEIN, QUALITAET] },
    { id: "avif", name: "AVIF", endung: ".avif", mime: "image/avif", text: "am kleinsten (neuere Browser)", optionen: [...ALLGEMEIN, QUALITAET] },
    { id: "ico", name: "ICO", endung: ".ico", text: "Symbol für Windows & Webseiten", optionen: [
        { id: "groessen", name: "Größen", art: "wahl", standard: "16,32,48,256", werte: [["16,32,48,256", "16 – 256 (empfohlen)"], ["16,32", "16 + 32 (Favicon)"], ["256", "nur 256"]] }, DREHEN] },
    { id: "pdf", name: "PDF", endung: ".pdf", text: "Bild als PDF-Seite", optionen: [
        { id: "seite", name: "Seite", art: "wahl", standard: "bild", werte: [["bild", "so groß wie das Bild"], ["a4", "A4"]] }, DREHEN] },
]

async function umwandeln(datei, ziel, o) {
    // JPG kann keine Transparenz – und im PDF steckt das Bild auch als JPG (sonst würden durchsichtige Stellen schwarz)
    const hintergrund = ziel.id === "jpg" ? o.hintergrund : ziel.id === "pdf" ? "#FFFFFF" : null
    let canvas = await zeichnen(datei, o, hintergrund)
    if (ziel.id === "ico") return [{ name: neuerName(datei.name, ".ico"), blob: await ico(canvas, o.groessen) }]
    if (ziel.id === "pdf") return [{ name: neuerName(datei.name, ".pdf"), blob: await alsPdf(canvas, o.seite) }]
    const blob = await kodieren(canvas, ziel.mime, (o.qualitaet ?? 92) / 100)
    if (blob.type !== ziel.mime) throw new Error(`Dein Browser kann kein ${ziel.name} schreiben. Probier WebP oder PNG.`)
    return [{ name: neuerName(datei.name, ziel.endung), blob }]
}

// ---------- Bild laden, drehen, skalieren ----------
const istSvg = (d) => /svg/.test(d.type) || d.name.toLowerCase().endsWith(".svg")

// SVGs ohne width/height zeichnet der Browser nur 150 px groß → feste Größe aus der viewBox setzen
async function svgMitGroesse(datei) {
    const text = await datei.text()
    const kopf = text.match(/<svg\b[^>]*>/i)?.[0]
    if (!kopf || /\swidth\s*=/.test(kopf)) return datei
    const vb = kopf.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1]?.split(/[\s,]+/).map(Number)
    const verh = vb && vb[2] > 0 && vb[3] > 0 ? vb[3] / vb[2] : 1
    const neu = kopf.replace(/<svg\b/i, `<svg width="1024" height="${Math.round(1024 * verh)}"`)
    return new Blob([text.replace(kopf, neu)], { type: "image/svg+xml" })
}

async function laden(datei) {
    const name = datei.name
    try {
        if (!istSvg(datei)) return await createImageBitmap(datei)
    } catch { /* weiter mit <img> */ }
    if (istSvg(datei)) datei = await svgMitGroesse(datei)
    const url = URL.createObjectURL(datei)
    try {
        const img = new Image()
        img.decoding = "async"
        img.src = url
        await img.decode()
        // SVG ohne feste Größe: sinnvoll groß zeichnen
        if (!img.naturalWidth) { img.width = 1024; img.height = 1024 }
        return img
    } catch {
        const art = name.split(".").pop().toUpperCase()
        throw new Error(`${art} kann dieser Browser nicht öffnen${/HEI[CF]/.test(art) ? " (Safari am iPhone/Mac schon)" : ""}.`)
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}

export async function zeichnen(datei, o = {}, hintergrund = null) {
    const bild = await laden(datei)
    const bw = bild.naturalWidth || bild.width, bh = bild.naturalHeight || bild.height
    // nurKleiner: Bilder, die schon schmaler sind, nicht hochrechnen (z. B. „Bilder verkleinern auf“)
    const ziel = o.breite > 0 && !(o.nurKleiner && o.breite >= bw) ? o.breite : bw
    const f = ziel / bw
    const w = Math.max(1, Math.round(bw * f)), h = Math.max(1, Math.round(bh * f))
    const quer = o.drehen === "90" || o.drehen === "270"
    const c = document.createElement("canvas")
    c.width = quer ? h : w
    c.height = quer ? w : h
    const g = c.getContext("2d")
    if (hintergrund) { g.fillStyle = hintergrund; g.fillRect(0, 0, c.width, c.height) }
    g.imageSmoothingQuality = "high"
    g.translate(c.width / 2, c.height / 2)
    g.rotate((+o.drehen || 0) * Math.PI / 180)
    if (o.spiegeln) g.scale(-1, 1)
    g.drawImage(bild, -w / 2, -h / 2, w, h)
    bild.close?.()
    return c
}

export const kodieren = (canvas, mime, qualitaet) => new Promise((ok, fehler) =>
    canvas.toBlob((b) => (b ? ok(b) : fehler(new Error("Bild ließ sich nicht schreiben"))), mime, qualitaet))

// ICO = kleine Kopfzeile + mehrere PNG-Bilder (wird von Windows & Browsern verstanden)
async function ico(canvas, groessenText) {
    const groessen = String(groessenText).split(",").map(Number)
    const bilder = []
    for (const s of groessen) {
        const c = document.createElement("canvas")
        c.width = c.height = s
        const g = c.getContext("2d")
        g.imageSmoothingQuality = "high"
        const f = Math.min(s / canvas.width, s / canvas.height)
        const w = canvas.width * f, h = canvas.height * f
        g.drawImage(canvas, (s - w) / 2, (s - h) / 2, w, h)
        bilder.push({ s, daten: new Uint8Array(await (await kodieren(c, "image/png")).arrayBuffer()) })
    }
    const kopf = 6 + 16 * bilder.length
    const gesamt = kopf + bilder.reduce((n, b) => n + b.daten.length, 0)
    const buf = new Uint8Array(gesamt)
    const v = new DataView(buf.buffer)
    v.setUint16(2, 1, true)                 // Typ: Icon
    v.setUint16(4, bilder.length, true)
    let pos = kopf
    bilder.forEach((b, i) => {
        const e = 6 + 16 * i
        buf[e] = b.s >= 256 ? 0 : b.s
        buf[e + 1] = b.s >= 256 ? 0 : b.s
        v.setUint16(e + 4, 1, true)            // Farbebenen
        v.setUint16(e + 6, 32, true)           // Bit pro Pixel
        v.setUint32(e + 8, b.daten.length, true)
        v.setUint32(e + 12, pos, true)
        buf.set(b.daten, pos)
        pos += b.daten.length
    })
    return new Blob([buf], { type: "image/x-icon" })
}

// Ein Bild als PDF-Seite (pdf-lib wird erst jetzt geladen)
export async function alsPdf(canvas, seite = "bild", doc = null) {
    const { PDFDocument } = await import("pdf-lib")
    const pdf = doc || (await PDFDocument.create())
    const jpg = await pdf.embedJpg(new Uint8Array(await (await kodieren(canvas, "image/jpeg", 0.92)).arrayBuffer()))
    if (seite === "a4") {
        const [W, H] = [595.28, 841.89], rand = 36
        const f = Math.min((W - 2 * rand) / jpg.width, (H - 2 * rand) / jpg.height, 1)
        const p = pdf.addPage([W, H])
        p.drawImage(jpg, { x: (W - jpg.width * f) / 2, y: (H - jpg.height * f) / 2, width: jpg.width * f, height: jpg.height * f })
    } else {
        // 1 px = 0,75 pt (96 dpi)
        const p = pdf.addPage([jpg.width * 0.75, jpg.height * 0.75])
        p.drawImage(jpg, { x: 0, y: 0, width: jpg.width * 0.75, height: jpg.height * 0.75 })
    }
    if (doc) return doc
    return new Blob([await pdf.save()], { type: "application/pdf" })
}
