// ==========================================================
// Gewächshaus · Abteil „Übergänge“ (NUR ZUM TESTEN)
// U01–U14: Wie Dinge erscheinen (Seiten, Listen, Zahlen, Text).
// Jede Kachel hat „Nochmal“. CSS: css/dienste/gewaechshaus/uebergaenge.css (.gu)
// Gefällt einer: als Eingang (EINGAENGE in thema-daten.js) oder Seitenwechsel nutzen.
// ==========================================================
import { kacheln, TEMPO_LEISTE, tempoEinrichten } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/uebergaenge.css"

const zeilen = (n, kl = "") => Array.from({ length: n }, (_, i) => `<span class="gu-zeile ${kl}" style="--i:${i}"><b></b><i></i></span>`).join("")
const karte = `<div class="gu-karte"><strong>Myzel</strong><span></span><span class="kurz"></span></div>`

const UEBERGAENGE = [
  { nr: "U01", name: "Gestaffelt aufsteigen", idee: "Einträge steigen nacheinander ein Stück hoch und werden sichtbar – wie Pflanzen, die nacheinander aufgehen.",
    einsatz: "Listen, Karten auf der Lichtung", html: `<div class="gu-liste gu01">${zeilen(4)}</div>` },
  { nr: "U02", name: "Ring-Öffnung", idee: "Der Inhalt öffnet sich als wachsender Kreis aus der Mitte – wie ein Jahresring.",
    einsatz: "Seitenwechsel, Dienst öffnen", html: `<div class="gu02">${karte}</div>` },
  { nr: "U03", name: "Vorhang auf", idee: "Zwei Vorhanghälften gleiten zur Seite, dahinter liegt der Inhalt. Für große Momente.",
    einsatz: "Begrüßung, erster Login", html: `<div class="gu03"><div class="gu03__buehne"><strong>Willkommen, Paddy</strong></div><i class="l"></i><i class="r"></i></div>` },
  { nr: "U04", name: "Blätter fallen", idee: "Alter Inhalt fällt wie Laub leicht gedreht nach unten weg, der neue steht schon dahinter.",
    einsatz: "Ansicht wechseln, Filter leeren", html: `<div class="gu04"><div class="neu">${karte}</div><div class="alt">${zeilen(3)}</div></div>` },
  { nr: "U05", name: "Aus dem Nebel", idee: "Inhalt kommt unscharf und hell an und wird scharf – wie Nebel, der sich hebt.",
    einsatz: "Bilder, Banner, Szenen", html: `<div class="gu05">${karte}</div>` },
  { nr: "U06", name: "Zeilen enthüllen", idee: "Text erscheint Zeile für Zeile hinter einer Maske, von unten nach oben.",
    einsatz: "Überschriften, Begrüßung",
    html: `<p class="gu06"><span><span style="--i:0">Guten Abend,</span></span><span><span style="--i:1">Paddy. Drei Knospen</span></span><span><span style="--i:2">warten auf dich.</span></span></p>` },
  { nr: "U07", name: "Zahl zählt hoch", idee: "Kennzahlen zählen beim Erscheinen von 0 hoch und bremsen sanft ab.",
    einsatz: "„Heute“, Speicheranzeige, Statistik",
    html: `<div class="gu07"><div><strong data-ziel="42">0</strong><span>Notizen</span></div><div><strong data-ziel="128">0</strong><span>MB frei</span></div><div><strong data-ziel="7">0</strong><span>Geräte</span></div></div>`,
    an(b) {
      b.querySelectorAll("[data-ziel]").forEach((z) => {
        const ziel = +z.dataset.ziel, start = performance.now(), dauer = 1400
        const tick = (t) => { const p = Math.min(1, (t - start) / dauer), e = 1 - Math.pow(1 - p, 3); z.textContent = Math.round(ziel * e); if (p < 1) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
    } },
  { nr: "U08", name: "Karte wird Seite", idee: "Eine Karte wächst auf die ganze Fläche und wird zur Seite – so fühlt sich ein Dienst-Öffnen verbunden an.",
    einsatz: "Lichtung → Dienst (View Transitions)", html: `<div class="gu08"><div class="gu08__karte"><strong>Harz</strong><span class="inhalt">${zeilen(3)}</span></div></div>` },
  { nr: "U09", name: "Wurzel zeichnet sich", idee: "Erst wächst eine feine Wurzel-Linie, dann erscheinen die Punkte, die sie verbindet.",
    einsatz: "Myzel-Netz, Bridge-Verbindung",
    html: `<svg class="gu09" viewBox="0 0 260 120" aria-hidden="true"><path pathLength="1" d="M20 60 C70 10 110 110 150 60 S220 20 240 60"/><circle cx="20" cy="60" r="6"/><circle cx="150" cy="60" r="6"/><circle cx="240" cy="60" r="6"/></svg>` },
  { nr: "U10", name: "Platte setzt auf", idee: "Eine Platte sinkt auf den Teller, dreht sich eine Runde aus und bleibt liegen. Nur einmal.",
    einsatz: "Grove-Start, Musik in Harz",
    html: `<svg class="gu10" viewBox="0 0 120 120" aria-hidden="true"><circle class="teller" cx="60" cy="60" r="54"/><g class="platte"><circle cx="60" cy="60" r="48"/><circle class="rille" cx="60" cy="60" r="40"/><circle class="rille" cx="60" cy="60" r="32"/><circle class="rille" cx="60" cy="60" r="24"/><circle class="etikett" cx="60" cy="60" r="14"/><path class="glanz" d="M60 12a48 48 0 0 1 34 14"/></g><circle class="achse" cx="60" cy="60" r="2.5"/></svg>` },
  { nr: "U11", name: "Schreibmaschine", idee: "Text tippt sich Buchstabe für Buchstabe, der Cursor blinkt danach noch zweimal und geht.",
    einsatz: "Begrüßung, Suche-Platzhalter",
    html: `<p class="gu11"><span></span><i></i></p>`,
    an(b) {
      const s = b.querySelector(".gu11 span"), satz = "Was wächst heute?"; let i = 0
      const tipp = () => { s.textContent = satz.slice(0, ++i); if (i < satz.length) setTimeout(tipp, 55 + Math.random() * 70); else b.querySelector(".gu11").classList.add("ist-fertig") }
      setTimeout(tipp, 300)
    } },
  { nr: "U12", name: "Wischen mit Licht", idee: "Der Inhalt wird von links freigelegt, an der Kante läuft ein warmer Lichtstreifen mit.",
    einsatz: "Banner, neue Bereiche", html: `<div class="gu12">${karte}</div>` },
  { nr: "U13", name: "Knospe öffnet", idee: "Inhalt wächst aus einem kleinen Punkt unten, wird erst schmal hoch, dann breit – wie eine Knospe, die aufgeht.",
    einsatz: "Neue Karte erscheint (Knospe angelegt)", html: `<div class="gu13">${karte}</div>` },
  { nr: "U14", name: "Netz verbindet sich", idee: "Punkte erscheinen, dann ziehen sich nacheinander die Fäden zwischen ihnen.",
    einsatz: "Myzel-Netz laden, Bridge-Realm",
    html: `<svg class="gu14" viewBox="0 0 220 120" aria-hidden="true">${[[[30, 30], [110, 20]], [[110, 20], [190, 45]], [[30, 30], [70, 95]], [[70, 95], [150, 95]], [[150, 95], [190, 45]], [[110, 20], [150, 95]]].map(([a, c], i) => `<path pathLength="1" style="--i:${i}" d="M${a}L${c}"/>`).join("")}${[[30, 30], [110, 20], [190, 45], [70, 95], [150, 95]].map(([x, y], i) => `<circle style="--i:${i}" cx="${x}" cy="${y}" r="5"/>`).join("")}</svg>` },
]

export default {
  id: "uebergaenge",
  name: "Übergänge",
  kurz: "Wie Dinge erscheinen",
  beschreibung: "Erscheinen, Seitenwechsel, Zählen, Tippen. Jede Kachel spielt einmal ab – mit „Nochmal“ startet sie neu. Tempo lässt sich oben ändern.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="13" stroke-dasharray="4 4"/><circle cx="24" cy="24" r="20" stroke-dasharray="2 6"/></svg></span>`,
  anzahl: UEBERGAENGE.length,
  bauen(el) {
    kacheln(el, UEBERGAENGE.map((u) => ({ ...u, nochmal: true })), { werkzeug: TEMPO_LEISTE })
    tempoEinrichten(el)
  },
}
