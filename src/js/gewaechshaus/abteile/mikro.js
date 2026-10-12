// ==========================================================
// Gewächshaus · Abteil „Kleine Momente“ (NUR ZUM TESTEN)
// Z01–Z14: Mikro-Interaktionen – einmalige kleine Antworten auf einen Klick.
// CSS: css/dienste/gewaechshaus/mikro.css (.gz)
// ==========================================================
import { kacheln, warten } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/mikro.css"

// Klasse kurz setzen, damit eine CSS-Animation einmal läuft
const einmal = (el, klasse) => { el.classList.remove(klasse); void el.offsetWidth; el.classList.add(klasse) }

const MIKRO = [
  { nr: "Z01", name: "Kopieren → Haken", idee: "Das Kopier-Zeichen dreht sich weg, ein Haken zeichnet sich – nach 1,5 s wieder zurück.", einsatz: "Rinde: Passwort kopieren, Links",
    html: `<button class="gz01" type="button" aria-label="Kopieren"><svg class="kopie" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg><svg class="haken" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1"/></svg></button><span class="gz-tipp">Klick</span>`,
    an(b) { const k = b.querySelector(".gz01"); k.onclick = async () => { k.classList.add("ist-ok"); await warten(1500); k.classList.remove("ist-ok") } } },
  { nr: "Z02", name: "Stern mit Funken", idee: "Beim Markieren füllt sich der Stern und fünf kleine Funken springen einmal heraus.", einsatz: "Mail markieren, Favoriten",
    html: `<button class="gz02" type="button" aria-pressed="false" aria-label="Markieren"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg>${Array.from({ length: 6 }, (_, i) => `<i style="--w:${i * 60}deg"></i>`).join("")}</button>`,
    an(b) { const k = b.querySelector(".gz02"); k.onclick = () => { const an = k.getAttribute("aria-pressed") !== "true"; k.setAttribute("aria-pressed", an); if (an) einmal(k, "funkt") } } },
  { nr: "Z03", name: "Glocke schwingt", idee: "Kommt eine Meldung, schwingt die Glocke einmal aus und der Punkt erscheint.", einsatz: "Glocke in der Kopfzeile",
    html: `<button class="gz03" type="button" aria-label="Glocke"><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path class="kloeppel" d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><i></i></button><span class="gz-tipp">Klick = Meldung kommt</span>`,
    an(b) { const k = b.querySelector(".gz03"); k.onclick = () => { einmal(k, "klingelt"); k.classList.add("hat-punkt") } } },
  { nr: "Z04", name: "Zeile welkt weg", idee: "Beim Löschen wird die Zeile blass, kippt leicht wie ein Blatt und die Liste schließt die Lücke weich.", einsatz: "Löschen in Listen",
    buehne: "hoch",
    html: `<div class="gz04">${["Einkaufsliste", "Server-Pläne", "Ideen für Grove", "Bridge-Notizen"].map((t) => `<div class="gz04__zeile"><span>${t}</span><button type="button" aria-label="Löschen">×</button></div>`).join("")}</div>`,
    nochmal: true,
    an(b) { b.querySelectorAll(".gz04 button").forEach((k) => k.onclick = () => { const z = k.closest(".gz04__zeile"); z.classList.add("welkt"); z.addEventListener("animationend", () => z.remove(), { once: true }) }) } },
  { nr: "Z05", name: "Zahl rollt", idee: "Ändert sich eine Zahl, rollt jede Ziffer einzeln an ihren Platz – wie ein altes Zählwerk.", einsatz: "Zähler, Speicher, Statistiken",
    html: `<div class="gz05"><span class="gz05__zahl"></span><button class="gh-demo-knopf gh-demo-knopf--leise" type="button">Neue Zahl</button></div>`,
    an(b) {
      const z = b.querySelector(".gz05__zahl")
      const zeigen = (n) => { const s = String(n).padStart(4, "0"); z.innerHTML = [...s].map((d) => `<span class="gz05__rad"><span style="translate:0 -${+d * 10}%">${"0123456789".split("").map((x) => `<b>${x}</b>`).join("")}</span></span>`).join("") }
      zeigen(1284)
      b.querySelector("button").onclick = () => { const n = Math.floor(Math.random() * 9999); [...z.querySelectorAll(".gz05__rad > span")].forEach((r, i) => r.style.translate = `0 -${+String(n).padStart(4, "0")[i] * 10}%`) }
    } },
  { nr: "Z06", name: "Herz wird Blüte", idee: "„Gefällt mir“ als Knospe: Beim Klick öffnet sie sich zur Blüte.", einsatz: "Lieblings-Notizen, Lesezeichen",
    html: `<button class="gz06" type="button" aria-pressed="false" aria-label="Gefällt mir"><svg viewBox="0 0 24 24"><path class="zu" d="M12 20c-3 0-5-3-5-7s3-8 5-9c2 1 5 5 5 9s-2 7-5 7z"/><g class="auf">${[0, 72, 144, 216, 288].map((w) => `<ellipse cx="12" cy="6.5" rx="3" ry="4.5" transform="rotate(${w} 12 12)"/>`).join("")}<circle cx="12" cy="12" r="2.2"/></g></svg></button>`,
    an(b) { const k = b.querySelector(".gz06"); k.onclick = () => k.setAttribute("aria-pressed", k.getAttribute("aria-pressed") !== "true") } },
  { nr: "Z07", name: "Umsortieren", idee: "Zeilen am Griff ziehen; die anderen weichen weich aus.", einsatz: "Knospen-Reihenfolge, Lichtung-Karten",
    buehne: "hoch",
    html: `<ul class="gz07">${["Bridge 1.1", "Server bestellen", "Domain holen", "Tunnel einrichten"].map((t) => `<li draggable="true"><i>⋮⋮</i>${t}</li>`).join("")}</ul>`,
    an(b) {
      const liste = b.querySelector(".gz07"); let zieh = null
      liste.addEventListener("dragstart", (e) => { zieh = e.target.closest("li"); zieh.classList.add("zieht") })
      liste.addEventListener("dragend", () => { zieh?.classList.remove("zieht"); zieh = null })
      liste.addEventListener("dragover", (e) => {
        e.preventDefault(); const ueber = e.target.closest("li"); if (!zieh || !ueber || ueber === zieh) return
        const vorher = [...liste.children].map((x) => [x, x.getBoundingClientRect().top])
        const r = ueber.getBoundingClientRect(); liste.insertBefore(zieh, e.clientY < r.top + r.height / 2 ? ueber : ueber.nextSibling)
        vorher.forEach(([x, top]) => { const d = top - x.getBoundingClientRect().top; if (d && x !== zieh) x.animate([{ translate: `0 ${d}px` }, { translate: "0 0" }], { duration: 220, easing: "ease-out" }) })
      })
    } },
  { nr: "Z08", name: "Abhaken mit Strich", idee: "Beim Erledigen zieht sich ein Strich durch den Text, die Zeile wird leiser und rutscht nach einem Moment ans Ende.", einsatz: "Knospen (Aufgaben)",
    buehne: "hoch",
    html: `<ul class="gz08">${["Server aussuchen", "Domain vergleichen", "Bridge-Doku lesen"].map((t) => `<li><button type="button" aria-label="Erledigt"></button><span>${t}</span></li>`).join("")}</ul>`,
    nochmal: true,
    an(b) { const l = b.querySelector(".gz08"); l.querySelectorAll("button").forEach((k) => k.onclick = async () => { const li = k.closest("li"); if (li.classList.contains("fertig")) return; li.classList.add("fertig"); await warten(900); const top = li.getBoundingClientRect().top; l.append(li); li.animate([{ translate: `0 ${top - li.getBoundingClientRect().top}px` }, { translate: "0 0" }], { duration: 350, easing: "ease-out" }) }) } },
  { nr: "Z09", name: "Kopfschütteln", idee: "Falsche Eingabe (z. B. Master-Passwort): das Feld schüttelt sanft den Kopf – zweimal, klein, kein Rot-Alarm.", einsatz: "Rinde entsperren, PIN",
    html: `<form class="gz09"><input type="password" value="falsch" aria-label="Master-Passwort"><button class="gh-demo-knopf" type="submit">Öffnen</button></form>`,
    an(b) { const f = b.querySelector("form"); f.onsubmit = (e) => { e.preventDefault(); einmal(f.querySelector("input"), "schuettelt") } } },
  { nr: "Z10", name: "Grove-Tooltip", idee: "Tooltip im Grove-Stil, erscheint nach kurzer Pause mit kleinem Pfeil – statt des grauen Browser-Kästchens.", einsatz: "Symbol-Knöpfe, Zahlen mit Erklärung",
    html: `<span class="gz10" tabindex="0">Busy-Points<span role="tooltip">Tasks + 2 × Instructions</span></span>` },
  { nr: "Z11", name: "Aktualisieren dreht einmal", idee: "Der Pfeil dreht genau eine Runde – lädt es länger, bleibt er weich in Bewegung, bis es fertig ist.", einsatz: "Postfach neu laden, Sync",
    html: `<button class="gz11" type="button" aria-label="Aktualisieren"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg></button><span class="gz-tipp">Klick</span>`,
    an(b) { const k = b.querySelector(".gz11"); k.onclick = async () => { if (k.classList.contains("dreht")) return; k.classList.add("dreht"); await warten(1600); k.classList.remove("dreht") } } },
  { nr: "Z12", name: "Aufklapp-Menü", idee: "Menü klappt aus dem Knopf heraus nach unten auf, Einträge erscheinen leicht gestaffelt.", einsatz: "Nutzermenü, „Mehr“-Menüs",
    buehne: "hoch",
    html: `<details class="gz12"><summary>Mehr<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary><div>${["Umbenennen", "Verschieben", "In Mühle öffnen", "Löschen"].map((t, i) => `<a href="#" onclick="return false" style="--i:${i}">${t}</a>`).join("")}</div></details>` },
  { nr: "Z13", name: "Avatar wechselt", idee: "Neues Profilbild: das alte schrumpft weg, das neue wächst mit einem Ring heraus.", einsatz: "Konto: Avatar ändern",
    html: `<button class="gz13" type="button" aria-label="Avatar wechseln"><span>P</span></button><span class="gz-tipp">Klick</span>`,
    an(b) { const k = b.querySelector(".gz13"), s = k.querySelector("span"); const buchst = ["P", "G", "B"]; let i = 0; k.onclick = () => { s.textContent = buchst[++i % 3]; einmal(k, "neu") } } },
  { nr: "Z14", name: "Schalter mit Wort", idee: "Text neben einem Schalter wechselt mit kurzem Überblenden: „Aus“ ↔ „An“, damit man nicht raten muss.", einsatz: "Einstellungen",
    html: `<label class="gz14"><input type="checkbox"><span class="gz14__bahn"><i></i></span><span class="gz14__wort"><b>Aus</b><b>An</b></span></label>` },
]

export default {
  id: "mikro",
  name: "Kleine Momente",
  kurz: "Mikro-Interaktionen",
  beschreibung: "Kleine, einmalige Antworten auf einen Klick: Kopieren, Markieren, Löschen, Abhaken, Sortieren. Alles hier ist zum Anfassen.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg></span>`,
  anzahl: MIKRO.length,
  bauen(el) { kacheln(el, MIKRO) },
}
