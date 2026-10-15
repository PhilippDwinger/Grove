// ==========================================================
// Saat · Erster Start: Lernspeicher wählen (+ Zugriff nach Neustart erneuern)
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { Lager } from "../lager.js"
import { ordnerMoeglich, ordnerWaehlen, browserOrt, zugriff, verzeichnisFuer, ortVergessen, dauerhaftBitten } from "../ort.js"
import { dialog, fehlerMeldung, dateiWaehlen } from "./ui.js"
import { zipLesen } from "../paket.js"

const BILD = `<svg class="sa-willkommen__bild" viewBox="0 0 320 120" aria-hidden="true">
  <path class="erde" d="M10 100c50-12 100-12 150 0s100 12 150 0"/>
  <path class="erde" d="M30 86c40-8 80-8 120 0s80 8 120 0" opacity=".45"/>
  <ellipse class="flaeche" cx="62" cy="88" rx="5" ry="7"/>
  <g class="pflanze p1"><path d="M122 94V80"/><path class="flaeche" d="M122 84c0-6-4.5-9-10-9 0 6 4.5 9 10 9z"/></g>
  <g class="pflanze p2"><path d="M182 96V66"/><path class="flaeche" d="M182 78c0-7-5-11-12-11 0 7 5 11 12 11zM182 73c0-7 5-11 12-11 0 7-5 11-12 11z"/></g>
  <g class="pflanze p3"><path d="M248 98V40"/>${[50, 60, 70, 80].map((y) => `<path class="korn" d="M248 ${y}c-3.4-.8-5.2-3.4-5.2-6.8 3.4.6 5.2 3 5.2 6.8zM248 ${y}c3.4-.8 5.2-3.4 5.2-6.8-3.4.6-5.2 3-5.2 6.8z"/>`).join("")}</g>
</svg>`

export function zeigen(el, app, { oeffnen }) {
    const ordner = ordnerMoeglich()
    el.innerHTML = `
    <section class="sa-willkommen">
        ${BILD}
        <h1>Saat</h1>
        <p class="sa-willkommen__satz">Lernen, das Wurzeln schlägt.</p>
        <ul class="sa-willkommen__punkte">
            <li>${S.haken}<span>Wiederholungen genau dann, wenn du kurz vor dem Vergessen bist – und das System lernt mit, wie dein Gedächtnis tickt.</span></li>
            <li>${S.haken}<span>Eigene Lerndateien mit Beispielsätzen, Übersetzungen, Bildern, Merksätzen und kleinen Aufgaben.</span></li>
            <li>${S.haken}<span>Alles bleibt bei dir: kein Konto nötig, kein Server, läuft auch offline.</span></li>
        </ul>
        <h2>Wo soll dein Lernspeicher liegen?</h2>
        <div class="sa-wahl">
            <button type="button" class="sa-wahl__karte" data-ordner ${ordner ? "" : "disabled"}>
                ${S.ordner}
                <strong>Ordner auf diesem PC ${ordner ? `<em>empfohlen</em>` : ""}</strong>
                <span>${ordner
                    ? "Z. B. Dokumente\\Saat. Du siehst die Dateien im Explorer, kannst sie sichern und den Ordner auf einen anderen PC mitnehmen."
                    : "Dieser Browser darf keine Ordner öffnen. Das geht in Chrome oder Edge am PC."}</span>
            </button>
            <button type="button" class="sa-wahl__karte" data-browser>
                ${S.karte}
                <strong>Im Browser</strong>
                <span>Für Handy, Tablet und Browser ohne Ordnerzugriff. Umziehen geht über „Sicherung herunterladen“.</span>
            </button>
        </div>
        <p class="sa-willkommen__klein">Schon einen Lernspeicher? Wähle seinen Ordner – Saat erkennt ihn. Oder <button type="button" class="g-knopf-text" data-sicherung>lade eine Sicherung (.zip)</button> in den Browser-Speicher.</p>
    </section>`

    el.querySelector("[data-ordner]").addEventListener("click", async () => {
        try {
            const ort = await ordnerWaehlen()
            if (!ort) return
            const verz = await verzeichnisFuer(ort)
            if (await Lager.istLernspeicher(verz)) return oeffnen(ort)
            const inhalt = (await verz.liste()).filter((e) => !e.name.startsWith("."))
            if (inhalt.length) {
                const w = await dialog({
                    titel: "Ordner ist nicht leer",
                    html: `<p>In „${esc(ort.name)}“ liegen schon ${inhalt.length} Einträge. Saat legt darin seine Unterordner an (<code>saatgut</code>, <code>medien</code>, <code>fortschritt</code> …) und verändert nichts anderes.</p><p>Am übersichtlichsten ist ein eigener, leerer Ordner – z. B. „Saat“.</p>`,
                    knoepfe: [{ wert: "", text: "Anderen wählen", art: "leise" }, { wert: "ja", text: "Trotzdem hier", art: "haupt" }],
                })
                if (w !== "ja") return
            }
            await oeffnen(ort, { neu: true })
        } catch (f) { fehlerMeldung(f) }
    })

    el.querySelector("[data-browser]").addEventListener("click", async () => {
        try {
            const ort = await browserOrt()
            await dauerhaftBitten()
            await oeffnen(ort, { neu: true })
        } catch (f) { fehlerMeldung(f) }
    })

    el.querySelector("[data-sicherung]").addEventListener("click", async () => {
        const [datei] = await dateiWaehlen({ accept: ".zip,.saatstand" })
        if (!datei) return
        try {
            const quelle = await zipLesen(datei, datei.name)
            const ort = await browserOrt()
            await dauerhaftBitten()
            const lager = await Lager.oeffnen(await verzeichnisFuer(ort), { kanal: false })
            await lager.zusammenfuehren(quelle, { profil: "uebernehmen" })
            await oeffnen(ort)
        } catch (f) { fehlerMeldung(f) }
    })
}

