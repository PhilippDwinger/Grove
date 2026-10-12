// ==========================================================
// Bridge · Design-Labor (src/dienste/bridge/index.html)
// Reine Testseite zum Planen von Look & Bewegung.
// Spricht NICHT mit dem Bridge-Server – alle Abläufe sind
// nachgestellt, aber nach dem echten Code (Bridge 1.0):
//   /realm/command → /call/command → Task in task_pool des Hosts
//   → /poll → /respond (Antwort in response_pool, Task gelöscht)
//   Busy-Points = Tasks + 2 × Instructions (MailBox.get_busy_points)
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub
import "../kern/schutz.js"
import "../glocke.js"
import "../nutzermenue.js"
import "../kern/alle-dienste.js"
import "../../css/kern.css"
import { sucheEinrichten } from "../kern/suche.js"

sucheEinrichten()

const NS = "http://www.w3.org/2000/svg"
const app = document.getElementById("bridge")

// ---------- kleine Helfer ----------
function svgEl(tag, attrs = {}, eltern) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  if (eltern) eltern.appendChild(e)
  return e
}
const warte = (ms) => new Promise((r) => setTimeout(r, ms))
function bewegungAus() {
  return document.documentElement.dataset.bewegung === "aus" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
}
function bewegungDezent() { return document.documentElement.dataset.bewegung === "dezent" }
function farbe(name) { return getComputedStyle(app).getPropertyValue(name).trim() || "#E3A15A" }

// ---------- Richtungen: wie Verbindungen gezeichnet werden ----------
const RICHTUNGEN = {
  wurzel: { name: "Wurzelwerk", info: "Organisch: Verbindungen wachsen wie Wurzeln, weiche Knoten. Passt am engsten zu Myzel und dem Grove-Wald." },
  signal: { name: "Signal",     info: "Technischer: feine, gepunktete Leitungen im rechten Winkel, kantige Knoten. Wirkt wie ein Schaltplan." },
  bogen:  { name: "Bogen",      info: "Brücken-Motiv: jede Verbindung ist ein Bogen über den Realm, kräftige Linien, runde Knoten." },
}
let richtung = "wurzel"

const P = (p) => `${+p.x.toFixed(2)} ${+p.y.toFixed(2)}`
function einheit(dx, dy) { const l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l } }
function autoRichtung(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y
  return Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx) || 1, y: 0 } : { x: 0, y: Math.sign(dy) || 1 }
}

// Eine Verbindung von a nach b.
//   da = Richtung, in der die Linie a verlässt
//   db = Richtung, die von b nach außen zeigt (am Realm: vom Mittelpunkt weg)
// Weil die Linie genau in diesen Richtungen startet und ankommt, gehen
// zusammengesetzte Wege ohne Knick ineinander über (= „tangentenstetig“).
// hin/rueck sind die Pfad-Befehle OHNE Startpunkt, damit man Stücke aneinanderhängen kann.
function verbindung(a, b, da = autoRichtung(a, b), db = autoRichtung(b, a)) {
  let hin, rueck
  if (richtung === "signal") {
    // Schaltplan: ein einziger rechter Winkel (erst in Startrichtung, dann aufs Ziel)
    const X = (v) => +v.toFixed(2)
    if (a.y === b.y || a.x === b.x) { hin = `L${P(b)}`; rueck = `L${P(a)}` }
    else if (da.y === 0) { hin = `H${X(b.x)} V${X(b.y)}`; rueck = `V${X(a.y)} H${X(a.x)}` }
    else { hin = `V${X(b.y)} H${X(b.x)}`; rueck = `H${X(a.x)} V${X(a.y)}` }
  } else if (richtung === "bogen") {
    const q = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 40 - Math.abs(a.x - b.x) * 0.15 }
    hin = `Q${P(q)} ${P(b)}`
    rueck = `Q${P(q)} ${P(a)}`
  } else {
    const k = Math.max(18, Math.hypot(b.x - a.x, b.y - a.y) * 0.42)
    const c1 = { x: a.x + da.x * k, y: a.y + da.y * k }
    const c2 = { x: b.x + db.x * k, y: b.y + db.y * k }
    hin = `C${P(c1)} ${P(c2)} ${P(b)}`
    rueck = `C${P(c2)} ${P(c1)} ${P(a)}`
  }
  return { a, b, hin, rueck, d: `M${P(a)} ${hin}`, dRueck: `M${P(b)} ${rueck}` }
}
const pfadD = (a, b) => verbindung(a, b).d

// Weg quer durch den Realm: von einem Andockpunkt am Ring zum anderen,
// in einer weichen Kurve durch den Kern (Signal: gerade über die Mitte).
function durchRealm(R, nach) {
  return richtung === "signal" ? `L${P(R)} L${P(nach)}` : `Q${P(R)} ${P(nach)}`
}
// Ganzer Weg: Client → Realm → Client, als EIN Pfad.
function weg(von, nach, R) {
  const mitte = `M${P(von.b)} ${durchRealm(R, nach.b)}`
  return {
    d: `M${P(von.a)} ${von.hin} ${durchRealm(R, nach.b)} ${nach.rueck}`,
    mitte: laenge(von.d) + laenge(mitte) / 2,
  }
}

// Pfadlänge messen (unsichtbares Mess-SVG, einmal angelegt)
let messPfad = null
function laenge(d) {
  if (!messPfad) {
    const m = document.createElementNS(NS, "svg")
    m.setAttribute("aria-hidden", "true")
    m.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden"
    document.body.appendChild(m)
    messPfad = svgEl("path", {}, m)
  }
  messPfad.setAttribute("d", d)
  return messPfad.getTotalLength()
}

// ---------- Signal-Motor ----------
// Alle Signale laufen in EINER requestAnimationFrame-Schleife.
// Pro Frame ändern wir nur Zahlen (transform, stroke-dashoffset) –
// keine Filter, keine neuen Elemente. Das hält es flüssig.
const SIGNALE = new Set()
let rafId = 0
function takt(t) {
  rafId = 0
  for (const schritt of SIGNALE) schritt(t)
  if (SIGNALE.size) rafId = requestAnimationFrame(takt)
}
function taktStarten() { if (!rafId) rafId = requestAnimationFrame(takt) }

// Weicher Lichthof um den Signal-Kopf (Verlauf statt teurem drop-shadow)
function lichthof(svg, f) {
  const id = "b-hof-" + f.replace(/[^a-z0-9]/gi, "")
  if (!svg.querySelector(`[id="${id}"]`)) {
    const defs = svg.querySelector("defs") || svg.insertBefore(document.createElementNS(NS, "defs"), svg.firstChild)
    const g = svgEl("radialGradient", { id }, defs)
    svgEl("stop", { offset: "0", "stop-color": f, "stop-opacity": .55 }, g)
    svgEl("stop", { offset: ".4", "stop-color": f, "stop-opacity": .2 }, g)
    svgEl("stop", { offset: "1", "stop-color": f, "stop-opacity": 0 }, g)
  }
  return `url(#${id})`
}

