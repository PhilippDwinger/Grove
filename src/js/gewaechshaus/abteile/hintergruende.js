// ==========================================================
// Gewächshaus · Abteil „Hintergründe & Muster“ (NUR ZUM TESTEN)
// H01–H14: Flächen für Seiten, Karten und Kopfbereiche. Fast alles reines CSS.
// Gefällt eins: als Muster/Hintergrund-Animation in Laub (thema-daten.js) anbieten.
// CSS: css/dienste/gewaechshaus/hintergruende.css (.gx)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/hintergruende.css"

const probe = `<div class="gx-probe"><strong>Myzel</strong><span>So liest sich Text darauf.</span></div>`

function topografie() {
  let d = ""
  for (let k = 0; k < 9; k++) {
    const r = 18 + k * 16
    d += `<path d="M${(160 + r).toFixed(0)} 110 ${Array.from({ length: 24 }, (_, i) => { const w = (i + 1) / 24 * Math.PI * 2, rr = r * (1 + 0.12 * Math.sin(w * 3 + k) + 0.06 * Math.cos(w * 5)); return `L${(160 + Math.cos(w) * rr * 1.3).toFixed(1)} ${(110 + Math.sin(w) * rr * 0.8).toFixed(1)}` }).join(" ")}Z"/>`
  }
  return `<svg class="gx-topo" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${d}</svg>`
}

function sterne() {
  let s = ""
  for (let i = 0; i < 60; i++) s += `<i style="left:${(i * 37.7) % 100}%;top:${(i * 61.3) % 100}%;--v:${(i % 9) * .7}s;--g:${1 + (i % 3)}px"></i>`
  return s
}

const HINTERGRUENDE = [
  { nr: "H01", name: "Holzmaserung", idee: "Feine, leicht wellige Linien wie die Maserung eines Bretts.", einsatz: "Karten, Harz",
    html: `<div class="gx gx01"></div>${probe}` },
  { nr: "H02", name: "Jahresringe-Muster", idee: "Verstreute Ringgruppen, sehr leise, wie Querschnitte im Holz.", einsatz: "Lichtung, Konto",
    html: `<div class="gx gx02"></div>${probe}` },
  { nr: "H03", name: "Plattenrillen", idee: "Hauchfeine konzentrische Rillen aus einer Ecke heraus.", einsatz: "Musik, Kopf von Diensten",
    html: `<div class="gx gx03"></div>${probe}` },
  { nr: "H04", name: "Sporen", idee: "Feines Punkteraster, das zur Mitte hin dichter wird.", einsatz: "Myzel, leere Flächen",
    html: `<div class="gx gx04"></div>${probe}` },
  { nr: "H05", name: "Höhenlinien", idee: "Wie auf einer Wanderkarte – geschwungene Linien um einen Gipfel.", einsatz: "Bridge-Karte, Geräte",
    html: `<div class="gx gx05">${topografie()}</div>${probe}` },
  { nr: "H06", name: "Notenlinien", idee: "Gruppen aus fünf Linien wie leeres Notenpapier, ganz zart.", einsatz: "Groove-Bereiche, Musik",
    html: `<div class="gx gx06"></div>${probe}` },
  { nr: "H07", name: "Jazzclub-Parkett", idee: "Rauten-Parkett in zwei sehr nahen Tönen, wie der Boden im Club.", einsatz: "Bühne, Unterseiten",
    html: `<div class="gx gx07"></div>${probe}` },
  { nr: "H08", name: "Laubschatten", idee: "Weiche, warme Lichtflecken wie Sonne durch Blätter – bewegen sich kaum merklich.", einsatz: "Lichtung tagsüber",
    html: `<div class="gx gx08"><i></i><i></i><i></i><i></i></div>${probe}` },
  { nr: "H09", name: "Sternenhimmel", idee: "Viele kleine Sterne, die langsam und unregelmäßig funkeln.", einsatz: "Nacht-Preset, Bridge",
    html: `<div class="gx gx09">${sterne()}</div>${probe}` },
  { nr: "H10", name: "Abendrot", idee: "Weicher Verlauf von Aubergine über Rosé zu Amber am unteren Rand.", einsatz: "Begrüßung abends",
    html: `<div class="gx gx10"></div>${probe}` },
  { nr: "H11", name: "Korn & Vignette", idee: "Kräftigeres Filmkorn und dunklere Ränder – wie ein altes Foto aus dem Club.", einsatz: "Jazzkeller-Preset",
    html: `<div class="gx gx11"></div>${probe}` },
  { nr: "H12", name: "Bauplan-Raster", idee: "Feines Raster mit stärkeren Linien alle fünf Felder – für technische Bereiche.", einsatz: "Bridge, Server, Labor",
    html: `<div class="gx gx12"></div>${probe}` },
  { nr: "H13", name: "Flieder-Schleier", idee: "Zwei weiche Lichtschleier in Flieder und Amber, die sehr langsam wandern.", einsatz: "Login, Hintergrund-Animation",
    html: `<div class="gx gx13"><i></i><i></i></div>${probe}` },
  { nr: "H14", name: "Wellenlinien", idee: "Übereinander liegende Sinuslinien wie ein Oszilloskop, ganz leise.", einsatz: "Grove Mail, Audio",
    html: `<div class="gx gx14"></div>${probe}` },
]

export default {
  id: "hintergruende",
  name: "Hintergründe",
  kurz: "Muster & Flächen",
  beschreibung: "Flächen für Seiten und Karten. Auf jeder liegt eine Probe-Karte, damit man sieht, ob Text darauf noch gut lesbar bleibt.",
  vorschau: `<span class="gh-vs"><span class="gx gx03" style="position:relative;display:block;width:120px;height:70px;border-radius:10px"></span></span>`,
  anzahl: HINTERGRUENDE.length,
  bauen(el) { kacheln(el, HINTERGRUENDE.map((h) => ({ ...h, buehne: "hoch frei" }))) },
}
