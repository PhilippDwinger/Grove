// ==========================================================
// Saat · Lernprofil, Einstellungen und Speicher (Daten mitnehmen)
// ==========================================================
import { esc } from "../../kern/html.js"
import { bestaetigen } from "../../kern/dialog.js"
import { S } from "../symbole.js"
import { kalibrierung, neuesProfil } from "../profil.js"
import { herunterladen } from "../paket.js"
import { Lager } from "../lager.js"
import { ordnerMoeglich, ordnerWaehlen, verzeichnisFuer, browserOrt, dauerhaftBitten } from "../ort.js"
import { meldung, fehlerMeldung, dialog, dateiWaehlen, prozent, zahl, datumZeit } from "./ui.js"

export function zeigen(el, app) {
    const l = app.lager
    const p = l.profil
    const m = p.modell
    const e = p.einstellungen
    const kal = kalibrierung(p, l.beobachtungen).slice(-12)
    const gebiete = Object.entries(m.gebiete).sort((a, b) => b[1].n - a[1].n)
    const n = l.beobachtungen.length

    el.innerHTML = `
    <section class="sa-profil">
        <header class="sa-kopf"><div><h1>Lernprofil</h1><p>Saat passt die Wiederholungsabstände an dein Gedächtnis an. Das Profil liegt nur in deinem Lernspeicher – es wird nie hochgeladen.</p></div></header>

        <div class="sa-raster">
            <article class="sa-kachel sa-kachel--breit sa-gedaechtnis">
                <header><h2>Dein Gedächtnis</h2></header>
                <div class="sa-gedaechtnis__kopf">
                    <p class="sa-gross">${Math.round(m.faktor * 100)}<small> %</small></p>
                    <p>${faktorText(m.faktor, n)}</p>
                </div>
                ${kalibrierungHtml(kal, e.zielQuote)}
                <p class="sa-klein">${n} Abfragen nach einer Pause flossen ein${p.anpassung.letzte ? ` · zuletzt angepasst ${datumZeit(p.anpassung.letzte)}` : ""}. Auswahl-Antworten und Wiederholungen am selben Tag zählen hier bewusst nicht.</p>
                ${gebiete.length ? `<table class="sa-tabelle"><thead><tr><th>Lerngebiet</th><th>Abstände</th><th>Abfragen</th></tr></thead><tbody>
                    ${gebiete.map(([g, v]) => `<tr><td>${esc(g)}</td><td>${Math.round(m.faktor * v.faktor * 100)} %<small> (${v.faktor >= 1 ? "+" : ""}${Math.round((v.faktor - 1) * 100)} % ggü. allgemein)</small></td><td>${v.n}</td></tr>`).join("")}
                </tbody></table>` : `<p class="sa-klein">Für einzelne Lerngebiete (z. B. Japanisch vs. Biologie) lernt Saat eigene Werte, sobald genug Abfragen vorliegen.</p>`}
                <details class="sa-erklaerung"><summary>Wie funktioniert das?</summary>
                    <p>Jede Karte hat eine <strong>Stabilität</strong>: die Zahl der Tage, nach denen du sie mit 90 % Wahrscheinlichkeit noch weißt. Saat legt die nächste Abfrage so, dass du sie mit deiner Ziel-Quote noch weißt. Grundlage ist FSRS, ein offenes, an vielen Millionen Wiederholungen erprobtes Gedächtnismodell.</p>
                    <p>Dein Profil vergleicht laufend die Vorhersage mit deinen echten Antworten. Erinnerst du dich öfter als erwartet, werden die Abstände vorsichtig länger, vergisst du mehr, werden sie kürzer – in kleinen Schritten (höchstens ±15 % je Anpassung), mit Grenzen (40–250 %) und so, dass ältere Daten mit der Zeit weniger zählen. Ein einzelner schlechter Tag kippt nichts.</p>
                </details>
            </article>

            <article class="sa-kachel sa-kachel--breit">
                <header><h2>Einstellungen</h2></header>
                <form class="sa-felder sa-einstellungen" novalidate>
                    <label class="sa-feld"><span>Ziel: so sicher willst du Karten bei der Abfrage noch wissen <b data-quote-text>${prozent(e.zielQuote)}</b></span>
                        <input type="range" min="80" max="95" step="1" value="${Math.round(e.zielQuote * 100)}" data-e="zielQuote">
                        <small class="sa-klein">Höher = öfter wiederholen, dafür sicherer. 90 % ist ein guter Mittelweg.</small></label>
                    <div class="sa-feld-reihe">
                        <label class="sa-feld"><span>Neue Karten pro Tag</span><input type="number" min="0" max="500" value="${e.neuProTag}" data-e="neuProTag"></label>
                        <label class="sa-feld"><span>Höchstens Karten pro Sitzung</span><input type="number" min="10" max="5000" value="${e.maxProTag}" data-e="maxProTag"></label>
                    </div>
                    <label class="sa-feld"><span>Reihenfolge neuer Karten</span><select data-e="neueReihenfolge">
                        <option value="datei"${e.neueReihenfolge === "datei" ? " selected" : ""}>Wie in der Lerndatei</option>
                        <option value="zufall"${e.neueReihenfolge === "zufall" ? " selected" : ""}>Gemischt</option></select></label>
                    <label class="sa-schalter"><input type="checkbox" data-e="vorlesen" ${e.vorlesen ? "checked" : ""}><span>Vorlesen anbieten (Sprachausgabe des Geräts, geht auch offline)</span></label>
                </form>
            </article>

            <article class="sa-kachel sa-kachel--breit">
                <header><h2>Speicher</h2></header>
                <p class="sa-speicherort">${S.ordner}<span><strong>${esc(app.ort?.name || "")}</strong><small>${app.ort?.art === "ordner" ? "Ordner auf diesem PC" : "Speicher dieses Browsers"} · ${l.decks.size} Lerndateien · ${l.ereignisse.length} Einträge im Lernprotokoll</small></span></p>
                ${app.ort?.art !== "ordner" ? `<p class="sa-hinweis">${S.info}<span>Der Browser-Speicher gehört zu diesem Browser. Lade ab und zu eine Sicherung herunter – damit kannst du auch auf einen anderen Computer umziehen.</span></p>` : ""}
                <div class="sa-knopfreihe">
                    ${ordnerMoeglich() ? `<button class="g-knopf-leise" type="button" data-wechseln>${S.ordner} ${app.ort?.art === "ordner" ? "Anderen Ordner wählen" : "In einen Ordner umziehen"}</button>` : ""}
                    ${app.ort?.art === "ordner" ? `<button class="g-knopf-leise" type="button" data-browser>${S.karte} Browser-Speicher nutzen</button>` : ""}
                    <button class="g-knopf-leise" type="button" data-pruefen>${S.haken} Speicher prüfen</button>
                </div>
                <div data-pruefbericht></div>
            </article>

            <article class="sa-kachel sa-kachel--breit">
                <header><h2>Daten mitnehmen</h2></header>
                <p class="sa-klein">Alles gehört dir. Die Dateien sind normale ZIP- bzw. JSON-Dateien.</p>
                <ul class="sa-export">
                    <li><div><strong>Lernstand</strong><span>Lernprotokoll, Profil und Entscheidungen – ohne Lerndateien. Zum Zusammenführen mit einem anderen Speicher.</span></div><button class="g-knopf-leise" type="button" data-x="stand">${S.holen} .saatstand</button></li>
                    <li><div><strong>Lernprofil</strong><span>Nur Einstellungen und Gedächtnismodell – z. B. für einen frischen Speicher.</span></div><button class="g-knopf-leise" type="button" data-x="profil">${S.holen} .saatprofil</button></li>
                    <li><div><strong>Ganze Sicherung</strong><span>Alles: Lerndateien, Medien, Lernstand, Profil. Wiederherstellen über „Importieren“.</span></div><button class="g-knopf-leise" type="button" data-x="alles">${S.holen} .zip</button></li>
                </ul>
                <div class="sa-knopfreihe">
                    <button class="g-knopf" type="button" data-import>${S.teilen} Importieren …</button>
                    <button class="g-knopf-text sa-gefahr" type="button" data-profil-zurueck>Lernprofil zurücksetzen</button>
                </div>
            </article>
        </div>
    </section>`

    // Einstellungen speichern (kurz verzögert, Regler live)
    let t = null
    el.querySelectorAll("[data-e]").forEach((f) => f.addEventListener(f.type === "range" ? "input" : "change", () => {
        if (f.dataset.e === "zielQuote") el.querySelector("[data-quote-text]").textContent = `${f.value} %`
        clearTimeout(t)
        t = setTimeout(async () => {
            const teil = {}
            for (const x of el.querySelectorAll("[data-e]")) {
                teil[x.dataset.e] = x.type === "checkbox" ? x.checked : x.type === "range" ? +x.value / 100 : x.type === "number" ? +x.value : x.value
            }
            try { await l.einstellungenSetzen(teil); meldung("Gespeichert") } catch (fe) { fehlerMeldung(fe) }
        }, f.type === "range" ? 500 : 0)
    }))

    el.querySelectorAll("[data-x]").forEach((k) => k.addEventListener("click", async () => {
        try {
            const x = k.dataset.x === "stand" ? await l.standExport() : k.dataset.x === "profil" ? l.profilDatei() : await l.sicherungExport()
            herunterladen(x.blob, x.name)
        } catch (f) { fehlerMeldung(f) }
    }))
    el.querySelector("[data-import]").addEventListener("click", async () => {
        const d = await dateiWaehlen({ accept: ".saatstand,.saatprofil,.zip,.saat,.saatpaket,.json,.csv,.tsv", mehrere: true })
        if (d.length) app.importieren(d)
    })
    el.querySelector("[data-profil-zurueck]").addEventListener("click", async () => {
        if (!(await bestaetigen({ titel: "Lernprofil zurücksetzen?", text: "Das Gedächtnismodell beginnt wieder bei den Standardwerten (deine Einstellungen bleiben). Dein Lernstand bleibt erhalten; das Profil lernt mit den nächsten Abfragen neu. Die bisherige Fassung liegt in der Sicherung.", ja: "Zurücksetzen", gefahr: true }))) return
        await l.vorherSichern("profil.json", "profil.json")
        const neu = neuesProfil(l.jetzt())
        neu.einstellungen = l.profil.einstellungen
        neu.anpassung.beobachtungen = l.beobachtungen.length
        await l.profilErsetzen(neu)
        meldung("Lernprofil zurückgesetzt")
    })
    el.querySelector("[data-pruefen]").addEventListener("click", () => pruefen(el, app))
    el.querySelector("[data-wechseln]")?.addEventListener("click", () => wechseln(app, "ordner"))
    el.querySelector("[data-browser]")?.addEventListener("click", () => wechseln(app, "browser"))
}

