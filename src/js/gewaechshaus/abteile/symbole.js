// ==========================================================
// Gewächshaus · Abteil „Symbole“ (NUR ZUM TESTEN)
// S01–S32: neue Linien-Symbole (24×24, Strich = currentColor).
// Gefällt eins: als SVG nach public/bilder/zeichen/ (48×48) oder direkt inline nutzen.
// CSS: css/dienste/gewaechshaus/symbole.css (.gs)
// ==========================================================
import { esc } from "../../kern/html.js"
import "../../../css/dienste/gewaechshaus/rahmen.css"
import "../../../css/dienste/gewaechshaus/symbole.css"

const S = [
  ["S01", "Knospe", "Aufgaben", `<path d="M12 21v-7"/><path d="M12 14c-3 0-4.5-2.5-4.5-5S10 4.2 12 3c2 1.2 4.5 3.5 4.5 6s-1.5 5-4.5 5z"/><path d="M12 14V9"/><path d="M12 18.5c-1.8 0-3.4-.9-4-2.4 1.6-.3 3.1.3 4 1.4"/>`],
  ["S02", "Blüte", "Aufgabe erledigt", `<circle cx="12" cy="9" r="2"/><circle cx="12" cy="5.3" r="2.3"/><circle cx="15.5" cy="7.8" r="2.3"/><circle cx="14.2" cy="11.9" r="2.3"/><circle cx="9.8" cy="11.9" r="2.3"/><circle cx="8.5" cy="7.8" r="2.3"/><path d="M12 14.3V21"/><path d="M12 18c1.6 0 3-.8 3.6-2.2-1.5-.3-2.8.2-3.6 1.2"/>`],
  ["S03", "Lesezeichen", "Lesezeichen-Dienst", `<path d="M7 3h10v18l-5-4-5 4z"/><path d="M12 7v6"/><path d="M12 10.5l-2-1.6M12 10.5l2-1.6"/>`],
  ["S04", "Zeitleiste", "Jahresringe", `<path d="M3 12h3M8 12h1.5M14.5 12H16M18 12h3"/><circle cx="7" cy="12" r="1.2"/><circle cx="12" cy="12" r="2.6"/><circle cx="12" cy="12" r=".6"/><circle cx="17" cy="12" r="1.2"/>`],
  ["S05", "Heute", "„Heute“ auf der Lichtung", `<path d="M3 19h18"/><path d="M7 19a5 5 0 0 1 10 0"/><path d="M12 11.5V9"/><path d="M6.4 13.5L4.9 12"/><path d="M17.6 13.5l1.5-1.5"/><path d="M6 22h4M14 22h4"/>`],
  ["S06", "Server", "Eigener Server", `<rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><circle cx="8" cy="7.5" r=".9"/><circle cx="8" cy="16.5" r=".9"/><path d="M12 7.5h4.5M12 16.5h4.5"/>`],
  ["S07", "Laptop", "Gerät (Bridge)", `<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2.5 18.5h19"/><path d="M10 18.5l.5-1h3l.5 1"/>`],
  ["S08", "Handy", "Gerät (Bridge)", `<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>`],
  ["S09", "Tor", "Realm", `<path d="M5 21V11a7 7 0 0 1 14 0v10"/><path d="M3 21h18"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/>`],
  ["S10", "Tunnel", "Cloudflare-Tunnel, Verbindung nach außen", `<circle cx="4.5" cy="15" r="2"/><circle cx="19.5" cy="15" r="2"/><path d="M6.5 15h11" stroke-dasharray="1.6 2"/><path d="M8 19v-4a4 4 0 0 1 8 0v4"/>`],
  ["S11", "Backup", "Sicherung", `<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".7"/>`],
  ["S12", "Kalender", "Termine, Fälligkeit", `<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="M12 17.5c0-2 1.2-3 3-3-.1 2-1.2 3-3 3zM12 17.5c0-1.5-.9-2.4-2.3-2.4 0 1.5.9 2.4 2.3 2.4z"/>`],
  ["S13", "Hochladen", "Harz", `<path d="M12 20V8"/><path d="M7 12l5-5 5 5"/><path d="M5 4h14"/>`],
  ["S14", "Herunterladen", "Mühle, Export", `<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>`],
  ["S15", "Teilen", "Verbinden, Myzel", `<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/>`],
  ["S16", "Schloss", "Rinde gesperrt", `<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.3" r="1.3"/><path d="M12 16.6v1.9"/>`],
  ["S17", "Schlüssel", "Zugang, privater Realm", `<circle cx="8" cy="8" r="4.5"/><circle cx="8" cy="8" r="1.2"/><path d="M11.2 11.2L20 20"/><path d="M16.5 16.5l2-2M18.6 18.6l1.6-1.6"/>`],
  ["S18", "Einstellungen", "Zahnrad als Jahresring", `<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2.4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>`],
  ["S19", "Kopfhörer", "Audio, Musik", `<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6.5" rx="1.6"/><rect x="17" y="14" width="4" height="6.5" rx="1.6"/>`],
  ["S20", "Plattenspieler", "Groove, Abspielen", `<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="10.5" cy="12" r="5"/><circle cx="10.5" cy="12" r="1.1"/><path d="M18 6.5v6.5l-3 2.5"/>`],
  ["S21", "Laterne", "Offline, Hinweise", `<path d="M8.5 7l1.3-3h4.4L15.5 7"/><path d="M12 2v2"/><rect x="7" y="7" width="10" height="11" rx="2"/><path d="M9 20.5h6"/><path d="M12 10c1.2 1.4 1.6 2.4 1.6 3.2a1.6 1.6 0 0 1-3.2 0c0-.8.4-1.8 1.6-3.2z"/>`],
  ["S22", "Pilz", "Myzel, Wachstum", `<path d="M3.5 12a8.5 7 0 0 1 17 0z"/><path d="M9.5 12v6.5a2.5 2.5 0 0 0 5 0V12"/><circle cx="9" cy="8.6" r="1"/><circle cx="14.6" cy="7.6" r="1"/>`],
  ["S23", "Feder", "Schreiben, Notiz", `<path d="M20 3.5C12.5 4.5 8 9.5 7 17l-2 3.5"/><path d="M7 17c4.5 0 8.5-2 10.5-7.5"/><path d="M10 13h4.5"/>`],
  ["S24", "Kompass", "Entdecken, Wege", `<circle cx="12" cy="12" r="9"/><path d="M15.3 8.7l-2 4.6-4.6 2 2-4.6z"/><circle cx="12" cy="12" r=".6"/>`],
  ["S25", "Wolke", "Sync, Supabase", `<path d="M7 18h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.6A3.2 3.2 0 0 0 7 18z"/>`],
  ["S26", "Mikrofon", "Sprachnotiz", `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21M9 21h6"/>`],
  ["S27", "Equalizer", "Aktivität, Last", `<path d="M4 20v-5M8 20V8M12 20v-9M16 20V5M20 20v-7"/>`],
  ["S28", "Papierkorb", "Löschen", `<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v5M14 11v5"/>`],
  ["S29", "Glühwürmchen", "Warten, Nacht", `<path d="M12 8a2 2 0 0 1 2 2v3.5a2 2 0 0 1-4 0V10a2 2 0 0 1 2-2z"/><path d="M10 10.5C7 9.3 5 10.2 4 12.3c2 1 4 1 6 .2M14 10.5c3-1.2 5-.3 6 1.8-2 1-4 1-6 .2"/><path d="M11 8L9.6 5.5M13 8l1.4-2.5"/><circle class="gs-licht" cx="12" cy="18.5" r="1.6"/>`],
  ["S30", "Wurzeln", "Bridge, Verbindungen", `<path d="M12 3v8"/><path d="M12 11c-2 2-5.5 3-7 8.5M12 11c2 2 5.5 3 7 8.5M12 11v10"/><path d="M8.7 15.5L6 15M15.3 15.5l2.7-.5"/>`],
  ["S31", "Note", "Groove, Jazz", `<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/><path d="M9 9.5l10-2"/>`],
  ["S32", "Kaffee", "Pause, Ruhe-Modus", `<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 6.5c0-1 1-1 1-2M12.5 6.5c0-1 1-1 1-2"/>`],
]

