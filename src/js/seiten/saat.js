// ==========================================================
// Saat · Seite (src/dienste/saat/index.html) – Lernen
//
// Saat ist bewusst unabhängig von Konto, Supabase und Internet:
//   • kein Türsteher (schutz.js) – eingeloggt sieht man trotzdem Glocke + Nutzermenü
//   • alles liegt im gewählten Lernspeicher (Ordner auf dem PC oder Browser-Speicher)
//   • nichts von Lernstand, Profil oder Statistik geht an einen Server
//
// Ansichten (Hash in der Adresse): #heute · #karten (#karte/<schlüssel>) · #saatgut ·
//   #editor/<datei-id>[/<karten-id>] · #profil · #lernen (laufende Sitzung)
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub
import "../kern/alle-dienste.js"
import "../../css/kern.css"
import { sucheEinrichten } from "../kern/suche.js"
import { esc } from "../kern/html.js"
import { idb } from "../kern/idb.js"
import { Lager } from "../saat/lager.js"
import { gemerkterOrt, ortMerken, zugriff, verzeichnisFuer } from "../saat/ort.js"
import { meldung, fehlerMeldung } from "../saat/ansichten/ui.js"
import { S } from "../saat/symbole.js"
import { aufgabeTauglich } from "../saat/ansichten/lernen.js"
import * as willkommen from "../saat/ansichten/willkommen.js"
import * as heute from "../saat/ansichten/heute.js"
import * as karten from "../saat/ansichten/karten.js"
import * as saatgut from "../saat/ansichten/saatgut.js"
import * as editor from "../saat/ansichten/editor.js"
import * as profil from "../saat/ansichten/profil.js"
import * as lernen from "../saat/ansichten/lernen.js"
import { importieren } from "../saat/ansichten/importieren.js"
import { karteAnsehen } from "../saat/ansichten/karte-dialog.js"

sucheEinrichten()
kontoEinbinden()

const seite = document.getElementById("saat")
const ANSICHTEN = { heute, karten, saatgut, editor, profil, lernen }
const NAV = [
    ["heute", "Heute", S.blitz],
    ["karten", "Karten", S.stapel],
    ["saatgut", "Saatgut", S.ordner],
    ["profil", "Lernprofil", S.profil],
]

export const app = {
    lager: null,
    ort: null,
    sitzung: null,           // laufende Lernsitzung (Einstellungen)
    aktuell: null,           // { name, ansicht, el }

    gehe(hash) {
        if (location.hash === "#" + hash) zeichnen()
        else location.hash = hash
    },

    // Lernsitzung starten. aufgaben: [{ schluessel, deckId?, kartenId? }]
    lernen({ modus = "karte", aufgaben, titel = "Lernen", zurueck = location.hash.slice(1) || "heute" }) {
        if (!aufgaben.length) { meldung("Keine passenden Karten."); return }
        let ausgelassen = 0
        if (modus === "auswahl") {
            const tauglich = aufgaben.filter((a) => aufgabeTauglich(app.lager, a))
            ausgelassen = aufgaben.length - tauglich.length
            aufgaben = tauglich
            if (!aufgaben.length) {
                meldung("Für diese Karten gibt es keine passenden Antwortmöglichkeiten – lern sie im Karteikarten-Modus.", { dauer: 5000 })
                return
            }
        }
        app.sitzung = { modus, aufgaben, titel, zurueck: zurueck.startsWith("lernen") ? "heute" : zurueck, ausgelassen, id: Date.now() }
        app.gehe("lernen")
    },

    importieren: (dateien) => importieren(app, dateien),
    karteAnsehen: (schluessel) => karteAnsehen(app, schluessel),
    neuZeichnen: () => zeichnen(),
}
window.saatApp = app        // für Tests im Browser

// ---------- Start ----------
start().catch((f) => {
    console.error(f)
    seite.innerHTML = `<div class="sa-fehler-gross">${S.warnung}<strong>Saat konnte nicht starten</strong><span>${esc(f.message || f)}</span><button class="g-knopf" type="button" onclick="location.reload()">Neu laden</button></div>`
})

async function start() {
    const ort = await gemerkterOrt()
    if (!ort) return willkommen.zeigen(seite, app, { oeffnen })
    const status = await zugriff(ort)
    if (status === "ok") return oeffnen(ort)
    willkommen.zugriffZeigen(seite, app, ort, status, { oeffnen })
}

