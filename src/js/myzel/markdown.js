// ==========================================================
// Myzel · Markdown anzeigen
// [[Titel]] und [[Titel|Text]] werden zu Verknüpfungen.
// ==========================================================
import { marked } from "marked"
import DOMPurify from "dompurify"

marked.setOptions({ gfm: true, breaks: true })

const LINK = /\[\[([^\[\]|\n]+?)(?:\|([^\[\]\n]+?))?\]\]/g

// Alle verlinkten Titel einer Notiz
export function linkTitel(text) {
    return [...(text || "").matchAll(LINK)].map((m) => m[1].trim()).filter(Boolean)
}

// Markdown → sicheres HTML. existiert(titel) entscheidet: durchgezogen oder gestrichelt
export function zuHtml(text, existiert) {
    const mitLinks = (text || "").replace(LINK, (_, titel, anzeige) => {
        const t = titel.trim()
        const klasse = existiert(t) ? "wurzel" : "wurzel wurzel--leer"
        return `<a href="#" class="${klasse}" data-titel="${escape(t)}">${escape((anzeige || t).trim())}</a>`
    })
    return DOMPurify.sanitize(marked.parse(mitLinks), { ADD_ATTR: ["data-titel", "target"] })
}

// Kurzer Textauszug für Listen
export function auszug(text, n = 120) {
    const t = (text || "")
        .replace(LINK, (_, titel, anzeige) => (anzeige || titel).trim())
        .replace(/[#>*_`~\-]+/g, " ").replace(/\s+/g, " ").trim()
    return t.length > n ? t.slice(0, n - 1) + "…" : t
}

// Titel in [[…]] umbenennen (für "Notiz umbenennen")
export function benenneUm(text, alt, neu) {
    return text.replace(LINK, (ganz, titel, anzeige) =>
        titel.trim().toLowerCase() === alt.toLowerCase() ? `[[${neu}${anzeige ? "|" + anzeige : ""}]]` : ganz)
}

function escape(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
