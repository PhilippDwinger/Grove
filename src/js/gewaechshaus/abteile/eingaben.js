// ==========================================================
// Gewächshaus · Abteil „Eingaben“ (NUR ZUM TESTEN)
// Entwürfe E01–E14: Felder, Schalter, Regler. CSS: css/dienste/gewaechshaus/eingaben.css (.ge)
// Keine Browser-Sprechblasen – Fehler zeigt Grove selbst.
// ==========================================================
import { kacheln } from "../kacheln.js"
import "../../../css/dienste/gewaechshaus/eingaben.css"

const EINGABEN = [
  { nr: "E01", name: "Schwebendes Label", idee: "Das Label sitzt im Feld und schwebt beim Tippen nach oben an den Rand.",
    einsatz: "Login, Registrieren, Konto",
    html: `<label class="ge01"><input type="text" placeholder=" "><span>E-Mail-Adresse</span></label>` },
  { nr: "E02", name: "Wachsende Linie", idee: "Nur eine Linie unten. Beim Fokus wächst sie von links in Amber nach.",
    einsatz: "Titel-Felder (Myzel, Knospen)",
    html: `<input class="ge02" type="text" placeholder="Titel der Notiz">` },
  { nr: "E03", name: "Glühwürmchen-Schalter", idee: "Der Knopf im Schalter glimmt auf, wenn er an ist – wie ein Glühwürmchen, das angeht.",
    einsatz: "Einstellungen an/aus (Laub, Konto)",
    html: `<label class="ge03"><input type="checkbox" role="switch" checked><span class="ge03__bahn"><i></i></span>Benachrichtigungen</label>` },
  { nr: "E04", name: "Blatt-Häkchen", idee: "Beim Abhaken zeichnet sich das Häkchen wie die Ader eines Blattes.",
    einsatz: "Listen, Aufgaben, Zustimmung",
    html: `<div class="ge-spalte">
      <label class="ge04"><input type="checkbox" checked><span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" pathLength="1"/></svg></span>Milch kaufen</label>
      <label class="ge04"><input type="checkbox"><span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8" pathLength="1"/></svg></span>Bridge 1.1 fertig</label>
    </div>` },
  { nr: "E05", name: "Schallplatten-Auswahl", idee: "Radio-Knöpfe als kleine Platten. Die gewählte zeigt Rillen und ein Amber-Etikett.",
    einsatz: "Eine Wahl aus wenigen (Speicher, Format)",
    html: `<div class="ge-spalte">
      ${["Im Browser", "Echter Ordner", "Über Bridge"].map((t, i) => `<label class="ge05"><input type="radio" name="ge05" ${i === 0 ? "checked" : ""}><span></span>${t}</label>`).join("")}
    </div>` },
  { nr: "E06", name: "Mischpult-Fader", idee: "Schieberegler wie am Mischpult: Skala mit Strichen, griffiger Fader, Wert daneben.",
    einsatz: "Laub (Tempo, Stärke), Lautstärke",
    html: `<label class="ge06"><span>Stärke</span><input type="range" min="0" max="100" value="60"><output>60</output></label>`,
    an(b) {
      const r = b.querySelector("input"), o = b.querySelector("output")
      const setzen = () => { o.textContent = r.value; r.style.setProperty("--wert", r.value + "%") }
      r.addEventListener("input", setzen); setzen()
    } },
  { nr: "E07", name: "Gleitende Pille", idee: "Segment-Wahl, bei der die helle Pille weich zur neuen Wahl gleitet.",
    einsatz: "Ansichten umschalten (Liste/Netz, Tag/Woche)",
    html: `<div class="ge07" role="group"><i class="ge07__pille"></i>${["Liste", "Netz", "Zeitleiste"].map((t, i) => `<button type="button" aria-pressed="${i === 0}">${t}</button>`).join("")}</div>`,
    an(b) {
      const g = b.querySelector(".ge07"), p = g.querySelector(".ge07__pille")
      const setzen = (k) => {
        g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === k))
        p.style.width = k.offsetWidth + "px"; p.style.translate = k.offsetLeft + "px 0"
      }
      g.querySelectorAll("button").forEach((k) => k.addEventListener("click", () => setzen(k)))
      requestAnimationFrame(() => setzen(g.querySelector("button")))
    } },
  { nr: "E08", name: "Suchfeld mit Taste", idee: "Ruhiges Suchfeld mit „Strg K“-Hinweis. Beim Fokus wird es breiter und der Hinweis geht.",
    einsatz: "Suche in Kopfzeile oder Dienst",
    html: `<label class="ge08"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" placeholder="Grove durchsuchen"><kbd>Strg K</kbd></label>` },
  { nr: "E09", name: "Passwort-Ringe", idee: "Die Stärke des Passworts als Jahresringe: Je stärker, desto mehr Ringe wachsen. Tipp mal was ein.",
    einsatz: "Registrieren, Rinde, Passwort ändern",
    html: `<div class="ge09"><input type="text" placeholder="Passwort" value="Grove"><svg viewBox="0 0 40 40" aria-hidden="true">${[17, 13, 9, 5].map((r, i) => `<circle cx="20" cy="20" r="${r}" data-r="${4 - i}"/>`).join("")}</svg><span class="ge09__text"></span></div>`,
    an(b) {
      const f = b.querySelector("input"), t = b.querySelector(".ge09__text"), box = b.querySelector(".ge09")
      const worte = ["Zu kurz", "Schwach", "Geht so", "Gut", "Stark"]
      const pruefen = () => {
        const v = f.value
        let s = 0
        if (v.length >= 8) s++
        if (v.length >= 12) s++
        if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++
        if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++
        box.dataset.staerke = s; t.textContent = worte[s]
      }
      f.addEventListener("input", pruefen); pruefen()
    } },
  { nr: "E10", name: "Fehler im Grove-Stil", idee: "Kein Wackeln, keine Browser-Blase: Nach dem Abschicken wird der Rand warm-rot und darunter steht ruhig, was fehlt.",
    einsatz: "Alle Formulare",
    html: `<form class="ge10" novalidate><label><span>Benutzername</span><input type="text" placeholder="z. B. paddy"></label><p class="ge10__hinweis" aria-live="polite"></p><button class="gh-demo-knopf" type="submit">Weiter</button></form>`,
    an(b) {
      const f = b.querySelector("form"), i = f.querySelector("input"), h = f.querySelector(".ge10__hinweis")
      f.addEventListener("submit", (e) => {
        e.preventDefault()
        const ok = /^[a-z0-9._-]{3,30}$/.test(i.value)
        f.classList.toggle("hat-fehler", !ok)
        h.textContent = ok ? "Passt." : i.value ? "Nur Kleinbuchstaben, Zahlen, Punkt, - und _ (3–30 Zeichen)." : "Den brauchen wir noch."
        f.classList.toggle("ist-ok", ok)
      })
      i.addEventListener("input", () => f.classList.remove("hat-fehler", "ist-ok"))
    } },
  { nr: "E11", name: "Tag-Eingabe", idee: "Tippen + Enter macht einen Tag daraus. Tags sehen aus wie kleine Zweige, × entfernt sie.",
    einsatz: "Myzel-Tags, Harz-Ordner, Filter",
    html: `<div class="ge11"><span class="ge11__tag">idee<button type="button" aria-label="entfernen">×</button></span><span class="ge11__tag">grove<button type="button" aria-label="entfernen">×</button></span><input type="text" placeholder="Tag + Enter"></div>`,
    an(b) {
      const box = b.querySelector(".ge11"), f = box.querySelector("input")
      box.addEventListener("click", (e) => { if (e.target.closest("button")) e.target.closest(".ge11__tag").remove(); else f.focus() })
      f.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" || !f.value.trim()) return
        e.preventDefault()
        const t = document.createElement("span")
        t.className = "ge11__tag"; t.textContent = f.value.trim().toLowerCase()
        t.insertAdjacentHTML("beforeend", `<button type="button" aria-label="entfernen">×</button>`)
        box.insertBefore(t, f); f.value = ""
      })
    } },
  { nr: "E12", name: "Ablage-Fläche", idee: "Gestrichelte Fläche zum Reinziehen. Kommt eine Datei drüber, wird sie warm und der Keimling hebt sich.",
    einsatz: "Harz hochladen, Mühle",
    html: `<label class="ge12"><input type="file" hidden><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38h28"/><path d="M24 38V18"/><path d="M24 26c0-5-4-8-9-8 0 5 4 8 9 8zM24 22c0-5 4-8 9-8 0 5-4 8-9 8z"/></svg><strong>Dateien hierher ziehen</strong><span>oder klicken zum Auswählen</span></label>`,
    an(b) {
      const z = b.querySelector(".ge12")
      ;["dragenter", "dragover"].forEach((ev) => z.addEventListener(ev, (e) => { e.preventDefault(); z.classList.add("ist-drueber") }))
      ;["dragleave", "drop"].forEach((ev) => z.addEventListener(ev, (e) => { e.preventDefault(); z.classList.remove("ist-drueber") }))
    } },
  { nr: "E13", name: "Zahl-Stepper", idee: "Minus, Zahl, Plus. Die Zahl rollt beim Ändern kurz nach oben oder unten.",
    einsatz: "Mengen, Anzahl Seiten, Tage",
    html: `<div class="ge13"><button type="button" data-d="-1" aria-label="weniger">−</button><span class="ge13__zahl"><b>3</b></span><button type="button" data-d="1" aria-label="mehr">+</button></div>`,
    an(b) {
      let n = 3
      const z = b.querySelector(".ge13__zahl")
      b.querySelectorAll("[data-d]").forEach((k) => k.addEventListener("click", () => {
        const d = +k.dataset.d
        if (n + d < 0 || n + d > 99) return
        n += d
        const neu = document.createElement("b")
        neu.textContent = n; neu.className = d > 0 ? "von-unten" : "von-oben"
        z.replaceChildren(neu)
      }))
    } },
  { nr: "E14", name: "Zeichen-Ring", idee: "Textfeld mit kleinem Ring unten rechts, der sich füllt, je näher du am Limit bist. Kurz vorm Ende wird er Amber-hell.",
    einsatz: "Kurztexte, Betreff, Status",
    html: `<div class="ge14"><textarea maxlength="120" placeholder="Was wächst gerade?">Heute Bridge 1.1 weiter</textarea><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle class="voll" cx="12" cy="12" r="9" pathLength="100"/></svg></div>`,
    an(b) {
      const t = b.querySelector("textarea"), r = b.querySelector(".voll"), box = b.querySelector(".ge14")
      const setzen = () => {
        const p = t.value.length / 120 * 100
        r.style.strokeDasharray = `${p} 100`
        box.classList.toggle("ist-knapp", p > 85)
      }
      t.addEventListener("input", setzen); setzen()
    } },
]

export default {
  id: "eingaben",
  name: "Eingaben",
  kurz: "Felder, Schalter, Regler",
  beschreibung: "Formular-Bausteine im Grove-Stil. Alles ist bedienbar – tipp rein, schalt um, zieh am Regler.",
  vorschau: `<span class="gh-vs"><label class="ge03"><input type="checkbox" role="switch" checked tabindex="-1"><span class="ge03__bahn"><i></i></span></label></span>`,
  anzahl: EINGABEN.length,
  bauen(el) { kacheln(el, EINGABEN) },
}
