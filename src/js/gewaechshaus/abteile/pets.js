// ==========================================================
// Gewächshaus · Abteil „Pets“ (NUR ZUM TESTEN)
// Kleine Wesen, die in Grove wohnen. Erst Deko, dann zeigen sie Dinge an
// (ungelesene Mails, Lernserie, Speicher …) und bekommen nach und nach Aufgaben.
// Entwürfe W01–W10. CSS: css/dienste/gewaechshaus/pets.css (Präfix .pt), Uhu: css/pets/uhu.css
//
// Stil (Paddys Feedback 16.10.: „etwas zu kindisch/simpel – der Uhu ist perfekt“, „nicht so transparent“):
//   wie der Uhu – Augen mit Iris + Pupille + Glanz, Fellstriche, zwei Tonstufen, ein Requisit, deckende Farben.
// Leben (Feedback 3: „lebendiger, mehrere Animationen, je Pet ein Mini-Abteil“):
//   - Jedes Pet hat AKTIONEN (einmalige Animationen). Abspielen: data-tut="<id>" am Rahmen .pt (CSS je Pet),
//     beim Uhu über stimmung() bzw. data-tut an .sa-uhu. → tun(pet, aktion)
//   - LEBEN: Von selbst spielt jedes sichtbare Pet alle paar Sekunden eine ruhige Aktion (Liste `leben`).
//     Aus bei Laub-Bewegung „aus“ oder „Bewegung reduzieren“.
//   - Augen folgen dem Mauszeiger (.pt-blick, Variablen --bx/--by).
//   - Mini-Abteil je Pet: /dienste/gewaechshaus/#pets/<slug> – große Bühne, alle Aktionen, Zustände, „Kann“.
// ==========================================================
import { kacheln } from "../kacheln.js"
import { esc } from "../../kern/html.js"
import { UHU_SVG, stimmung } from "../../saat/ansichten/lehrer.js"
import "../../../css/dienste/gewaechshaus/pets.css"

// Auge wie beim Uhu: Lederhaut, Iris, Pupille (rund, Schlitz oder quer), Glanz, Lid zum Blinzeln
const auge = (x, y, r, { schlitz = false, quer = false } = {}) => `
  <circle class="pt-sklera" cx="${x}" cy="${y}" r="${r}"/>
  <g class="pt-blick">
    <circle class="pt-iris" cx="${x}" cy="${y}" r="${r * .78}"/>
    ${schlitz ? `<ellipse class="pt-auge" cx="${x}" cy="${y}" rx="${r * .2}" ry="${r * .7}"/>` : quer ? `<ellipse class="pt-auge" cx="${x}" cy="${y}" rx="${r * .62}" ry="${r * .26}"/>` : `<circle class="pt-auge" cx="${x}" cy="${y}" r="${r * .42}"/>`}
    <circle class="pt-glanz" cx="${x + r * .28}" cy="${y - r * .32}" r="${r * .22}"/>
  </g>
  <ellipse class="pt-lid" cx="${x}" cy="${y}" rx="${r + .8}" ry="${r + .8}"/>`

const buehne = (pet, wert, regler = "") => `<div class="pt-buehne">${pet}<div class="pt-wert" data-wert>${wert}</div><div class="pt-regler">${regler}</div></div>`
const schieber = (min, max, wert, label) => `<label class="pt-schieber"><span>${label}</span><input type="range" min="${min}" max="${max}" value="${wert}" data-regler></label>`
const knopf = (text, attr = "") => `<button type="button" class="gh-demo-knopf gh-demo-knopf--leise" ${attr}>${text}</button>`
const zzz = (x, y) => `<text class="pt-zzz" x="${x}" y="${y}">z</text><text class="pt-zzz pt-zzz--2" x="${x + 12}" y="${y - 12}">z</text>`
const warte = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- Aktionen abspielen ----------
const bewegungAus = () => document.documentElement.dataset.bewegung === "aus" || matchMedia("(prefers-reduced-motion: reduce)").matches

function tun(p, a) {
  if (!p || !a) return
  if (a.st) { stimmung(p, a.st, a.ms); return }                  // Uhu: Stimmungen aus Saat
  if (a.js) { a.js(p); return }
  p.removeAttribute("data-tut"); p.getBoundingClientRect()        // Neustart der CSS-Animation
  p.dataset.tut = a.id
  clearTimeout(p._tut); p._tut = setTimeout(() => { if (p.dataset.tut === a.id) p.removeAttribute("data-tut") }, a.ms)
}
const beschaeftigt = (p) => p.hasAttribute("data-tut") || (p.dataset.stimmung && p.dataset.stimmung !== "ruhig") || p.hasAttribute("data-spricht")

// Von selbst leben: alle 4–10 s eine ruhige Aktion, nur wenn sichtbar
const sichtbar = new WeakSet()
const beobachter = new IntersectionObserver((e) => e.forEach((x) => x.isIntersecting ? sichtbar.add(x.target) : sichtbar.delete(x.target)))
function leben(p, pet, schalter = () => true) {
  beobachter.observe(p)
  const liste = pet.aktionen.filter((a) => pet.leben.includes(a.id))
  const takt = () => setTimeout(() => {
    if (!p.isConnected) { beobachter.unobserve(p); return }
    if (schalter() && sichtbar.has(p) && !bewegungAus() && !document.hidden && !beschaeftigt(p)) tun(p, liste[Math.floor(Math.random() * liste.length)])
    takt()
  }, 4000 + Math.random() * 6000)
  takt()
}

// Augen folgen dem Mauszeiger (einmal für die ganze Seite)
let blickAn = false
function blickEinrichten() {
  if (blickAn) return
  blickAn = true
  let x = 0, y = 0, geplant = false
  const malen = () => {
    geplant = false
    document.querySelectorAll(".pt").forEach((p) => {
      const r = p.getBoundingClientRect()
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return
      const k = (v) => Math.max(-1, Math.min(1, v)).toFixed(2)
      p.style.setProperty("--bx", k((x - (r.left + r.width / 2)) / (r.width * .9)))
      p.style.setProperty("--by", k((y - (r.top + r.height * .45)) / (r.height * .9)))
    })
  }
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; if (!geplant) { geplant = true; requestAnimationFrame(malen) } }, { passive: true })
  document.documentElement.addEventListener("pointerleave", () => document.querySelectorAll(".pt").forEach((p) => { p.style.setProperty("--bx", 0); p.style.setProperty("--by", 0) }))
}

