// ==========================================================
// Laub · Vorschau
// Ein kleines Grove-Fenster, das immer zeigt, wie der gewählte
// Bereich aussieht. Funktioniert wie die echten Seiten: Die Variablen
// des Bereichs werden auf das Vorschau-Element gesetzt – alles darin
// erbt sie (CSS-Variablen vererben sich an alle Kinder).
// ==========================================================
import {
    wirksam, variablen, variablenSetzen, bildQuelle, atmoSetzen, begruessungSetzen,
    schriftenLaden, zeichenDatei, einfaerben,
} from "../kern/thema.js"
import { ZEICHEN_EFFEKTE, KARTEN, SZENEN, BEREICHE } from "../kern/thema-daten.js"
import { dienste } from "../dienste.js"
import { ctx, el } from "./bausteine.js"

const ICON = (pfad) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pfad}</svg>`

export function vorschauErstellen(aside) {
    aside.innerHTML = `
      <div class="vs" data-thema-vorschau="grove">
        <div class="vs-titel"><span>Vorschau</span><strong class="vs-bereich"></strong></div>
        <div class="vs-fenster">
          <div class="vs-kopf">
            <img class="vs-zeichen" alt="">
            <span class="vs-marke"><span class="vs-marke__name"></span><small class="vs-marke__zusatz"></small></span>
            <span class="vs-icons">
              <i class="vs-rund">${ICON('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>')}</i>
              <i class="vs-rund">${ICON('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')}</i>
              <i class="vs-avatar">P</i>
            </span>
          </div>
          <div class="vs-hero">
            <img class="vs-szene" alt="">
            <div class="vs-atmo" aria-hidden="true"></div>
            <div class="vs-hero__text">
              <p class="vs-datum">Samstag, 10. Oktober</p>
              <h3 class="vs-gruss"></h3>
              <p class="vs-unter">Willkommen auf deiner <em>Lichtung</em>.</p>
            </div>
          </div>
          <div class="vs-inhalt">
            <div class="vs-atmo vs-atmo--seite" aria-hidden="true"></div>
            <a class="vs-karte" href="#" tabindex="-1">
              <span class="vs-buehne"><img class="vs-bild" alt=""></span>
              <span class="vs-kinhalt">
                <span class="vs-zeile"><b class="vs-kname"></b><span class="vs-status">Aktiv</span></span>
                <span class="vs-art"></span>
                <span class="vs-text"></span>
                <span class="vs-los">Öffnen</span>
              </span>
            </a>
            <div class="vs-knoepfe">
              <button class="vs-voll" type="button" tabindex="-1">${ICON('<path d="M5 12l5 5 9-10"/>')} Speichern</button>
              <button class="vs-leise" type="button" tabindex="-1">${ICON('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>')} Löschen</button>
            </div>
            <label class="vs-feld"><span>Suchen</span><input value="Jazzabend am Freitag" tabindex="-1" readonly></label>
            <div class="vs-chips"><span class="vs-gut">✓ Gespeichert</span><span class="vs-fehler">Fehler</span><span class="vs-tag">#grove</span></div>
          </div>
        </div>
        <p class="vs-fuss">Fahr über die Karte – so reagieren Karten beim Drüberfahren.</p>
      </div>`

    const $ = (s) => aside.querySelector(s)
    const vs = $(".vs")
    let letzte = {}

    function zeichnen() {
        const bereich = ctx.bereich
        const w = wirksam(bereich)
        const info = BEREICHE.find((b) => b.id === bereich)
        const dienst = dienste.find((d) => d.id === bereich) || dienste.find((d) => d.id === "myzel")
        const mitHero = bereich === "grove" || bereich === "lichtung"

        vs.dataset.themaVorschau = bereich
        variablenSetzen(vs, variablen(w))
        vs.dataset.bewegung = w.bewegung.stufe
        vs.dataset.enden = w.symbole.enden
        vs.toggleAttribute("data-symbole", !!w.symbole.strich)
        schriftenLaden([w.schrift.titel, w.schrift.text])
        $(".vs-bereich").textContent = info?.name || bereich

        // Kopfzeile: Logo oder Zeichen des Dienstes
        const zeichenId = mitHero ? w.bilder.logo : w.bilder.zeichen
        bildQuelle($(".vs-zeichen"), zeichenDatei(zeichenId) || zeichenDatei("grove"))
        const z = $(".vs-zeichen")
        for (const e of ZEICHEN_EFFEKTE) if (e.klasse) z.classList.remove(e.klasse)
        const effekt = ZEICHEN_EFFEKTE.find((e) => e.id === w.bewegung.zeichen)
        if (effekt?.klasse && w.bewegung.stufe === "voll") z.classList.add(effekt.klasse)
        $(".vs-marke__name").textContent = mitHero ? "Grove" : (info?.name || "Grove").replace("Grove ", "")
        $(".vs-marke__zusatz").textContent = mitHero ? "" : (dienst?.art || "")

        // Hero mit Szene + Begrüßung (nur Lichtung / Ganz Grove)
        $(".vs-hero").hidden = !mitHero
        const szene = SZENEN.find((s) => s.id === w.bilder.szene) || SZENEN[0]
        $(".vs-szene").hidden = !szene.datei
        if (szene.datei) bildQuelle($(".vs-szene"), szene.datei)
        if (letzte.gruss !== w.bewegung.begruessung + w.schrift.titel) {
            begruessungSetzen($(".vs-gruss"), "Guten Abend, Paddy.", w.bewegung.begruessung)
            letzte.gruss = w.bewegung.begruessung + w.schrift.titel
        }

        // Hintergrund-Animation: im Hero oder hinter dem Inhalt
        const atmoAn = w.bewegung.stufe === "voll" ? w.bewegung.hintergrund : "keiner"
        atmoSetzen($(".vs-hero .vs-atmo"), mitHero ? atmoAn : "keiner")
        atmoSetzen($(".vs-atmo--seite"), mitHero ? "keiner" : atmoAn)

        // Beispiel-Karte
        const karte = $(".vs-karte")
        const k = KARTEN.find((x) => x.id === w.bilder.karte) || KARTEN.find((x) => x.id === dienst?.id)
        bildQuelle($(".vs-bild"), k?.datei || dienst?.bild)
        $(".vs-kname").textContent = dienst?.name || "Myzel"
        $(".vs-art").textContent = dienst?.art || ""
        $(".vs-text").textContent = dienst?.beschreibung || ""
        karte.classList.toggle("a40", w.bewegung.hover === "leuchten")
        karte.classList.toggle("a41", w.bewegung.hover === "kippen")
        karte.dataset.hover = w.bewegung.hover
        if (letzte.eingang !== w.bewegung.eingang) {        // Erscheinen neu abspielen
            letzte.eingang = w.bewegung.eingang
            karte.dataset.eingang = w.bewegung.eingang
            karte.style.animation = "none"; void karte.offsetWidth; karte.style.animation = ""
        }
        vs.querySelectorAll("img").forEach((img) => img.dataset.orig && einfaerben(img))
    }

    return { zeichnen }
}