// Schweif aus drei Lagen: lang & zart → kurz & hell. Ergibt einen weichen Kometen.
const SCHWEIF = [[96, 1.4, .14], [52, 2.2, .32], [22, 3, .7]]   // Länge, Breite, Deckkraft

// Ein Signal läuft den Pfad d entlang. beiStrecke: [[strecke, fn], …] feuert unterwegs (ohne anzuhalten).
function signal(svg, d, { farbeVar = "--b-task", tempo = .3, beiStrecke = [] } = {}) {
  if (bewegungAus()) return Promise.resolve()
  const f = farbe(farbeVar)
  const g = svgEl("g", { class: "b-signal" }, svg)
  const licht = svgEl("path", { d, class: "b-signal__licht", stroke: f }, g)
  const L = licht.getTotalLength()
  const schweife = SCHWEIF.map(([l, w, o]) => {
    const sp = svgEl("path", { d, fill: "none", stroke: f, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: o, "stroke-dasharray": `${l} ${L * 2 + 400}`, "stroke-dashoffset": l }, g)
    sp._l = l
    return sp
  })
  const kopf = svgEl("g", { opacity: 0 }, g)
  svgEl("circle", { r: 15, fill: lichthof(svg, f) }, kopf)
  svgEl("circle", { r: 3.8, fill: f }, kopf)
  svgEl("circle", { r: 1.5, fill: farbe("--text"), opacity: .9 }, kopf)
  requestAnimationFrame(() => licht.classList.add("an"))

  const weit = L + SCHWEIF[0][0]                 // Kopf bis zum Ziel + Schweif läuft aus
  const dauer = Math.max(900, weit / tempo)
  const offen = [...beiStrecke].sort((x, y) => x[0] - y[0])
  return new Promise((fertig) => {
    let start = null
    const schritt = (t) => {
      if (!g.isConnected) { SIGNALE.delete(schritt); fertig(); return }
      if (start === null) start = t
      const p = Math.min(1, (t - start) / dauer)
      const s = (.5 - .5 * Math.cos(Math.PI * p)) * weit   // sanft an, sanft aus – ein einziger Bogen
      const pt = licht.getPointAtLength(Math.min(s, L))
      kopf.setAttribute("transform", `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`)
      kopf.setAttribute("opacity", Math.max(0, Math.min(1, s / 18, 1 - (s - L) / 36)).toFixed(3))
      for (const sp of schweife) sp.setAttribute("stroke-dashoffset", (sp._l - s).toFixed(2))
      while (offen.length && s >= offen[0][0]) offen.shift()[1]()
      if (p >= 1) {
        SIGNALE.delete(schritt)
        licht.classList.remove("an")
        setTimeout(() => g.remove(), 600)
        fertig()
      }
    }
    SIGNALE.add(schritt)
    taktStarten()
  })
}

function welle(svg, x, y, r = 30, farbeVar = "--b-task") {
  if (bewegungAus()) return
  const c = svgEl("circle", { cx: x, cy: y, r, fill: "none", stroke: farbe(farbeVar), "stroke-width": 1.6, class: "b-welle" }, svg)
  setTimeout(() => c.remove(), 1300)
}

// Client leuchtet kurz auf, während er arbeitet (CSS-Übergang, kein Loop)
function arbeitet(g, ms = 1000) {
  const r = g?.querySelector(".b-knoten")
  if (!r || bewegungAus()) return
  r.classList.add("b-knoten--arbeitet")
  setTimeout(() => r.classList.remove("b-knoten--arbeitet"), ms)
}

// Realm-Zeichen: Jahresringe mit Kern (wie das Grove-Logo)
function realmZeichen(svg, x, y, s = 1, name = "") {
  const g = svgEl("g", { transform: `translate(${x} ${y}) scale(${s})` }, svg)
  svgEl("circle", { r: 54, class: "b-ring" }, g)
  svgEl("circle", { r: 42, class: "b-ring" }, g)
  svgEl("circle", { r: 30, class: "b-ring b-ring--innen" }, g)
  svgEl("circle", { r: 16, class: "b-realm-kern" }, g)
  svgEl("circle", { r: 4, fill: farbe("--amber") }, g)
  if (name) {
    const t = svgEl("text", { y: 78, "text-anchor": "middle", class: "b-text--gross" }, g)
    t.textContent = name
  }
  return g
}

function client(svg, x, y, name, { w = 64, h = 42, ziel = false } = {}) {
  const g = svgEl("g", { transform: `translate(${x} ${y})` }, svg)
  svgEl("rect", { x: -w / 2, y: -h / 2, width: w, height: h, class: "b-knoten" + (ziel ? " b-knoten--ziel" : "") }, g)
  svgEl("rect", { x: -w / 2 + 7, y: -h / 2 + 7, width: w - 14, height: h - 14, class: "b-knoten-schirm" }, g)
  const t = svgEl("text", { y: h / 2 + 17, "text-anchor": "middle", class: "b-text" }, g)
  t.textContent = name
  return g
}

function keimling(eltern, x, y, animiert) {
  const g = svgEl("g", { transform: `translate(${x} ${y})` }, eltern)
  svgEl("path", { d: "M0 0 V-16", class: "b-keim" + (animiert ? " b46-stiel" : "") }, g)
  svgEl("path", { d: "M0 -12 C5 -20 13 -20 15 -15 C10 -11 5 -11 0 -12Z", class: "b-blatt" + (animiert ? " b46-blatt" : "") }, g)
  return g
}

