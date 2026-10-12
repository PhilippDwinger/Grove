// ==========================================================
// Mühle · PDF hinein (→ Bilder je Seite, Text, PDF mit ausgewählten Seiten)
// pdf.js (von Mozilla) liest, pdf-lib schreibt. Beides lädt erst bei Bedarf.
// ==========================================================
import { istTyp, neuerName, stamm, bereichLesen } from "../hilfen.js"

const SEITEN = { id: "seiten", name: "Seiten", art: "text", standard: "alle", hilfe: "z. B. 1-3, 5, 8- (leer oder „alle“ = alle Seiten)" }
const AUFLOESUNG = { id: "aufloesung", name: "Auflösung", art: "wahl", standard: "2", werte: [["1", "normal (72 dpi)"], ["2", "scharf (144 dpi)"], ["3", "sehr scharf (216 dpi)"]] }

let pdfjs = null
async function lesen(datei) {
    if (!pdfjs) {
        // „legacy“-Fassung: bringt Ersatz für ganz neue JavaScript-Funktionen mit,
        // die viele Browser noch nicht kennen (die normale Fassung bricht dort ab)
        pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
        const { default: worker } = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")
        pdfjs.GlobalWorkerOptions.workerSrc = worker
    }
    // Gibt das Dokument zurück; aufräumen mit doc.__aufgabe.destroy()
    const aufgabe = pdfjs.getDocument({ data: new Uint8Array(await datei.arrayBuffer()), isEvalSupported: false })
    const doc = await aufgabe.promise
    doc.__aufgabe = aufgabe
    return doc
}
const schliessen = (doc) => doc?.__aufgabe?.destroy?.()

export default {
    id: "pdf",
    name: "PDF-Dateien",
    passt: (d) => istTyp(d, "application/pdf", [".pdf"]),
    async analysieren(datei) {
        const doc = await lesen(datei)
        const info = { seiten: doc.numPages }
        schliessen(doc)
        return info
    },
    ziele: (info) => [
        { id: "png", name: "PNG-Bilder", endung: ".png", text: `jede Seite ein Bild${info?.seiten ? ` (${info.seiten} Seiten)` : ""}`, optionen: [SEITEN, AUFLOESUNG] },
        { id: "jpg", name: "JPG-Bilder", endung: ".jpg", text: "jede Seite ein Foto, kleiner", optionen: [SEITEN, AUFLOESUNG] },
        { id: "txt", name: "Text", endung: ".txt", text: "den Text herausziehen", optionen: [SEITEN] },
        { id: "auszug", name: "PDF (Auszug)", endung: ".pdf", text: "nur bestimmte Seiten, auch umsortiert", optionen: [
            { ...SEITEN, standard: "", hilfe: "Reihenfolge zählt: „3, 1-2“ setzt Seite 3 nach vorn." },
            { id: "drehen", name: "Drehen", art: "wahl", standard: "0", werte: [["0", "nicht"], ["90", "90° rechts"], ["180", "180°"], ["270", "90° links"]] }] },
    ],
    async umwandeln(datei, ziel, o, { fortschritt }) {
        if (ziel.id === "auszug") return [{ name: neuerName(datei.name, ".pdf", " (Auszug)"), blob: await auszug(datei, o) }]
        const doc = await lesen(datei)
        try {
            const seiten = bereichLesen(o.seiten, doc.numPages)
            if (!seiten.length) throw new Error("Keine gültigen Seiten gewählt.")
            if (ziel.id === "txt") {
                const teile = []
                for (const [i, nr] of seiten.entries()) {
                    fortschritt?.(i / seiten.length, `Seite ${nr + 1} …`)
                    const inhalt = await (await doc.getPage(nr + 1)).getTextContent()
                    let text = ""
                    for (const s of inhalt.items) text += s.str + (s.hasEOL ? "\n" : "")
                    teile.push(seiten.length > 1 ? `— Seite ${nr + 1} —\n${text.trim()}` : text.trim())
                }
                return [{ name: neuerName(datei.name, ".txt"), blob: new Blob([teile.join("\n\n") + "\n"], { type: "text/plain" }) }]
            }
            const raus = []
            const mime = ziel.id === "jpg" ? "image/jpeg" : "image/png"
            for (const [i, nr] of seiten.entries()) {
                fortschritt?.(i / seiten.length, `Seite ${nr + 1} von ${doc.numPages} …`)
                const seite = await doc.getPage(nr + 1)
                const vp = seite.getViewport({ scale: +o.aufloesung || 2 })
                const c = document.createElement("canvas")
                c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height)
                const g = c.getContext("2d")
                g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, c.width, c.height)        // PDFs sind „weißes Papier“
                await seite.render({ canvasContext: g, canvas: c, viewport: vp }).promise
                const blob = await new Promise((ok) => c.toBlob(ok, mime, 0.9))
                const nummer = String(nr + 1).padStart(String(doc.numPages).length, "0")
                raus.push({ name: seiten.length > 1 ? `${stamm(datei.name)} - Seite ${nummer}${ziel.endung}` : neuerName(datei.name, ziel.endung), blob })
            }
            return raus
        } finally { schliessen(doc) }
    },
}

async function auszug(datei, o) {
    const { PDFDocument, degrees } = await import("pdf-lib")
    const quelle = await PDFDocument.load(await datei.arrayBuffer(), { ignoreEncryption: true })
    const n = quelle.getPageCount()
    // Reihenfolge so, wie eingetippt (nicht sortiert)
    const t = String(o.seiten || "").trim()
    const folge = !t || /^alle$/i.test(t) ? [...Array(n).keys()]
        : t.split(/[,;\s]+/).filter(Boolean).flatMap((teil) => bereichLesen(teil, n))
    if (!folge.length) throw new Error("Keine gültigen Seiten gewählt.")
    const neu = await PDFDocument.create()
    const kopien = await neu.copyPages(quelle, folge)
    for (const s of kopien) {
        if (+o.drehen) s.setRotation(degrees((s.getRotation().angle + +o.drehen) % 360))
        neu.addPage(s)
    }
    return new Blob([await neu.save()], { type: "application/pdf" })
}
