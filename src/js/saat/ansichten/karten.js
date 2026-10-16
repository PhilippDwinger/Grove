// ==========================================================
// Saat · Alle Karten: Beherrschung, Suche, Filter, Sortierung, Detail, Vorziehen
// ==========================================================
import { esc } from "../../kern/html.js"
import { S, STUFEN, STUFEN_NAME, BLOCK_SYMBOL } from "../symbole.js"
import { normal } from "../hilfen.js"
import { vorneTitel, vorneIstBild } from "../format.js"
import { stufeMarke, faelligText, leerHtml, BILD } from "./ui.js"
import { karteDetailHtml, karteDetailAktivieren } from "./karte-dialog.js"
import { konflikteHtml, konflikteAktivieren } from "./konflikte.js"

const SEITE = 120
const SORTEN = [
    ["faellig", "Nächste Fälligkeit"],
    ["schwach", "Unsicherste zuerst"],
    ["stark", "Sicherste zuerst"],
    ["alpha", "Alphabetisch"],
    ["zuletzt", "Zuletzt gelernt"],
    ["schwer", "Schwierigste zuerst"],
    ["datei", "Wie in der Datei"],
]

// Merkt sich Filter innerhalb dieser Seite (nicht dauerhaft)
const f = { suche: "", stufe: "alle", deck: "alle", sorte: "faellig", menge: SEITE, gewaehlt: null }

export function zeigen(el, app, parameter = []) {
    if (parameter[0]) f.gewaehlt = parameter[0]
    el.innerHTML = `
    <section class="sa-karten">
        <header class="sa-kopf">
            <div><h1>Karten</h1><p>Jede Karte nur einmal – egal in wie vielen Lerndateien sie steht. Die Stufe zeigt, wie sicher du sie gerade abrufen kannst.</p></div>
        </header>
        <div data-konflikte-box></div>
        <div class="sa-werkzeug">
            <input class="sa-suche" type="search" placeholder="Karten durchsuchen" aria-label="Karten durchsuchen" value="${esc(f.suche)}" data-filter-suche>
            <div class="sa-segment" role="group" aria-label="Nach Stufe filtern" data-stufen></div>
            <select class="sa-auswahlfeld" data-deck aria-label="Lerndatei"></select>
            <select class="sa-auswahlfeld" data-sorte aria-label="Sortierung">${SORTEN.map(([w, t]) => `<option value="${w}"${f.sorte === w ? " selected" : ""}>${t}</option>`).join("")}</select>
        </div>
        <div class="sa-karten__haupt">
            <div data-liste-box>
                <div class="sa-liste__aktionen" data-aktionen></div>
                <div class="sa-liste" data-liste role="list"></div>
            </div>
            <aside class="sa-detail sa-detail--seite" data-detail hidden></aside>
        </div>
    </section>`
    el.querySelector("[data-filter-suche]").addEventListener("input", (e) => { f.suche = e.target.value; f.menge = SEITE; listeZeichnen(el, app) })
    el.querySelector("[data-deck]").addEventListener("change", (e) => { f.deck = e.target.value; f.menge = SEITE; aktualisieren(el, app) })
    el.querySelector("[data-sorte]").addEventListener("change", (e) => { f.sorte = e.target.value; listeZeichnen(el, app) })
    aktualisieren(el, app)
}

export function aktualisieren(el, app) {
    const l = app.lager
    const box = el.querySelector("[data-konflikte-box]")
    if (!box) return
    box.innerHTML = konflikteHtml(l)
    konflikteAktivieren(box, app)
    const decks = [...l.decks.values()].sort((a, b) => a.deck.titel.localeCompare(b.deck.titel))
    if (f.deck !== "alle" && !l.decks.has(f.deck)) f.deck = "alle"
    el.querySelector("[data-deck]").innerHTML = `<option value="alle">Alle Lerndateien</option>${decks.map((d) => `<option value="${esc(d.deck.id)}"${f.deck === d.deck.id ? " selected" : ""}>${esc(d.deck.titel)}</option>`).join("")}`
    listeZeichnen(el, app)
    detailZeichnen(el, app)
}

