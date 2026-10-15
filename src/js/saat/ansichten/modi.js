// ==========================================================
// Saat · Lernarten (Modi) – was gibt es, welche Karte taugt wofür, Auswahl-Dialog
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { auswahlBauen } from "../ablenker.js"
import { schreibTauglich } from "../eingabe.js"
import { zeichenTauglich } from "../zeichnen-kern.js"
import { dialog } from "./ui.js"
import { aufgabeAufloesen } from "./kontext.js"

export const MODI = [
    { id: "karte", name: "Karteikarten", text: "Erinnern, aufdecken, ehrlich bewerten. Das Herzstück.", symbol: S.stapel },
    { id: "auswahl", name: "Auswahl", text: "Drei Antworten, eine stimmt. Leichter – zählt darum weniger.", symbol: S.auswahl },
    { id: "tippen", name: "Schreiben", text: "Die Antwort selbst eintippen. Bei Japanisch geht auch Romaji.", symbol: S.tastatur },
    { id: "zeichnen", name: "Zeichnen", text: "Die Lösung von Hand ins Feld malen – für Kanji, Kana, Formen.", symbol: S.pinsel },
    { id: "gespraech", name: "Gespräch", text: "Professor Uhu stellt dir abwechselnd Aufgaben in allen Arten.", symbol: S.sprechblase },
]
export const modusName = (id) => MODI.find((m) => m.id === id)?.name ?? "Karteikarten"

let poolCache = { index: null, liste: [] }
export function pool(lager) {
    if (poolCache.index !== lager.index) {
        poolCache = { index: lager.index, liste: [...lager.index.eintraege.values()].map((e) => ({ karte: e.karte, deckId: e.deck.id })) }
    }
    return poolCache.liste
}
export function auswahlFuer(lager, a) {
    const r = aufgabeAufloesen(lager, a)
    return r ? auswahlBauen({ karte: r.karte, deckId: r.deck.id }, pool(lager)) : null
}

// Taugt diese Aufgabe für den Modus?
export function tauglich(lager, a, modus) {
    if (modus === "karte" || modus === "gespraech") return !!aufgabeAufloesen(lager, a)
    if (modus === "auswahl") return !!auswahlFuer(lager, a)
    const r = aufgabeAufloesen(lager, a)
    if (!r) return false
    if (modus === "tippen") return schreibTauglich(r.karte)
    if (modus === "zeichnen") return zeichenTauglich(r.karte)
    return false
}

// Dialog: Lernart wählen (zeigt, für wie viele der Karten jede Art passt)
export async function modusWaehlen(app, aufgaben, { titel = "Lernen", zurueck } = {}) {
    if (!aufgaben.length) return
    const anzahl = Object.fromEntries(MODI.map((m) => [m.id, aufgaben.filter((a) => tauglich(app.lager, a, m.id)).length]))
    let gewaehlt = null
    await dialog({
        titel: "Wie möchtest du lernen?", breit: true, knoepfe: [],
        html: `<p class="sa-klein">${aufgaben.length} ${aufgaben.length === 1 ? "Karte" : "Karten"} · ${esc(titel)}</p>
            <div class="sa-modi">${MODI.map((m) => `<button type="button" class="sa-modus" data-modus="${m.id}" ${anzahl[m.id] ? "" : "disabled"}>
                ${m.symbol}<strong>${esc(m.name)}</strong><span>${esc(m.text)}</span>
                <small>${anzahl[m.id] === aufgaben.length ? "alle Karten" : anzahl[m.id] ? `${anzahl[m.id]} von ${aufgaben.length} Karten` : m.id === "zeichnen" ? "keine Karte hat eine Zeichen-Schablone" : "passt zu keiner Karte"}</small>
            </button>`).join("")}</div>`,
        beimOeffnen: (d) => d.querySelectorAll("[data-modus]").forEach((k) => k.addEventListener("click", () => { gewaehlt = k.dataset.modus; d.close("ok") })),
    })
    if (gewaehlt) app.lernen({ modus: gewaehlt, aufgaben, titel, zurueck })
}