// ==========================================================
// Seite aufbauen
// ==========================================================
app.innerHTML = `
  <section class="b-held">
    <div>
      <span class="b-entwurf">Design-Labor · Entwurf</span>
      <h1>Bridge</h1>
      <p class="b-held__lede">Ein Realm, beliebig viele Geräte. Was ein Client anbietet, kann jeder andere im Realm aufrufen, egal wo er steht.</p>
      <p class="b-held__lede">Diese Seite ist nur zum Planen: Look und Bewegung, nach dem echten Ablauf aus Bridge 1.0 nachgestellt.</p>
      <div class="b-richtung">
        <div class="b-richtung__titel">Gestaltungs-Richtung</div>
        <div class="b-segment" role="group" aria-label="Gestaltungs-Richtung">
          ${Object.entries(RICHTUNGEN).map(([id, r]) => `<button type="button" data-richtung="${id}" aria-pressed="${id === richtung}">${r.name}</button>`).join("")}
        </div>
        <p class="b-richtung__info" id="richtung-info">${RICHTUNGEN[richtung].info}</p>
      </div>
    </div>
    <div class="b-buehne"><svg id="held-netz" viewBox="0 0 600 400" role="img" aria-label="Realm mit verbundenen Clients, zwischen denen Aufrufe hin und her laufen"></svg></div>
  </section>

  <section class="b-abschnitt" id="ablauf">
    <div class="b-abschnitt__kopf">
      <h2>Der Weg eines Aufrufs</h2>
      <p>Client B nutzt eine Funktion, die Client A anbietet. B kennt A nicht, B spricht nur mit dem Realm. Schritt für Schritt, wie es im Code passiert.</p>
    </div>
    <div class="b-ablauf">
      <div class="b-flaeche b-ablauf__bild"><svg id="ablauf-bild" viewBox="0 0 720 430" role="img" aria-label="Ablauf eines Funktionsaufrufs zwischen zwei Clients"></svg></div>
      <div class="b-flaeche b-ablauf__text">
        <div class="b-schritte" id="ablauf-schritte"></div>
        <div class="b-ablauf__nr" id="ablauf-nr"></div>
        <div class="b-ablauf__titel" id="ablauf-titel"></div>
        <p class="b-ablauf__erkl" id="ablauf-erkl"></p>
        <code class="b-code-inline b-endpunkt" id="ablauf-endpunkt"></code>
        <div class="b-steuerung">
          <button class="g-knopf-leise" type="button" id="ablauf-zurueck">Zurück</button>
          <button class="g-knopf" type="button" id="ablauf-weiter">Weiter</button>
          <button class="g-knopf-leise" type="button" id="ablauf-alles">Ganz abspielen</button>
        </div>
      </div>
    </div>
  </section>

  <section class="b-abschnitt" id="mailbox">
    <div class="b-abschnitt__kopf">
      <h2>Die Mailbox</h2>
      <p>Jeder Client hat eine Mailbox mit drei Pools. Der Client holt sie mit <code>/poll</code> ab. Probier aus, wie sich die Busy-Points verändern.</p>
    </div>
    <div class="b-mailbox">
      <div class="b-flaeche b-pools" id="pools"></div>
      <div class="b-flaeche b-busy">
        <div>
          <div class="b-busy__formel">Busy-Points</div>
          <div class="b-busy__zahl" id="busy-zahl">0</div>
          <div class="b-busy__formel" id="busy-formel"></div>
        </div>
        <div class="b-knopfreihe">
          <button class="g-knopf-leise" type="button" data-neu="task">+ Task</button>
          <button class="g-knopf-leise" type="button" data-neu="instr">+ Instruction</button>
          <button class="g-knopf-leise" type="button" data-neu="resp">+ Response</button>
        </div>
        <div class="b-knopfreihe">
          <button class="g-knopf-leise" type="button" id="mb-erledigen">Älteste Task erledigen</button>
          <button class="g-knopf-leise" type="button" id="mb-poll" aria-expanded="false">Poll-Antwort zeigen</button>
        </div>
        <div class="b-poll" id="mb-poll-ausgabe" hidden></div>
      </div>
    </div>
  </section>

  <section class="b-abschnitt" id="last">
    <div class="b-abschnitt__kopf">
      <h2>Wer bekommt die Task?</h2>
      <p>Hosten mehrere Clients denselben Befehl, vergleicht der Realm ihre Busy-Points und gibt die Task dem, der am wenigsten zu tun hat.</p>
    </div>
    <div class="b-flaeche">
      <div class="b-hosts" id="hosts"></div>
      <div class="b-last__fuss">
        <span class="b-last__meldung" id="last-meldung">Alle drei hosten <span class="b-code-inline">bild.verkleinern</span>.</span>
        <div class="b-knopfreihe">
          <button class="g-knopf" type="button" id="last-aufruf">Aufruf schicken</button>
          <button class="g-knopf-leise" type="button" id="last-abarbeiten">Alle arbeiten eine ab</button>
        </div>
      </div>
    </div>
  </section>

  <section class="b-abschnitt" id="realms">
    <div class="b-abschnitt__kopf">
      <h2>Drei Arten von Realms</h2>
      <p>Wie offen ein Realm ist, entscheidet, wer beitreten, Befehle anbieten und Befehle aufrufen darf.</p>
    </div>
    <div class="b-realms" id="realm-arten"></div>
  </section>

  <section class="b-abschnitt" id="katalog">
    <div class="b-abschnitt__kopf">
      <h2>Bewegung · Entwürfe 45–52</h2>
      <p>Die Bibliothek geht bei 45 weiter. Jede Animation läuft einmal und startet per Klick neu, ohne Dauer-Schleifen. Was dir gefällt, wandert nach <code>animationen.css</code> und <code>ANIMATIONEN.md</code>.</p>
    </div>
    <div class="b-katalog" id="katalog-kacheln"></div>
  </section>

  <section class="b-abschnitt" id="extensions">
    <div class="b-abschnitt__kopf">
      <h2>Extensions</h2>
      <p>Bridge selbst ist Python. Damit man überall andocken kann, gibt es für jede sinnvolle Sprache eine Extension. Hier testen wir nur, wie Code-Beispiele auf der Bridge-Seite aussehen.</p>
    </div>
    <div class="b-ext">
      <div class="b-flaeche">
        <div class="b-sprachen" id="sprachen"></div>
        <p class="b-hinweis">Platzhalter: Die Funktionsnamen sind angenommen. Sobald 1.1 und die Extensions auf GitHub sind, setze ich die echten ein.</p>
      </div>
      <pre class="b-code" id="code-beispiel"></pre>
    </div>
  </section>

  <p class="b-fuss">Bridge-Labor · nur Entwurf, verbindet sich mit keinem Server. Gebaut nach Bridge 1.0 (Realm, MailBox, sender, /call/command, /poll, /respond).</p>
`

// ==========================================================
// 1 · Kopfbereich: lebendiges Netz
// ==========================================================
const held = document.getElementById("held-netz")
const REALM = { x: 300, y: 200 }
const HELD_CLIENTS = [
  { x: 95,  y: 80,  name: "Laptop" },
  { x: 70,  y: 230, name: "Handy" },
  { x: 165, y: 345, name: "Raspberry Pi" },
  { x: 505, y: 80,  name: "Desktop" },
  { x: 530, y: 230, name: "NAS" },
  { x: 435, y: 345, name: "Browser" },
]
const R_RING = 54
// Andockpunkt am Client (Seite oder Ober-/Unterkante, je nach Lage) und am Ring
function andocken(c, w = 64, h = 42) {
  const dx = REALM.x - c.x, dy = REALM.y - c.y
  let a, da
  if (Math.abs(dx) * .7 > Math.abs(dy)) { da = { x: Math.sign(dx), y: 0 }; a = { x: c.x + da.x * w / 2, y: c.y } }
  else { da = { x: 0, y: Math.sign(dy) }; a = { x: c.x, y: c.y + da.y * h / 2 } }
  const r = einheit(a.x - REALM.x, a.y - REALM.y)
  return verbindung(a, { x: REALM.x + r.x * R_RING, y: REALM.y + r.y * R_RING }, da, r)
}
function heldZeichnen() {
  held.innerHTML = ""
  const linien = svgEl("g", {}, held)
  HELD_CLIENTS.forEach((c) => {
    c.v = andocken(c)
    svgEl("path", { d: c.v.d, class: "b-linie" }, linien)
  })
  realmZeichen(held, REALM.x, REALM.y, 1, "")
  const name = svgEl("text", { x: REALM.x, y: REALM.y + 82, "text-anchor": "middle", class: "b-text--gross" }, held)
  name.textContent = "Realm „Werkstatt“"
  HELD_CLIENTS.forEach((c, i) => {
    c.g = client(held, c.x, c.y, c.name)
    if (i % 2 === 0) keimling(c.g, 22, -21, false)
  })
}
heldZeichnen()

