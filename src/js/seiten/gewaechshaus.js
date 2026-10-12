// ==========================================================
// Gewächshaus · Seite (src/dienste/gewaechshaus/index.html)
// NUR ZUM TESTEN – hier wachsen Animationen und Design-Ideen,
// bevor sie nach Grove umziehen. Wird später wieder entfernt.
// Abteile: js/gewaechshaus/abteile.js · Adresse: /dienste/gewaechshaus/#<abteil-id>
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub
import "../kern/schutz.js"
import "../glocke.js"
import "../nutzermenue.js"
import "../kern/alle-dienste.js"
import "../../css/kern.css"
import { sucheEinrichten } from "../kern/suche.js"
import { esc } from "../kern/html.js"
import { ABTEILE } from "../gewaechshaus/abteile.js"

sucheEinrichten()

const app = document.getElementById("gewaechshaus")

function zeigen() {
  const id = decodeURIComponent(location.hash.slice(1))
  const abteil = ABTEILE.find((a) => a.id === id) || null
  app.innerHTML = `
    <p class="gh-hinweis">Nur zum Testen · Das Gewächshaus fliegt später wieder raus. Was hier gefällt, zieht vorher nach Grove um.</p>
    <header class="gh-kopf">
      <h1>Gewächshaus</h1>
      <p>Hier wachsen neue Animationen und Design-Ideen. Jedes Abteil sammelt Entwürfe zu einem Thema.</p>
    </header>
    <nav class="gh-abteile" aria-label="Abteile">
      <a href="#" ${abteil ? "" : 'aria-current="page"'}>Übersicht</a>
      ${ABTEILE.map((a) => `<a href="#${a.id}" ${abteil === a ? 'aria-current="page"' : ""}>${esc(a.name)}</a>`).join("")}
    </nav>
    <section class="gh-bereich"></section>`
  const bereich = app.querySelector(".gh-bereich")

  if (abteil) {
    const kopf = document.createElement("div")
    kopf.className = "gh-abteil-kopf"
    kopf.innerHTML = `<h2>${esc(abteil.name)}</h2><p>${esc(abteil.beschreibung)}</p>`
    const inhalt = document.createElement("div")
    bereich.append(kopf, inhalt)
    abteil.bauen(inhalt)
  } else {
    bereich.innerHTML = `
      <div class="gh-uebersicht">
        ${ABTEILE.map((a) => `
          <a class="gh-abteil" href="#${a.id}">
            <span class="gh-abteil__vorschau">${a.vorschau || ""}</span>
            <strong>${esc(a.name)}</strong>
            <span>${esc(a.kurz)}</span>
            <span class="gh-abteil__zahl">${a.anzahl} Entwürfe</span>
          </a>`).join("")}
        <div class="gh-abteil gh-abteil--leer">
          <strong>Nächstes Abteil</strong>
          <span>Sag einfach, worum es gehen soll: Knöpfe, Übergänge, Hintergründe …</span>
        </div>
      </div>`
  }
  window.scrollTo({ top: 0 })
}

window.addEventListener("hashchange", zeigen)
zeigen()
