// ==========================================================
// Mühle · Dokumente (Markdown, Text, HTML, Word → PDF, Word, HTML, Markdown, Text)
// Myzel-Notizen kommen als .md-Datei hier an.
// ==========================================================
import { istTyp, neuerName, stamm } from "../hilfen.js"
import { zuMarkdown, linksAufloesen, lexen, zuText, hatTitel, DOKU_OPTIONEN, SEITEN_OPTIONEN, heute } from "../dokument/markdown.js"

const EINGANG = [".md", ".markdown", ".txt", ".text", ".html", ".htm", ".docx"]

export default {
    id: "dokument",
    name: "Dokumente",
    passt: (d) => istTyp(d, "text/markdown", EINGANG),
    ziele: [
        { id: "pdf", name: "PDF", endung: ".pdf", text: "zum Drucken & Verschicken", optionen: [...DOKU_OPTIONEN, ...SEITEN_OPTIONEN] },
        { id: "docx", name: "Word", endung: ".docx", text: "weiter bearbeiten in Word / LibreOffice", optionen: [...DOKU_OPTIONEN, ...SEITEN_OPTIONEN] },
        { id: "html", name: "HTML", endung: ".html", text: "Webseite, öffnet in jedem Browser", optionen: [...DOKU_OPTIONEN, SEITEN_OPTIONEN[1]] },
        { id: "md", name: "Markdown", endung: ".md", text: "einfacher Text mit Formatierung", optionen: [DOKU_OPTIONEN[3], DOKU_OPTIONEN[4]] },
        { id: "txt", name: "Text", endung: ".txt", text: "nur der Text, ohne Formatierung", optionen: [DOKU_OPTIONEN[3], DOKU_OPTIONEN[4]] },
    ],
    async umwandeln(datei, ziel, o, { fortschritt }) {
        fortschritt?.(0.1, "Lese Dokument …")
        const md = linksAufloesen(await zuMarkdown(datei))
        const titel = stamm(datei.name)
        const tokens = await lexen(md)
        const name = neuerName(datei.name, ziel.endung)
        fortschritt?.(0.4, `Schreibe ${ziel.name} …`)
        if (ziel.id === "pdf") {
            const { mdZuPdf } = await import("../dokument/pdf.js")
            return [{ name, blob: await mdZuPdf(tokens, o, titel) }]
        }
        if (ziel.id === "docx") {
            const { mdZuDocx } = await import("../dokument/docx.js")
            return [{ name, blob: await mdZuDocx(tokens, o, titel) }]
        }
        if (ziel.id === "html") {
            const { mdZuHtml } = await import("../dokument/html.js")
            return [{ name, blob: new Blob([await mdZuHtml(md, tokens, o, titel)], { type: "text/html" }) }]
        }
        const mitTitel = o.titel && !hatTitel(tokens)
        const datum = o.datum ? heute() : ""
        if (ziel.id === "md") {
            const kopf = (mitTitel ? `# ${titel}\n\n` : "") + (datum ? `*${datum}*\n\n` : "")
            return [{ name, blob: new Blob([kopf + md.trim() + "\n"], { type: "text/markdown" }) }]
        }
        const kopf = (mitTitel ? `${titel}\n${"=".repeat(Math.min(60, titel.length))}\n` : "") + (datum ? `${datum}\n` : "") + (mitTitel || datum ? "\n" : "")
        return [{ name, blob: new Blob([kopf + zuText(tokens).trim() + "\n"], { type: "text/plain" }) }]
    },
}