// Nach einem Neustart: Ordnerzugriff erneuern (der Browser verlangt dafür einen Klick)
export function zugriffZeigen(el, app, ort, status, { oeffnen }) {
    const weg = status === "weg"
    el.innerHTML = `
    <section class="sa-willkommen sa-willkommen--kurz">
        ${BILD}
        <h1>${weg ? "Ordner nicht gefunden" : "Weiterlernen?"}</h1>
        <p class="sa-willkommen__satz">${weg
            ? `Der Lernspeicher „${esc(ort.name)}“ ist nicht mehr da – vielleicht umbenannt, verschoben oder auf einem Laufwerk, das gerade fehlt.`
            : `Dein Browser fragt einmal nach, ob Saat wieder auf den Ordner „${esc(ort.name)}“ zugreifen darf.`}</p>
        <div class="sa-willkommen__knoepfe">
            ${weg ? `<button class="g-knopf" type="button" data-nochmal>Nochmal versuchen</button>` : `<button class="g-knopf" type="button" data-erlauben>${S.ordner} Zugriff erlauben</button>`}
            <button class="g-knopf-leise" type="button" data-anderer>Anderen Speicher wählen</button>
        </div>
    </section>`
    el.querySelector("[data-erlauben]")?.addEventListener("click", async () => {
        const s = await zugriff(ort, { fragen: true })
        if (s === "ok") oeffnen(ort)
        else if (s === "weg") zugriffZeigen(el, app, ort, "weg", { oeffnen })
    })
    el.querySelector("[data-nochmal]")?.addEventListener("click", async () => {
        const s = await zugriff(ort, { fragen: true })
        if (s === "ok") oeffnen(ort)
    })
    el.querySelector("[data-anderer]").addEventListener("click", async () => {
        await ortVergessen()
        zeigen(el, app, { oeffnen })
    })
}
