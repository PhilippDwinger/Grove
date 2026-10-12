// ==========================================================
// Mühle · Markdown → eigenständige HTML-Datei (öffnet sich in jedem Browser,
// Gestaltung steckt in der Datei; Schriften von Google Fonts, sonst Ersatz).
// ==========================================================
import { FARBEN, RAENDER, heute, hatTitel } from "./markdown.js"
import { esc } from "../../kern/html.js"

const SCHRIFT = {
    sans: "'Instrument Sans', 'Segoe UI', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'IBM Plex Mono', Consolas, monospace",
}

export async function mdZuHtml(md, tokens, o, titel) {
    const { marked } = await import("marked")
    const F = FARBEN[o.stil] || FARBEN.grove
    const grove = o.stil === "grove"
    const koerper = marked.parse(md, { gfm: true })
    const kopf = o.titel && titel && !hatTitel(tokens) ? `<h1 class="titel">${esc(titel)}</h1>` : ""
    const datum = o.datum ? `<p class="datum">${esc(heute())}</p>` : ""
    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titel || "Dokument")}</title>
<meta name="generator" content="Grove · Mühle">
${grove ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet">` : ""}
<style>
  :root { --text: ${F.text}; --leise: ${F.leise}; --ueber: ${F.ueber}; --titel: ${F.titel}; --akzent: ${F.akzent}; --code: ${F.code}; --linie: ${F.linie}; }
  body { max-width: 46rem; margin: 0 auto; padding: ${RAENDER[o.rand] || 22}mm 1.25rem; color: var(--text); background: #fff;
         font: ${+o.groesse || 11}pt/1.6 ${SCHRIFT[o.schrift] || SCHRIFT.sans}; }
  h1, h2, h3, h4 { font-family: ${grove ? "Fraunces, Georgia, serif" : "inherit"}; line-height: 1.2; margin: 1.6em 0 .5em; }
  h1, .titel { color: var(--titel); } h2, h3, h4 { color: var(--ueber); }
  .titel { font-size: 2.3em; margin-top: 0; } .datum { color: var(--leise); margin-top: -.6em; }
  a { color: var(--ueber); }
  blockquote { margin: 1em 0; padding: .2em 1em; border-left: 3px solid var(--akzent); color: var(--leise); font-style: italic; }
  code { font-family: Consolas, monospace; background: var(--code); padding: .1em .3em; border-radius: 4px; font-size: .92em; }
  pre { background: var(--code); padding: .9em 1em; border-radius: 8px; overflow: auto; } pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; } th { color: var(--ueber); text-align: left; }
  th, td { padding: .45em .6em; border-bottom: 1px solid var(--linie); }
  hr { border: 0; border-top: 1px solid var(--linie); margin: 2em 0; }
  img { max-width: 100%; }
  @media print { body { padding: 0; } @page { margin: ${RAENDER[o.rand] || 22}mm; } }
</style>
</head>
<body>
${kopf}${datum}
${koerper}
</body>
</html>
`
}
