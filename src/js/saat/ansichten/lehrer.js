// ==========================================================
// Saat · Professor Uhu – der Lehrer im Gesprächsmodus
// Aussehen: SVG (Farben nur über CSS-Variablen → passt zu jedem Laub-Thema).
// Stimmungen über data-stimmung am Element (CSS in saat.css, Abschnitt „Professor Uhu“):
//   ruhig (atmet, blinzelt) · spricht (Schnabel) · freut (hüpft, Augen lachen) · traurig (Kopf neigt sich)
//   · denkt (schaut aufs Eingabefeld) · winkt (Begrüßung)
// Redewendungen: je Anlass mehrere, nie zweimal hintereinander dieselbe.
// ==========================================================
import { esc } from "../../kern/html.js"

export const NAME = "Professor Uhu"

export const UHU_SVG = `
<svg class="uhu" viewBox="0 0 160 190" role="img" aria-label="${NAME}, eine Eule mit Brille und Doktorhut">
  <g class="uhu__ast"><path d="M8 176 C50 168 110 168 152 176" /><path d="M120 171 c6 -4 10 -10 12 -16" /></g>
  <g class="uhu__ganz">
    <g class="uhu__fluegel uhu__fluegel--l"><path d="M34 104 C14 118 16 150 38 160 C40 140 42 122 46 108 Z" /></g>
    <g class="uhu__fluegel uhu__fluegel--r"><path d="M126 104 C146 118 144 150 122 160 C120 140 118 122 114 108 Z" /></g>
    <g class="uhu__koerper">
      <ellipse class="uhu__rumpf" cx="80" cy="122" rx="46" ry="48" />
      <ellipse class="uhu__bauch" cx="80" cy="132" rx="30" ry="33" />
      <path class="uhu__federn" d="M62 124 q6 6 12 0 q6 6 12 0 q6 6 12 0 M66 138 q6 6 12 0 q6 6 12 0 M70 152 q5 5 10 0 q5 5 10 0" />
    </g>
    <g class="uhu__fuesse"><path d="M66 168 l-4 6 M70 168 l0 7 M74 168 l4 6 M86 168 l-4 6 M90 168 l0 7 M94 168 l4 6" /></g>
    <g class="uhu__kopf">
      <path class="uhu__ohr" d="M40 52 L34 22 L58 42 Z" /><path class="uhu__ohr" d="M120 52 L126 22 L102 42 Z" />
      <ellipse class="uhu__schaedel" cx="80" cy="70" rx="44" ry="38" />
      <path class="uhu__maske" d="M80 50 C62 40 42 48 40 68 C40 88 58 98 80 90 C102 98 120 88 120 68 C118 48 98 40 80 50 Z" />
      <g class="uhu__augen">
        <circle class="uhu__auge" cx="62" cy="68" r="12" /><circle class="uhu__auge" cx="98" cy="68" r="12" />
        <g class="uhu__pupillen"><circle cx="63" cy="69" r="5.5" /><circle cx="97" cy="69" r="5.5" /><circle class="uhu__glanz" cx="65" cy="66.5" r="1.6" /><circle class="uhu__glanz" cx="99" cy="66.5" r="1.6" /></g>
        <g class="uhu__lider"><rect x="48" y="55" width="28" height="27" rx="13" /><rect x="84" y="55" width="28" height="27" rx="13" /></g>
        <g class="uhu__froh"><path d="M52 71 q10 -10 20 0" /><path d="M88 71 q10 -10 20 0" /></g>
      </g>
      <g class="uhu__brille"><circle cx="62" cy="68" r="15" /><circle cx="98" cy="68" r="15" /><path d="M77 66 q3 -3 6 0" /><path d="M47 64 l-8 -3 M113 64 l8 -3" /></g>
      <g class="uhu__schnabel"><path class="uhu__schnabel-oben" d="M73 82 L87 82 L80 94 Z" /><path class="uhu__schnabel-unten" d="M75 88 L85 88 L80 96 Z" /></g>
      <g class="uhu__hut">
        <path class="uhu__hut-kappe" d="M58 38 C58 30 102 30 102 38 L102 44 C90 40 70 40 58 44 Z" />
        <path class="uhu__hut-platte" d="M80 18 L124 30 L80 42 L36 30 Z" />
        <g class="uhu__quaste"><path d="M80 30 L112 36 L112 54" /><path class="uhu__quaste-ende" d="M109 54 l6 0 l-1 9 l-4 0 Z" /></g>
      </g>
    </g>
  </g>
</svg>`