function eintraege(app) {
    const l = app.lager
    const jetzt = l.jetzt()
    const out = []
    let i = 0
    for (const e of l.index.eintraege.values()) {
        i++
        if (f.deck !== "alle" && !e.vorkommen.some((v) => v.deckId === f.deck)) continue
        const z = l.zustand(e.schluessel)
        out.push({ e, z, stufe: l.beherrschung(e.schluessel, jetzt), r: z ? l.abruf(e.schluessel, jetzt) : -1, i })
    }
    return out
}

function listeZeichnen(el, app) {
    const l = app.lager
    const alle = eintraege(app)
    const zaehler = { alle: alle.length, gut: 0, okay: 0, schlecht: 0, neu: 0 }
    for (const x of alle) zaehler[x.stufe]++
    el.querySelector("[data-stufen]").innerHTML = ["alle", "gut", "okay", "schlecht", "neu"].map((s) =>
        `<button type="button" data-stufe="${s}" aria-pressed="${f.stufe === s}" class="${s !== "alle" ? "sa-stufe--" + s : ""}">${s !== "alle" ? STUFEN[s] : ""}<span>${s === "alle" ? "Alle" : s === "neu" ? "Neu" : STUFEN_NAME[s]}</span><b>${zaehler[s]}</b></button>`).join("")
    el.querySelectorAll("[data-stufe]").forEach((k) => k.addEventListener("click", () => { f.stufe = k.dataset.stufe; f.menge = SEITE; listeZeichnen(el, app) }))

    const q = normal(f.suche)
    let liste = alle.filter((x) => (f.stufe === "alle" || x.stufe === f.stufe) && (!q || normal(`${x.e.karte.vorne?.text} ${x.e.karte.vorne?.zusatz} ${x.e.karte.antwort} ${(x.e.karte.alternativen || []).join(" ")} ${(x.e.karte.tags || []).join(" ")} ${x.e.id}`).includes(q)))
    const unendlich = Number.MAX_SAFE_INTEGER
    const sorten = {
        faellig: (a, b) => (a.z?.faellig ?? unendlich) - (b.z?.faellig ?? unendlich) || a.i - b.i,
        schwach: (a, b) => a.r - b.r || a.i - b.i,
        stark: (a, b) => b.r - a.r || a.i - b.i,
        alpha: (a, b) => vorneTitel(a.e.karte).localeCompare(vorneTitel(b.e.karte), "de"),
        zuletzt: (a, b) => (b.z?.letzte ?? 0) - (a.z?.letzte ?? 0),
        schwer: (a, b) => (b.z?.d ?? 0) - (a.z?.d ?? 0),
        datei: (a, b) => a.i - b.i,
    }
    liste.sort(sorten[f.sorte] || sorten.faellig)

    const aktionen = el.querySelector("[data-aktionen]")
    aktionen.innerHTML = liste.length ? `<span class="sa-klein">${liste.length} ${liste.length === 1 ? "Karte" : "Karten"}</span>
        <span class="sa-liste__knoepfe"><button class="g-knopf-leise" type="button" data-alle-lernen>${S.spielen} Diese ${Math.min(liste.length, 200)} abfragen</button><button class="sa-symbolknopf" type="button" data-alle-art title="Mit anderer Lernart" aria-label="Mit anderer Lernart">${S.sprechblase}</button></span>` : ""
    aktionen.querySelector("[data-alle-art]")?.addEventListener("click", () =>
        app.modusWaehlen(liste.slice(0, 200).map((x) => ({ schluessel: x.e.schluessel })), { titel: "Auswahl aus der Kartenliste", zurueck: "karten" }))
    aktionen.querySelector("[data-alle-lernen]")?.addEventListener("click", () =>
        app.lernen({ modus: "karte", aufgaben: liste.slice(0, 200).map((x) => ({ schluessel: x.e.schluessel })), titel: "Auswahl aus der Kartenliste", zurueck: "karten" }))

    const box = el.querySelector("[data-liste]")
    if (!alle.length) {
        box.innerHTML = leerHtml({ bild: BILD.beet, titel: "Noch keine Karten", text: "Leg unter „Saatgut“ eine Lerndatei an oder öffne eine.", knoepfe: `<a class="g-knopf" href="#saatgut">Zum Saatgut</a>` })
        return
    }
    if (!liste.length) { box.innerHTML = leerHtml({ bild: BILD.lupe, titel: "Nichts gefunden", text: "Versuch's mit einem anderen Wort oder Filter." }); return }
    const jetzt = l.jetzt()
    box.innerHTML = liste.slice(0, f.menge).map(({ e, z, stufe }) => `
        <div class="sa-zeile${f.gewaehlt === e.schluessel ? " ist-aktiv" : ""}" role="listitem" data-k="${esc(e.schluessel)}" tabindex="0">
            ${stufeMarke(stufe, { text: false })}
            <div class="sa-zeile__text">
                <strong>${vorneIstBild(e.karte) ? `<span class="sa-zeile__bild" title="Bildkarte">${BLOCK_SYMBOL.bild}</span>` : ""}${esc(vorneTitel(e.karte) || "(ohne Vorderseite)")}${e.karte.vorne?.zusatz && !vorneIstBild(e.karte) ? ` <small>${esc(e.karte.vorne.zusatz)}</small>` : ""}</strong>
                <span>${esc(vorneIstBild(e.karte) ? (e.karte.alternativen || [])[0] || "" : e.karte.antwort || "")}</span>
            </div>
            <span class="sa-zeile__info">${e.vorkommen.length > 1 ? `<span class="sa-marke" title="Steht in ${e.vorkommen.length} Lerndateien – ein gemeinsamer Lernstand">${S.kette}${e.vorkommen.length}</span>` : ""}${e.konflikt && !e.konflikt.geloest ? `<span class="sa-marke sa-marke--warm" title="ID-Konflikt">${S.warnung}</span>` : ""}<span class="sa-zeile__wann">${faelligText(z, jetzt)}</span></span>
            <span class="sa-zeile__knoepfe">
                <button class="sa-symbolknopf" type="button" data-abfragen title="Jetzt abfragen (auch wenn nicht fällig)" aria-label="Jetzt abfragen">${S.spielen}</button>
                <button class="sa-symbolknopf" type="button" data-auswahl title="Andere Lernart wählen" aria-label="Andere Lernart wählen">${S.sprechblase}</button>
            </span>
        </div>`).join("") + (liste.length > f.menge ? `<button class="g-knopf-leise sa-mehr" type="button" data-mehr>${liste.length - f.menge} weitere zeigen</button>` : "")

    box.querySelector("[data-mehr]")?.addEventListener("click", () => { f.menge += SEITE * 2; listeZeichnen(el, app) })
    box.querySelectorAll(".sa-zeile").forEach((z) => {
        const k = z.dataset.k
        z.addEventListener("click", (e) => {
            if (e.target.closest("[data-abfragen]")) return app.lernen({ modus: "karte", aufgaben: [{ schluessel: k }], titel: "Einzelne Karte", zurueck: "karten" })
            if (e.target.closest("[data-auswahl]")) return app.modusWaehlen([{ schluessel: k }], { titel: "Einzelne Karte", zurueck: "karten" })
            f.gewaehlt = f.gewaehlt === k ? null : k
            box.querySelectorAll(".sa-zeile").forEach((x) => x.classList.toggle("ist-aktiv", x.dataset.k === f.gewaehlt))
            detailZeichnen(el, app)
        })
        z.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === z) z.click() })
    })
}

function detailZeichnen(el, app) {
    const d = el.querySelector("[data-detail]")
    const haupt = el.querySelector(".sa-karten__haupt")
    if (!f.gewaehlt || !app.lager.eintrag(f.gewaehlt)) {
        d.hidden = true
        haupt.classList.remove("mit-detail")
        return
    }
    d.hidden = false
    haupt.classList.add("mit-detail")
    d.innerHTML = karteDetailHtml(app, f.gewaehlt, { schliessen: true })
    karteDetailAktivieren(d, app, f.gewaehlt, {
        schliessen: () => { f.gewaehlt = null; el.querySelectorAll(".sa-zeile.ist-aktiv").forEach((x) => x.classList.remove("ist-aktiv")); detailZeichnen(el, app) },
    })
    if (matchMedia("(max-width: 900px)").matches) d.scrollIntoView({ behavior: "smooth", block: "start" })
}