let heldLaeuft = false
async function heldAufruf() {
  if (heldLaeuft || document.hidden || bewegungAus()) return
  heldLaeuft = true
  const hosts = HELD_CLIENTS.filter((_, i) => i % 2 === 0)
  const host = hosts[Math.floor(Math.random() * hosts.length)]
  const andere = HELD_CLIENTS.filter((c) => c !== host)
  const rufer = andere[Math.floor(Math.random() * andere.length)]
  // Aufruf: ein durchgehender Weg Rufer → Realm → Host
  const hin = weg(rufer.v, host.v, REALM)
  await signal(held, hin.d, { beiStrecke: [[hin.mitte, () => welle(held, REALM.x, REALM.y, 30)]] })
  arbeitet(host.g, 1200)
  await warte(700)
  // Antwort: derselbe Weg zurück
  const zurueck = weg(host.v, rufer.v, REALM)
  await signal(held, zurueck.d, { farbeVar: "--b-resp", beiStrecke: [[zurueck.mitte, () => welle(held, REALM.x, REALM.y, 30, "--b-resp")]] })
  heldLaeuft = false
}
;(async () => {
  await warte(900)
  await heldAufruf()
  for (;;) {
    await warte(1600 + Math.random() * 2200)          // ruhiger, unregelmäßiger Rhythmus
    if (!bewegungDezent()) await heldAufruf()
  }
})()

// Richtungs-Schalter
app.querySelectorAll(".b-segment button").forEach((knopf) => {
  knopf.addEventListener("click", () => {
    richtung = knopf.dataset.richtung
    app.dataset.richtung = richtung
    app.querySelectorAll(".b-segment button").forEach((b) => b.setAttribute("aria-pressed", b === knopf))
    document.getElementById("richtung-info").textContent = RICHTUNGEN[richtung].info
    heldZeichnen()
    ablaufZeichnen()
    kachelnZeichnen()
  })
})

// ==========================================================
// 2 · Der Weg eines Aufrufs
// ==========================================================
const ablauf = document.getElementById("ablauf-bild")
const A_B = { x: 110, y: 120 }, A_R = { x: 360, y: 120 }, A_A = { x: 610, y: 120 }
const SCHRITTE = [
  { titel: "Ausgangslage", endpunkt: "", text: "Zwei Clients sind mit dem Realm „Werkstatt“ verbunden. Jeder hat seine eigene Mailbox mit drei Pools: Task, Instruction, Response." },
  { titel: "A bietet eine Funktion an", endpunkt: "POST /realm/command", text: "Client A meldet „bild.verkleinern“ an. Der Realm merkt sich: Diesen Befehl hostet A." },
  { titel: "B ruft sie auf", endpunkt: "POST /call/command", text: "B fragt den Realm nach „bild.verkleinern“, mitsamt Argumenten. Wer die Funktion ausführt, muss B nicht wissen." },
  { titel: "Der Realm wählt den Host", endpunkt: "get_least_busy_client()", text: "Alle Hosts des Befehls werden verglichen: Busy-Points = Tasks + 2 × Instructions. Hier gibt es nur A, also bekommt A die Task." },
  { titel: "Task landet bei A", endpunkt: "task_pool · message_id", text: "Der Aufruf liegt jetzt als Task in A.task_pool. Er ist mit einer message_id registriert, damit die Antwort später den Weg zurück findet." },
  { titel: "A holt ab und arbeitet", endpunkt: "POST /poll", text: "A fragt regelmäßig seine Mailbox ab, findet die Task und führt die Funktion bei sich aus." },
  { titel: "Antwort geht an B", endpunkt: "POST /respond", text: "A antwortet mit der message_id. Bridge prüft die Route, legt das Ergebnis in B.response_pool und löscht die Task bei A." },
]
let schritt = 0
let ablaufBeschaeftigt = false

function mailboxZeichnen(x, titel, inhalt, neu) {
  const g = svgEl("g", { transform: `translate(${x - 96} 230)` }, ablauf)
  const t = svgEl("text", { x: 96, y: 0, "text-anchor": "middle", class: "b-text--klein" }, g)
  t.textContent = titel
  const pools = [["task", "Task"], ["instr", "Instr."], ["resp", "Resp."]]
  pools.forEach(([art, name], i) => {
    const px = i * 66
    svgEl("rect", { x: px, y: 14, width: 58, height: 128, rx: 8, class: "b-pool" }, g)
    const l = svgEl("text", { x: px + 29, y: 160, "text-anchor": "middle", class: "b-text--klein" }, g)
    l.textContent = name
    ;(inhalt[art] || []).forEach((n, j) => {
      const chip = svgEl("rect", { x: px + 7, y: 120 - j * 22, width: 44, height: 16, class: `b-chip b-chip--${art}` + (neu === `${art}${j}` ? " b49" : "") }, g)
      chip.setAttribute("rx", 4)
      const ct = svgEl("text", { x: px + 29, y: 131 - j * 22, "text-anchor": "middle", class: "b-text--mono", style: "fill:var(--auf-akzent);font-size:9px" }, g)
      ct.textContent = n
      if (neu === `${art}${j}`) ct.classList.add("b49")
    })
  })
}