const svg = (inhalt, cls = "") => `<svg class="gs${cls}" viewBox="0 0 24 24" aria-hidden="true">${inhalt}</svg>`

export default {
  id: "symbole",
  name: "Symbole",
  kurz: "32 neue Linien-Zeichen",
  beschreibung: "Neue Zeichen für Dienste und Aktionen, die Grove noch fehlen – im selben Strich wie die Kopfzeile. Oben kannst du Strichstärke und Größe testen. Fahr über ein Zeichen für Amber.",
  vorschau: `<span class="gh-vs">${svg(S[0][3])}${svg(S[19][3])}${svg(S[8][3])}</span>`,
  anzahl: S.length,
  bauen(el) {
    el.innerHTML = `
      <div class="gh-werkzeug gs-werkzeug">
        <span class="gh-werkzeug__titel">Strich</span>
        <div class="gh-segment" role="group" aria-label="Strichstärke">
          ${[["1.3", "Fein"], ["1.8", "Normal"], ["2.4", "Kräftig"]].map(([w, n]) => `<button type="button" data-strich="${w}" aria-pressed="${w === "1.8"}">${n}</button>`).join("")}
        </div>
        <span class="gh-werkzeug__titel">Enden</span>
        <div class="gh-segment" role="group" aria-label="Enden">
          ${[["round", "Rund"], ["square", "Eckig"]].map(([w, n]) => `<button type="button" data-enden="${w}" aria-pressed="${w === "round"}">${n}</button>`).join("")}
        </div>
      </div>
      <div class="gs-raster">
        ${S.map(([nr, name, wofuer, inhalt]) => `
          <figure class="gs-kachel" title="${esc(wofuer)}">
            ${svg(inhalt, " gs--gross")}
            <span class="gs-klein">${svg(inhalt)}${svg(inhalt, " gs--mini")}</span>
            <figcaption><strong>${esc(name)}</strong><span class="gh-nr">${nr}</span></figcaption>
            <span class="gs-wofuer">${esc(wofuer)}</span>
          </figure>`).join("")}
      </div>
      <h3 class="gs-unterkopf">So sehen sie im Einsatz aus</h3>
      <div class="gs-einsatz">
        <nav class="gs-leiste">
          ${[0, 4, 3, 2, 5].map((i, n) => `<a href="#" onclick="return false" ${n === 1 ? 'aria-current="page"' : ""}>${svg(S[i][3])}<span>${S[i][1] === "Knospe" ? "Knospen" : S[i][1]}</span></a>`).join("")}
        </nav>
        <div class="gs-chips">
          ${[12, 13, 14, 27].map((i) => `<button type="button" class="gs-chip">${svg(S[i][3])}${esc(S[i][1])}</button>`).join("")}
        </div>
      </div>`
    const setzen = (attr, prop) => el.querySelectorAll(`[data-${attr}]`).forEach((k) => k.addEventListener("click", () => {
      el.style.setProperty(prop, k.dataset[attr])
      el.querySelectorAll(`[data-${attr}]`).forEach((b) => b.setAttribute("aria-pressed", b === k))
    }))
    setzen("strich", "--gs-strich")
    setzen("enden", "--gs-enden")
  },
}
