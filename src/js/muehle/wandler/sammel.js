// ==========================================================
// Mühle · Sammel-Wandler: nehmen ALLE gewählten Dateien zusammen (mehrere: true)
// ==========================================================
import { istTyp, stamm } from "../hilfen.js"
import bild, { zeichnen, alsPdf } from "./bild.js"

const istPdf = (d) => istTyp(d, "application/pdf", [".pdf"])
const heute = () => new Date().toISOString().slice(0, 10)

export const bilderZuPdf = {
    id: "bilder-pdf",
    name: "Alle zusammen",
    mehrere: true,
    passt: (dateien) => dateien.length > 1 && dateien.every((d) => bild.passt(d)),
    ziele: [{ id: "pdf", name: "Ein PDF", endung: ".pdf", text: "alle Bilder hintereinander, eine Seite je Bild", optionen: [
        { id: "seite", name: "Seite", art: "wahl", standard: "a4", werte: [["a4", "A4"], ["bild", "so groß wie das Bild"]] },
        { id: "breite", name: "Bilder verkleinern auf", art: "zahl", standard: 2000, min: 0, max: 8000, schritt: 100, einheit: "px", hilfe: "0 = Originalgröße (große Datei)" }] }],
    async umwandeln(dateien, ziel, o, { fortschritt }) {
        const { PDFDocument } = await import("pdf-lib")
        const doc = await PDFDocument.create()
        for (const [i, d] of dateien.entries()) {
            fortschritt?.(i / dateien.length, `Bild ${i + 1} von ${dateien.length} …`)
            await alsPdf(await zeichnen(d, { breite: o.breite, nurKleiner: true }, "#FFFFFF"), o.seite, doc)
        }
        return [{ name: `${stamm(dateien[0].name)} und ${dateien.length - 1} weitere.pdf`, blob: new Blob([await doc.save()], { type: "application/pdf" }) }]
    },
}

export const pdfsZusammen = {
    id: "pdfs-zusammen",
    name: "Alle zusammen",
    mehrere: true,
    passt: (dateien) => dateien.length > 1 && dateien.every(istPdf),
    ziele: [{ id: "pdf", name: "Ein PDF", endung: ".pdf", text: "alle PDFs hintereinander (Reihenfolge wie oben)", optionen: [] }],
    async umwandeln(dateien, ziel, o, { fortschritt }) {
        const { PDFDocument } = await import("pdf-lib")
        const neu = await PDFDocument.create()
        for (const [i, d] of dateien.entries()) {
            fortschritt?.(i / dateien.length, `${d.name} …`)
            const quelle = await PDFDocument.load(await d.arrayBuffer(), { ignoreEncryption: true })
            for (const s of await neu.copyPages(quelle, quelle.getPageIndices())) neu.addPage(s)
        }
        return [{ name: `${stamm(dateien[0].name)} (zusammengefügt).pdf`, blob: new Blob([await neu.save()], { type: "application/pdf" }) }]
    },
}

export const alsZip = {
    id: "zip",
    name: "Alle zusammen",
    mehrere: true,
    passt: (dateien) => dateien.length > 0,
    ziele: [{ id: "zip", name: "ZIP", endung: ".zip", text: "alles in ein Archiv packen", optionen: [
        { id: "stufe", name: "Packen", art: "wahl", standard: "6", werte: [["0", "nur zusammenfassen (schnell)"], ["6", "normal"], ["9", "möglichst klein (langsam)"]] }] }],
    async umwandeln(dateien, ziel, o, { fortschritt }) {
        const { zipSync } = await import("fflate")
        const inhalt = {}
        const namen = new Set()
        for (const [i, d] of dateien.entries()) {
            fortschritt?.(i / dateien.length, `Packe ${d.name} …`)
            let n = d.name, z = 2
            while (namen.has(n.toLowerCase())) n = `${stamm(d.name)} (${z++})${d.name.slice(stamm(d.name).length)}`
            namen.add(n.toLowerCase())
            inhalt[n] = [new Uint8Array(await d.arrayBuffer()), { level: +o.stufe }]
        }
        const name = dateien.length === 1 ? `${stamm(dateien[0].name)}.zip` : `Grove-Paket ${heute()}.zip`
        return [{ name, blob: new Blob([zipSync(inhalt)], { type: "application/zip" }) }]
    },
}
