// ==========================================================
// Gewächshaus · Abteil „Knöpfe“ (NUR ZUM TESTEN)
// Entwürfe K01–K14. CSS: css/dienste/gewaechshaus/knoepfe.css (Präfix .gk)
// Regel aus Paddys Geschmack: Knöpfe bewegen sich NUR bei Hover/Klick, nie dauernd.
// ==========================================================
import { kacheln, warten } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/knoepfe.css"

const pfeil = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>`
const plus = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`
const stern = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg>`
const runter = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`

const KNOEPFE = [
  { nr: "K01", name: "Harz steigt", idee: "Leiser Knopf mit Rand. Beim Hover steigt die Farbe von unten hoch, wie Harz im Glas.",
    einsatz: "Zweite Aktion neben einem Hauptknopf",
    html: `<button class="gk gk01" type="button"><span>Notiz anlegen</span></button>` },
  { nr: "K02", name: "Rille", idee: "Beim Hover zieht sich von der Mitte aus eine feine Linie unter den Text, wie eine Rille auf der Platte.",
    einsatz: "Text-Knöpfe, Navigation",
    html: `<button class="gk gk02" type="button">Alle Dienste</button>` },
  { nr: "K03", name: "Eindrücken", idee: "Hebt sich beim Hover um einen Pixel, beim Klicken sinkt er spürbar ein. Fühlt sich an wie eine echte Taste.",
    einsatz: "Hauptknopf überall",
    html: `<button class="gk gk03" type="button">Speichern</button>` },
  { nr: "K04", name: "Pfeil-Schritt", idee: "Der Pfeil macht beim Hover einen kleinen Schritt nach vorn.",
    einsatz: "Weiter, Öffnen, zum Dienst",
    html: `<button class="gk gk04" type="button"><span>Zu Myzel</span>${pfeil}</button>` },
  { nr: "K05", name: "Klick-Welle", idee: "Ein Ring breitet sich genau dort aus, wo geklickt wurde – einmal, dann ist Ruhe.",
    einsatz: "Große Flächen-Knöpfe, Karten",
    html: `<button class="gk gk05" type="button">Klick mich irgendwo</button>`,
    an(b) {
      b.querySelector(".gk05").addEventListener("pointerdown", (e) => {
        const k = e.currentTarget, r = k.getBoundingClientRect()
        const w = document.createElement("i")
        w.style.left = e.clientX - r.left + "px"
        w.style.top = e.clientY - r.top + "px"
        k.append(w)
        w.addEventListener("animationend", () => w.remove())
      })
    } },
  { nr: "K06", name: "Speichern-Ablauf", idee: "Klick → drei Glühwürmchen im Knopf → Haken und „Gespeichert“ → nach 2 s wieder normal. Die Breite bleibt gleich.",
    einsatz: "Speichern, Senden, alles was dauert",
    html: `<button class="gk gk06" type="button" data-zustand="ruhe">
      <span class="gk06__text">Speichern</span>
      <span class="gk06__laden" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="gk06__fertig"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg>Gespeichert</span>
    </button>`,
    an(b) {
      const k = b.querySelector(".gk06")
      k.addEventListener("click", async () => {
        if (k.dataset.zustand !== "ruhe") return
        k.dataset.zustand = "laedt"; await warten(1400)
        k.dataset.zustand = "fertig"; await warten(2000)
        k.dataset.zustand = "ruhe"
      })
    } },
  { nr: "K07", name: "Zwei-Teiler", idee: "Hauptaktion links, kleiner Pfeil rechts für mehr Möglichkeiten. Getrennt durch eine feine Fuge.",
    einsatz: "„Speichern“ + „Speichern als …“, Mühle-Ziel",
    html: `<span class="gk07"><button class="gk" type="button">Als PDF</button><button class="gk gk07__mehr" type="button" aria-label="Weitere Formate">${runter}</button></span>` },
  { nr: "K08", name: "Plus dreht", idee: "Das Plus dreht sich beim Hover um eine Vierteldrehung. Klein, aber man merkt: hier entsteht was.",
    einsatz: "Neu anlegen (Notiz, Knospe, Eintrag)",
    html: `<button class="gk gk08" type="button">${plus}<span>Neue Knospe</span></button>` },
  { nr: "K09", name: "Warmer Schein", idee: "Keine Bewegung – beim Hover glimmt nur ein warmer Lichthof um den Knopf auf.",
    einsatz: "Wichtigster Knopf einer Seite",
    html: `<button class="gk gk09" type="button">Grove betreten</button>` },
  { nr: "K10", name: "Halten zum Löschen", idee: "Statt einer Rückfrage: Knopf gedrückt halten, die Füllung läuft durch – erst dann wird gelöscht. Loslassen bricht ab.",
    einsatz: "Löschen ohne Bestätigungs-Dialog",
    html: `<button class="gk gk10" type="button"><span class="gk10__fuell" aria-hidden="true"></span><span class="gk10__text">Halten zum Löschen</span></button>`,
    an(b) {
      const k = b.querySelector(".gk10"), t = k.querySelector(".gk10__text")
      let uhr
      const ab = () => { clearTimeout(uhr); if (!k.classList.contains("ist-fertig")) k.classList.remove("haelt") }
      k.addEventListener("pointerdown", () => {
        if (k.classList.contains("ist-fertig")) return
        k.classList.add("haelt")
        uhr = setTimeout(async () => {
          k.classList.add("ist-fertig"); t.textContent = "Gelöscht"
          await warten(1800)
          k.classList.remove("ist-fertig", "haelt"); t.textContent = "Halten zum Löschen"
        }, 1200)
      })
      ;["pointerup", "pointerleave", "pointercancel"].forEach((ev) => k.addEventListener(ev, ab))
    } },
  { nr: "K11", name: "Merken-Schalter", idee: "Ein Knopf, der an oder aus ist. Angeschaltet füllt sich der Stern, der Rand wird Amber.",
    einsatz: "Markieren (Mail), Favoriten",
    html: `<button class="gk gk11" type="button" aria-pressed="false">${stern}<span>Merken</span></button>`,
    an(b) {
      const k = b.querySelector(".gk11")
      k.addEventListener("click", () => {
        const an = k.getAttribute("aria-pressed") !== "true"
        k.setAttribute("aria-pressed", an)
        k.querySelector("span").textContent = an ? "Gemerkt" : "Merken"
      })
    } },
  { nr: "K12", name: "Runde Symbol-Knöpfe", idee: "Nur ein Zeichen, rund. Der Name erscheint als Grove-Tooltip darüber (statt des Browser-Tooltips).",
    einsatz: "Werkzeugleisten (Myzel, Harz)",
    html: `<span class="gk12">
      <button class="gk gk12__k" type="button" data-tipp="Fett"><b>B</b></button>
      <button class="gk gk12__k" type="button" data-tipp="Verknüpfen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg></button>
      <button class="gk gk12__k" type="button" data-tipp="Löschen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
    </span>` },
  { nr: "K13", name: "Plattenteller", idee: "Play-Knopf als kleine Platte. Nur solange etwas läuft, drehen sich die Rillen – beim Pausieren rollt sie aus.",
    einsatz: "Abspielen (Audio in Harz), Bridge-Task starten",
    html: `<button class="gk13" type="button" aria-pressed="false" aria-label="Abspielen">
      <svg class="gk13__platte" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22"/><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="12"/><path d="M24 2a22 22 0 0 1 15 6"/></svg>
      <svg class="gk13__zeichen" viewBox="0 0 24 24" aria-hidden="true"><path class="play" d="M9 7l8 5-8 5z"/><path class="pause" d="M9 7v10M15 7v10"/></svg>
    </button>`,
    an(b) {
      const k = b.querySelector(".gk13")
      k.addEventListener("click", () => k.setAttribute("aria-pressed", k.getAttribute("aria-pressed") !== "true"))
    } },
  { nr: "K14", name: "Wellen-Link", idee: "Text-Link, dessen Unterstrich sich beim Hover in eine kleine Welle legt – wie eine Saite, die schwingt, und wieder still wird.",
    einsatz: "Links im Fließtext",
    html: `<p class="gk14-text">Mehr dazu steht in <a class="gk14" href="#" onclick="return false">deinen Notizen</a>.</p>` },
  { nr: "K15", name: "Pille mit Zahl", idee: "Knopf mit kleinem Zähler rechts – z. B. wie viele Dateien gleich umgewandelt werden.",
    einsatz: "Sammel-Aktionen, Filter",
    html: `<button class="gk gk15" type="button">Umwandeln <span>3</span></button>` },
  { nr: "K16", name: "Gefahr leise", idee: "Löschen-Knopf, der erst beim Hover rot wird. Vorher ist er ruhig und schreit nicht.",
    einsatz: "Löschen in Detailansichten",
    html: `<button class="gk gk16" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>Löschen</button>` },
]

export default {
  id: "knoepfe",
  name: "Knöpfe",
  kurz: "Hover, Klick, Zustände",
  beschreibung: "Knopf-Ideen, die sich nur bewegen, wenn du sie berührst. Fahr drüber, klick, halt gedrückt – alles hier ist echt bedienbar.",
  vorschau: `<span class="gh-vs"><button class="gk gk04" type="button" tabindex="-1"><span>Weiter</span>${pfeil}</button></span>`,
  anzahl: KNOEPFE.length,
  bauen(el) { kacheln(el, KNOEPFE) },
}
