// ==========================================================
// Saat · ID-Konflikte anzeigen und entscheiden
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { dialog, fehlerMeldung, meldung } from "./ui.js"

export function konflikteHtml(lager, { kurz = false } = {}) {
    const offen = lager.index.konflikte.filter((k) => !k.geloest)
    if (!offen.length) return ""
    if (kurz) {
        return `<div class="sa-hinweis sa-hinweis--warm">${S.warnung}<span>${offen.length === 1 ? "Eine Karten-ID kommt" : `${offen.length} Karten-IDs kommen`} in mehreren Lerndateien mit unterschiedlichem Inhalt vor. Bis du entscheidest, haben die Varianten getrennte Lernstände.</span><button class="g-knopf-leise" type="button" data-konflikte>Ansehen</button></div>`
    }
    return `<section class="sa-konflikte">
        <h2>${S.warnung} Gleiche ID, anderer Inhalt</h2>
        <p class="sa-klein">Saat hat nichts vermischt: Die zuletzt gelernte Variante behält den Lernstand, die anderen lernst du vorerst getrennt. Sag Saat, ob es dieselbe Karte ist.</p>
        ${offen.map((k) => konfliktHtml(lager, k)).join("")}
    </section>`
}

function konfliktHtml(lager, k) {
    const titel = (ids) => ids.map((id) => esc(lager.decks.get(id)?.deck.titel || id)).join(", ")
    return `<article class="sa-konflikt" data-id="${esc(k.id)}">
        <p class="sa-konflikt__id">ID <code>${esc(k.id)}</code></p>
        <div class="sa-konflikt__varianten">
            ${k.varianten.map((v) => `<div class="sa-konflikt__variante${v.status === "haupt" ? " ist-haupt" : ""}">
                <strong>${esc(v.karte.vorne?.text || "–")}</strong><span>${esc(v.karte.antwort || "–")}</span>
                <small>${titel(v.decks)}${v.status === "haupt" ? " · hat den Lernstand" : v.status === "gleich" ? " · zusammengeführt" : v.status === "getrennt" ? " · getrennt" : ""}</small>
                ${v.status === "offen" ? `<div class="sa-konflikt__knoepfe">
                    <button class="g-knopf-leise" type="button" data-gleich="${esc(v.schluessel)}">Dieselbe Karte</button>
                    <button class="g-knopf-leise" type="button" data-getrennt="${esc(v.schluessel)}">Verschiedene Karten</button></div>` : ""}
            </div>`).join("")}
        </div>
    </article>`
}

export function konflikteAktivieren(el, app) {
    const l = app.lager
    el.querySelectorAll("[data-konflikte]").forEach((k) => k.addEventListener("click", () => konflikteDialog(app)))
    el.querySelectorAll("[data-gleich]").forEach((k) => k.addEventListener("click", async () => {
        const id = k.closest("[data-id]").dataset.id
        try { await l.konfliktEntscheiden(k.dataset.gleich, "gleich", id); meldung("Zusammengeführt – die Lernstände zählen jetzt gemeinsam") } catch (f) { fehlerMeldung(f) }
    }))
    el.querySelectorAll("[data-getrennt]").forEach((k) => k.addEventListener("click", async () => {
        try { await l.konfliktEntscheiden(k.dataset.getrennt, "getrennt"); meldung("Bleiben getrennte Karten") } catch (f) { fehlerMeldung(f) }
    }))
}

export function konflikteDialog(app) {
    return dialog({
        titel: "Karten-Konflikte", breit: true, knoepfe: [{ wert: "", text: "Fertig", art: "leise" }],
        html: konflikteHtml(app.lager),
        beimOeffnen: (d) => {
            konflikteAktivieren(d, app)
            const neu = () => {
                const inhalt = d.querySelector(".sa-dialog__inhalt")
                if (!inhalt) return
                inhalt.innerHTML = konflikteHtml(app.lager) || `<p>Alle Konflikte sind entschieden.</p>`
                konflikteAktivieren(d, app)
            }
            app.lager.addEventListener("aenderung", neu)
            d.addEventListener("close", () => app.lager.removeEventListener("aenderung", neu))
        },
    })
}