function faktorText(f, n) {
    if (n < 25) return "Noch zu wenige Abfragen nach Pausen – Saat nutzt die bewährten Standardwerte und lernt mit jeder Wiederholung dazu."
    if (f > 1.08) return `Du behältst Dinge länger als der Durchschnitt. Deine Abstände sind um ${Math.round((f - 1) * 100)} % gestreckt.`
    if (f < 0.92) return `Deine Abstände sind um ${Math.round((1 - f) * 100)} % kürzer als der Standard, damit du dein Ziel sicher erreichst.`
    return "Deine Erinnerung entspricht ziemlich genau dem Standardmodell."
}

// Kleines Liniendiagramm: tatsächliche vs. erwartete Erinnerungsquote je Monat
function kalibrierungHtml(kal, ziel) {
    if (kal.length < 2) return ""
    const B = 560, H = 150, L = 34, R = 10, O = 12, U = 26
    const min = 0.5
    const x = (i) => L + (i / (kal.length - 1)) * (B - L - R)
    const y = (q) => O + (1 - (Math.max(min, q) - min) / (1 - min)) * (H - O - U)
    const linie = (feld) => kal.map((k, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(k[feld]).toFixed(1)}`).join("")
    const monat = (s) => new Date(s + "-01").toLocaleDateString("de-DE", { month: "short" })
    return `<figure class="sa-diagramm">
        <svg viewBox="0 0 ${B} ${H}" role="img" aria-label="Erinnerungsquote je Monat: tatsächlich und erwartet">
            ${[0.5, 0.75, 1].map((q) => `<line class="raster" x1="${L}" x2="${B - R}" y1="${y(q)}" y2="${y(q)}"/><text class="achse" x="${L - 6}" y="${y(q) + 4}" text-anchor="end">${q * 100}</text>`).join("")}
            <line class="ziel" x1="${L}" x2="${B - R}" y1="${y(ziel)}" y2="${y(ziel)}"/>
            <path class="erwartet" d="${linie("erwartet")}"/>
            <path class="echt" d="${linie("quote")}"/>
            ${kal.map((k, i) => `<g class="punkt"><circle cx="${x(i)}" cy="${y(k.quote)}" r="4"/><circle class="treffer" cx="${x(i)}" cy="${y(k.quote)}" r="12"><title>${monat(k.monat)}: ${Math.round(k.quote * 100)} % gewusst (erwartet ${Math.round(k.erwartet * 100)} %, ${k.n} Abfragen)</title></circle></g>
                <text class="achse" x="${x(i)}" y="${H - 6}" text-anchor="middle">${monat(k.monat)}</text>`).join("")}
        </svg>
        <figcaption><span class="sa-legende sa-legende--echt">tatsächlich gewusst</span><span class="sa-legende sa-legende--erwartet">vom Modell erwartet</span><span class="sa-legende sa-legende--ziel">dein Ziel</span></figcaption>
    </figure>`
}

async function pruefen(el, app) {
    const box = el.querySelector("[data-pruefbericht]")
    box.innerHTML = `<p class="sa-klein">Prüfe …</p>`
    const r = await app.lager.pruefen()
    const punkte = [
        [!r.kaputteDateien.length, r.kaputteDateien.length ? `${r.kaputteDateien.length} Lerndatei(en) nicht lesbar: ${r.kaputteDateien.map((k) => esc(k.datei)).join(", ")}` : "Alle Lerndateien lesbar"],
        [!r.kaputteZeilen, r.kaputteZeilen ? `${r.kaputteZeilen} beschädigte Zeile(n) im Lernprotokoll übersprungen` : "Lernprotokoll vollständig lesbar"],
        [!r.offeneKonflikte, r.offeneKonflikte ? `${r.offeneKonflikte} offene ID-Konflikte (unter „Karten“ klären)` : "Keine ID-Konflikte"],
        [!r.fehlendeMedien.length, r.fehlendeMedien.length ? `${r.fehlendeMedien.length} Medien fehlen: ${r.fehlendeMedien.slice(0, 5).map((m) => esc(m.pfad.replace(/^medien\//, ""))).join(", ")}${r.fehlendeMedien.length > 5 ? " …" : ""}` : "Alle lokalen Medien vorhanden"],
    ]
    box.innerHTML = `<ul class="sa-pruefung">${punkte.map(([ok, t]) => `<li class="${ok ? "ist-ok" : "ist-warn"}">${ok ? S.haken : S.warnung}<span>${t}</span></li>`).join("")}
        ${r.dateiWarnungen.map((d) => `<li class="ist-info">${S.info}<span>${esc(d.titel)}: ${d.warnungen.map(esc).join(" · ")}</span></li>`).join("")}</ul>`
}

// Speicherort wechseln: neuen wählen → dort vorhandenen öffnen ODER alles mitnehmen
async function wechseln(app, art) {
    try {
        const ort = art === "ordner" ? await ordnerWaehlen() : await browserOrt()
        if (!ort) return
        if (art === "browser") await dauerhaftBitten()
        const verz = await verzeichnisFuer(ort)
        const vorhanden = await Lager.istLernspeicher(verz)
        const w = await dialog({
            titel: vorhanden ? "Dort liegt schon ein Lernspeicher" : "Neuer Speicherort",
            html: vorhanden
                ? `<p>In „${esc(ort.name)}“ gibt es bereits einen Saat-Lernspeicher.</p><p><strong>Wechseln</strong> öffnet ihn so, wie er ist. <strong>Zusammenführen</strong> übernimmt zusätzlich alles von hier dorthin – ohne Duplikate, ohne etwas zu überschreiben.</p>`
                : `<p>„${esc(ort.name)}“ ist noch kein Lernspeicher.</p><p><strong>Mitnehmen</strong> kopiert deine Lerndateien, Medien, deinen Lernstand und dein Profil dorthin. Der bisherige Speicher bleibt unverändert, bis du ihn selbst löschst.</p>`,
            knoepfe: vorhanden
                ? [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "wechseln", text: "Nur wechseln", art: "leise" }, { wert: "mitnehmen", text: "Zusammenführen", art: "haupt" }]
                : [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "wechseln", text: "Leer beginnen", art: "leise" }, { wert: "mitnehmen", text: "Mitnehmen", art: "haupt" }],
        })
        if (!w) return
        if (w === "mitnehmen") {
            const ziel = await Lager.oeffnen(verz, { kanal: false })
            const bericht = await ziel.zusammenfuehren(app.lager.verz, { profil: vorhanden ? "behalten" : "uebernehmen" })
            meldung(`Übernommen: ${bericht.ereignisseNeu} Abfragen, ${bericht.decksNeu.length} Lerndateien`, { dauer: 5000 })
        }
        await app.oeffnen(ort)
        app.gehe("profil")
    } catch (f) { fehlerMeldung(f) }
}