function ablaufZeichnen(neu = {}) {
  // laufende Signale behalten, damit nichts abreißt
  const laufend = [...ablauf.querySelectorAll(":scope > .b-signal")]
  ablauf.innerHTML = ""
  const s = schritt
  const AR = R_RING * .82
  const vB = verbindung({ x: A_B.x + 34, y: A_B.y }, { x: A_R.x - AR, y: A_R.y }, { x: 1, y: 0 }, { x: -1, y: 0 })
  const vA = verbindung({ x: A_A.x - 34, y: A_A.y }, { x: A_R.x + AR, y: A_R.y }, { x: -1, y: 0 }, { x: 1, y: 0 })
  ablauf._vA = vA; ablauf._vB = vB
  ablauf._gA = null
  svgEl("path", { d: vB.d, class: "b-linie" + (s >= 2 ? " b-linie--aktiv" : "") }, ablauf)
  svgEl("path", { d: vA.d, class: "b-linie" + (s >= 1 ? " b-linie--aktiv" : "") }, ablauf)

  realmZeichen(ablauf, A_R.x, A_R.y, .82, "")
  const rn = svgEl("text", { x: A_R.x, y: A_R.y + 66, "text-anchor": "middle", class: "b-text" }, ablauf)
  rn.textContent = "Realm „Werkstatt“"
  if (s >= 1) {
    const cmd = svgEl("text", { x: A_R.x, y: A_R.y + 86, "text-anchor": "middle", class: "b-text--mono" + (neu.cmd ? " b-auftauchen" : "") }, ablauf)
    cmd.textContent = "bild.verkleinern → A"
  }
  if (s === 3) {
    const ring = svgEl("circle", { cx: A_A.x, cy: A_A.y, r: 46, fill: "none", stroke: farbe("--amber"), "stroke-width": 1.6, "stroke-dasharray": "4 5", class: "b-auftauchen" }, ablauf)
    ring.setAttribute("opacity", .8)
    const bp = svgEl("text", { x: A_A.x, y: A_A.y - 54, "text-anchor": "middle", class: "b-text--mono b-auftauchen" }, ablauf)
    bp.textContent = "Busy-Points: 0"
  }

  const gB = client(ablauf, A_B.x, A_B.y, "Client B", { w: 68, h: 46 })
  const gA = client(ablauf, A_A.x, A_A.y, "Client A", { w: 68, h: 46, ziel: s >= 3 && s <= 5 })
  ablauf._gA = gA
  if (s >= 1) keimling(gA, 24, -23, !!neu.keim)
  if (s === 5) {
    const r = svgEl("circle", { cx: 0, cy: 0, r: 30, fill: "none", stroke: farbe("--amber"), "stroke-width": 2, "stroke-dasharray": "40 150", "stroke-linecap": "round", class: bewegungAus() ? "" : "b-arbeitet" }, gA)
    r.setAttribute("opacity", .9)
  }

  const inhaltA = { task: s === 4 ? ["#7f3a"] : [], instr: [], resp: [] }
  const inhaltB = { task: [], instr: [], resp: s >= 6 ? ["#7f3a"] : [] }
  mailboxZeichnen(A_B.x, "Mailbox von B", inhaltB, neu.pool === "B" ? "resp0" : null)
  mailboxZeichnen(A_A.x, "Mailbox von A", inhaltA, neu.pool === "A" ? "task0" : null)

  // Text
  const info = SCHRITTE[s]
  document.getElementById("ablauf-nr").textContent = `Schritt ${s} von ${SCHRITTE.length - 1}`
  document.getElementById("ablauf-titel").textContent = info.titel
  document.getElementById("ablauf-erkl").textContent = info.text
  const ep = document.getElementById("ablauf-endpunkt")
  ep.textContent = info.endpunkt
  ep.hidden = !info.endpunkt
  document.getElementById("ablauf-schritte").innerHTML = SCHRITTE.slice(1).map((_, i) => `<span class="${i < s ? "an" : ""}"></span>`).join("")
  document.getElementById("ablauf-zurueck").disabled = s === 0 || ablaufBeschaeftigt
  document.getElementById("ablauf-weiter").textContent = s === SCHRITTE.length - 1 ? "Von vorn" : "Weiter"
  laufend.forEach((g) => ablauf.appendChild(g))
}

async function ablaufWeiter() {
  if (ablaufBeschaeftigt) return
  if (schritt === SCHRITTE.length - 1) { schritt = 0; ablaufZeichnen(); return }
  ablaufBeschaeftigt = true
  const ziel = schritt + 1
  const vA = ablauf._vA, vB = ablauf._vB
  const amRealm = (v, fv) => [[laenge(v.d) - 1, () => welle(ablauf, A_R.x, A_R.y, 24, fv)]]
  let neu = {}
  if (ziel === 1) { await signal(ablauf, vA.d, { farbeVar: "--b-resp", beiStrecke: amRealm(vA, "--b-resp") }); neu = { keim: true, cmd: true } }
  if (ziel === 2) { await signal(ablauf, vB.d, { beiStrecke: amRealm(vB) }) }
  if (ziel === 4) { await signal(ablauf, vA.dRueck); neu = { pool: "A" } }
  if (ziel === 5) { arbeitet(ablauf._gA, 1400) }
  if (ziel === 6) {
    const w = weg(vA, vB, A_R)
    await signal(ablauf, w.d, { farbeVar: "--b-resp", beiStrecke: [[w.mitte, () => welle(ablauf, A_R.x, A_R.y, 24, "--b-resp")]] })
    neu = { pool: "B" }
  }
  schritt = ziel
  ablaufBeschaeftigt = false
  ablaufZeichnen(neu)
}
document.getElementById("ablauf-weiter").addEventListener("click", ablaufWeiter)
document.getElementById("ablauf-zurueck").addEventListener("click", () => {
  if (ablaufBeschaeftigt || schritt === 0) return
  schritt--; ablaufZeichnen()
})
document.getElementById("ablauf-alles").addEventListener("click", async () => {
  if (ablaufBeschaeftigt) return
  schritt = 0; ablaufZeichnen()
  for (let i = 1; i < SCHRITTE.length; i++) {
    await warte(i === 1 ? 300 : 1400)
    await ablaufWeiter()
  }
})
ablaufZeichnen()

// ==========================================================
// 3 · Mailbox
// ==========================================================
const POOLS = [
  { art: "task",  feld: "task_pool",        name: "Task",        wofuer: "Jemand ruft eine Funktion auf, die dieser Client hostet." },
  { art: "instr", feld: "instruction_pool", name: "Instruction", wofuer: "Anweisungen an den Client. Zählen doppelt bei der Auslastung." },
  { art: "resp",  feld: "response_pool",    name: "Response",    wofuer: "Ergebnisse von Aufrufen, die dieser Client selbst gestartet hat." },
]
const mailbox = { task: [], instr: [], resp: [] }
const BEFEHLE = { task: ["bild.verkleinern", "pdf.zusammen", "licht.an"], instr: ["neu.verbinden", "cache.leeren"], resp: ["wetter.jetzt", "datei.liste"] }
const poolsEl = document.getElementById("pools")
poolsEl.innerHTML = POOLS.map((p) => `
  <div class="b-poolbox">
    <div class="b-poolbox__kopf"><strong><span class="b-poolbox__farbe b-nachricht--${p.art}"></span>${p.name}</strong><span>${p.feld}</span></div>
    <div class="b-poolbox__wofuer">${p.wofuer}</div>
    <div class="b-poolbox__inhalt" data-pool="${p.art}"></div>
  </div>`).join("")

