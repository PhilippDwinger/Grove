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
