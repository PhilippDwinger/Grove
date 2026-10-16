// ==========================================================
// Grove · Hauptmenü (index.html)
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import "../kern/schutz.js"                       // zuerst: nur Eingeloggte
import "../glocke.js"
import { ladeNutzer } from "../nutzermenue.js"
import { dienste, statusText } from "../dienste.js"
import { begruessungSetzen, karteFuer } from "../kern/thema.js"
import "../kern/alle-dienste.js"                 // Suche kennt alle Dienste
import { sucheEinrichten } from "../kern/suche.js"

sucheEinrichten()                                // Strg+K + Lupe in der Kopfzeile

// ---------- Begrüßung nach Tageszeit ----------
const stunde = new Date().getHours()
const gruss =
    stunde < 5  ? "Gute Nacht" :
    stunde < 11 ? "Guten Morgen" :
    stunde < 17 ? "Guten Tag" :
    stunde < 22 ? "Guten Abend" : "Gute Nacht"

const nutzer = await ladeNutzer()
const vorname = nutzer ? nutzer.name.split("@")[0] : ""
const begruessung = document.querySelector("#begruessung")
begruessungSetzen(begruessung, `${gruss}, ${vorname}.`)   // Effekt wählt man in Laub
window.addEventListener("grove-thema", () => begruessungSetzen(begruessung, `${gruss}, ${vorname}.`))
document.querySelector("#datum").textContent = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long",
})

// ---------- Dienst-Karten aus der Liste bauen ----------
const raster = document.querySelector("#dienste-raster")
const vorlage = document.querySelector("#dienst-vorlage")
const platzhalter = document.querySelector("#dienst-platzhalter")

dienste.forEach((dienst, i) => {
    const karte = vorlage.content.firstElementChild.cloneNode(true)
    karte.style.setProperty("--i", i)
    karte.dataset.status = dienst.status
    karte.dataset.themaDienst = dienst.id          // Farben + Bild dieses Dienstes (Laub)
    karte.dataset.id = dienst.id                   // für Layouts (z. B. Terminal: „grove open <id>“)
    karte.dataset.nr = karte.querySelector(".dienst__buehne").dataset.nr = String(i + 1).padStart(2, "0")
    karte.style.setProperty("--r", `${((i * 37) % 9) - 4}deg`)   // feste „Schiefe“ für Pinnwand & Co.
    karte.style.setProperty("--h", (i * 37) % 5)                 // feste Höhenstufe 0–4 (Bibliothek)
    karte.style.setProperty("--bahn", i % 2 ? 0.62 : 1)          // Sternwarte: innere/äußere Umlaufbahn …
    karte.style.setProperty("--richtung", i % 2 ? -1.4 : 1)      // … die innere läuft schneller und andersherum
    karte.style.setProperty("--start", `${Math.floor(i / 2) * (720 / dienste.length) + (i % 2) * 30}deg`)

    karte.querySelector(".dienst__bild").src = karteFuer(dienst.id, dienst.bild)
    karte.querySelector(".dienst__name").textContent = dienst.name
    karte.querySelector(".dienst__art").textContent = dienst.art
    karte.querySelector(".dienst__text").textContent = dienst.beschreibung
    karte.querySelector(".dienst__status").textContent = statusText[dienst.status]

    if (dienst.pfad && dienst.status !== "bald") {
        karte.href = dienst.pfad
    } else {
        karte.removeAttribute("href")
        karte.setAttribute("aria-disabled", "true")
        karte.querySelector(".dienst__los").textContent = "Wächst noch"
    }
    raster.insertBefore(karte, platzhalter)
})
platzhalter.style.setProperty("--i", dienste.length)
platzhalter.dataset.nr = String(dienste.length + 1).padStart(2, "0")

