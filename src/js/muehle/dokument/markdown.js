// ==========================================================
// Mühle · Dokumente: alles wird erst zu Markdown, dann ins Zielformat.
// So braucht jedes Ziel (PDF, Word, HTML …) nur EINEN Weg: Markdown → Ziel.
// ==========================================================
import { endung, alsText as textLesen } from "../hilfen.js"

// Datei → Markdown-Text
export async function zuMarkdown(datei) {
    const e = endung(datei.name)
    if (e === ".docx") {
        const mammoth = await import("mammoth")
        const { value: html } = await (mammoth.default ?? mammoth).convertToHtml({ arrayBuffer: await datei.arrayBuffer() })
        return htmlZuMarkdown(html)
    }
    if (e === ".html" || e === ".htm" || datei.type === "text/html") return htmlZuMarkdown(await textLesen(datei))
    return textLesen(datei)
}

async function htmlZuMarkdown(html) {
    const { default: Turndown } = await import("turndown")
    const t = new Turndown({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" })
    t.remove(["script", "style", "head", "title"])
    // Turndown setzt "-   Punkt" bzw. "1.  Punkt" – aufräumen zu "- Punkt" / "1. Punkt"
    return t.turndown(html).replace(/^(\s*)([-*]|\d+\.)\s{2,}/gm, "$1$2 ")
}

// Myzel-Links [[Titel]] / [[Titel|Anzeige]] → normaler Text
export const linksAufloesen = (md) => md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, ziel, anzeige) => (anzeige || ziel).trim())

// Beginnt das Dokument schon mit einer Hauptüberschrift?
export const hatTitel = (tokens) => tokens.find((t) => t.type !== "space")?.type === "heading"

export async function lexen(md) {
    const { marked } = await import("marked")
    return marked.lexer(md, { gfm: true })
}

// &amp; &lt; … zurück in Zeichen (marked lässt sie teils in den Tokens)
export const entitaeten = (s = "") => s.replace(/&(amp|lt|gt|quot|#39|#x27|nbsp);/g, (_, n) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'", nbsp: " " })[n])
const ohneTags = (s = "") => s.replace(/<[^>]+>/g, "")

// Inline-Tokens → reiner Text
export function inlineText(toks = []) {
    return toks.map((t) => t.tokens ? inlineText(t.tokens) : t.type === "br" ? "\n" : t.type === "image" ? `[Bild: ${t.text}]` : entitaeten(ohneTags(t.text ?? ""))).join("")
}

// Ganze Tokens → lesbarer reiner Text (für .txt)
export function zuText(tokens, tiefe = 0) {
    const zeilen = []
    for (const t of tokens) {
        switch (t.type) {
            case "heading": zeilen.push(inlineText(t.tokens), t.depth <= 2 ? (t.depth === 1 ? "=" : "-").repeat(Math.min(60, inlineText(t.tokens).length)) : "", ""); break
            case "paragraph": zeilen.push(inlineText(t.tokens), ""); break
            case "list":
                t.items.forEach((item, i) => {
                    const marke = t.ordered ? `${(t.start || 1) + i}. ` : item.task ? (item.checked ? "[x] " : "[ ] ") : "• "
                    const teile = zuText(item.tokens, tiefe + 1).trim().split("\n")
                    zeilen.push("  ".repeat(tiefe) + marke + teile[0], ...teile.slice(1).map((z) => "  ".repeat(tiefe) + "   " + z))
                })
                if (!tiefe) zeilen.push("")
                break
            case "text": zeilen.push(t.tokens ? inlineText(t.tokens) : entitaeten(t.text)); break
            case "blockquote": zeilen.push(...zuText(t.tokens).trim().split("\n").map((z) => "> " + z), ""); break
            case "code": zeilen.push(...t.text.split("\n").map((z) => "    " + z), ""); break
            case "hr": zeilen.push("―".repeat(30), ""); break
            case "table":
                zeilen.push(t.header.map((c) => inlineText(c.tokens)).join("\t"), ...t.rows.map((r) => r.map((c) => inlineText(c.tokens)).join("\t")), "")
                break
            case "html": { const s = entitaeten(ohneTags(t.text)).trim(); if (s) zeilen.push(s, "") } break
            default: break
        }
    }
    return zeilen.join("\n").replace(/\n{3,}/g, "\n\n")
}

// ---------- Gestaltung, die PDF / Word / HTML teilen ----------
// Druckfarben für die Datei (nicht die Grove-Oberfläche): Grove-Stil = warmes Braun-Amber auf Weiß
export const FARBEN = {
    grove:    { titel: "#7A4318", ueber: "#9A5520", akzent: "#D9A066", text: "#2A1F2C", leise: "#7A6A5C", code: "#F7F0E7", linie: "#E8D5BE" },
    schlicht: { titel: "#111111", ueber: "#111111", akzent: "#BBBBBB", text: "#111111", leise: "#666666", code: "#F3F3F3", linie: "#DDDDDD" },
}
export const RAENDER = { schmal: 14, normal: 22, breit: 30 }    // mm

export const DOKU_OPTIONEN = [
    { id: "stil", name: "Stil", art: "wahl", standard: "grove", werte: [["grove", "Grove (warm)"], ["schlicht", "Schlicht"]] },
    { id: "schrift", name: "Schrift", art: "wahl", standard: "sans", werte: [["sans", "Modern"], ["serif", "Klassisch"], ["mono", "Schreibmaschine"]] },
    { id: "groesse", name: "Schriftgröße", art: "zahl", standard: 11, min: 8, max: 18, schritt: 0.5, einheit: "pt" },
    { id: "titel", name: "Dateiname als Titel", art: "schalter", standard: true, hilfe: "Nur, wenn das Dokument nicht schon mit einer Überschrift beginnt." },
    { id: "datum", name: "Datum unter den Titel", art: "schalter", standard: false },
]
export const SEITEN_OPTIONEN = [
    { id: "seite", name: "Seitenformat", art: "wahl", standard: "a4", werte: [["a4", "A4"], ["a5", "A5"], ["letter", "US Letter"]] },
    { id: "rand", name: "Ränder", art: "wahl", standard: "normal", werte: [["schmal", "schmal"], ["normal", "normal"], ["breit", "breit"]] },
    { id: "seitenzahlen", name: "Seitenzahlen", art: "schalter", standard: true },
]
export const heute = () => new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })
