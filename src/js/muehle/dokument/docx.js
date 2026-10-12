// ==========================================================
// Mühle · Markdown → Word (.docx) über die Bibliothek „docx“
// Überschriften, Absätze, fett/kursiv/durchgestrichen, Links, Listen (auch
// verschachtelt + Aufgaben), Zitate, Code, Tabellen, Trennlinien, Seitenzahlen.
// ==========================================================
import { FARBEN, RAENDER, entitaeten, heute, hatTitel } from "./markdown.js"

const SEITE = { a4: [11906, 16838], a5: [8391, 11906], letter: [12240, 15840] }      // twips
const SCHRIFT = { sans: "Calibri", serif: "Georgia", mono: "Consolas" }
const ohneRaute = (f) => f.replace("#", "")

export async function mdZuDocx(tokens, o, titel) {
    const d = await import("docx")
    const { Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
        WidthType, BorderStyle, ShadingType, Footer, PageNumber, LevelFormat } = d
    const F = FARBEN[o.stil] || FARBEN.grove
    const schrift = SCHRIFT[o.schrift] || "Calibri"
    const titelSchrift = o.stil === "grove" && o.schrift !== "mono" ? "Georgia" : schrift
    const gr = Math.round((+o.groesse || 11) * 2)          // halbe Punkte
    let listenNr = 0

    function laeufe(toks = [], stil = {}) {
        const out = []
        for (const k of toks) {
            if (k.type === "strong") out.push(...laeufe(k.tokens, { ...stil, bold: true }))
            else if (k.type === "em") out.push(...laeufe(k.tokens, { ...stil, italics: true }))
            else if (k.type === "del") out.push(...laeufe(k.tokens, { ...stil, strike: true }))
            else if (k.type === "link") out.push(new ExternalHyperlink({ link: k.href, children: laeufe(k.tokens, { ...stil, color: ohneRaute(F.ueber), underline: {} }) }))
            else if (k.type === "codespan") out.push(new TextRun({ text: entitaeten(k.text), font: "Consolas", shading: { type: ShadingType.CLEAR, fill: ohneRaute(F.code), color: "auto" }, ...stil }))
            else if (k.type === "br") out.push(new TextRun({ break: 1 }))
            else if (k.type === "image") out.push(new TextRun({ text: `[Bild: ${k.text}]`, italics: true, color: ohneRaute(F.leise) }))
            else if (k.tokens) out.push(...laeufe(k.tokens, stil))
            else out.push(new TextRun({ text: entitaeten((k.text ?? "").replace(/<[^>]+>/g, "")), ...stil }))
        }
        return out
    }

    // liste = Nummerierung für den ersten Absatz eines Listenpunkts, vorne = Läufe davor (z. B. ☐)
    function bloecke(toks = [], ebene = 0, liste = null, vorne = []) {
        const out = []
        for (const k of toks) {
            switch (k.type) {
                case "heading":
                    out.push(new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][Math.min(k.depth, 4) - 1], children: laeufe(k.tokens) }))
                    break
                case "paragraph":
                case "text":
                    out.push(new Paragraph({ children: [...vorne, ...(k.tokens ? laeufe(k.tokens) : [new TextRun(entitaeten(k.text))])], ...(liste || {}) }))
                    liste = null; vorne = []          // nur der erste Absatz eines Listenpunkts bekommt den Punkt
                    break
                case "list": {
                    const ref = k.ordered ? "zahlen" : "punkte"
                    const instanz = k.ordered ? ++listenNr : 0
                    for (const it of k.items) {
                        const haken = it.task ? [new TextRun({ text: it.checked ? "☑ " : "☐ " })] : []
                        out.push(...bloecke(it.tokens, ebene + 1, { numbering: { reference: ref, level: Math.min(ebene, 3), instance: instanz } }, haken))
                    }
                    break
                }
                case "blockquote":          // Zitat in einer Liste: einfach eingerückt (oben stehende Zitate macht zitate())
                    out.push(...bloecke(k.tokens, ebene))
                    break
                case "code":
                    k.text.split("\n").forEach((zeile, i, alle) => out.push(new Paragraph({
                        children: [new TextRun({ text: zeile || " ", font: "Consolas", size: gr - 2 })],
                        shading: { type: ShadingType.CLEAR, fill: ohneRaute(F.code), color: "auto" },
                        spacing: { before: i === 0 ? 120 : 0, after: i === alle.length - 1 ? 160 : 0, line: 260 },
                    })))
                    break
                case "hr":
                    out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ohneRaute(F.linie), space: 1 } }, spacing: { after: 200 } }))
                    break
                case "table": {
                    const zelle = (c, kopf) => new TableCell({ children: [new Paragraph({ children: laeufe(c.tokens, kopf ? { bold: true, color: ohneRaute(F.ueber) } : {}) })], margins: { top: 60, bottom: 60, left: 100, right: 100 } })
                    out.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [new TableRow({ tableHeader: true, children: k.header.map((c) => zelle(c, true)) }), ...k.rows.map((r) => new TableRow({ children: r.map((c) => zelle(c, false)) }))],
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: ohneRaute(F.linie) }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: ohneRaute(F.linie) }, insideVertical: { style: BorderStyle.NONE } },
                    }))
                    out.push(new Paragraph({ children: [] }))
                    break
                }
                case "html": { const s = entitaeten(k.text.replace(/<[^>]+>/g, "")).trim(); if (s) out.push(new Paragraph({ children: [new TextRun(s)] })) } break
                default: break
            }
        }
        return out
    }

    // Zitate: einrücken + Linie links (Absätze nachträglich als Zitat bauen)
    function zitate(toks) {
        return toks.flatMap((k) => k.type !== "blockquote" ? bloecke([k]) : k.tokens.filter((x) => x.type !== "space").map((x) => new Paragraph({
            children: laeufe(x.tokens || [{ type: "text", text: x.text || "" }], { italics: true, color: ohneRaute(F.leise) }),
            indent: { left: 360 },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: ohneRaute(F.akzent), space: 10 } },
            spacing: { after: 160 },
        })))
    }

    const kinder = []
    if (o.titel && titel && !hatTitel(tokens)) {
        kinder.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(titel)] }))
        if (o.datum) kinder.push(new Paragraph({ children: [new TextRun({ text: heute(), color: ohneRaute(F.leise) })], spacing: { after: 240 } }))
    } else if (o.datum) kinder.push(new Paragraph({ children: [new TextRun({ text: heute(), color: ohneRaute(F.leise) })] }))
    kinder.push(...zitate(tokens))

    const ueber = (groesse, farbe, nach = 120) => ({ run: { font: titelSchrift, size: Math.round(gr * groesse), bold: true, color: ohneRaute(farbe) }, paragraph: { spacing: { before: 240, after: nach }, keepNext: true } })
    const rand = Math.round((RAENDER[o.rand] || 22) * 56.7)          // mm → twips
    const [w, h] = SEITE[o.seite] || SEITE.a4
    const ebenen = (format, text) => [0, 1, 2, 3].map((l) => ({ level: l, format, text: text(l), alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 420 + l * 360, hanging: 280 } }, run: { color: ohneRaute(F.ueber) } } }))

    const doc = new Document({
        creator: "Grove · Mühle",
        title: titel || "Grove",
        styles: {
            default: {
                document: { run: { font: schrift, size: gr, color: ohneRaute(F.text) }, paragraph: { spacing: { after: 140, line: 300 } } },
                title: ueber(2.3, F.titel, 200),
                heading1: ueber(1.8, F.titel),
                heading2: ueber(1.45, F.ueber),
                heading3: ueber(1.2, F.ueber),
                heading4: ueber(1.05, F.ueber),
            },
        },
        numbering: {
            config: [
                { reference: "punkte", levels: ebenen(LevelFormat.BULLET, (l) => ["•", "◦", "▪", "•"][l]) },
                { reference: "zahlen", levels: ebenen(LevelFormat.DECIMAL, (l) => `%${l + 1}.`) },
            ],
        },
        sections: [{
            properties: { page: { size: { width: w, height: h }, margin: { top: rand, bottom: rand, left: rand, right: rand } } },
            footers: o.seitenzahlen ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 16, color: ohneRaute(F.leise) })] })] }) } : undefined,
            children: kinder,
        }],
    })
    return Packer.toBlob(doc)
}