// Für die Menü-Layouts aus Laub (html[data-menue], css/seiten/hauptmenue.css): Anzahl + Mitte
raster.style.setProperty("--n", dienste.length)
raster.style.setProperty("--mitte", (dienste.length - 1) / 2)
const mitte = document.createElement("div")       // Zentrum der „Umlaufbahn“ (sonst unsichtbar)
mitte.className = "raster__mitte"
mitte.setAttribute("aria-hidden", "true")
mitte.innerHTML = `<img src="/bilder/marke/grove-logo.svg" alt="" data-logo><span data-mitte-name>Grove</span><em data-mitte-art></em><p data-mitte-text></p>`
raster.prepend(mitte)
const mitteZeigen = (karte) => {
    mitte.querySelector("[data-mitte-name]").textContent = karte ? karte.querySelector(".dienst__name").textContent : "Grove"
    mitte.querySelector("[data-mitte-art]").textContent = karte ? karte.querySelector(".dienst__art").textContent : ""
    mitte.querySelector("[data-mitte-text]").textContent = karte ? karte.querySelector(".dienst__text").textContent : "Fahr über einen Dienst."
    mitte.classList.toggle("hat-dienst", !!karte)
}
mitteZeigen(null)

// ---------- „Schweben“ statt :hover ----------
// Viele Layouts heben/drehen die Karte beim Drüberfahren. Mit reinem :hover rutscht die Karte dabei
// manchmal unter der Maus weg → Hover aus → Karte fällt zurück → Hover an … (Flackern).
// Darum: .schwebt bleibt, solange die Maus in der ALTEN oder der NEUEN Fläche der Karte ist.
// Das CSS (hauptmenue.css, menue-layouts.css, thema.css) nutzt a.dienst.schwebt statt a.dienst:hover.
const drin = (r, x, y) => !!r && x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 1 && y <= r.bottom + 1
let schwebend = null
function schwebenAus() {
    if (!schwebend) return
    schwebend.el.classList.remove("schwebt")
    schwebend = null
    document.removeEventListener("pointermove", pruefen)
    if (document.documentElement.dataset.menue === "orbit") mitteZeigen(null)
}
function pruefen(e) {
    if (!schwebend) return
    if (drin(schwebend.start, e.clientX, e.clientY) || drin(schwebend.el.getBoundingClientRect(), e.clientX, e.clientY)) return
    schwebenAus()
    const darunter = document.elementFromPoint(e.clientX, e.clientY)?.closest(".dienst")
    if (darunter && raster.contains(darunter)) starten(darunter)
}
function starten(karte) {
    schwebend = { el: karte, start: karte.getBoundingClientRect() }
    karte.classList.add("schwebt")
    document.addEventListener("pointermove", pruefen)
    // Abendrot: der zuletzt gezeigte Streifen bleibt offen · Sternwarte/Bibliothek: Infos in der Mitte
    raster.querySelectorAll(".ist-offen").forEach((x) => x.classList.remove("ist-offen"))
    karte.classList.add("ist-offen")
    mitteZeigen(karte)
}
raster.querySelectorAll(".dienst").forEach((karte) => {
    karte.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch" || schwebend?.el === karte) return
        // Nachbarkarte unter der Maus: nur wechseln, wenn die Maus die alte Fläche wirklich verlassen hat
        if (schwebend && (drin(schwebend.start, e.clientX, e.clientY) || drin(schwebend.el.getBoundingClientRect(), e.clientX, e.clientY))) return
        schwebenAus()
        starten(karte)
    })
    karte.addEventListener("pointerleave", pruefen)
    karte.addEventListener("focus", () => { raster.querySelectorAll(".ist-offen").forEach((x) => x.classList.remove("ist-offen")); karte.classList.add("ist-offen"); mitteZeigen(karte) })
})
document.documentElement.addEventListener("pointerleave", schwebenAus)
window.addEventListener("scroll", () => { if (schwebend) schwebend.start = null }, { passive: true })
raster.querySelector("a.dienst")?.classList.add("ist-offen")
