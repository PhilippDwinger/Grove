// ==========================================================
// Gewächshaus · Kachel-Baustein für Abteile (NUR ZUM TESTEN)
// Baut die Entwurfs-Kacheln eines Abteils aus einer Liste.
// Eintrag = { nr, name, idee, einsatz?, html, buehne?, nochmal?, an?(buehneEl) }
//   buehne  = Zusatz-Klassen der Bühne: "hoch" | "flach" | "frei" | "hell" | "links"
//   nochmal = Knopf „Nochmal“ – baut die Bühne neu (Animation startet von vorn)
//   an(el)  = kleine Logik für Klicks/Demos, bekommt die Bühne
// Optionen: { breit (zwei breite Kacheln je Zeile), voll (eine Kachel je Zeile), schmal (kleine Kacheln), werkzeug (HTML über den Kacheln) }
// ==========================================================
import { esc } from "../kern/html.js"
import "../../css/dienste/gewaechshaus/rahmen.css"

export function kacheln(el, liste, { breit = false, voll = false, schmal = false, werkzeug = "" } = {}) {
  const art = voll ? " gh-kacheln--breit gh-kacheln--voll" : breit ? " gh-kacheln--breit" : schmal ? " gh-kacheln--schmal" : ""
  el.innerHTML = `
    ${werkzeug}
    <div class="gh-kacheln${art}">
      ${liste.map((k, i) => `
        <article class="gh-kachel" data-i="${i}">
          <div class="gh-buehne${k.buehne ? " " + k.buehne.split(" ").map((b) => "gh-buehne--" + b).join(" ") : ""}"></div>
          <div class="gh-kachel__kopf"><strong>${esc(k.name)}</strong><span class="gh-nr">${esc(k.nr)}</span></div>
          ${k.idee ? `<p>${esc(k.idee)}</p>` : ""}
          ${k.einsatz ? `<p class="gh-einsatz">Für: ${esc(k.einsatz)}</p>` : ""}
          ${k.nochmal ? `<button type="button" class="gh-nochmal" data-nochmal>↻ Nochmal</button>` : ""}
        </article>`).join("")}
    </div>`

  el.querySelectorAll(".gh-kachel").forEach((kachel) => {
    const k = liste[+kachel.dataset.i]
    const buehne = kachel.querySelector(".gh-buehne")
    const fuellen = () => {
      buehne.innerHTML = k.html
      if (k.an) k.an(buehne)
    }
    fuellen()
    kachel.querySelector("[data-nochmal]")?.addEventListener("click", fuellen)
  })
}

// Tempo-Leiste wie im Abteil „Ladeanimationen“ (setzt --gl-tempo am Abteil)
export const TEMPO_LEISTE = `
  <div class="gh-werkzeug">
    <span class="gh-werkzeug__titel">Tempo</span>
    <div class="gh-segment" role="group" aria-label="Tempo">
      <button type="button" data-tempo="1.6" aria-pressed="false">Langsam</button>
      <button type="button" data-tempo="1" aria-pressed="true">Normal</button>
      <button type="button" data-tempo="0.65" aria-pressed="false">Schnell</button>
    </div>
  </div>`

export function tempoEinrichten(el) {
  el.querySelectorAll("[data-tempo]").forEach((k) => k.addEventListener("click", () => {
    el.style.setProperty("--gl-tempo", k.dataset.tempo)
    el.querySelectorAll("[data-tempo]").forEach((b) => b.setAttribute("aria-pressed", b === k))
  }))
}

// kleine Hilfe: wartet ms Millisekunden (für Demo-Abläufe)
export const warten = (ms) => new Promise((r) => setTimeout(r, ms))
