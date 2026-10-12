// ==========================================================
// Gewächshaus · Abteil „Ladeanimationen“ (NUR ZUM TESTEN)
// Entwürfe L01–L08. Das CSS steht in css/dienste/gewaechshaus.css (.gl01 … .gl08).
// Gefällt Paddy einer, wandert er mit der nächsten Nummer (.a45 …)
// nach animationen.css + ANIMATIONEN.md (siehe CLAUDE.md, Animations-Bibliothek).
// ==========================================================
import { esc } from "../../kern/html.js"

// Hilfen für wiederholte SVG-Teile
const ringe = (klein) => `
  <svg class="gl01${klein ? " gl--klein" : ""}" viewBox="0 0 64 64" aria-hidden="true">
    <circle class="spur" cx="32" cy="32" r="27"/><circle class="spur" cx="32" cy="32" r="19"/>${klein ? "" : '<circle class="spur" cx="32" cy="32" r="11"/>'}
    <circle class="lauf" cx="32" cy="32" r="27" pathLength="100" stroke-dasharray="16 84"/>
    <circle class="lauf lauf--2" cx="32" cy="32" r="19" pathLength="100" stroke-dasharray="22 78"/>
    ${klein ? "" : '<circle class="lauf lauf--3" cx="32" cy="32" r="11" pathLength="100" stroke-dasharray="30 70"/>'}
    <circle class="kern" cx="32" cy="32" r="${klein ? 5 : 3}"/>
  </svg>`
const saiten = (xs, cls) => `
  <svg class="gl02${cls}" viewBox="0 0 ${xs.length * 12 + 16} 48" aria-hidden="true">
    ${xs.map((x) => `<path class="ruhe" d="M${x} 6 V42"/>`).join("")}
    ${xs.map((x, i) => `<path class="saite" style="--i:${i}" d="M${x} 6 Q${x + 11} 24 ${x} 42"/>`).join("")}
  </svg>`
const keimling = (cls = "") => `
  <svg class="gl03${cls}" viewBox="0 0 48 48" aria-hidden="true">
    <path class="boden" d="M10 40 H38"/>
    <g class="pflanze">
      <path class="stiel" d="M24 40 V22" pathLength="1"/>
      <path class="blatt blatt--l" d="M24 30 C24 25 19.5 22 15 22 C15 27 18.5 30 24 30 Z"/>
      <path class="blatt blatt--r" d="M24 26 C24 21 28.5 18 33 18 C33 23 29.5 26 24 26 Z"/>
    </g>
  </svg>`
const myzel = (cls = "") => `
  <svg class="gl04${cls}" viewBox="0 0 64 56" aria-hidden="true">
    <path class="netz" d="M12 46 L32 10 L52 46 Z"/>
    <path class="faden" d="M12 46 L32 10 L52 46 Z" pathLength="100"/>
    <circle class="knoten k1" cx="12" cy="46" r="4.5"/><circle class="knoten k2" cx="32" cy="10" r="4.5"/><circle class="knoten k3" cx="52" cy="46" r="4.5"/>
  </svg>`

