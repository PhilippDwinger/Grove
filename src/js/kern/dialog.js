// ==========================================================
// Grove-Kern: Dialoge im Grove-Stil (statt confirm() / prompt() des Browsers)
//
//   if (await bestaetigen({ titel: "Löschen?", text: "…", ja: "Löschen", gefahr: true })) …
//   const neu = await eingabe({ titel: "Umbenennen", wert: "alt.txt" })   // null = abgebrochen
// ==========================================================
import "../../css/kern.css"
import { esc } from "./html.js"

function dialogBauen(inhalt) {
    const d = document.createElement("dialog")
    d.className = "g-dialog"
    d.innerHTML = `<form method="dialog">${inhalt}</form>`
    document.body.append(d)
    d.addEventListener("close", () => setTimeout(() => d.remove(), 200))
    return d
}

export function bestaetigen({ titel, text = "", ja = "Ja", nein = "Abbrechen", gefahr = false }) {
    return new Promise((ok) => {
        const d = dialogBauen(`
            <h2>${esc(titel)}</h2>
            ${text ? `<p>${esc(text)}</p>` : ""}
            <div class="g-dialog__knoepfe">
              <button class="g-knopf-leise" value="nein" type="submit">${esc(nein)}</button>
              <button class="g-knopf${gefahr ? " g-knopf--gefahr" : ""}" value="ja" type="submit" autofocus>${esc(ja)}</button>
            </div>`)
        d.addEventListener("close", () => ok(d.returnValue === "ja"))
        d.showModal()
    })
}

export function eingabe({ titel, text = "", wert = "", ja = "Speichern", nein = "Abbrechen", markieren = null }) {
    return new Promise((ok) => {
        const d = dialogBauen(`
            <h2>${esc(titel)}</h2>
            ${text ? `<p>${esc(text)}</p>` : ""}
            <input class="g-dialog__feld" type="text" value="${esc(wert)}" autocomplete="off">
            <div class="g-dialog__knoepfe">
              <button class="g-knopf-leise" value="nein" type="submit">${esc(nein)}</button>
              <button class="g-knopf" value="ja" type="submit">${esc(ja)}</button>
            </div>`)
        const feld = d.querySelector("input")
        // Enter im Feld = Speichern (sonst nähme das Formular den ERSTEN Knopf – „Abbrechen“)
        feld.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); d.close("ja") } })
        d.addEventListener("close", () => ok(d.returnValue === "ja" ? feld.value.trim() : null))
        d.showModal()
        feld.focus()
        // z. B. beim Umbenennen nur den Namen ohne Endung markieren
        const ende = markieren ?? feld.value.length
        feld.setSelectionRange(0, ende)
    })
}
