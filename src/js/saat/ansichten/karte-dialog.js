// ==========================================================
// Saat · Karten-Detail (Seitenleiste in „Karten“ und Dialog bei Verweisen)
// Zeigt die Karte, ihren Lernstand und ihre Geschichte; von hier aus lässt sie sich
// jederzeit abfragen (vorziehen), bearbeiten oder zurücksetzen.
// ==========================================================
import { esc } from "../../kern/html.js"
import { bestaetigen } from "../../kern/dialog.js"
import { S } from "../symbole.js"
import { vorderseite, rueckseite, aktivieren } from "../darstellung.js"
import { ERGEBNIS } from "../planer.js"
import { dialog, stufeMarke, datumZeit, faelligText, prozent, zahl, meldung, fehlerMeldung } from "./ui.js"
import { ctxFuer } from "./kontext.js"

const ERGEBNIS_TEXT = { nicht: "Nicht gewusst", erkannt: "Kam mir bekannt vor", gewusst: "Gewusst", leicht: "Ganz leicht" }

export function karteDetailHtml(app, schluessel, { schliessen = false } = {}) {
    const l = app.lager
    const e = l.eintrag(schluessel)
    if (!e) return `<p class="sa-klein">Diese Karte ist in keiner geladenen Lerndatei mehr.</p>`
    const z = l.zustand(schluessel)
    const jetzt = l.jetzt()
    const stufe = l.beherrschung(schluessel, jetzt)
    const p = l.pFuer(e)
    const verlauf = (l.verlauf.get(schluessel) || []).slice(-12).reverse()
    const ctx = ctxFuer(app, e.deck)
    const geaendert = z && verlauf[0]?.fp && verlauf[0].fp !== e.fp
    return `
    <div class="sa-detail__kopf">
        ${stufeMarke(stufe)}
        ${schliessen ? `<button class="sa-symbolknopf" type="button" data-zu aria-label="Schließen">${S.zu}</button>` : ""}
    </div>
    <div class="sa-detail__karte">
        ${vorderseite(e.karte, ctx)}
        <hr>
        ${rueckseite(e.karte, ctx)}
    </div>
    <div class="sa-detail__knoepfe">
        <button class="g-knopf" type="button" data-abfragen>${S.spielen} Jetzt abfragen</button>
        <button class="g-knopf-leise" type="button" data-auswahl>${S.sprechblase} Andere Lernart</button>
    </div>
    ${geaendert ? `<p class="sa-hinweis">${S.info}<span>Vorderseite oder Antwort haben sich seit der letzten Abfrage geändert. Der Lernstand gilt weiter.</span></p>` : ""}
    ${e.konflikt && !e.konflikt.geloest ? `<p class="sa-hinweis sa-hinweis--warm">${S.warnung}<span>Diese ID hat in einer anderen Datei einen anderen Inhalt.</span><button class="g-knopf-leise" type="button" data-konflikte>Klären</button></p>` : ""}
    <dl class="sa-fakten">
        <dt>Nächste Abfrage</dt><dd>${z ? `${datumZeit(z.faellig)} <small>(${faelligText(z, jetzt)})</small>` : "noch nicht gelernt"}</dd>
        <dt>Abrufwahrscheinlichkeit</dt><dd>${z ? prozent(l.abruf(schluessel, jetzt)) : "–"}</dd>
        <dt>Stabilität</dt><dd>${z ? `${zahl(z.s * p.faktor)} Tage` : "–"}</dd>
        <dt>Schwierigkeit</dt><dd>${z ? `${zahl(z.d)} von 10` : "–"}</dd>
        <dt>Abfragen</dt><dd>${z ? `${z.wdh} (${z.frei}× frei gewusst${z.mc ? `, ${z.mc}× Auswahl` : ""}${z.fehler ? `, ${z.fehler}× vergessen` : ""})` : "0"}</dd>
        <dt>Lerngebiet</dt><dd>${esc(e.gebiet)}</dd>
        <dt>ID</dt><dd><code>${esc(e.id)}</code></dd>
        <dt>Steht in</dt><dd>${e.vorkommen.map((v) => `<a href="#editor/${encodeURIComponent(v.deckId)}/${encodeURIComponent(e.id)}">${esc(l.decks.get(v.deckId)?.deck.titel || v.deckId)}</a>`).join("<br>")}</dd>
    </dl>
    ${verlauf.length ? `<details class="sa-verlauf"><summary>Verlauf (${(l.verlauf.get(schluessel) || []).length})</summary><ol>
        ${verlauf.map((ev) => `<li><span>${datumZeit(ev.t)}</span><span>${ev.a === "auswahl" ? (ev.ok ? "Auswahl richtig" : "Auswahl falsch") : esc(ERGEBNIS_TEXT[ERGEBNIS[ev.b]])}${ev.vz ? " · vorgezogen" : ""}</span></li>`).join("")}
    </ol></details>` : ""}
    ${z ? `<button class="g-knopf-text sa-gefahr" type="button" data-zuruecksetzen>Lernstand dieser Karte zurücksetzen</button>` : ""}`
}

export function karteDetailAktivieren(el, app, schluessel, { schliessen } = {}) {
    const l = app.lager
    const e = l.eintrag(schluessel)
    if (!e) return
    aktivieren(el.querySelector(".sa-detail__karte"), ctxFuer(app, e.deck))
    const zu = () => schliessen?.()
    el.querySelector("[data-zu]")?.addEventListener("click", zu)
    el.querySelector("[data-abfragen]")?.addEventListener("click", () => { zu(); app.lernen({ modus: "karte", aufgaben: [{ schluessel }], titel: "Einzelne Karte" }) })
    el.querySelector("[data-auswahl]")?.addEventListener("click", () => { zu(); app.modusWaehlen([{ schluessel }], { titel: "Einzelne Karte" }) })
    el.querySelector("[data-konflikte]")?.addEventListener("click", async () => { zu(); (await import("./konflikte.js")).konflikteDialog(app) })
    el.querySelector("[data-zuruecksetzen]")?.addEventListener("click", async () => {
        if (!(await bestaetigen({ titel: "Lernstand zurücksetzen?", text: "Die Karte gilt danach wieder als neu. Der bisherige Verlauf bleibt im Protokoll erhalten, zählt aber nicht mehr.", ja: "Zurücksetzen", gefahr: true }))) return
        try { await l.zuruecksetzen(schluessel); meldung("Lernstand zurückgesetzt") } catch (f) { fehlerMeldung(f) }
    })
}

// Dialog (z. B. Klick auf einen Verweis während des Lernens)
export function karteAnsehen(app, schluessel) {
    let schliessen = () => {}
    return dialog({
        titel: "Karte", breit: false, knoepfe: [],
        html: `<div class="sa-detail">${karteDetailHtml(app, schluessel)}</div>`,
        beimOeffnen: (d) => {
            schliessen = () => d.close()
            // im Lernmodus nicht aus der laufenden Sitzung herausreißen
            if (app.sitzung) d.querySelectorAll("[data-abfragen], [data-auswahl], [data-zuruecksetzen]").forEach((k) => k.remove())
            karteDetailAktivieren(d, app, schluessel, { schliessen })
        },
    })
}
