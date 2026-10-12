// ==========================================================
// Gewächshaus · Abteil „Banner“ (NUR ZUM TESTEN)
// B01–B10: breite Kopfbilder als Inline-SVG (Farben = CSS-Variablen → folgen Laub).
// Gefällt eins: als Szene nach public/bilder/szenen/ (1440×360) oder als Hero in eine Seite.
// CSS: css/dienste/gewaechshaus/banner.css (.gb)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/banner.css"

// fester Zufall → jedes Mal dasselbe Bild
function zufall(saat) {
  return () => { saat |= 0; saat = (saat + 0x6D2B79F5) | 0; let t = Math.imul(saat ^ (saat >>> 15), 1 | saat); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// Reihe aus Tannen als ein Pfad
function tannen(saat, boden, min, max, abstand) {
  const r = zufall(saat)
  let d = `M-20 300 L-20 ${boden}`
  for (let x = -20; x < 1240; x += abstand * (0.6 + r() * 0.8)) {
    const h = min + r() * (max - min), b = h * 0.32
    d += ` L${x} ${boden} L${x + b * 0.5} ${boden - h * 0.45} L${x + b * 0.3} ${boden - h * 0.45} L${x + b} ${boden - h} L${x + b * 1.7} ${boden - h * 0.45} L${x + b * 1.5} ${boden - h * 0.45} L${x + b * 2} ${boden}`
  }
  return d + ` L1240 ${boden} L1240 300 Z`
}

function lichter(saat, n, y0, y1, klasse = "gb-glueh") {
  const r = zufall(saat)
  return Array.from({ length: n }, () => `<circle class="${klasse}" cx="${(r() * 1200).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(1.2 + r() * 1.8).toFixed(1)}" style="--v:${(r() * 6).toFixed(2)}s;--d:${(5 + r() * 6).toFixed(1)}s"/>`).join("")
}

const verlauf = (id, oben, unten) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(${oben})"/><stop offset="1" style="stop-color:var(${unten})"/></linearGradient>`
const text = (kicker, titel, rechts = false) => `<div class="gb-text${rechts ? " gb-text--rechts" : ""}"><span>${kicker}</span><strong>${titel}</strong></div>`
const bild = (inhalt, defs = "") => `<svg class="gb" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${inhalt}</svg>`

// ---------- Szenen ----------
const B01 = bild(`
  <rect width="1200" height="300" fill="url(#gb01h)"/>
  <circle class="gb-mondhof" cx="960" cy="78" r="80"/><circle class="gb-mond" cx="960" cy="78" r="30"/>
  <path class="gb-l1" d="${tannen(3, 230, 60, 120, 38)}"/>
  <path class="gb-l2" d="${tannen(7, 262, 70, 150, 46)}"/>
  ${lichter(11, 14, 170, 270)}
  <path class="gb-l3" d="${tannen(13, 300, 80, 170, 58)}"/>`,
  verlauf("gb01h", "--himmel", "--ground"))

const bassKoerper = "M540 282c-44 0-56-42-34-64 10-10 10-22 0-32-17-22 0-54 34-54s51 32 34 54c-10 10-10 22 0 32 22 22 10 64-34 64z"
const B02 = bild(`
  <rect width="1200" height="300" class="gb-tief"/>
  <polygon class="gb-kegel" points="560,0 640,0 820,300 380,300"/>
  <ellipse class="gb-buehnenlicht" cx="600" cy="292" rx="260" ry="26"/>
  <rect y="284" width="1200" height="16" class="gb-l2"/>
  <g class="gb-schatten">
    <path d="${bassKoerper}"/>
    <path d="M540 132V40" stroke-width="7"/><path d="M533 40c0-14 14-14 14 0" fill="none" stroke-width="5"/>
    <path d="M700 284V150M676 284h48" stroke-width="4"/><circle cx="700" cy="142" r="9"/>
    <path d="M520 200h40M520 206h40" class="gb-saitenhalter"/>
  </g>
  <path class="gb-vorhang" d="M0 0h210c-20 60 10 120-10 180s20 90 0 120H0z"/>
  <path class="gb-vorhang gb-vorhang--falte" d="M60 0c-10 80 20 180 0 300M130 0c15 90-15 190 5 300"/>
  <path class="gb-vorhang" d="M1200 0H990c20 60-10 120 10 180s-20 90 0 120h200z"/>
  <path class="gb-vorhang gb-vorhang--falte" d="M1140 0c10 80-20 180 0 300M1070 0c-15 90 15 190-5 300"/>
  <path class="gb-volant" d="M0 0h1200v26c-40 14-80 14-120 0s-80-14-120 0-80 14-120 0-80-14-120 0-80 14-120 0-80-14-120 0-80 14-120 0-80-14-120 0-80 14-120 0-80-14-120 0z"/>`)

const rillen = Array.from({ length: 16 }, (_, i) => `<circle cx="600" cy="300" r="${86 + i * 9}"/>`).join("")
const B03 = bild(`
  <rect width="1200" height="300" fill="url(#gb03h)"/>
  <g class="gb-platte"><circle cx="600" cy="300" r="236" class="gb-plattengrund"/><g class="gb-rillen">${rillen}</g>
    <path class="gb-glanz" d="M600 64a236 236 0 0 1 167 69"/>
    <circle cx="600" cy="300" r="64" class="gb-etikett"/><circle cx="600" cy="300" r="5" class="gb-tief"/></g>
  <rect y="246" width="1200" height="54" class="gb-l3"/>
  <path class="gb-horizont" d="M0 246h1200"/>`,
  `<linearGradient id="gb03h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--himmel)"/><stop offset=".75" style="stop-color:color-mix(in srgb, var(--amber) 22%, var(--ground))"/></linearGradient>`)

function myzelNetz() {
  const r = zufall(21), k = []
  for (let i = 0; i < 26; i++) k.push([40 + r() * 1120, 120 + r() * 165])
  let linien = ""
  k.forEach(([x, y], i) => {
    const nah = k.map(([a, b], j) => [Math.hypot(a - x, b - y), j]).sort((a, b) => a[0] - b[0]).slice(1, 3)
    nah.forEach(([, j]) => { if (j > i) linien += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} Q${((x + k[j][0]) / 2 + 20).toFixed(0)} ${((y + k[j][1]) / 2 + 18).toFixed(0)} ${k[j][0].toFixed(0)} ${k[j][1].toFixed(0)}"/>` })
  })
  return `<g class="gb-faeden">${linien}</g>` + k.map(([x, y], i) => `<circle class="gb-knoten" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="3" style="--v:${(i * 0.37).toFixed(2)}s"/>`).join("")
}
const keimlinge = [150, 420, 760, 1010].map((x) => `<g class="gb-keim" transform="translate(${x} 92)"><path d="M0 0v-22"/><path d="M0-12c0-7-6-11-12-11 0 7 6 11 12 11zM0-16c0-7 6-11 12-11 0 7-6 11-12 11z"/><path class="gb-wurzel" d="M0 0c-4 14 6 26-2 44M0 0c8 10 18 12 22 30"/></g>`).join("")
const B04 = bild(`
  <rect width="1200" height="300" class="gb-erde"/>
  <rect width="1200" height="92" fill="url(#gb04h)"/>
  <path class="gb-grasnarbe" d="M0 92h1200"/>
  ${myzelNetz()}${keimlinge}`,
  verlauf("gb04h", "--himmel", "--surface"))

function ringe() {
  const r = zufall(5)
  return Array.from({ length: 22 }, (_, i) => {
    const rad = 20 + i * 19 + r() * 6, w = 1 + r() * 0.08
    return `<ellipse cx="150" cy="150" rx="${(rad * w).toFixed(1)}" ry="${(rad * 0.94).toFixed(1)}" style="--o:${(0.25 + r() * 0.5).toFixed(2)}"/>`
  }).join("")
}
const B05 = bild(`
  <rect width="1200" height="300" class="gb-holz"/>
  <g class="gb-ringe">${ringe()}</g>
  <path class="gb-riss" d="M150 150l120-26 70 10 90-30"/>
  <circle class="gb-mark" cx="150" cy="150" r="5"/>`)

function halme() {
  const r = zufall(31)
  let d = ""
  for (let x = 0; x < 1210; x += 5 + r() * 6) { const h = 30 + r() * 70, b = (r() - 0.5) * 30; d += `M${x.toFixed(0)} 300q${(b * 0.3).toFixed(0)} ${(-h * 0.6).toFixed(0)} ${b.toFixed(0)} ${(-h).toFixed(0)}` }
  return d
}
const B06 = bild(`
  <rect width="1200" height="300" fill="url(#gb06h)"/>
  ${lichter(41, 34, 70, 250)}
  <path class="gb-halme" d="${halme()}"/>`,
  verlauf("gb06h", "--himmel", "--wald-mitte"))

const welle = (y, a, l) => { let d = `M0 300V${y}`; for (let x = 0; x <= 2400; x += l) d += `q${l / 4} ${-a} ${l / 2} 0t${l / 2} 0`; return d + "V300z" }
const B07 = bild(`
  <rect width="1200" height="300" fill="url(#gb07h)"/>
  <g class="gb-wellen">
    <path class="gb-w1" d="${welle(150, 26, 300)}"/>
    <path class="gb-w2" d="${welle(190, 22, 240)}"/>
    <path class="gb-w3" d="${welle(225, 18, 200)}"/>
    <path class="gb-w4" d="${welle(258, 12, 150)}"/>
  </g>`,
  verlauf("gb07h", "--himmel", "--surface"))

const berge = "M0 190l120-60 90 40 140-90 130 80 110-50 150 70 120-40 160 60 180-30v100H0z"
const B08 = bild(`
  <rect width="1200" height="300" fill="url(#gb08h)"/>
  <circle class="gb-mondhof" cx="300" cy="70" r="60"/><circle class="gb-mond" cx="300" cy="70" r="20"/>
  <path class="gb-l1" d="${berge}"/>
  <rect y="190" width="1200" height="110" class="gb-see"/>
  <g class="gb-spiegel" clip-path="url(#gb08c)"><path class="gb-l1" d="${berge}" transform="translate(0 380) scale(1 -1)"/></g>
  <path class="gb-ufer" d="M0 190h1200"/>
  <g class="gb-nebel" filter="url(#gb08b)"><ellipse cx="300" cy="195" rx="380" ry="14"/><ellipse cx="900" cy="205" rx="420" ry="12"/><ellipse cx="620" cy="235" rx="360" ry="10"/></g>`,
  verlauf("gb08h", "--himmel", "--ground") + `<filter id="gb08b"><feGaussianBlur stdDeviation="9"/></filter><clipPath id="gb08c"><rect y="190" width="1200" height="110"/></clipPath>`)

function sternbild() {
  const p = [[880, 250], [880, 190], [880, 130], [840, 160], [800, 120], [920, 160], [960, 115], [880, 75], [835, 95], [925, 92]]
  const kanten = [[0, 1], [1, 2], [2, 7], [1, 3], [3, 4], [1, 5], [5, 6], [2, 8], [2, 9]]
  return `<g class="gb-bild">${kanten.map(([a, b]) => `<path pathLength="1" d="M${p[a]}L${p[b]}"/>`).join("")}</g>` +
    p.map(([x, y], i) => `<circle class="gb-hauptstern" cx="${x}" cy="${y}" r="${i === 7 ? 4 : 2.6}"/>`).join("")
}
const B09 = bild(`
  <rect width="1200" height="300" fill="url(#gb09h)"/>
  ${lichter(51, 70, 5, 295, "gb-stern")}
  ${sternbild()}`,
  verlauf("gb09h", "--ground-deep", "--ground"))

const B10 = `<div class="gb10"><svg viewBox="0 0 300 300" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<circle cx="300" cy="150" r="${30 + i * 16}"/>`).join("")}<path d="M300 150l-140-62"/></svg><div><span>Willkommen zurück</span><strong>Gr<em>o</em>ve</strong></div></div>`

const BANNER = [
  { nr: "B01", name: "Mondwald", idee: "Drei Reihen Tannen, Mond mit Lichthof, ein paar Glühwürmchen zwischen den Bäumen.", einsatz: "Lichtung abends, Login",
    html: B01 + text("Guten Abend", "Paddy") },
  { nr: "B02", name: "Jazzbühne", idee: "Vorhang, Lichtkegel, Kontrabass und Mikro als Schatten. Der Kegel atmet ganz leicht.", einsatz: "Groove-Momente, Bridge „läuft“",
    html: B02 + text("Heute auf der Bühne", "3 Geräte online") },
  { nr: "B03", name: "Plattenhorizont", idee: "Eine riesige Schallplatte geht wie eine Sonne am Horizont unter. Der Glanz wandert langsam über die Rillen.", einsatz: "Startseite, Willkommen",
    html: B03 + text("Grove", "Dein Groove, deine Welt") },
  { nr: "B04", name: "Unter der Erde", idee: "Oben Keimlinge, darunter Wurzeln und ein Myzel-Netz, dessen Knoten nacheinander glimmen.", einsatz: "Myzel, Bridge, Verbindungen",
    html: B04 + text("Myzel", "42 Notizen · 87 Verbindungen") },
  { nr: "B05", name: "Jahresringe", idee: "Ein Baumquerschnitt von links ins Bild, feine Ringe, ein Riss. Ganz still, viel Platz für Text.", einsatz: "Jahresringe-Zeitleiste, Konto",
    html: B05 + text("Jahresringe", "Was dieses Jahr gewachsen ist", true) },
  { nr: "B06", name: "Glühwürmchen-Wiese", idee: "Hohes Gras im Vordergrund, darüber schweben Glühwürmchen und glimmen langsam auf und ab.", einsatz: "Leere Seiten, Nacht-Thema",
    html: B06 + text("Alles ruhig", "Keine neuen Meldungen") },
  { nr: "B07", name: "Schallwellen-Hügel", idee: "Hügel aus Schallwellen in vier Lagen. Die vorderste rollt ganz langsam weiter.", einsatz: "Grove Mail, Audio",
    html: B07 + text("Grove Mail", "paddy@groveme.eu.org") },
  { nr: "B08", name: "Nebelsee", idee: "Berge spiegeln sich im See, Nebelbänder ziehen langsam vorbei.", einsatz: "Harz, ruhige Bereiche",
    html: B08 + text("Harz", "12 Dateien sicher verwahrt") },
  { nr: "B09", name: "Sternbild Grove", idee: "Sternenhimmel; ein Sternbild in Baumform zeichnet sich einmal nach – danach funkeln nur noch die Sterne.", einsatz: "Bridge-Realm, Nacht",
    html: B09 + text("Realm „Zuhause“", "Laptop · Server · Handy"), nochmal: true },
  { nr: "B10", name: "Nur Ringe", idee: "Kein Bild, nur feine Jahresringe am Rand mit Tonarm-Schnitt und großem Schriftzug. Ganz ruhig.", einsatz: "Kopf von Unterseiten, Druck",
    html: B10 },
]

export default {
  id: "banner",
  name: "Banner",
  kurz: "Breite Kopfbilder",
  beschreibung: "Kopfbilder für Lichtung und Dienste. Alles Inline-SVG mit Grove-Variablen – sie färben sich also mit Laub um. Bewegung ist bewusst langsam und leise.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 32" style="width:72px;height:48px"><path d="M2 28l8-12 6 6 8-14 8 12 6-6 8 14z"/><circle cx="38" cy="7" r="3"/></svg></span>`,
  anzahl: BANNER.length,
  bauen(el) { kacheln(el, BANNER.map((b) => ({ ...b, buehne: "frei hoch" })), { voll: true }) },
}