function zufallsId() { return Math.random().toString(16).slice(2, 6) }
function mailboxNeu(art) {
  if (mailbox[art].length >= 7) return
  const liste = BEFEHLE[art]
  const n = { id: zufallsId(), inhalt: liste[Math.floor(Math.random() * liste.length)] }
  mailbox[art].push(n)
  const el = document.createElement("div")
  el.className = `b-nachricht b-nachricht--${art} b-nachricht--neu`
  el.dataset.id = n.id
  el.innerHTML = `<span>${n.inhalt}</span><span>#${n.id}</span>`
  poolsEl.querySelector(`[data-pool="${art}"]`).appendChild(el)
  mailboxStatus()
}
function mailboxErledigen() {
  const n = mailbox.task.shift()
  if (!n) return
  const el = poolsEl.querySelector(`[data-pool="task"] [data-id="${n.id}"]`)
  if (el && !bewegungAus()) { el.classList.add("b-nachricht--weg"); setTimeout(() => el.remove(), 360) }
  else el?.remove()
  mailboxStatus()
}
function mailboxStatus() {
  const t = mailbox.task.length, i = mailbox.instr.length
  document.getElementById("busy-zahl").textContent = t + 2 * i
  document.getElementById("busy-formel").innerHTML = `<b>${t}</b> Tasks + 2 × <b>${i}</b> Instructions. Responses zählen nicht mit.`
  const aus = document.getElementById("mb-poll-ausgabe")
  const json = (art) => mailbox[art].map((n) => ({ message_id: n.id, content: art === "task" ? { command_name: n.inhalt, command_args: {} } : n.inhalt, origin_client_ip: "10.0.0." + (n.id.charCodeAt(0) % 40 + 2) }))
  aus.textContent = JSON.stringify({ task_pool: json("task"), response_pool: json("resp"), instruction_pool: json("instr") }, null, 2)
}
app.querySelectorAll("[data-neu]").forEach((k) => k.addEventListener("click", () => mailboxNeu(k.dataset.neu)))
document.getElementById("mb-erledigen").addEventListener("click", mailboxErledigen)
document.getElementById("mb-poll").addEventListener("click", (e) => {
  const aus = document.getElementById("mb-poll-ausgabe")
  aus.hidden = !aus.hidden
  e.currentTarget.setAttribute("aria-expanded", !aus.hidden)
  e.currentTarget.textContent = aus.hidden ? "Poll-Antwort zeigen" : "Poll-Antwort verbergen"
})
mailboxNeu("task"); mailboxNeu("instr"); mailboxNeu("resp")

// ==========================================================
// 4 · Lastverteilung
// ==========================================================
const hosts = [
  { name: "Laptop",       tasks: 3, instr: 1 },
  { name: "Raspberry Pi", tasks: 1, instr: 0 },
  { name: "NAS",          tasks: 2, instr: 1 },
]
const hostsEl = document.getElementById("hosts")
hostsEl.innerHTML = hosts.map((h, i) => `
  <div class="b-host" data-host="${i}">
    <span class="b-host__name">${h.name}</span>
    <span class="b-host__balken"><span></span></span>
    <span class="b-host__punkte"></span>
  </div>`).join("")
const punkte = (h) => h.tasks + 2 * h.instr
function hostsZeichnen(gewaehlt = -1) {
  hosts.forEach((h, i) => {
    const row = hostsEl.querySelector(`[data-host="${i}"]`)
    row.querySelector(".b-host__balken > span").style.width = Math.min(100, punkte(h) * 8) + "%"
    row.querySelector(".b-host__punkte").textContent = punkte(h) + " P"
    row.classList.toggle("b-host--gewaehlt", i === gewaehlt)
  })
}
document.getElementById("last-aufruf").addEventListener("click", () => {
  let best = 0
  hosts.forEach((h, i) => { if (punkte(h) < punkte(hosts[best])) best = i })
  hosts[best].tasks++
  hostsZeichnen(best)
  document.getElementById("last-meldung").textContent = `Task geht an ${hosts[best].name}: Er hatte die wenigsten Busy-Points.`
})
document.getElementById("last-abarbeiten").addEventListener("click", () => {
  hosts.forEach((h) => { if (h.tasks > 0) h.tasks--; else if (h.instr > 0) h.instr-- })
  hostsZeichnen()
  document.getElementById("last-meldung").textContent = "Jeder Host hat eine Nachricht erledigt."
})
hostsZeichnen()

// ==========================================================
// 5 · Realm-Arten
// ==========================================================
const ARTEN = [
  {
    id: "public", name: "Public", text: "Offen für alle Clients auf dem Server. Jeder darf Befehle anbieten und aufrufen.",
    fakten: ["Kein Schlüssel nötig", "Jeder kann hosten"],
  },
  {
    id: "protected", name: "Protected", text: "Beitritt nur mit dem Access-Key des Realms. Auf Wunsch darf nur der Besitzer Befehle anbieten.",
    fakten: ["Ein gemeinsamer Access-Key", "Option: nur Besitzer hostet"],
  },
  {
    id: "private", name: "Private", text: "Jeder Schlüssel vergibt Rollen. Rollen entscheiden, wer hosten darf und wer welchen Befehl aufrufen darf.",
    fakten: ["Mehrere Keys mit Rollen", "Befehle mit erlaubten Rollen"],
  },
]
const artenEl = document.getElementById("realm-arten")
artenEl.innerHTML = ARTEN.map((a) => `
  <div class="b-flaeche b-realm">
    <svg viewBox="0 0 300 170" data-art="${a.id}" role="img" aria-label="${a.name} Realm: Beitritt"></svg>
    <h3>${a.name}</h3>
    <p>${a.text}</p>
    <div class="b-realm__fakten">${a.fakten.map((f) => `<span>· ${f}</span>`).join("")}</div>
    <button class="g-knopf-leise" type="button" data-beitritt="${a.id}">Beitritt zeigen</button>
  </div>`).join("")

// Sanfte Bewegung von 0 → 1 über ms (läuft im selben Takt wie die Signale)
function bewege(ms, fn) {
  if (bewegungAus()) { fn(1); return Promise.resolve() }
  return new Promise((fertig) => {
    let start = null
    const schritt = (t) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / ms)
      fn(.5 - .5 * Math.cos(Math.PI * p))
      if (p >= 1) { SIGNALE.delete(schritt); fertig() }
    }
    SIGNALE.add(schritt)
    taktStarten()
  })
}
const mix = (a, b, e) => a + (b - a) * e

// Schlüssel liegend: Ring links, Bart rechts – zeigt zum Realm
function schluessel(eltern, rolle) {
  const g = svgEl("g", { class: "b-schluessel" }, eltern)
  svgEl("circle", { cx: -7, cy: 0, r: 4.5 }, g)
  svgEl("path", { d: "M-2.5 0 H11 M7 0 V3.5 M10 0 V3" }, g)
  if (rolle) {
    const [name, f] = rolle
    svgEl("rect", { x: -14, y: 8, width: 30, height: 13, rx: 6.5, fill: farbe(f), class: "b-schluessel__marke" }, g)
    const t = svgEl("text", { x: 1, y: 17.6, "text-anchor": "middle", class: "b-text--klein", style: "fill:var(--auf-akzent);stroke:none;font-size:9px;font-weight:600" }, g)
    t.textContent = name
  }
  return g
}

