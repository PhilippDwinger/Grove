// ==========================================================
// Mühle · Markdown → PDF (pdfmake – echte, durchsuchbare Text-PDFs)
// Schriften: Modern = Roboto (alle Zeichen), Klassisch = Times, Schreibmaschine = Courier.
// ==========================================================
import { FARBEN, RAENDER, entitaeten, heute, hatTitel } from "./markdown.js"

let pdfMake = null
async function laden() {
    if (pdfMake) return pdfMake
    pdfMake = (await import("pdfmake/build/pdfmake")).default
    const vfs = (await import("pdfmake/build/vfs_fonts")).default
    pdfMake.addVirtualFileSystem(vfs)
    const schriften = await Promise.all([
        import("pdfmake/build/standard-fonts/Times.js"),
        import("pdfmake/build/standard-fonts/Courier.js"),
    ])
    for (const m of schriften) pdfMake.addFontContainer(m.default ?? m)
    pdfMake.setUrlAccessPolicy?.(() => false)          // nie etwas aus dem Netz nachladen
    return pdfMake
}

// Keine der PDF-Schriften kennt Pfeile oder Emojis → ersetzen bzw. weglassen
// (sonst erscheinen leere Kästchen). Times/Courier können nur westeuropäische Zeichen.
const ERSATZ = { "→": "->", "←": "<-", "⇒": "=>", "↔": "<->", "✓": "v", "✔": "v", "✗": "x", "✘": "x", "★": "*", "☆": "*", "☐": "[ ]", "☑": "[x]", "☒": "[x]" }
const ZEICHEN = new RegExp("[" + Object.keys(ERSATZ).join("") + "]", "g")
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu
const sicher = (s, schrift) => {
    let t = s.replace(ZEICHEN, (z) => ERSATZ[z]).replace(EMOJI, "")
    if (schrift !== "Roboto") t = t.replace(/[^\u0000-ɏ‐-‧€]/g, "?")
    return t
}