// ---------- Die Pets ----------
// Eintrag: { nr, slug, name, idee, einsatz, heute[], spaeter[], svg, wert, regler, an(bühne), aktionen[{id,name,text,ms}], leben[], klick }
const PETS = [
  { nr: "W01", slug: "uhu", name: "Professor Uhu", idee: "Der Lehrer aus Saat. Wohnt im Lernen, könnte aber überall auftauchen. Zeigt deine Lernserie – und freut sich, wenn du heute schon gelernt hast.",
    einsatz: "Saat · Lernserie, fällige Karten · später: Erinnerungen, Tipps",
    heute: ["Spricht im Gespräch-Modus von Saat mit dir", "Freut sich über richtige, tröstet bei falschen Antworten"],
    spaeter: ["Zeigt deine Lernserie auf der Lichtung", "Erinnert an fällige Karten", "Gibt Lerntipps aus deinem Profil"],
    svg: `<div class="sa-uhu pt-uhu" data-stimmung="ruhig">${UHU_SVG}</div>`, wert: "Serie: 12 Tage",
    aktionen: [
      { id: "freut", st: "freut", name: "Freuen", text: "Hüpft, Augen lachen, Flügel hoch", ms: 1800 },
      { id: "winkt", st: "winkt", name: "Winken", text: "Winkt mit dem rechten Flügel", ms: 2400 },
      { id: "denkt", st: "denkt", name: "Nachdenken", text: "Kopf schief, Blick nach unten", ms: 2200 },
      { id: "traurig", st: "traurig", name: "Traurig", text: "Kopf hängt, Quaste fällt", ms: 2200 },
      { id: "spricht", js: async (u) => { u.toggleAttribute("data-spricht", true); await warte(1800); u.removeAttribute("data-spricht") }, name: "Sprechen", text: "Schnabel bewegt sich", ms: 1800 },
      { id: "umschauen", name: "Umschauen", text: "Dreht den Kopf nach links und rechts", ms: 2400 },
      { id: "nicken", name: "Nicken", text: "Zweimal zustimmend nicken", ms: 1200 },
      { id: "flattern", name: "Flattern", text: "Schlägt mit beiden Flügeln", ms: 1400 },
      { id: "brille", name: "Brille richten", text: "Schiebt die Brille hoch", ms: 1100 },
      { id: "hut", name: "Hut lüften", text: "Hebt kurz den Doktorhut", ms: 1500 },
      { id: "einnicken", name: "Einnicken", text: "Augen zu, Kopf sinkt – und wach", ms: 3400 },
    ],
    leben: ["umschauen", "nicken", "brille", "einnicken"],
    an(b) {
      const uhu = b.querySelector(".sa-uhu")
      uhu.addEventListener("click", () => stimmung(uhu, "freut", 1400))
    } },

  { nr: "W02", slug: "moosling", name: "Moosling", idee: "Eine alte Schildkröte, auf deren Panzer ein kleiner Garten wächst. Mit jeder Notiz in Myzel sprießt mehr – erst Moos, dann Farn, irgendwann ein Pilz.",
    einsatz: "Myzel · Anzahl Notizen · später: zeigt verwaiste Notizen ohne Verbindung",
    heute: ["Garten wächst mit der Zahl deiner Notizen (Moos → Farn → Pilz)"],
    spaeter: ["Zeigt verwaiste Notizen als welke Blätter", "Gießt den Garten, wenn du Notizen verbindest", "Wandert langsam über die Lichtung"],
    svg: `<div class="pt pt--moos" data-stufe="2"><svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse class="pt-schatten" cx="84" cy="156" rx="58" ry="6"/>
        <g class="pt-tropfen">${[62, 84, 106].map((x, i) => `<path style="--i:${i}" d="M${x} 26c-2 4-3.4 6-3.4 8a3.4 3.4 0 0 0 6.8 0c0-2-1.4-4-3.4-8z"/>`).join("")}</g>
        <g class="pt-koerper">
          <path class="pt-haut pt-bein-v" d="M46 132c-3 10-1 18 6 21h10c3-6 3-14 1-21z"/><path class="pt-haut pt-bein-h" d="M112 132c3 10 1 18-6 21H96c-3-6-3-14-1-21z"/>
          <g class="pt-kopf">
            <path class="pt-haut" d="M48 124c-10-2-20-6-24-16-5-12 2-24 14-25 12-1 20 8 20 20 0 8-3 14-10 21z"/>
            <path class="pt-fell" d="M30 112c4 2 9 2 13 0M28 104c3 1 6 1 9-1"/>
            ${auge(33, 97, 4.4)}
            <path class="pt-mund" d="M22 105c4 2 8 2 11 0"/><ellipse class="pt-maul" cx="25" cy="106" rx="3.4" ry="2.6"/>
          </g>
          <path class="pt-panzer" d="M40 130c0-34 22-56 50-56s46 22 46 56z"/>
          <path class="pt-panzer-muster" d="M66 90l14-7 14 7v14l-14 7-14-7zM94 104l14-6 12 8M66 104l-12 8-8 14M80 111v19M94 104l8 26M108 98l10 12 4 20M66 90l-10-4M94 90l12-6"/>
          <path class="pt-rand" d="M34 130h110c0 7-5 10-11 10H44c-6 0-10-3-10-10z"/>
          <path class="pt-moos" d="M56 84c4-9 13-11 19-6 5-7 15-8 21-2 7-4 15-1 19 6-6 2-10 5-15 3-6 4-14 3-20 0-7 3-15 4-24-1z"/>
          <g class="pt-spross pt-spross--1"><path class="pt-stiel" d="M66 80c-1-8-5-12-10-14"/><path class="pt-blatt" d="M56 66c-6-1-9-5-8-9 5 0 8 3 8 9z"/><path class="pt-blatt" d="M60 72c-1-5 2-8 6-9 1 5-2 8-6 9z"/></g>
          <g class="pt-spross pt-spross--2"><path class="pt-stiel" d="M104 80c2-10 0-18-6-24"/><path class="pt-farn" d="M98 56c4 2 6 6 6 10M100 62c-4 0-7 2-8 5M102 66c4 0 6 3 7 6M102 72c-4 1-6 3-6 6"/></g>
          <g class="pt-spross pt-spross--3"><path class="pt-stiel" d="M86 76V60"/><path class="pt-pilzhut" d="M76 62c0-8 5-12 10-12s10 4 10 12c-4 1-16 1-20 0z"/><circle class="pt-punkt" cx="83" cy="56" r="1.6"/><circle class="pt-punkt" cx="90" cy="55" r="1.1"/></g>
        </g></svg></div>`, wert: "25 Notizen", regler: schieber(0, 3, 2, "Notizen"),
    aktionen: [
      { id: "kriechen", name: "Kriechen", text: "Ein paar langsame Schritte nach vorn", ms: 2600 },
      { id: "einziehen", name: "Kopf einziehen", text: "Verschwindet kurz im Panzer", ms: 2400 },
      { id: "nicken", name: "Nicken", text: "Bedächtiges Nicken", ms: 1400 },
      { id: "gaehnen", name: "Gähnen", text: "Reckt den Hals und gähnt", ms: 2000 },
      { id: "regen", name: "Regen", text: "Tropfen fallen, der Garten wippt", ms: 3000 },
      { id: "wachsen", name: "Sprießen", text: "Pflanzen strecken sich", ms: 1600 },
      { id: "blinzeln", name: "Blinzeln", text: "Langsam zweimal blinzeln", ms: 1200 },
    ],
    leben: ["nicken", "gaehnen", "wachsen", "blinzeln", "kriechen"],
    an(b) {
      const p = b.querySelector(".pt"), t = ["3 Notizen", "8 Notizen", "25 Notizen", "120 Notizen"]
      b.querySelector("[data-regler]").addEventListener("input", (e) => { p.dataset.stufe = e.target.value; b.querySelector("[data-wert]").textContent = t[e.target.value] })
    } },

  { nr: "W03", slug: "funke", name: "Funke", idee: "Ein Glühwürmchen, das Post bringt. Je mehr ungelesene Mails, desto heller glüht sein Hinterleib. Alles gelesen? Dann sitzt es still auf seinem Halm.",
    einsatz: "Grove Mail · ungelesene Mails · später: fliegt zur Glocke bei neuer Mail",
    heute: ["Glüht heller, je mehr ungelesene Mails", "Landet auf dem Halm, wenn alles gelesen ist"],
    spaeter: ["Bringt neue Mails als Brief zur Glocke", "Morst bei wichtigen Absendern", "Leuchtet nachts den Posteingang aus"],
    svg: `<div class="pt pt--funke" style="--glut:.6"><svg viewBox="0 0 160 170" aria-hidden="true">
        <path class="pt-halm" d="M30 168c10-30 30-50 64-66"/><path class="pt-halm pt-halm--blatt" d="M60 124c-12-4-20-14-20-26 12 4 18 14 20 26z"/>
        <g class="pt-koerper pt-schweben">
          <circle class="pt-licht-hof" cx="118" cy="92" r="30"/>
          <path class="pt-fluegel" d="M70 76c6-26 34-40 52-30-4 18-26 32-52 30z"/>
          <path class="pt-fluegel pt-fluegel--2" d="M72 80c16-16 44-18 56-4-10 12-32 14-56 4z"/>
          <path class="pt-ader" d="M74 76c14-8 28-16 44-26M76 80c16-2 32-4 48-4"/>
          <path class="pt-hinterleib" d="M78 92c10-8 30-10 44-4 10 4 14 12 10 18-6 8-24 10-38 6-12-4-20-12-16-20z"/>
          <path class="pt-licht" d="M108 88c10 0 20 4 24 10 2 6-4 12-14 13-6 0-10-2-12-6-2-6-2-12 2-17z"/>
          <path class="pt-segment" d="M92 88c2 8 2 16 0 24M102 86c2 8 2 18 0 26"/>
          <path class="pt-k" d="M64 82c4-8 14-10 20-4 4 5 2 14-4 16-8 2-16-4-16-12z"/>
          <path class="pt-schild" d="M54 78c4-10 18-14 28-8 2 4-2 8-8 9-8 1-16 1-20-1z"/><circle class="pt-schildfleck" cx="68" cy="74" r="3"/>
          <circle class="pt-k" cx="52" cy="86" r="9"/>
          <g class="pt-blick"><ellipse class="pt-facette" cx="48" cy="85" rx="4.2" ry="5"/><circle class="pt-glanz" cx="49.5" cy="83" r="1.1"/></g>
          <path class="pt-fuehler" d="M48 78c-6-8-14-12-22-10M52 77c-2-10-8-16-16-18"/>
          <path class="pt-bein" d="M60 94l-6 10M68 96l-2 12M76 96l4 12"/>
          <g class="pt-brief"><path class="pt-faden" d="M66 104v10"/><rect class="pt-brief__papier" x="56" y="114" width="22" height="15" rx="2"/><path class="pt-brief__klappe" d="M56.5 115.5l10.5 7.5 10.5-7.5"/></g>
        </g></svg></div>`, wert: "6 ungelesen", regler: schieber(0, 20, 6, "Ungelesen"),
    aktionen: [
      { id: "aufleuchten", name: "Aufleuchten", text: "Ein heller Lichtstoß", ms: 1300 },
      { id: "morsen", name: "Morsen", text: "Blinkt kurz-kurz-lang", ms: 2600 },
      { id: "brief", name: "Brief bringen", text: "Trägt eine neue Mail heran", ms: 3200 },
      { id: "kreisen", name: "Kreisen", text: "Dreht eine Runde in der Luft", ms: 3000 },
      { id: "putzen", name: "Fühler putzen", text: "Zuckt mit den Fühlern", ms: 1500 },
      { id: "landen", name: "Landen", text: "Setzt sich kurz auf den Halm", ms: 3200 },
    ],
    leben: ["aufleuchten", "kreisen", "putzen", "morsen"],
    an(b) {
      const p = b.querySelector(".pt")
      b.querySelector("[data-regler]").addEventListener("input", (e) => {
        const n = +e.target.value
        p.style.setProperty("--glut", Math.min(1, n / 10).toFixed(2)); p.toggleAttribute("data-schlaeft", n === 0)
        b.querySelector("[data-wert]").textContent = n ? `${n} ungelesen` : "alles gelesen · ruht"
      })
    } },

  { nr: "W04", slug: "harzel", name: "Harzel", idee: "Ein Eichhörnchen, das deine Dateien wie Eicheln bunkert. Der Vorrat auf dem Ast zeigt, wie voll der Speicher ist – kurz vorm Platzen hat es die Backen voll.",
    einsatz: "Harz · Speicherplatz · später: warnt vor großen Dateien, findet Doppelte",
    heute: ["Vorrat auf dem Ast = belegter Speicher", "Backen voll ab 85 %"],
    spaeter: ["Vergräbt neue Uploads sichtbar", "Warnt vor großen Dateien", "Findet doppelte Dateien („die Eichel hab ich schon“)"],
    svg: `<div class="pt pt--harzel" data-stufe="2"><svg viewBox="0 0 160 170" aria-hidden="true">
        <path class="pt-ast" d="M4 154c40-10 100-10 154-2"/><path class="pt-ast pt-ast--zweig" d="M130 152c6-6 10-14 10-22"/><path class="pt-ast-blatt" d="M140 130c-2-8 2-14 8-16 2 8-2 14-8 16z"/>
        <g class="pt-vorrat">${[16, 30, 23, 44, 9].map((x, i) => `<g class="pt-vorrat__n" style="--n:${i}"><ellipse class="pt-nuss" cx="${x}" cy="${i === 2 ? 138 : 146}" rx="5.5" ry="6.5"/><path class="pt-kappe" d="M${x - 6.5} ${i === 2 ? 134.5 : 142.5}c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5z"/></g>`).join("")}</g>
        <g class="pt-koerper">
          <path class="pt-schwanz" d="M100 150c34 0 52-26 46-56-6-30-34-40-48-22 16 0 28 14 24 32-4 18-18 26-28 26z"/>
          <path class="pt-fell pt-fell--hell pt-schwanzfell" d="M126 70c8 6 12 16 12 28M134 84c2 10 0 20-6 30M118 120c8-4 14-12 16-22M106 138c10 0 20-6 26-14"/>
          <path class="pt-k" d="M70 150c-14-6-18-30-8-48 8-14 28-16 36-2 10 16 8 40-4 50z"/>
          <path class="pt-k2" d="M72 146c-8-6-10-22-4-34 6 4 14 4 20 0 4 12 2 28-6 34z"/>
          <path class="pt-k" d="M88 150c8 0 14-2 16-6-4-4-10-4-16 0z"/>
          <g class="pt-kopf">
            <path class="pt-k" d="M56 98c-12-2-20-12-16-24 4-12 18-18 30-12 12 6 12 22 4 30-4 4-10 6-18 6z"/>
            <g class="pt-ohr"><path class="pt-k" d="M57 66c-3-8-1-16 4-20 5 3 8 10 7 18z"/><path class="pt-ohr-innen" d="M60 63c-1-5 0-10 2-12 2 2 4 6 3 11z"/><path class="pt-pinsel" d="M61 46l-1-6M62 46l3-5M61 46l-4-3"/></g>
            <ellipse class="pt-backe" cx="56" cy="87" rx="8" ry="6"/>
            ${auge(54, 74, 4.6)}
            <ellipse class="pt-nase" cx="40" cy="80" rx="2.4" ry="1.8"/>
            <path class="pt-fell" d="M72 70c4 2 6 6 6 10"/>
          </g>
          <path class="pt-fell" d="M66 96c4 2 8 2 12 0"/>
          <g class="pt-kruemel"><circle cx="52" cy="118" r="1.3"/><circle cx="58" cy="120" r="1"/><circle cx="55" cy="117" r=".9"/></g>
          <g class="pt-eichel"><ellipse class="pt-nuss" cx="56" cy="110" rx="6.5" ry="7.5"/><path class="pt-kappe" d="M49 106c0-5 3-8 7-8s7 3 7 8z"/><path class="pt-k" d="M48 112c4-4 8-4 10 0M62 112c-2-4-6-4-8-1"/></g>
        </g></svg></div>`, wert: "48 % voll", regler: schieber(0, 100, 48, "Speicher"),
    aktionen: [
      { id: "knabbern", name: "Knabbern", text: "Knabbert an der Eichel, Krümel fallen", ms: 2200 },
      { id: "vergraben", name: "Vergraben", text: "Legt die Eichel in den Vorrat", ms: 2600 },
      { id: "maennchen", name: "Männchen machen", text: "Richtet sich auf und späht", ms: 1800 },
      { id: "umschauen", name: "Umschauen", text: "Blickt sich hastig um", ms: 2000 },
      { id: "schwanz", name: "Schwanz zucken", text: "Zwei schnelle Zuckungen", ms: 1200 },
      { id: "backen", name: "Backen füllen", text: "Stopft sich die Backen voll", ms: 2000 },
    ],
    leben: ["knabbern", "umschauen", "schwanz", "maennchen"],
    an(b) {
      const p = b.querySelector(".pt")
      b.querySelector("[data-regler]").addEventListener("input", (e) => {
        const v = +e.target.value; p.dataset.stufe = Math.round(v / 20); p.toggleAttribute("data-voll", v > 85)
        b.querySelector("[data-wert]").textContent = v > 85 ? `${v} % voll · Backen voll!` : `${v} % voll`
      })
    } },

  { nr: "W05", slug: "stachel", name: "Stachel", idee: "Ein Igel als Wächter deiner Passwörter. Ist Rinde gesperrt, rollt er sich zur Kugel. Seine Stacheln stehen umso stolzer, je stärker deine Passwörter im Schnitt sind.",
    einsatz: "Rinde · gesperrt/offen, Passwort-Stärke · später: meldet schwache oder doppelte Passwörter",
    heute: ["Kugel mit Schloss = Rinde gesperrt", "Stacheln zeigen die mittlere Passwort-Stärke"],
    spaeter: ["Schnüffelt an schwachen Passwörtern", "Sträubt die Stacheln bei doppelten", "Rollt sich bei Auto-Sperre ein"],
    svg: `<div class="pt pt--igel" style="--staerke:.8"><svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse class="pt-schatten" cx="80" cy="154" rx="56" ry="6"/>
        <path class="pt-laub pt-laub--1" d="M20 152c4-8 12-10 18-6-4 6-10 8-18 6z"/><path class="pt-laub pt-laub--2" d="M128 154c6-6 14-6 18 0-6 4-12 4-18 0z"/>
        <g class="pt-koerper">
          <g class="pt-stacheln"><path class="pt-stachel" d="M53.1 130.8L29.1 138.8 M52.2 128.0L22.4 131.9 M52.0 125.2L24.5 123.7 M52.6 122.4L28.1 116.3 M53.9 119.7L26.5 107.4 M55.9 117.2L33.2 101.3 M58.5 115.1L40.8 96.7 M61.6 113.3L44.7 88.4 M65.2 111.9L54.1 86.3 M69.0 111.0L63.2 85.8 M73.0 110.6L71.6 80.5 M77.0 110.7L80.8 83.0 M81.0 111.4L88.9 86.8 M84.7 112.5L99.2 86.2 M88.0 114.1L105.6 92.5 M90.9 116.1L110.2 99.5 M93.2 118.4L119.3 103.7 M94.8 121.0L120.9 112.0 M95.8 123.8L120.7 120.0 M96.0 126.6L126.0 127.7 M95.5 129.4L122.4 135.6"/><path class="pt-stachel pt-stachel--hell" d="M52.5 129.4L19.0 136.9 M52.0 126.6L20.0 127.8 M52.2 123.8L15.8 118.5 M53.2 121.0L20.6 110.0 M54.8 118.4L27.0 102.8 M57.1 116.1L28.9 93.0 M60.0 114.1L38.1 87.9 M63.3 112.5L47.8 84.7 M67.0 111.4L55.4 77.2 M71.0 110.7L66.2 77.1 M75.0 110.6L76.5 78.8 M79.0 111.0L87.4 75.9 M82.8 111.9L96.7 80.8 M86.4 113.3L104.4 86.9 M89.5 115.1L115.4 89.5 M92.1 117.2L120.4 97.9 M94.1 119.7L123.3 106.7 M95.4 122.4L131.1 113.9 M96.0 125.2L130.3 123.4 M95.8 128.0L127.5 132.1 M94.9 130.8L129.9 141.9"/></g>
          <path class="pt-bauchfell" d="M40 136c0-16 16-26 36-26 18 0 30 8 34 20 2 8-4 14-12 14H48c-6 0-8-4-8-8z"/>
          <g class="pt-gesicht">
            <path class="pt-k2" d="M100 118c8-8 22-8 32 2 6 6 10 10 12 14-6 4-18 6-30 4-10-2-16-8-14-20z"/>
            <path class="pt-fell" d="M108 132c6 2 14 2 20 0M112 124c4-2 8-2 12 0"/>
            ${auge(118, 120, 3.6)}
            <circle class="pt-nase" cx="145" cy="133" r="3.2"/>
            <path class="pt-k2 pt-fuss pt-fuss--1" d="M58 144h12v8H58z"/><path class="pt-k2 pt-fuss pt-fuss--2" d="M92 144h12v8H92z"/>
          </g>
          <g class="pt-schloss"><rect x="66" y="104" width="18" height="15" rx="3"/><path d="M69 104v-5a6 6 0 0 1 12 0v5"/></g>
        </g></svg></div>`, wert: "Rinde offen · stark", regler: `${knopf("Sperren", "data-sperren")}${schieber(2, 10, 8, "Stärke")}`,
    aktionen: [
      { id: "schnueffeln", name: "Schnüffeln", text: "Nase zuckt, Kopf tastet vor", ms: 1700 },
      { id: "einrollen", name: "Einrollen", text: "Rollt sich kurz zur Kugel", ms: 2800 },
      { id: "straeuben", name: "Stacheln sträuben", text: "Stacheln richten sich auf", ms: 1200 },
      { id: "schuetteln", name: "Schütteln", text: "Schüttelt sich, Laub fliegt", ms: 1300 },
      { id: "trippeln", name: "Trippeln", text: "Kleine Schritte auf der Stelle", ms: 1700 },
      { id: "blinzeln", name: "Blinzeln", text: "Zweimal blinzeln", ms: 1200 },
    ],
    leben: ["schnueffeln", "trippeln", "blinzeln", "straeuben"],
    an(b) {
      const p = b.querySelector(".pt")
      const zeigen = () => { const s = +b.querySelector("[data-regler]").value; b.querySelector("[data-wert]").textContent = `${p.hasAttribute("data-zu") ? "Rinde gesperrt" : "Rinde offen"} · ${s > 7 ? "stark" : s > 4 ? "mittel" : "schwach"}` }
      b.querySelector("[data-sperren]").addEventListener("click", (e) => { p.toggleAttribute("data-zu"); e.target.textContent = p.hasAttribute("data-zu") ? "Entsperren" : "Sperren"; zeigen() })
      b.querySelector("[data-regler]").addEventListener("input", (e) => { p.style.setProperty("--staerke", e.target.value / 10); zeigen() })
    } },

  { nr: "W06", slug: "sporli", name: "Sporli", idee: "Ein alter Waldpilz mit Laterne. Sein Hut trägt die Farbe deines Themes – stellst du in Laub etwas um, färbt er sich mit. Ab und zu stäubt er Sporen ins Licht.",
    einsatz: "Laub · aktueller Look · später: schlägt Presets vor, zeigt Tageszeit-Themes",
    heute: ["Hut in der Farbe des Themes", "Färbt sich mit, wenn du in Laub etwas umstellst"],
    spaeter: ["Schlägt passende Presets vor", "Laterne zeigt Tageszeit-Themes", "Stäubt Sporen beim Speichern eines Presets"],
    svg: `<div class="pt pt--sporli" data-hut="0"><svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse class="pt-schatten" cx="78" cy="156" rx="44" ry="6"/>
        <g class="pt-sporen">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle cx="${44 + i * 10}" cy="${58 + (i % 3) * 4}" r="${1.3 + (i % 2) * .8}" style="--s:${i}"/>`).join("")}</g>
        <g class="pt-koerper">
          <path class="pt-moosbett" d="M30 156c4-10 14-14 24-10 6-8 20-8 26 0 8-6 22-4 26 6 6-2 12 0 14 4z"/>
          <g class="pt-rumpf">
            <path class="pt-stiel-pilz" d="M64 100c-4 18-6 36-2 50 6 4 26 4 32 0 4-14 2-32-2-50z"/>
            <path class="pt-fell" d="M70 112c-1 10-1 22 1 32M84 110c2 12 2 24 0 34"/>
            <path class="pt-manschette" d="M60 112c6 6 30 6 36 0l2 6c-8 6-32 6-40 0z"/>
            ${auge(70, 126, 3.2)}${auge(86, 126, 3.2)}
            <path class="pt-mund" d="M75 135c2 1.4 4 1.4 6 0"/>
            <g class="pt-hutgruppe">
              <path class="pt-lamellen-flaeche" d="M30 96c10 8 30 12 48 12s38-4 48-12c-12-4-30-6-48-6s-36 2-48 6z"/>
              <path class="pt-lamellen" d="M40 98l18 8M52 96l12 10M66 94l6 12M78 94v12M90 94l-6 12M104 96l-12 10M116 98l-18 8"/>
              <path class="pt-hut" d="M26 96c-2-30 22-56 52-56s56 26 52 56c-14 4-32 6-52 6s-38-2-52-6z"/>
              <path class="pt-hutglanz" d="M44 66c8-12 20-18 34-18"/>
              <path class="pt-hutpunkt" d="M48 72c4-3 9-2 10 2-3 4-8 4-10-2zM80 56c5-2 10 0 10 4-4 3-9 2-10-4zM100 76c4-2 8 0 8 4-3 2-7 2-8-4zM66 84c3-1 6 1 6 3-3 2-6 1-6-3z"/>
              <g class="pt-laterne"><path class="pt-faden" d="M120 98v16"/><rect class="pt-laterne__rahmen" x="114" y="114" width="12" height="16" rx="2"/><rect class="pt-laterne__licht" x="116.5" y="117" width="7" height="10" rx="1.5"/><circle class="pt-laterne__hof" cx="120" cy="122" r="14"/></g>
            </g>
          </g>
        </g></svg></div>`, wert: "Hut: Akzent", regler: knopf("Theme wechseln", "data-hutwechsel"),
    aktionen: [
      { id: "sporen", name: "Sporen stäuben", text: "Eine Wolke Sporen steigt auf", ms: 2400 },
      { id: "hut", name: "Hut lüften", text: "Hebt grüßend den Hut", ms: 1800 },
      { id: "wackeln", name: "Wackeln", text: "Schwankt wie im Wind", ms: 1600 },
      { id: "laterne", name: "Laterne schwenken", text: "Schwingt die Laterne, Licht flackert", ms: 2200 },
      { id: "strecken", name: "Strecken", text: "Wächst kurz ein Stück", ms: 1700 },
      { id: "blinzeln", name: "Blinzeln", text: "Zweimal blinzeln", ms: 1200 },
    ],
    leben: ["sporen", "wackeln", "laterne", "blinzeln"],
    an(b) {
      const p = b.querySelector(".pt"), n = ["Akzent", "Zweitakzent", "Erfolg", "Text"]
      b.querySelector("[data-hutwechsel]").addEventListener("click", () => { p.dataset.hut = (+p.dataset.hut + 1) % 4; b.querySelector("[data-wert]").textContent = `Hut: ${n[p.dataset.hut]}`; tun(p, { id: "sporen", ms: 2400 }) })
    } },

  { nr: "W07", slug: "quak", name: "Quak", idee: "Eine Kröte, die in der Mühle wohnt. Läuft eine Umwandlung, springt sie Seerose für Seerose bis zur Blüte – das ist der Fortschrittsbalken.",
    einsatz: "Mühle · Fortschritt einer Umwandlung · später: sitzt auf fertigen Dateien zum Abholen",
    heute: ["Springt Seerose für Seerose = Fortschritt", "Quakt an der Blüte, wenn die Datei fertig ist"],
    spaeter: ["Sitzt auf fertigen Dateien zum Abholen", "Schnappt Fehler wie Fliegen weg", "Taucht ab, wenn eine Umwandlung abbricht"],
    svg: `<div class="pt pt--quak" data-schritt="0"><svg viewBox="0 0 300 150" aria-hidden="true">
        <path class="pt-wasser" d="M0 132c30-4 60 4 90 0s60-4 90 0 60 4 90 0 30 2 30 2"/>
        <g class="pt-rosen">${[40, 110, 180, 250].map((x, i) => `<path class="pt-rose${i === 3 ? " pt-rose--ziel" : ""}" d="M${x} 128l-30 0a30 9 0 1 0 6-6z"/>`).join("")}
          <g class="pt-bluete"><path d="M250 112c-6-8-4-16 0-20 4 4 6 12 0 20z"/><path d="M250 114c-10-2-14-10-12-16 6 2 10 8 12 16z"/><path d="M250 114c10-2 14-10 12-16-6 2-10 8-12 16z"/></g></g>
        <g class="pt-frosch">
          <g class="pt-wellen"><ellipse cx="44" cy="128" rx="22" ry="4"/><ellipse class="pt-welle--2" cx="44" cy="128" rx="22" ry="4"/></g>
          <g class="pt-fliege"><ellipse class="pt-fliege__fluegel" cx="99" cy="68" rx="3.6" ry="1.8"/><ellipse class="pt-fliege__fluegel" cx="105" cy="68" rx="3.6" ry="1.8"/><circle class="pt-fliege__leib" cx="102" cy="71" r="2.8"/></g>
          <path class="pt-zunge" d="M46 104Q76 86 100 72" pathLength="100"/>
          <g class="pt-koerper">
            <path class="pt-k" d="M14 124c-4-10 0-18 6-20-4-8 0-18 8-20 6-12 22-14 30-4 8 2 12 12 8 20 6 4 8 12 4 20-10 6-46 6-56 4z"/>
            <path class="pt-k2" d="M26 122c-2-8 6-14 16-14s18 6 16 14z"/>
            <ellipse class="pt-kehle" cx="44" cy="108" rx="13" ry="8"/>
            <path class="pt-fleck" d="M30 92c3-2 6 0 5 3-3 2-6 0-5-3zM50 90c3-1 5 1 4 3-3 1-5 0-4-3zM62 108c2-1 4 1 3 3-2 1-4 0-3-3zM16 110c2-1 4 1 3 3-2 1-4 0-3-3z"/>
            <path class="pt-k" d="M10 126c-6-2-8-8-4-12 6 0 10 4 10 10zM78 126c6-2 8-8 4-12-6 0-10 4-10 10z"/>
            <path class="pt-mund" d="M24 104c10 6 30 6 40 0"/>
            ${auge(30, 84, 6.2, { quer: true })}${auge(56, 84, 6.2, { quer: true })}
          </g>
        </g></svg></div>`, wert: "bereit", regler: knopf("Umwandeln", "data-los"),
    aktionen: [
      { id: "quaken", name: "Quaken", text: "Kehlsack bläht sich zweimal", ms: 1700 },
      { id: "zunge", name: "Fliege schnappen", text: "Eine Fliege summt heran – schnapp", ms: 2000 },
      { id: "hopsen", name: "Hopsen", text: "Kleiner Sprung auf der Stelle", ms: 900 },
      { id: "abtauchen", name: "Abtauchen", text: "Taucht kurz unter, Wellen ziehen", ms: 2600 },
      { id: "wellen", name: "Plätschern", text: "Kleine Wellen ums Blatt", ms: 2000 },
      { id: "blinzeln", name: "Blinzeln", text: "Zweimal blinzeln", ms: 1200 },
    ],
    leben: ["quaken", "zunge", "wellen", "blinzeln"],
    an(b) {
      const p = b.querySelector(".pt"), wert = b.querySelector("[data-wert]")
      b.querySelector("[data-los]").addEventListener("click", async (e) => {
        e.target.disabled = true
        for (let s = 1; s <= 3; s++) { p.dataset.schritt = s; wert.textContent = `${Math.round(s / 3 * 100)} %`; await warte(900) }
        wert.textContent = "fertig! · bild.webp"; tun(p, { id: "quaken", ms: 1700 })
        await warte(1800)
        p.dataset.schritt = 0; wert.textContent = "bereit"; e.target.disabled = false
      })
    } },

  { nr: "W08", slug: "ember", name: "Ember", idee: "Ein Fuchs für Bridge. Sind deine Geräte online, sitzt er aufmerksam da, die Ohren gespitzt. Ist keins erreichbar, legt er den Schwanz um sich und schläft.",
    einsatz: "Bridge · Geräte online · später: trägt Aufgaben von Gerät zu Gerät",
    heute: ["Sitzt wach, solange Geräte online sind", "Schläft, wenn keins erreichbar ist"],
    spaeter: ["Spitzt die Ohren bei neuen Aufgaben", "Trägt Aufgaben sichtbar von Gerät zu Gerät", "Schnüffelt an unbekannten Geräten"],
    svg: `<div class="pt pt--ember"><svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse class="pt-schatten" cx="80" cy="156" rx="50" ry="6"/>
        <g class="pt-koerper">
          <g class="pt-schwanzgruppe"><path class="pt-schwanz" d="M96 152c26 2 44-12 42-34-2-14-12-20-20-18 8 8 8 22-4 32-6 6-14 10-22 10z"/><path class="pt-spitze" d="M126 102c8-2 12 4 12 12-4-6-8-8-12-12z"/>
          <path class="pt-fell pt-fell--hell" d="M128 112c2 8 0 16-6 22M118 104c4 6 4 14 0 20"/></g>
          <path class="pt-k" d="M54 154c-8-26-2-50 24-62 26 12 32 36 24 62z"/>
          <path class="pt-k2" d="M66 150c-6-18-2-36 12-46 14 10 18 28 12 46-4-6-8-8-12-8s-8 2-12 8z"/>
          <path class="pt-fell" d="M72 116l6 4 6-4M70 126l8 4 8-4M72 136l6 4 6-4"/>
          <path class="pt-bein pt-bein--l" d="M66 154v-16"/><path class="pt-bein pt-bein--r" d="M90 154v-16"/>
          <g class="pt-kopf">
            <g class="pt-ohr pt-ohr--l"><path class="pt-k" d="M47 80L40 42L64 62z"/><path class="pt-ohr-innen" d="M46 50l12 12-12 6z"/></g>
            <g class="pt-ohr pt-ohr--r"><path class="pt-k" d="M109 80L116 42L92 62z"/><path class="pt-ohr-innen" d="M110 50l-12 12 12 6z"/></g>
            <path class="pt-k" d="M46 78L62 60q16-6 32 0L110 78q-2 22-32 30-30-8-32-30z"/>
            <path class="pt-k2" d="M52 84q12 4 18 16 4 6 8 8 4-2 8-8 6-12 18-16-8 18-26 26-18-8-26-26z"/>
            <path class="pt-fell" d="M60 64c4-2 8-2 12 0M84 64c4-2 8-2 12 0"/>
            ${auge(64, 76, 4.6, { schlitz: true })}${auge(92, 76, 4.6, { schlitz: true })}
            <ellipse class="pt-maul" cx="78" cy="103" rx="4" ry="3.4"/>
            <path class="pt-nase" d="M73 94h10l-5 5z"/>
          </g>
          ${zzz(112, 56)}
        </g></svg></div>`, wert: "3 Geräte online", regler: knopf("Alle offline", "data-online"),
    aktionen: [
      { id: "ohren", name: "Ohren zucken", text: "Erst links, dann rechts", ms: 1100 },
      { id: "lauschen", name: "Lauschen", text: "Kopf schief, Ohren nach vorn", ms: 2400 },
      { id: "schnueffeln", name: "Schnüffeln", text: "Nase zuckt in der Luft", ms: 1500 },
      { id: "gaehnen", name: "Gähnen", text: "Großes Fuchsgähnen", ms: 2000 },
      { id: "wedeln", name: "Wedeln", text: "Freudiges, schnelles Wedeln", ms: 1600 },
      { id: "pfote", name: "Pfote heben", text: "Hebt die rechte Vorderpfote", ms: 1500 },
    ],
    leben: ["ohren", "lauschen", "schnueffeln", "gaehnen", "wedeln"],
    an(b) {
      const p = b.querySelector(".pt")
      b.querySelector("[data-online]").addEventListener("click", (e) => {
        p.toggleAttribute("data-schlaeft")
        e.target.textContent = p.hasAttribute("data-schlaeft") ? "Geräte online" : "Alle offline"
        b.querySelector("[data-wert]").textContent = p.hasAttribute("data-schlaeft") ? "kein Gerät erreichbar · schläft" : "3 Geräte online"
      })
    } },

  { nr: "W09", slug: "spirale", name: "Spirale", idee: "Eine Weinbergschnecke, deren Haus der Tag ist: Die Spirale füllt sich von Morgen bis Abend. Sie kriecht ganz langsam mit der Uhrzeit über die Lichtung.",
    einsatz: "Lichtung · Tagesfortschritt · später: Termine/Knospen als Punkte auf dem Haus",
    heute: ["Spirale auf dem Haus = wie viel vom Tag vorbei ist"],
    spaeter: ["Termine als Punkte auf dem Haus", "Kriecht im Tagesverlauf über die Lichtung", "Zieht sich abends ins Haus zurück"],
    svg: `<div class="pt pt--schnecke" style="--tag:.5"><svg viewBox="0 0 160 170" aria-hidden="true">
        <ellipse class="pt-schatten" cx="82" cy="152" rx="62" ry="6"/>
        <path class="pt-schleimspur" d="M150 150h8"/>
        <g class="pt-tropfen">${[40, 70, 120].map((x, i) => `<path style="--i:${i}" d="M${x} 20c-2 4-3.4 6-3.4 8a3.4 3.4 0 0 0 6.8 0c0-2-1.4-4-3.4-8z"/>`).join("")}</g>
        <g class="pt-koerper">
          <path class="pt-haut" d="M14 150c2-14 12-22 26-22l20 4h68c14 0 22 8 22 18z"/>
          <g class="pt-kopf">
            <path class="pt-haut" d="M20 140c-4-14-2-28 6-36 8 2 12 10 12 22z"/>
            <g class="pt-fuehlergruppe">
              <path class="pt-fuehler" d="M24 106c-6-12-6-24-2-32M32 108c2-12 6-22 12-28"/>
              <circle class="pt-sklera" cx="21" cy="72" r="4"/><g class="pt-blick"><circle class="pt-auge" cx="21.5" cy="72" r="2.2"/><circle class="pt-glanz" cx="22.5" cy="71" r=".8"/></g>
              <circle class="pt-sklera" cx="45" cy="78" r="4"/><g class="pt-blick"><circle class="pt-auge" cx="45.5" cy="78" r="2.2"/><circle class="pt-glanz" cx="46.5" cy="77" r=".8"/></g>
            </g>
          </g>
          <path class="pt-fell" d="M40 144c10 2 20 2 30 0M80 146c12 1 24 1 36-1"/>
          <g class="pt-hausgruppe">
            <circle class="pt-haus" cx="94" cy="94" r="40"/>
            <path class="pt-haus-linie" d="M58 110c6 14 20 22 36 24M62 72c8-14 22-20 36-20"/>
            <path class="pt-spirale-spur" d="M94 94m0 0a6 6 0 0 1 12 0a12 12 0 0 1-24 0a18 18 0 0 1 36 0a24 24 0 0 1-48 0a30 30 0 0 1 60 0" pathLength="100"/>
            <path class="pt-spirale" d="M94 94m0 0a6 6 0 0 1 12 0a12 12 0 0 1-24 0a18 18 0 0 1 36 0a24 24 0 0 1-48 0a30 30 0 0 1 60 0" pathLength="100"/>
          </g>
        </g></svg></div>`, wert: "12:00 · halber Tag", regler: schieber(6, 22, 14, "Uhrzeit"),
    aktionen: [
      { id: "fuehler", name: "Fühler einziehen", text: "Fühler ein – und wieder aus", ms: 2200 },
      { id: "haus", name: "Ins Haus", text: "Zieht sich kurz ganz zurück", ms: 3000 },
      { id: "kriechen", name: "Kriechen", text: "Schiebt sich langsam vorwärts", ms: 3200 },
      { id: "umschauen", name: "Umschauen", text: "Fühler pendeln suchend", ms: 2600 },
      { id: "regen", name: "Regen genießen", text: "Tropfen fallen, sie streckt sich", ms: 3000 },
      { id: "tageslauf", name: "Tageslauf", text: "Spult einen ganzen Tag ab", ms: 3600, js: async (p) => {
        if (p._lauf) return
        p._lauf = true
        const alt = p.style.getPropertyValue("--tag"), start = performance.now()
        p.classList.add("pt--lauf")
        await new Promise((fertig) => { const s = (t) => { const f = Math.min(1, (t - start) / 3000); p.style.setProperty("--tag", f.toFixed(3)); f < 1 ? requestAnimationFrame(s) : fertig() }; requestAnimationFrame(s) })
        await warte(600); p.classList.remove("pt--lauf"); p.style.setProperty("--tag", alt); p._lauf = false
      } },
    ],
    leben: ["fuehler", "umschauen", "kriechen"],
    an(b) {
      const p = b.querySelector(".pt"), r = b.querySelector("[data-regler]")
      const setzen = () => { const h = +r.value; p.style.setProperty("--tag", ((h - 6) / 16).toFixed(3)); b.querySelector("[data-wert]").textContent = `${String(h).padStart(2, "0")}:00 · ${h < 11 ? "Morgen" : h < 17 ? "Tag" : "Abend"}` }
      r.value = Math.min(22, Math.max(6, new Date().getHours())); setzen()
      r.addEventListener("input", setzen)
    } },

  { nr: "W10", slug: "vinyl", name: "Vinyl", idee: "Eine Katze mit Kopfhörern auf dem Plattenspieler – Grove + Groove. Nachts döst sie, tagsüber hört sie mit. Klick = sie schnurrt.",
    einsatz: "Lichtung · Tag/Nacht, Begrüßung · später: legt Musik-Stimmung je Tageszeit auf",
    heute: ["Tagsüber dreht die Platte, sie wippt mit", "Nachts döst sie auf dem Plattenteller"],
    spaeter: ["Begrüßt dich auf der Lichtung", "Legt eine Musik-Stimmung je Tageszeit auf", "Wippt im Takt, wenn Grove Musik spielt"],
    svg: `<div class="pt pt--vinyl"><svg viewBox="0 0 160 170" aria-hidden="true">
        <rect class="pt-spieler" x="8" y="132" width="144" height="22" rx="5"/><circle class="pt-spieler__knopf" cx="140" cy="143" r="3.4"/>
        <g class="pt-platte"><ellipse cx="72" cy="132" rx="58" ry="11"/><ellipse class="pt-platte__rille" cx="72" cy="132" rx="42" ry="8"/><ellipse class="pt-platte__rille pt-platte__rille--2" cx="72" cy="132" rx="28" ry="5"/><ellipse class="pt-platte__mitte" cx="72" cy="132" rx="9" ry="2.6"/></g>
        <path class="pt-tonarm" d="M140 104v16l-26 10"/><circle class="pt-tonarm__fuss" cx="140" cy="104" r="5"/>
        <g class="pt-noten"><g style="--i:0"><path d="M114 52v-14l9-3v14"/><ellipse cx="111.6" cy="52" rx="3" ry="2.2"/><ellipse cx="120.6" cy="49" rx="3" ry="2.2"/></g><g style="--i:1"><path d="M126 66v-12"/><path d="M126 54c4 1 6 4 5 7"/><ellipse cx="123.6" cy="66" rx="3" ry="2.2"/></g><g style="--i:2"><path d="M106 40v-11"/><ellipse cx="103.6" cy="40" rx="2.6" ry="2"/></g></g>
        <g class="pt-koerper">
          <path class="pt-schwanz pt-schwanz--katze" d="M94 128c22 2 32-8 28-24-2-6-8-8-12-6"/>
          <path class="pt-k" d="M50 132c-8-26 2-48 24-52 22 4 32 26 24 52z"/>
          <path class="pt-fell pt-fell--hell" d="M64 104c2 8 2 16 0 24M84 104c-2 8-2 16 0 24"/>
          <path class="pt-k pt-pfote" d="M56 132c0-6 6-8 10-6"/><path class="pt-k" d="M92 132c0-6-6-8-10-6"/>
          <g class="pt-kopf">
            <path class="pt-k" d="M50 64l-4-28 18 14q10-4 20 0l18-14-4 28q0 20-24 24-24-4-24-24z"/>
            <path class="pt-ohr-innen" d="M50 44l8 8-8 4zM98 44l-8 8 8 4z"/>
            ${auge(63, 64, 4.4, { schlitz: true })}${auge(85, 64, 4.4, { schlitz: true })}
            <path class="pt-nase" d="M71 74h6l-3 3.4z"/><path class="pt-mund" d="M70 79q2 2 4 0q2 2 4 0"/><ellipse class="pt-maul" cx="74" cy="81" rx="3.4" ry="3"/>
            <path class="pt-bart" d="M58 74l-16-2M58 78l-16 3M90 74l16-2M90 78l16 3"/>
            <g class="pt-kopfhoerer"><path class="pt-buegel" d="M47 66C45 34 103 34 101 66"/><rect class="pt-muschel" x="41" y="58" width="11" height="18" rx="5"/><rect class="pt-muschel" x="96" y="58" width="11" height="18" rx="5"/></g>
          </g>
          ${zzz(102, 44)}
        </g></svg></div>`, wert: "Tag · hört mit", regler: knopf("Nacht", "data-nacht"),
    aktionen: [
      { id: "schnurren", name: "Schnurren", text: "Zufriedenes Vibrieren", ms: 1300 },
      { id: "mitwippen", name: "Mitwippen", text: "Kopf wippt im Takt", ms: 2600 },
      { id: "noten", name: "Noten", text: "Musik steigt aus den Kopfhörern", ms: 2800 },
      { id: "scratchen", name: "Scratchen", text: "Pfote auf der Platte – wikka wikka", ms: 1700 },
      { id: "strecken", name: "Strecken", text: "Reckt sich lang", ms: 1900 },
      { id: "gaehnen", name: "Gähnen", text: "Katzengähnen mit Augen zu", ms: 2000 },
    ],
    leben: ["mitwippen", "noten", "gaehnen", "strecken"],
    klick: "schnurren",
    an(b) {
      const p = b.querySelector(".pt")
      b.querySelector("[data-nacht]").addEventListener("click", (e) => {
        p.toggleAttribute("data-schlaeft")
        e.target.textContent = p.hasAttribute("data-schlaeft") ? "Tag" : "Nacht"
        b.querySelector("[data-wert]").textContent = p.hasAttribute("data-schlaeft") ? "Nacht · döst auf der Platte" : "Tag · hört mit"
      })
    } },
]

// Bühne füllen: HTML + Logik + Klick-Reaktion + Leben
function einrichten(pet, b, schalter) {
  const p = b.querySelector(".pt, .sa-uhu")
  pet.an?.(b)
  if (!p.classList.contains("sa-uhu")) {
    const klick = pet.aktionen.find((a) => a.id === (pet.klick || "freut")) || { id: "freut", ms: 700 }
    p.addEventListener("click", () => tun(p, klick))
  }
  leben(p, pet, schalter)
  blickEinrichten()
  return p
}

// ---------- Mini-Abteil je Pet ----------
function showcase(el, pet) {
  const i = PETS.indexOf(pet)
  let lebt = true
  el.innerHTML = `
    <div class="pt-show">
      <nav class="pt-show__leiste" aria-label="Pets">
        <a class="pt-show__zurueck" href="#pets">← Alle Pets</a>
        ${PETS.map((x) => `<a href="#pets/${x.slug}" ${x === pet ? 'aria-current="page"' : ""}><span>${x.nr}</span>${esc(x.name)}</a>`).join("")}
      </nav>
      <div class="pt-show__haupt">
        <div class="pt-show__buehne">${buehne(pet.svg, pet.wert, pet.regler || "")}</div>
        <div class="pt-show__seite">
          <div class="pt-show__titel"><span class="gh-nr">${pet.nr}</span><h3>${esc(pet.name)}</h3></div>
          <p>${esc(pet.idee)}</p>
          <div class="pt-show__zeile"><h4>Animationen · ${pet.aktionen.length}</h4>
            <label class="pt-show__leben"><input type="checkbox" checked data-leben> Bewegt sich von selbst</label></div>
          <div class="pt-show__aktionen">
            ${pet.aktionen.map((a, n) => `<button type="button" class="pt-aktion" data-a="${n}" style="--ms:${a.ms}ms"><strong>${esc(a.name)}</strong><span>${esc(a.text)}</span>${pet.leben.includes(a.id) ? '<em title="spielt auch von selbst">auch von selbst</em>' : ""}</button>`).join("")}
          </div>
          <button type="button" class="gh-demo-knopf gh-demo-knopf--leise pt-show__alle" data-alle>▶ Alle nacheinander</button>
        </div>
      </div>
      <div class="pt-show__kann">
        <div><h4>Kann heute</h4><ul>${pet.heute.map((t) => `<li>${esc(t)}</li>`).join("")}</ul><p class="gh-einsatz">Für: ${esc(pet.einsatz)}</p></div>
        <div><h4>Kann später</h4><ul>${pet.spaeter.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      </div>
      <div class="pt-show__weiter">
        <a href="#pets/${PETS[(i + PETS.length - 1) % PETS.length].slug}">‹ ${esc(PETS[(i + PETS.length - 1) % PETS.length].name)}</a>
        <a href="#pets/${PETS[(i + 1) % PETS.length].slug}">${esc(PETS[(i + 1) % PETS.length].name)} ›</a>
      </div>
    </div>`
  const b = el.querySelector(".pt-buehne")
  const p = einrichten(pet, b, () => lebt)
  el.querySelector("[data-leben]").addEventListener("change", (e) => { lebt = e.target.checked })
  const spielen = (n) => {
    const a = pet.aktionen[n], k = el.querySelector(`[data-a="${n}"]`)
    tun(p, a)
    k.classList.add("laeuft"); clearTimeout(k._t); k._t = setTimeout(() => k.classList.remove("laeuft"), a.ms)
  }
  el.querySelectorAll("[data-a]").forEach((k) => k.addEventListener("click", () => spielen(+k.dataset.a)))
  el.querySelector("[data-alle]").addEventListener("click", async (e) => {
    e.target.disabled = true
    for (let n = 0; n < pet.aktionen.length && p.isConnected; n++) { spielen(n); await warte(pet.aktionen[n].ms + 400) }
    e.target.disabled = false
  })
}

// ---------- Übersicht ----------
function uebersicht(el) {
  kacheln(el, PETS.map((pet) => ({ ...pet, buehne: "hoch", html: buehne(pet.svg, pet.wert, pet.regler || ""), an: undefined })))
  el.querySelectorAll(".gh-kachel").forEach((k, n) => {
    const pet = PETS[n]
    einrichten(pet, k.querySelector(".gh-buehne"))
    k.insertAdjacentHTML("beforeend", `<a class="gh-nochmal pt-zum-show" href="#pets/${pet.slug}">${pet.aktionen.length} Animationen ansehen →</a>`)
  })
}

export default {
  id: "pets",
  name: "Pets",
  kurz: "Kleine Wesen, die Dinge zeigen",
  beschreibung: "Pets wohnen in Grove: erst Deko, dann zeigen sie Dinge an – ungelesene Mails, Lernserie, Speicher, Geräte. Später bekommen sie echte Aufgaben. Sie bewegen sich von selbst und schauen dir nach; jedes Pet hat ein eigenes Mini-Abteil mit allen Animationen.",
  vorschau: `<span class="gh-vs"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34c0-10 6-16 14-16s14 6 14 16c0 4-6 6-14 6s-14-2-14-6z"/><path d="M12 22l-2-8 7 5M36 22l2-8-7 5"/><circle cx="19" cy="28" r="1.5"/><circle cx="29" cy="28" r="1.5"/></svg></span>`,
  anzahl: PETS.length,
  bauen(el, unter = "") {
    const pet = PETS.find((x) => x.slug === unter)
    pet ? showcase(el, pet) : uebersicht(el)
  },
}
