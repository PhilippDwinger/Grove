// ==========================================================
// Gewächshaus · Abteil „Schrift“ (NUR ZUM TESTEN)
// T01–T14: Überschriften, Zitate, Hervorhebungen, kleine Typo-Details.
// CSS: css/dienste/gewaechshaus/schrift.css (.gt)
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/schrift.css"

const SCHRIFT = [
  { nr: "T01", name: "Initial", idee: "Großer erster Buchstabe in Fraunces und Amber, der über drei Zeilen reicht – wie in einem alten Buch.",
    einsatz: "Lange Notizen, Jahresringe-Rückblick",
    html: `<p class="gt01">Grove wächst langsam, aber stetig. Jede Notiz ist ein Ring, jede Verbindung eine Wurzel, die tiefer greift als gedacht.</p>` },
  { nr: "T02", name: "Kicker + Titel", idee: "Kleine gesperrte Zeile über dem Titel sagt, wo man ist. Der Titel bleibt ruhig.",
    einsatz: "Seitenköpfe aller Dienste",
    html: `<div class="gt02"><span>Myzel · Notiz</span><h3>Server-Pläne</h3><p>Zuletzt bearbeitet vor 5 Min.</p></div>` },
  { nr: "T03", name: "Zitat", idee: "Riesiges, blasses Anführungszeichen hinter dem Text, Quelle klein darunter.",
    einsatz: "Myzel-Zitate, „Gedanke des Tages“",
    html: `<blockquote class="gt03"><p>Die beste Zeit, einen Baum zu pflanzen, war vor zwanzig Jahren. Die zweitbeste ist jetzt.</p><cite>Sprichwort</cite></blockquote>` },
  { nr: "T04", name: "Marker", idee: "Wichtige Wörter bekommen einen warmen Leuchtstift-Strich, der beim Hover über den Absatz nachgezogen wird.",
    einsatz: "Hervorhebungen in Notizen (==Text==)",
    html: `<p class="gt04">Dateien bleiben <mark>auf deinem Gerät</mark>. Supabase kennt nur den <mark>Steckbrief</mark>.</p>` },
  { nr: "T05", name: "Handschrift-Strich", idee: "Unter einem Wort zieht sich ein geschwungener Strich wie mit dem Füller – beim Hover zeichnet er sich neu.",
    einsatz: "Begrüßung, Titel",
    html: `<h3 class="gt05">Guten <span>Abend<svg viewBox="0 0 120 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 9 C30 3 60 12 88 6 S115 5 118 8"/></svg></span>, Paddy</h3>` },
  { nr: "T06", name: "Trenner mit Ringen", idee: "Abschnitts-Trenner: zwei feine Linien und dazwischen drei kleine Jahresringe.",
    einsatz: "Zwischen Bereichen, Ende einer Notiz",
    html: `<div class="gt06"><span></span><svg viewBox="0 0 30 14" aria-hidden="true"><circle cx="15" cy="7" r="6"/><circle cx="15" cy="7" r="3.5"/><circle cx="15" cy="7" r="1"/></svg><span></span></div>` },
  { nr: "T07", name: "Große Zahl", idee: "Zahl groß in Fraunces, Einheit klein und hochgestellt daneben.",
    einsatz: "Speicher, Statistiken",
    html: `<div class="gt07"><strong>12<sup>MB</sup></strong><span>von 500 MB</span></div>` },
  { nr: "T08", name: "Kursiver Akzent", idee: "In Überschriften ein Wort kursiv in Amber – wie das „o“ im Logo-Schriftzug.",
    einsatz: "Begrüßung, Banner",
    html: `<h3 class="gt08">Was <em>wächst</em> heute?</h3>` },
  { nr: "T09", name: "Tasten", idee: "Tastenkürzel als kleine, plastische Tasten mit Schatten unten.",
    einsatz: "Hilfe, Suche, Tooltips",
    html: `<p class="gt09">Drück <kbd>Strg</kbd> + <kbd>K</kbd> zum Suchen, <kbd>Esc</kbd> zum Schließen.</p>` },
  { nr: "T10", name: "Randnotiz", idee: "Kleine Notiz am Rand mit Verbindungsstrich zum Wort, auf das sie sich bezieht.",
    einsatz: "Myzel-Kommentare, Erklärungen",
    html: `<div class="gt10"><p>Bridge nutzt <span class="gt10__wort">Realms</span>, um Geräte zu gruppieren.</p><aside>Realm = ein Raum, in dem Clients andocken.</aside></div>` },
  { nr: "T11", name: "Ring-Aufzählung", idee: "Listenpunkte als kleine Ringe; Unterpunkte als einzelne Punkte.",
    einsatz: "Notizen, Anleitungen",
    html: `<ul class="gt11"><li>Server kaufen<ul><li>ThinkCentre M920q</li><li>2 TB SSD</li></ul></li><li>Domain holen</li><li>Tunnel einrichten</li></ul>` },
  { nr: "T12", name: "Verlaufs-Schrift", idee: "Großer Schriftzug mit feinem Verlauf von Amber zu Flieder – ruhig, ohne Bewegung.",
    einsatz: "Startbildschirm, Dienst-Logos",
    html: `<span class="gt12">Bridge</span>` },
  { nr: "T13", name: "Zeit-Chips", idee: "Relative Zeiten als kleine Chips. Was bald fällig ist, wird warm.",
    einsatz: "Knospen (Fälligkeit), Glocke",
    html: `<div class="gt13"><span>vor 3 Min.</span><span class="bald">heute 18:00</span><span class="drueber">seit gestern</span><span>Fr., 17. Okt.</span></div>` },
  { nr: "T14", name: "Code im Text", idee: "Inline-Code mit warmem Grund, Code-Block mit Zeilennummern und einer Amber-Leiste links.",
    einsatz: "Anleitungen, Notizen mit Befehlen",
    buehne: "hoch",
    html: `<div class="gt14"><p>Starte mit <code>npm run dev</code>:</p><pre><code><span>npm install</span><span>npm run build</span><span>npm run preview</span></code></pre></div>` },
]

export default {
  id: "schrift",
  name: "Schrift",
  kurz: "Typo-Details",
  beschreibung: "Kleine Schrift-Ideen, die Grove eine eigene Stimme geben: Initialen, Zitate, Marker, Tasten, Zeit-Chips.",
  vorschau: `<span class="gh-vs" style="font:italic 400 2.4rem var(--font-display);color:var(--amber)">Aa</span>`,
  anzahl: SCHRIFT.length,
  bauen(el) { kacheln(el, SCHRIFT) },
}