// ---------- Redewendungen ----------
const SAETZE = {
    hallo: [
        "Hu-hu! Schön, dass du da bist. Ich hab ein paar Fragen für dich vorbereitet.",
        "Ah, da bist du ja! Setz dich, wir gehen ein paar Karten durch.",
        "Guten {tageszeit}! Bereit für eine kleine Lernrunde?",
        "Willkommen im Klassenzimmer unter den Bäumen. Fangen wir an?",
        "Hu-huu – heute stehen {anzahl} Aufgaben auf meinem Zettel. Los geht's!",
    ],
    serieHallo: [
        "Du lernst schon {streak} Tage am Stück – das gefällt mir! Weiter so.",
        "{streak} Tage in Folge! Da wackeln mir vor Freude die Federohren.",
    ],
    karte: [
        "Was bedeutet „{vorne}“? Überleg in Ruhe, dann schau nach.",
        "Sag es dir im Kopf: „{vorne}“ – was heißt das?",
        "Kennst du das hier noch? „{vorne}“",
        "Nächste Karte: „{vorne}“. Na, klingelt's?",
        "Denk kurz nach: „{vorne}“ …",
    ],
    karteBild: [
        "Schau dir das Bild genau an – {frage}",
        "Was siehst du hier? Überleg erst, dann deck auf.",
        "Erkennst du das? Sag es dir im Kopf.",
        "Bildrätsel! {frage}",
    ],
    auswahlBild: [
        "Schau aufs Bild – welche Antwort passt?",
        "Eins von dreien stimmt. {frage}",
        "Kleines Bilderquiz: Was nimmst du?",
    ],
    tippenBild: [
        "Schreib mir, was du auf dem Bild siehst.",
        "Genau hinschauen und eintippen: {frage}",
        "Ganz ohne Hilfe – was ist das?",
    ],
    auswahl: [
        "Welche Antwort passt zu „{vorne}“?",
        "Eins von dreien ist richtig. „{vorne}“ bedeutet …",
        "Kleines Quiz: „{vorne}“ – was nimmst du?",
        "Such dir die richtige aus: „{vorne}“.",
    ],
    tippen: [
        "Schreib mir bitte, was „{vorne}“ heißt.",
        "Tipp die Antwort ein: „{vorne}“ = ?",
        "Ganz frei, ohne Hilfe: Was ist „{vorne}“?",
        "Jetzt du – schreib's auf: „{vorne}“.",
    ],
    zeichnen: [
        "Nimm den Stift: {aufgabe}.",
        "Jetzt wird gezeichnet! {aufgabe}.",
        "{aufgabe} – mal es einfach ins Feld.",
        "Zeig mal, was deine Hand weiß: {aufgabe}.",
    ],
    aufdecken: ["Und – wie gut wusstest du es?", "Sei ehrlich: Wie lief's?", "Wie sicher warst du dir?"],
    richtig: ["Hervorragend!", "Ganz genau.", "Sehr gut – das sitzt.", "Hu-hu, richtig!", "Perfekt, weiter so.", "Genau so ist es.", "Ausgezeichnet!"],
    fast: ["Fast perfekt – achte auf die Schreibweise: „{antwort}“.", "Ich lass es gelten! Ganz genau wäre: „{antwort}“."],
    falsch: [
        "Nicht ganz. Richtig ist „{antwort}“ – das merken wir uns.",
        "Hmm, knapp daneben. Es heißt „{antwort}“.",
        "Kein Problem, dafür üben wir ja. Die Lösung: „{antwort}“.",
        "Fast! Gemeint war „{antwort}“. Die kommt gleich nochmal.",
    ],
    zeichnenRichtig: ["Schön gezeichnet – {prozent} % passen zur Vorlage!", "Das erkenne ich sofort. Sehr gut!", "Saubere Linien – richtig!"],
    zeichnenFalsch: ["Hmm, das sieht noch anders aus als die Vorlage ({prozent} %). Schau sie dir genau an.", "Noch nicht ganz – vergleich mal mit der Vorlage."],
    bewertetGut: ["Prima, dann sehen wir uns die Karte erst später wieder.", "Gut, die lassen wir eine Weile ruhen.", "Notiert!"],
    bewertetSchlecht: ["Kein Ding – die kommt gleich nochmal dran.", "Macht nichts, wir wiederholen sie bald.", "Alles gut, Wiederholung ist der Trick."],
    serie: ["Drei in Folge – du bist heute in Form!", "Fünf richtige am Stück! Respekt.", "Du hast einen Lauf!"],
    wiedergut: ["Siehst du – jetzt sitzt es.", "Na also! Beim zweiten Mal hat's geklappt."],
    korrigiert: ["Oh, da hab ich mich vertan – ich zähle es als richtig.", "Du hast recht, mein Fehler. Gezählt!"],
    korrigiertFalsch: ["In Ordnung, ich zähle es als falsch.", "Ehrlich bleibt am längsten – ist notiert."],
    ende: [
        "Das war's für heute! {richtig} von {gesamt} richtig. {lob}",
        "Feierabend im Klassenzimmer. {richtig} von {gesamt} – {lob}",
        "Geschafft! {richtig} von {gesamt} Aufgaben richtig. {lob}",
    ],
}
const LOB = [[0.9, "Großartig!"], [0.7, "Richtig gut."], [0.5, "Ordentlich – das wird."], [0, "Jeder Fehler ist eine Wiederholung mehr. Morgen sitzt mehr."]]

const zuletzt = new Map()
export function satz(art, werte = {}) {
    const liste = SAETZE[art] || [art]
    let i = Math.floor(Math.random() * liste.length)
    if (liste.length > 1 && i === zuletzt.get(art)) i = (i + 1) % liste.length
    zuletzt.set(art, i)
    return liste[i].replace(/\{(\w+)\}/g, (_, k) => werte[k] ?? "")
}
export const lobFuer = (quote) => LOB.find(([g]) => quote >= g)[1]
export function tageszeit(d = new Date()) {
    const h = d.getHours()
    return h < 11 ? "Morgen" : h < 17 ? "Tag" : "Abend"
}

// Text Zeichen für Zeichen schreiben, während der Uhu „spricht“
export function schreiben(el, text, uhu, { tempo = 16 } = {}) {
    return new Promise((ok) => {
        const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.bewegung === "aus"
        if (ruhig || text.length > 220) { el.innerHTML = esc(text); ok(); return }
        uhu.dataset.spricht = "1"
        let i = 0
        const z = [...text]
        const schritt = () => {
            i = Math.min(z.length, i + 2)
            el.textContent = z.slice(0, i).join("")
            if (i < z.length) setTimeout(schritt, tempo)
            else { delete uhu.dataset.spricht; ok() }
        }
        schritt()
    })
}

export function stimmung(uhu, art, dauer = 1400) {
    uhu.dataset.stimmung = art
    clearTimeout(uhu._t)
    if (dauer) uhu._t = setTimeout(() => { uhu.dataset.stimmung = "ruhig" }, dauer)
}