export async function mdZuPdf(tokens, o, titel) {
    const pm = await laden()
    const F = FARBEN[o.stil] || FARBEN.grove
    const schrift = { sans: "Roboto", serif: "Times", mono: "Courier" }[o.schrift] || "Roboto"
    const ueberSchrift = o.stil === "grove" && schrift !== "Courier" ? "Times" : schrift
    const gr = +o.groesse || 11
    const t = (s) => sicher(entitaeten(s), schrift)

    function inline(toks = [], stil = {}) {
        const out = []
        for (const k of toks) {
            if (k.type === "strong") out.push(...inline(k.tokens, { ...stil, bold: true }))
            else if (k.type === "em") out.push(...inline(k.tokens, { ...stil, italics: true }))
            else if (k.type === "del") out.push(...inline(k.tokens, { ...stil, decoration: "lineThrough" }))
            else if (k.type === "link") out.push(...inline(k.tokens, { ...stil, link: k.href, color: F.ueber, decoration: "underline" }))
            else if (k.type === "codespan") out.push({ text: sicher(entitaeten(k.text), "Courier"), font: "Courier", background: F.code, ...stil })
            else if (k.type === "br") out.push({ text: "\n" })
            else if (k.type === "image") out.push({ text: `[Bild: ${t(k.text)}]`, italics: true, color: F.leise })
            else if (k.tokens) out.push(...inline(k.tokens, stil))
            else out.push({ text: t((k.text ?? "").replace(/<[^>]+>/g, "")), ...stil })
        }
        return out
    }

    function bloecke(toks = []) {
        const out = []
        for (const k of toks) {
            switch (k.type) {
                case "heading": out.push({ text: inline(k.tokens), style: "h" + Math.min(k.depth, 4) }); break
                case "paragraph": out.push({ text: inline(k.tokens), style: "absatz" }); break
                case "text": out.push({ text: k.tokens ? inline(k.tokens) : t(k.text), style: "absatz" }); break
                case "list": {
                    const items = k.items.map((it) => {
                        const inhalt = bloecke(it.tokens).map((b) => ({ ...b, style: undefined, margin: [0, 0, 0, 2] }))
                        // Aufgabe: Kästchen vorne in dieselbe Zeile
                        if (it.task && inhalt[0]?.text !== undefined) {
                            const haken = { text: it.checked ? "[x] " : "[ ] ", font: "Courier", color: F.ueber }
                            inhalt[0] = { ...inhalt[0], text: [haken, ...[].concat(inhalt[0].text)] }
                        }
                        return inhalt.length === 1 ? inhalt[0] : { stack: inhalt }
                    })
                    out.push(k.ordered ? { ol: items, start: k.start || 1, style: "liste", markerColor: F.ueber } : { ul: items, style: "liste", markerColor: F.ueber })
                    break
                }
                case "blockquote":
                    out.push({
                        table: { widths: [2.5, "*"], body: [[{ text: "", fillColor: F.akzent }, { stack: bloecke(k.tokens), color: F.leise, italics: true, margin: [10, 2, 0, 0] }]] },
                        layout: "noBorders", margin: [0, 2, 0, 10],
                    })
                    break
                case "code":
                    out.push({
                        table: { widths: ["*"], body: [[{ text: sicher(k.text, "Courier"), font: "Courier", fontSize: gr - 1.5, preserveLeadingSpaces: true, lineHeight: 1.2 }]] },
                        layout: { fillColor: () => F.code, hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 9, paddingRight: () => 9, paddingTop: () => 7, paddingBottom: () => 7 },
                        margin: [0, 2, 0, 10],
                    })
                    break
                case "hr": out.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: breite, y2: 0, lineWidth: 0.8, lineColor: F.linie }], margin: [0, 6, 0, 12] }); break
                case "table":
                    out.push({
                        table: {
                            headerRows: 1,
                            widths: k.header.map(() => "*"),
                            body: [
                                k.header.map((c) => ({ text: inline(c.tokens), bold: true, color: F.ueber })),
                                ...k.rows.map((r) => r.map((c) => ({ text: inline(c.tokens) }))),
                            ],
                        },
                        layout: { hLineColor: () => F.linie, vLineWidth: () => 0, hLineWidth: (i) => (i === 1 ? 1 : 0.5), paddingTop: () => 4, paddingBottom: () => 4 },
                        margin: [0, 2, 0, 12],
                    })
                    break
                case "html": { const s = entitaeten(k.text.replace(/<[^>]+>/g, "")).trim(); if (s) out.push({ text: t(s), style: "absatz" }) } break
                default: break
            }
        }
        return out
    }

    const rand = RAENDER[o.rand] * 2.835 || 62          // mm → pt
    const breite = ({ a4: 595.28, a5: 419.53, letter: 612 }[o.seite] || 595.28) - 2 * rand

    const inhalt = []
    if (o.titel && titel && !hatTitel(tokens)) {
        inhalt.push({ text: t(titel), style: "titel" })
        if (o.datum) inhalt.push({ text: heute(), color: F.leise, margin: [0, -6, 0, 14] })
    } else if (o.datum) inhalt.push({ text: heute(), color: F.leise, margin: [0, 0, 0, 10] })
    inhalt.push(...bloecke(tokens))

    const dd = {
        pageSize: { a4: "A4", a5: "A5", letter: "LETTER" }[o.seite] || "A4",
        pageMargins: [rand, rand, rand, rand + (o.seitenzahlen ? 8 : 0)],
        info: { title: titel || "Grove", creator: "Grove · Mühle" },
        content: inhalt,
        footer: o.seitenzahlen ? (seite, gesamt) => ({ text: `${seite} / ${gesamt}`, alignment: "center", fontSize: 8, color: F.leise, margin: [0, rand / 3, 0, 0] }) : undefined,
        defaultStyle: { font: schrift, fontSize: gr, lineHeight: 1.3, color: F.text },
        styles: {
            titel: { font: ueberSchrift, fontSize: gr * 2.3, bold: true, color: F.titel, margin: [0, 0, 0, 12] },
            h1: { font: ueberSchrift, fontSize: gr * 1.8, bold: true, color: F.titel, margin: [0, 10, 0, 6] },
            h2: { font: ueberSchrift, fontSize: gr * 1.45, bold: true, color: F.ueber, margin: [0, 10, 0, 5] },
            h3: { font: ueberSchrift, fontSize: gr * 1.2, bold: true, color: F.ueber, margin: [0, 8, 0, 4] },
            h4: { fontSize: gr * 1.05, bold: true, color: F.ueber, margin: [0, 6, 0, 3] },
            absatz: { margin: [0, 0, 0, 8] },
            liste: { margin: [0, 0, 0, 8] },
        },
    }
    // Hinweis: Fett/Kursiv gibt es bei allen drei Schriften
    return pm.createPdf(dd).getBlob()
}