export async function oeffnen(ort, { neu = false } = {}) {
    seite.innerHTML = `<div class="sa-laden" role="status"><span class="sa-laden__keim" aria-hidden="true"></span>Lernspeicher wird geöffnet …</div>`
    const verz = await verzeichnisFuer(ort)
    app.lager?.schliessen()
    const lager = await Lager.oeffnen(verz)
    app.lager = lager
    app.ort = ort
    await ortMerken(ort)
    lager.addEventListener("aenderung", beiAenderung)
    lager.addEventListener("von-aussen", () => { beiAenderung({ vonAussen: true }); meldung("Von einem anderen Tab aktualisiert") })
    suchindexSchreiben()
    if (neu && !lager.decks.size) location.hash = "heute"
    zeichnen()
}
app.oeffnen = oeffnen

// ---------- Ansichten ----------
window.addEventListener("hashchange", () => zeichnen())

function zeichnen() {
    if (!app.lager) return
    let [name, ...rest] = location.hash.slice(1).split("/")
    if (name === "karte") { rest = [rest.join("/")]; name = "karten" }
    if (!ANSICHTEN[name] || (name === "lernen" && !app.sitzung)) name = "heute"
    app.aktuell?.ansicht.verlassen?.()
    if (name !== "lernen") app.sitzung = null

    const vollbild = name === "lernen"
    document.body.classList.toggle("sa-vollbild", vollbild)
    seite.innerHTML = vollbild ? `<div class="sa-inhalt"></div>` : `
        <nav class="sa-nav" aria-label="Saat">
            ${NAV.map(([id, text, sym]) => `<a href="#${id}" class="sa-nav__punkt"${name === id || (name === "editor" && id === "saatgut") ? ' aria-current="page"' : ""}>${sym}<span>${text}</span></a>`).join("")}
            <span class="sa-nav__ort" title="Lernspeicher: ${esc(app.ort?.name || "")}">${S.ordner}<span>${esc(app.ort?.name || "")}</span></span>
        </nav>
        <div class="sa-inhalt"></div>`
    const el = seite.querySelector(".sa-inhalt")
    const ansicht = ANSICHTEN[name]
    app.aktuell = { name, ansicht, el, parameter: rest.map(decodeURIComponent) }
    try {
        ansicht.zeigen(el, app, app.aktuell.parameter)
    } catch (f) {
        console.error(f)
        el.innerHTML = `<div class="sa-fehler-gross">${S.warnung}<strong>Diese Ansicht hatte ein Problem</strong><span>${esc(f.message)}</span></div>`
    }
    if (!vollbild) window.scrollTo({ top: 0 })
}

let zeitgeber = null
function beiAenderung({ vonAussen = false } = {}) {
    clearTimeout(zeitgeber)
    zeitgeber = setTimeout(suchindexSchreiben, 1200)
    const a = app.aktuell
    if (!a) return
    if (a.ansicht.aktualisieren) return a.ansicht.aktualisieren(a.el, app, { vonAussen })
    if (a.ansicht.ruhig) return
    zeichnen()
}

// Kleiner Suchindex für Strg+K (bleibt in diesem Browser, js/saat/register.js liest ihn)
async function suchindexSchreiben() {
    const l = app.lager
    if (!l) return
    const liste = [...l.index.eintraege.values()].map((e) => ({ k: e.schluessel, v: e.karte.vorne?.text || "", z: e.karte.vorne?.zusatz || "", a: e.karte.antwort || "", d: e.deck.titel }))
    try { await idb.setzen("saat-suche", liste) } catch { /* egal */ }
}

// ---------- Konto (freiwillig) ----------
async function kontoEinbinden() {
    const ohne = document.querySelector("[data-ohne-konto]")
    try {
        const { supabase } = await import("../kern/supabase.js")
        const { data } = await supabase.auth.getSession()
        if (!data?.session) { ohne.hidden = false; return }
        document.querySelector(".nutzer").hidden = false
        document.getElementById("glocke").hidden = false
        await import("../nutzermenue.js")
        await import("../glocke.js")
    } catch (f) {
        // offline oder ohne Supabase – Saat läuft trotzdem
        console.info("Saat: ohne Konto-Anbindung", f?.message)
        ohne.hidden = false
    }
}

// Ungespeicherte Arbeit gibt es nicht (alles wird sofort geschrieben) – aber eine laufende Sitzung
window.addEventListener("beforeunload", () => app.lager?.schliessen())
export { fehlerMeldung }