const LADER = [
  { nr: "L01", name: "Rillen", idee: "Drei Spuren laufen in den Jahresringen, jede in ihrem Tempo, wie Rillen auf einer Platte. Der Kern bleibt ruhig.",
    einsatz: "Seite oder Dienst lädt", gross: ringe(false), klein: ringe(true), kleinText: "Dienst wird geladen" },
  { nr: "L02", name: "Walking Bass", idee: "Vier Kontrabass-Saiten werden nacheinander gezupft und schwingen aus, wie eine laufende Basslinie.",
    einsatz: "Etwas wird verarbeitet (Bridge-Task, Senden)", gross: saiten([14, 26, 38, 50], ""), klein: saiten([10, 22, 34], " gl--klein"), kleinText: "Wird gesendet" },
  { nr: "L03", name: "Keimling", idee: "Ein Stiel wächst, zwei Blätter öffnen sich, dann wird er still und es beginnt von vorn.",
    einsatz: "Etwas Neues wird angelegt", gross: keimling(), klein: keimling(" gl--klein"), kleinText: "Notiz wird angelegt" },
  { nr: "L04", name: "Myzel-Faden", idee: "Ein Faden läuft durch drei Knoten. Jeder Knoten leuchtet kurz, wenn der Faden ihn erreicht.",
    einsatz: "Verbindungen werden gesucht (Suche, Myzel-Netz)", gross: myzel(), klein: myzel(" gl--klein"), kleinText: "Verbindungen suchen" },
  { nr: "L05", name: "Glühwürmchen", idee: "Drei Glühwürmchen schweben träge durch die Nacht und glimmen nacheinander auf, mit dunklen Pausen dazwischen.",
    einsatz: "Kurzes Warten, überall", gross: `<span class="gl05" aria-hidden="true"><i></i><i></i><i></i></span>`,
    klein: `<span class="gl05 gl--klein" aria-hidden="true"><i></i><i></i><i></i></span>`, kleinText: "Einen Moment" },
  { nr: "L06", name: "Wurzelspur", idee: "Ein Lichtstreifen gleitet durch eine feine Leitung, sanft an und sanft aus.",
    einsatz: "Oben an der Seite oder unter einer Kopfzeile", gross: `<span class="gl06" aria-hidden="true"></span>`,
    klein: `<span class="gl06 gl--klein" aria-hidden="true"></span>`, kleinText: "Postfach lädt" },
  { nr: "L07", name: "Platzhalter-Karte", idee: "Die Karte steht schon da, ein warmer Schimmer zieht drüber, bis die Inhalte kommen.",
    einsatz: "Listen und Karten (Mails, Notizen, Rinde)", gross: `<span class="gl07" aria-hidden="true"><i class="rund"></i><i></i><i class="z2"></i><i class="z3"></i></span>`,
    klein: `<span class="gl07z" aria-hidden="true"></span>`, kleinText: "" },
  { nr: "L08", name: "Schimmernde Schrift", idee: "Ein Lichtstreifen wandert durch die Worte, wie Bühnenlicht über einen Schriftzug.",
    einsatz: "Statt eines Symbols, wenn Text gut passt", gross: `<span class="gl08">Einen Moment …</span>`,
    klein: `<span class="gl08 gl--klein">Lädt …</span>`, kleinText: "" },
]

const TEMPI = [["1.6", "Langsam"], ["1", "Normal"], ["0.65", "Schnell"]]

export default {
  id: "ladeanimationen",
  name: "Ladeanimationen",
  kurz: "Warten, aber schön",
  beschreibung: "Entwürfe für alles, was lädt. Groß zum Ansehen und klein so, wie sie später neben Text stehen. Sag einfach die Nummer, die dir gefällt.",
  vorschau: `<span class="gl05" aria-hidden="true"><i></i><i></i><i></i></span>`,
  anzahl: LADER.length,
  bauen(el) {
    el.innerHTML = `
      <div class="gh-werkzeug">
        <span class="gh-werkzeug__titel">Tempo</span>
        <div class="gh-segment" role="group" aria-label="Tempo">
          ${TEMPI.map(([w, n]) => `<button type="button" data-tempo="${w}" aria-pressed="${w === "1"}">${n}</button>`).join("")}
        </div>
      </div>
      <div class="gh-kacheln">
        ${LADER.map((l) => `
          <article class="gh-kachel">
            <div class="gh-buehne">${l.gross}</div>
            <div class="gh-kachel__kopf"><strong>${esc(l.name)}</strong><span class="gh-nr">${l.nr}</span></div>
            <p>${esc(l.idee)}</p>
            <p class="gh-einsatz">Für: ${esc(l.einsatz)}</p>
            <div class="gh-klein"><span class="gh-klein__titel">Klein</span>${l.klein}${l.kleinText ? `<span>${esc(l.kleinText)}</span>` : ""}</div>
          </article>`).join("")}
      </div>`
    el.querySelectorAll("[data-tempo]").forEach((k) => k.addEventListener("click", () => {
      el.style.setProperty("--gl-tempo", k.dataset.tempo)
      el.querySelectorAll("[data-tempo]").forEach((b) => b.setAttribute("aria-pressed", b === k))
    }))
  },
}