// Tor-Szene: Client links, Realm rechts, Tor-Ring drumherum.
//   art: public (Tor offen) · protected (Schlüssel) · private (Schlüssel mit Rolle)
// Gibt eine Funktion zurück, die den Beitritt abspielt.
function torSzene(svg, { R, C, art, skala = .62, torR = 46, beschriftung = true }) {
  svg.innerHTML = ""
  const kernR = 16 * skala
  const zugang = `M${P({ x: C.x + 20, y: C.y })} L${P({ x: R.x - kernR, y: R.y })}`
  // Weg: gestrichelt (wartet) → durchgezogen (verbunden), weich überblendet
  svgEl("path", { d: zugang, class: "b-zugang" }, svg)
  const fest = svgEl("path", { d: zugang, class: "b-linie b-linie--aktiv b-zugang--fest" }, svg)

  // Tor: Lücke in Prozent des Umfangs, immer genau zur Client-Seite (links)
  const tor = svgEl("circle", { cx: R.x, cy: R.y, r: torR, class: "b-tor", pathLength: 100 }, svg)
  const luecke = (g) => {
    tor.setAttribute("stroke-dasharray", `${(100 - g).toFixed(2)} ${g.toFixed(2)}`)
    tor.setAttribute("stroke-dashoffset", (-(50 + g / 2)).toFixed(2))
  }
  const offen = art === "public" ? 22 : 0
  luecke(offen)

  realmZeichen(svg, R.x, R.y, skala)
  const mitglieder = [[R.x + 13, R.y - 13], [R.x + 15, R.y + 12]]
  mitglieder.forEach(([x, y]) => svgEl("circle", { cx: x, cy: y, r: 3.6, class: "b-mitglied" }, svg))

  const client = svgEl("g", { transform: `translate(${C.x} ${C.y})` }, svg)
  svgEl("rect", { x: -20, y: -13, width: 40, height: 26, class: "b-knoten" }, client)
  svgEl("rect", { x: -14, y: -7, width: 28, height: 14, class: "b-knoten-schirm" }, client)

  const rolle = art === "private" ? ["host", "--gut"] : null
  const keyStart = { x: C.x + 40, y: C.y }
  const keyZiel = { x: R.x - torR - 14, y: R.y }
  let key = null
  if (art !== "public") {
    key = schluessel(svg, rolle)
    key.setAttribute("transform", `translate(${P(keyStart)})`)
  }

  let status = null
  if (beschriftung) {
    status = svgEl("text", { x: 14, y: 22, class: "b-text--klein" }, svg)
    status.textContent = "will beitreten"
  }

  let laeuft = false, fertig = false
  return async function beitreten() {
    if (laeuft || fertig) return
    laeuft = true
    const spalt = art === "private" ? 12 : 18
    if (key) {
      // 1 · Schlüssel gleitet den Weg entlang zum Tor
      await bewege(950, (e) => key.setAttribute("transform", `translate(${mix(keyStart.x, keyZiel.x, e).toFixed(2)} ${keyStart.y})`))
      // 2 · Schlüssel geht im Tor auf, das Tor öffnet sich
      await bewege(520, (e) => {
        key.setAttribute("opacity", (1 - e).toFixed(3))
        key.setAttribute("transform", `translate(${mix(keyZiel.x, keyZiel.x + 12, e).toFixed(2)} ${keyZiel.y})`)
        luecke(mix(0, spalt, e))
      })
    }
    // 3 · Client verbindet sich: Signal durch das Tor bis in den Kern
    fest.classList.add("an")
    await signal(svg, zugang, { tempo: .2, beiStrecke: [[laenge(zugang) - 1, () => welle(svg, R.x, R.y, 22)]] })
    arbeitet(client, 900)
    // 4 · neues Mitglied erscheint im Realm
    const neu = svgEl("circle", { cx: R.x - 3, cy: R.y + 17, r: 3.6, class: "b-mitglied b-mitglied--neu" }, svg)
    if (rolle) neu.style.fill = `var(${rolle[1]})`
    // 5 · Tor schließt sich wieder hinter ihm
    if (key) { await warte(250); await bewege(620, (e) => luecke(mix(spalt, 0, e))) }
    if (status) status.textContent = rolle ? `beigetreten · Rolle ${rolle[0]}` : "beigetreten"
    laeuft = false
    fertig = true
  }
}

const REALM_SZENE = { R: { x: 205, y: 82 }, C: { x: 52, y: 82 } }
const beitritte = {}
function realmArtZeichnen(id) {
  const svg = artenEl.querySelector(`svg[data-art="${id}"]`)
  beitritte[id] = torSzene(svg, { ...REALM_SZENE, art: id })
}
ARTEN.forEach((a) => realmArtZeichnen(a.id))
artenEl.querySelectorAll("[data-beitritt]").forEach((k) => k.addEventListener("click", async () => {
  const id = k.dataset.beitritt
  if (k.disabled) return
  if (k.dataset.gespielt) realmArtZeichnen(id)        // nochmal: frisch aufbauen
  k.disabled = true
  await beitritte[id]()
  k.dataset.gespielt = "1"
  k.disabled = false
  k.textContent = "Nochmal zeigen"
}))

// ==========================================================
// 6 · Animations-Katalog 45–52
// ==========================================================
const KACHELN = [
  { nr: 45, name: "Andocken", text: "Ein Client gleitet an den Realm, die Verbindung zieht sich nach.", wo: "Neuer Client verbindet sich" },
  { nr: 46, name: "Funktion keimt", text: "Aus dem Client wächst ein Keimling: Er bietet jetzt etwas an.", wo: "/realm/command" },
  { nr: 47, name: "Aufruf fließt", text: "Ein Amber-Puls mit Schweif läuft zum Host.", wo: "/call/command" },
  { nr: 48, name: "Antwort kehrt heim", text: "Der grüne Puls läuft den Weg zurück.", wo: "/respond" },
  { nr: 49, name: "In den Pool", text: "Eine Nachricht fällt mit kleinem Federn in ihren Pool.", wo: "Mailbox" },
  { nr: 50, name: "Waage", text: "Auslastungs-Balken gleichen sich weich an.", wo: "Lastverteilung" },
  { nr: 51, name: "Realm atmet", text: "Die Jahresringe weiten sich dreimal und kommen zur Ruhe.", wo: "Realm geöffnet / erstellt" },
  { nr: 52, name: "Schlüssel öffnet", text: "Der Schlüssel gleitet zum Tor, es öffnet sich, der Client tritt ein, das Tor schließt wieder.", wo: "Beitritt Protected / Private" },
]
const katalogEl = document.getElementById("katalog-kacheln")
katalogEl.innerHTML = KACHELN.map((k) => `
  <div class="b-flaeche b-kachel">
    <svg viewBox="0 0 260 140" data-kachel="${k.nr}" aria-hidden="true"></svg>
    <div class="b-kachel__kopf"><strong>${k.name}</strong><span class="b-kachel__nr">${k.nr}</span></div>
    <p>${k.text}<br>Für: ${k.wo}</p>
    <button class="g-knopf-leise" type="button" data-spielen="${k.nr}">Abspielen</button>
  </div>`).join("")

