// ==========================================================
// Saat · Importieren (Lerndateien, Pakete, Lernstand, Profil, Sicherungen)
// Zuerst wird gezeigt, was in der Datei steckt – übernommen wird erst nach deiner Wahl.
// ==========================================================
import { esc } from "../../kern/html.js"
import { dialog, meldung, fehlerMeldung } from "./ui.js"

export async function importieren(app, dateien) {
    for (const datei of dateien) {
        try { await eine(app, datei) }
        catch (f) {
            console.warn(f)
            await dialog({ titel: "Import nicht möglich", html: `<p><strong>${esc(datei.name)}</strong></p><p>${esc(f.message)}</p>`, knoepfe: [{ wert: "", text: "OK", art: "haupt" }] })
        }
    }
}

async function eine(app, datei) {
    const l = app.lager
    const plan = await l.importPruefen(datei)
    const warnungen = plan.warnungen?.length ? `<details class="sa-warnliste"><summary>${plan.warnungen.length} Hinweis(e)</summary><ul>${plan.warnungen.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>` : ""

    if (plan.typ === "deck") {
        const d = plan.deck
        const geteilt = plan.bekannt ? `<p>${plan.bekannt} dieser Karten kennst du schon aus anderen Lerndateien${plan.mitStand ? ` (${plan.mitStand} mit Lernstand)` : ""} – ihr Fortschritt gilt hier automatisch mit.</p>` : ""
        const medien = plan.medien.size ? `<p>${plan.medien.size} Bild-/Audiodatei(en) werden in deinen Lernspeicher kopiert.</p>` : ""
        const fehlend = plan.fehlendeMedien.length ? `<p class="sa-warn">${plan.fehlendeMedien.length} Medium/Medien fehlen in der Datei – die Karten zeigen an der Stelle einen Hinweis.</p>` : ""
        const html = `<p><strong>${esc(d.titel)}</strong> · ${d.karten.length} Karten${d.autor ? ` · von ${esc(d.autor)}` : ""}</p>
            ${d.beschreibung ? `<p class="sa-klein">${esc(d.beschreibung)}</p>` : ""}
            ${geteilt}${medien}${fehlend}
            ${plan.nurLesen ? `<p class="sa-warn">Diese Datei stammt aus einer neueren Saat-Version. Du kannst damit lernen, sie aber hier nicht bearbeiten.</p>` : ""}
            ${plan.vorhanden ? `<p class="sa-warn">Diese Lerndatei hast du schon („${esc(plan.vorhanden.titel)}“, ${plan.vorhanden.karten.length} Karten). <strong>Ersetzen</strong> legt die bisherige Fassung in die Sicherung. <strong>Als Kopie</strong> behält beide – gleiche Karten teilen sich trotzdem den Lernstand.</p>` : ""}
            ${warnungen}`
        const knoepfe = plan.vorhanden
            ? [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "kopie", text: "Als Kopie", art: "leise" }, { wert: "ersetzen", text: "Ersetzen", art: "haupt" }]
            : [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "neu", text: "Hinzufügen", art: "haupt" }]
        const w = await dialog({ titel: "Lerndatei hinzufügen", html, knoepfe })
        if (!w) return
        const r = await l.importAusfuehren(plan, { modus: w })
        meldung(`„${r.deck.titel}“ ist im Saatgut`)
        return
    }

    if (plan.typ === "profil") {
        const p = plan.profil
        const w = await dialog({
            titel: "Lernprofil übernehmen",
            html: `<p>Das Profil enthält deine Einstellungen und das, was Saat über dein Gedächtnis gelernt hat (Abstände ${Math.round(p.modell.faktor * 100)} %, ${Object.keys(p.modell.gebiete).length} Lerngebiete).</p>
                <p>Dein jetziges Profil wird vorher gesichert.</p>${warnungen}`,
            knoepfe: [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "einst", text: "Nur Einstellungen", art: "leise" }, { wert: "alles", text: "Ganzes Profil übernehmen", art: "haupt" }],
        })
        if (!w) return
        await l.vorherSichern("profil.json", "profil.json")
        await l.importAusfuehren(plan, { nurEinstellungen: w === "einst" })
        meldung("Lernprofil übernommen")
        return
    }

    // Lernstand oder ganze Sicherung
    const neueDecks = plan.decks.filter((d) => d.neu)
    const w = await dialog({
        titel: plan.decks.length ? "Sicherung übernehmen" : "Lernstand übernehmen",
        html: `<p><strong>${esc(plan.name)}</strong></p>
            <ul class="sa-liste-punkte">
                <li>${plan.ereignisse} Abfragen im Lernprotokoll, davon <strong>${plan.neueEreignisse} neu</strong> für diesen Speicher${plan.ereignisse && !plan.neueEreignisse ? " (alles schon da)" : ""}</li>
                ${plan.decks.length ? `<li>${plan.decks.length} Lerndateien${neueDecks.length ? `, davon ${neueDecks.length} neu` : ""}</li>` : ""}
                ${plan.profil ? `<li>ein Lernprofil (Abstände ${Math.round(plan.profil.modell.faktor * 100)} %)</li>` : ""}
            </ul>
            <p class="sa-klein">Nichts wird überschrieben: Abfragen werden zusammengeführt (doppelte erkennt Saat), bei unterschiedlichen Fassungen derselben Lerndatei gewinnt die neuere, die ältere landet in der Sicherung.</p>
            ${plan.profil ? `<label class="sa-schalter"><input type="checkbox" name="profil" ${plan.eigeneBeobachtungen ? "" : "checked"}><span>Lernprofil aus der Datei übernehmen${plan.eigeneBeobachtungen ? " (dein jetziges wird gesichert)" : ""}</span></label>` : ""}`,
        knoepfe: [{ wert: "", text: "Abbrechen", art: "leise" }, { wert: "ja", text: "Übernehmen", art: "haupt" }],
        beimOeffnen: (d) => d.addEventListener("close", () => { app._profilWahl = d.querySelector('[name="profil"]')?.checked }),
    })
    if (w !== "ja") return
    const bericht = await l.importAusfuehren(plan, { profil: app._profilWahl ? "uebernehmen" : "behalten" })
    const teile = [`${bericht.ereignisseNeu} Abfragen`]
    if (bericht.decksNeu.length) teile.push(`${bericht.decksNeu.length} neue Lerndateien`)
    if (bericht.decksAktualisiert.length) teile.push(`${bericht.decksAktualisiert.length} aktualisiert`)
    if (bericht.medienNeu) teile.push(`${bericht.medienNeu} Medien`)
    meldung(`Übernommen: ${teile.join(", ")}`, { dauer: 5000 })
    if (bericht.decksBehalten.length || bericht.decksKaputt.length) {
        await dialog({
            titel: "Gut zu wissen",
            html: `${bericht.decksBehalten.length ? `<p>Bei ${bericht.decksBehalten.length} Lerndatei(en) war deine Fassung neuer und bleibt: ${bericht.decksBehalten.map(esc).join(", ")}. Die importierte Fassung liegt unter <code>sicherung/…/import/</code>.</p>` : ""}
                ${bericht.decksKaputt.length ? `<p>Nicht lesbar und übersprungen: ${bericht.decksKaputt.map(esc).join(", ")}</p>` : ""}`,
        })
    }
}

export { fehlerMeldung }