function kachel(nr, animiert) {
  const svg = katalogEl.querySelector(`svg[data-kachel="${nr}"]`)
  svg.innerHTML = ""
  const R = { x: 190, y: 70 }, C = { x: 60, y: 70 }
  const linie = () => pfadD({ x: C.x + 28, y: C.y }, { x: R.x - 38, y: R.y })
  if (nr === 45) {
    realmZeichen(svg, R.x, R.y, .7)
    svgEl("path", { d: linie(), class: "b-linie" + (animiert ? " b45-linie" : "") }, svg)
    const g = svgEl("g", { class: animiert ? "b45-knoten" : "" }, svg)
    client(g, C.x, C.y, "", { w: 56, h: 38 })
    if (animiert) setTimeout(() => welle(svg, R.x, R.y, 26), 1100)
  }
  if (nr === 46) {
    const g = client(svg, 130, 82, "", { w: 80, h: 50 })
    keimling(g, 0, -25, animiert)
  }
  if (nr === 47 || nr === 48) {
    realmZeichen(svg, R.x, R.y, .7)
    const d = linie()
    svgEl("path", { d, class: "b-linie" }, svg)
    client(svg, C.x, C.y, "", { w: 56, h: 38 })
    if (animiert) {
      const v = verbindung({ x: C.x + 28, y: C.y }, { x: R.x - 38, y: R.y })
      signal(svg, nr === 47 ? v.d : v.dRueck, { farbeVar: nr === 47 ? "--b-task" : "--b-resp", tempo: .18 })
    }
  }
  if (nr === 49) {
    svgEl("rect", { x: 100, y: 20, width: 60, height: 104, rx: 8, class: "b-pool" }, svg)
    ;[0, 1].forEach((j) => { const c = svgEl("rect", { x: 108, y: 100 - j * 22, width: 44, height: 16, class: "b-chip b-chip--task" }, svg); c.setAttribute("rx", 4) })
    const neu = svgEl("rect", { x: 108, y: 56, width: 44, height: 16, class: "b-chip b-chip--instr" + (animiert ? " b49" : "") }, svg)
    neu.setAttribute("rx", 4)
  }
  if (nr === 50) {
    const werte = animiert ? [.45, .5, .4] : [.9, .2, .6]
    werte.forEach((w, i) => {
      svgEl("rect", { x: 30, y: 32 + i * 30, width: 200, height: 10, rx: 5, fill: farbe("--ground-deep") }, svg)
      const b = svgEl("rect", { x: 30, y: 32 + i * 30, width: 200 * (animiert ? [.9, .2, .6][i] : w), height: 10, rx: 5, fill: farbe(i === 1 ? "--flieder" : "--amber") }, svg)
      if (animiert) {
        b.style.transition = bewegungAus() ? "none" : "width .9s cubic-bezier(.2,.8,.2,1)"
        requestAnimationFrame(() => requestAnimationFrame(() => b.setAttribute("width", 200 * w)))
      }
    })
  }
  if (nr === 51) {
    const g = realmZeichen(svg, 130, 70, .9)
    if (animiert) g.querySelectorAll(".b-ring").forEach((r, i) => { r.classList.add("b51"); r.style.animationDelay = `${i * .15}s` })
  }
  if (nr === 52) {
    const abspielen = torSzene(svg, { R: { x: 192, y: 70 }, C: { x: 44, y: 70 }, art: "protected", skala: .58, torR: 42, beschriftung: false })
    if (animiert) abspielen()
  }
}
function kachelnZeichnen() { KACHELN.forEach((k) => kachel(k.nr, false)) }
kachelnZeichnen()
katalogEl.querySelectorAll("[data-spielen]").forEach((k) => k.addEventListener("click", () => kachel(Number(k.dataset.spielen), true)))

// ==========================================================
// 7 · Extensions (Platzhalter-Code)
// ==========================================================
const CODE = {
  Python: `<span class="k">from</span> bridge_client <span class="k">import</span> Bridge

bridge = Bridge(<span class="s">"https://bridge.example"</span>, name=<span class="s">"laptop"</span>, passwort=<span class="s">"…"</span>)
werkstatt = bridge.realm(<span class="s">"Werkstatt"</span>)

<span class="c"># Funktion anbieten – landet als Befehl im Realm</span>
<span class="f">@werkstatt.befehl</span>(<span class="s">"bild.verkleinern"</span>)
<span class="k">def</span> <span class="f">verkleinern</span>(pfad, breite):
    ...
    <span class="k">return</span> neuer_pfad

<span class="c"># Funktion eines anderen Clients aufrufen</span>
ergebnis = werkstatt.rufe(<span class="s">"pdf.zusammen"</span>, dateien=[...])`,
  JavaScript: `<span class="k">import</span> { Bridge } <span class="k">from</span> <span class="s">"bridge-client"</span>

<span class="k">const</span> bridge = <span class="k">await</span> Bridge.verbinden(<span class="s">"https://bridge.example"</span>, { name: <span class="s">"browser"</span> })
<span class="k">const</span> werkstatt = bridge.realm(<span class="s">"Werkstatt"</span>)

<span class="c">// Funktion anbieten</span>
werkstatt.<span class="f">befehl</span>(<span class="s">"licht.an"</span>, <span class="k">async</span> ({ raum }) => schalte(raum))

<span class="c">// Funktion aufrufen</span>
<span class="k">const</span> klein = <span class="k">await</span> werkstatt.<span class="f">rufe</span>(<span class="s">"bild.verkleinern"</span>, { pfad, breite: <span class="s">800</span> })`,
  Lua: `<span class="c">-- z. B. für Roblox</span>
<span class="k">local</span> Bridge = require(script.BridgeClient)
<span class="k">local</span> werkstatt = Bridge.verbinden(<span class="s">"https://bridge.example"</span>):realm(<span class="s">"Werkstatt"</span>)

werkstatt:<span class="f">befehl</span>(<span class="s">"spieler.zahl"</span>, <span class="k">function</span>()
    <span class="k">return</span> #game.Players:GetPlayers()
<span class="k">end</span>)`,
  "C#": `<span class="k">var</span> bridge = <span class="k">await</span> Bridge.VerbindenAsync(<span class="s">"https://bridge.example"</span>, <span class="s">"desktop"</span>);
<span class="k">var</span> werkstatt = bridge.Realm(<span class="s">"Werkstatt"</span>);

werkstatt.<span class="f">Befehl</span>(<span class="s">"pdf.zusammen"</span>, (<span class="k">string</span>[] dateien) => Pdf.Zusammen(dateien));
<span class="k">var</span> klein = <span class="k">await</span> werkstatt.<span class="f">RufeAsync</span>(<span class="s">"bild.verkleinern"</span>, <span class="k">new</span> { pfad, breite = <span class="s">800</span> });`,
}
const sprachenEl = document.getElementById("sprachen")
const codeEl = document.getElementById("code-beispiel")
sprachenEl.innerHTML = Object.keys(CODE).map((s, i) => `<button class="b-sprache" type="button" data-sprache="${s}" aria-pressed="${i === 0}">${s}</button>`).join("")
codeEl.innerHTML = CODE.Python
sprachenEl.querySelectorAll("[data-sprache]").forEach((k) => k.addEventListener("click", () => {
  sprachenEl.querySelectorAll("[data-sprache]").forEach((b) => b.setAttribute("aria-pressed", b === k))
  codeEl.innerHTML = CODE[k.dataset.sprache]
}))
