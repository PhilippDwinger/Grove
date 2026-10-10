// ==========================================================
// Grove Mail · Seite (src/dienste/mail/index.html)
// Steuert Ordner, Liste, Lesebereich und Live-Updates.
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import "../kern/schutz.js"
import "../glocke.js"
import { ladeNutzer } from "../nutzermenue.js"
import { MAIL_DOMAIN, DOMAIN_AKTIV, ORDNER } from "../mail/konfig.js"
import * as daten from "../mail/daten.js"
import * as zeige from "../mail/darstellung.js"
import "../kern/alle-dienste.js"
import { sucheEinrichten } from "../kern/suche.js"
import { verbindungsBereich } from "../kern/verknuepfen.js"
import { alleVerbindungenLoeschen } from "../kern/verbindungen.js"

sucheEinrichten()

const $ = (s) => document.querySelector(s)

// ---------- Zustand ----------
const zustand = {
    ordner: ORDNER[location.hash.slice(1)] ? location.hash.slice(1) : "eingang",
    suche: "",
    liste: [],
    aktiv: null,        // gerade geöffnete Mail (voll geladen)
    bilderErlaubt: false,
}

// ---------- Start ----------
const nutzer = await ladeNutzer()
if (nutzer) {
    const adresse = nutzer.profil?.username ? `${nutzer.profil.username.toLowerCase()}@${MAIL_DOMAIN}` : null
    // \u200B nach dem @ = unsichtbare Umbruchstelle, damit lange Adressen schön umbrechen
    $("#meine-adresse").textContent = adresse ? adresse.replace("@", "@\u200B") : "Kein Username gesetzt"
    $("#adresse-kopieren").hidden = !adresse
    $("#adresse-kopieren").addEventListener("click", async () => {
        await navigator.clipboard.writeText(adresse)
        hinweis("Adresse kopiert")
    })
    $("#domain-hinweis").hidden = DOMAIN_AKTIV

    daten.beobachte(nutzer.user.id, beiLiveAenderung)
}

// Aus der Suche oder "Verbunden mit": /dienste/mail/?mail=<id> öffnet genau diese Mail
const startMail = new URLSearchParams(location.search).get("mail")
if (startMail) {
    history.replaceState(null, "", location.pathname)
    try {
        const m = await daten.ladeMail(startMail)
        if (ORDNER[m.ordner]) zustand.ordner = m.ordner
    } catch { /* Mail gibt es nicht mehr – dann einfach den Eingang zeigen */ }
}
await waehleOrdner(zustand.ordner)
if (startMail) oeffneMail(startMail)
aktualisiereZaehler()

// ---------- Ordner ----------
document.querySelectorAll("[data-ordner]").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault()
        waehleOrdner(link.dataset.ordner)
    })
})
window.addEventListener("hashchange", () => {
    const o = location.hash.slice(1)
    if (ORDNER[o] && o !== zustand.ordner) waehleOrdner(o)
})

async function waehleOrdner(ordner) {
    zustand.ordner = ordner
    history.replaceState(null, "", `#${ordner}`)
    document.querySelectorAll("[data-ordner]").forEach((l) => {
        l.toggleAttribute("aria-current", l.dataset.ordner === ordner)
        if (l.dataset.ordner === ordner) l.setAttribute("aria-current", "page")
    })
    $("#ordner-titel").textContent = ORDNER[ordner]
    schliesseMail()
    await ladeListe()
}

// ---------- Suche (wartet kurz, bis du fertig getippt hast) ----------
let suchTimer
$("#suche").addEventListener("input", (e) => {
    clearTimeout(suchTimer)
    suchTimer = setTimeout(() => { zustand.suche = e.target.value; ladeListe() }, 250)
})

// ---------- Liste ----------
async function ladeListe() {
    const liste = $("#liste")
    liste.setAttribute("aria-busy", "true")
    try {
        zustand.liste = await daten.ladeListe(zustand.ordner, zustand.suche)
        zeichneListe()
    } catch (fehler) {
        console.error(fehler)
        zeigeLeer("fehler")
    } finally {
        liste.removeAttribute("aria-busy")
    }
}

function zeichneListe() {
    const liste = $("#liste")
    liste.replaceChildren()
    if (zustand.liste.length === 0) {
        zeigeLeer(zustand.suche ? "suche" : zustand.ordner)
        return
    }
    $("#liste-leer").hidden = true
    const vorlage = $("#post-vorlage")
    for (const mail of zustand.liste) {
        const el = vorlage.content.firstElementChild.cloneNode(true)
        el.dataset.id = mail.id
        el.classList.toggle("post--neu", !mail.gelesen)
        el.querySelector(".post__avatar").textContent = zeige.initiale(mail.von_name, mail.von_adresse)
        el.querySelector(".post__von").textContent = mail.von_name || mail.von_adresse
        el.querySelector(".post__zeit").textContent = zeige.kurzesDatum(mail.datum)
        el.querySelector(".post__betreff").textContent = mail.betreff || "(kein Betreff)"
        el.querySelector(".post__vorschau").textContent = mail.vorschau
        el.querySelector(".post__klammer").hidden = !(mail.anhaenge?.length)
        if (zustand.aktiv?.id === mail.id) el.setAttribute("aria-current", "true")
        el.addEventListener("click", () => oeffneMail(mail.id))
        el.addEventListener("keydown", (e) => { if (e.key === "Enter") oeffneMail(mail.id) })
        liste.append(el)
    }
}

const LEER_TEXTE = {
    eingang:    ["Alles gelesen", "Hier landen neue Mails – sie erscheinen sofort."],
    archiv:     ["Archiv ist leer", "Archivierte Mails findest du hier wieder."],
    gesendet:   ["Noch nichts gesendet", "Schreiben kommt im nächsten Schritt."],
    entwuerfe:  ["Keine Entwürfe", "Angefangene Mails werden hier gespeichert."],
    papierkorb: ["Papierkorb ist leer", "Gelöschte Mails landen erst hier."],
    suche:      ["Nichts gefunden", "Versuch es mit einem anderen Wort."],
    fehler:     ["Laden fehlgeschlagen", "Prüf deine Verbindung und lade die Seite neu."],
}
function zeigeLeer(art) {
    const [titel, text] = LEER_TEXTE[art] || LEER_TEXTE.eingang
    $("#liste-leer-titel").textContent = titel
    $("#liste-leer-text").textContent = text
    $("#liste-leer").hidden = false
}

// ---------- Mail lesen ----------
async function oeffneMail(id) {
    document.querySelectorAll(".post").forEach((p) => p.toggleAttribute("aria-current", p.dataset.id === id))
    let mail
    try {
        mail = await daten.ladeMail(id)
    } catch (fehler) {
        console.error(fehler)
        hinweis("Mail konnte nicht geladen werden")
        return
    }
    zustand.aktiv = mail
    zustand.bilderErlaubt = false
    zeichneMail()
    $("#raum").classList.add("lesemodus")

    if (!mail.gelesen) {
        mail.gelesen = true
        markiereInListe(id, { gelesen: true })
        daten.aendere(id, { gelesen: true }).then(aktualisiereZaehler).catch(console.error)
    }
}

async function zeichneMail() {
    const mail = zustand.aktiv
    $("#lesen-leer").hidden = true
    $("#brief").hidden = false
    $("#brief-betreff").textContent = mail.betreff || "(kein Betreff)"
    $("#brief-avatar").textContent = zeige.initiale(mail.von_name, mail.von_adresse)
    $("#brief-von").textContent = mail.von_name || mail.von_adresse
    $("#brief-adresse").textContent = mail.von_name ? `<${mail.von_adresse}>` : ""
    $("#brief-an").textContent = `an ${mail.an?.join(", ") || "dich"}`
    $("#brief-datum").textContent = zeige.langesDatum(mail.datum)

    // Aktionen je nach Ordner
    const imPapierkorb = mail.ordner === "papierkorb"
    $("[data-aktion=archivieren]").hidden = mail.ordner === "archiv" || imPapierkorb
    $("[data-aktion=wiederherstellen]").hidden = !(imPapierkorb || mail.ordner === "archiv")
    $("[data-aktion=loeschen]").textContent = imPapierkorb ? "Endgültig löschen" : "Löschen"
    $("[data-aktion=loeschen]").dataset.bestaetigen = ""

    // Verbunden mit (Grove-weit: Notizen, Passwörter, …)
    const verbunden = $("#brief-verbindungen")
    verbunden.replaceChildren()
    verbindungsBereich(verbunden, { typ: "mail", id: mail.id })

    // Inhalt
    const inhalt = $("#brief-inhalt")
    inhalt.replaceChildren()
    let { text, html } = mail
    if (!text && !html && mail.roh_pfad) {
        inhalt.textContent = "Mail wird geladen …"
        try {
            const original = await daten.ladeOriginal(mail.roh_pfad)
            if (zustand.aktiv?.id !== mail.id) return
            text = original.text; html = original.html
        } catch (fehler) { console.error(fehler) }
        inhalt.replaceChildren()
    }

    $("#bilder-hinweis").hidden = true
    if (html) {
        const rahmen = document.createElement("iframe")
        rahmen.className = "brief__html"
        rahmen.title = "Inhalt der Mail"
        rahmen.setAttribute("sandbox", "allow-same-origin allow-popups allow-popups-to-escape-sandbox")
        zeige.passeHoeheAn(rahmen)
        rahmen.srcdoc = zeige.htmlFuerRahmen(html, { bilderErlaubt: zustand.bilderErlaubt })
        inhalt.append(rahmen)
        $("#bilder-hinweis").hidden = zustand.bilderErlaubt || !zeige.hatExterneBilder(html)
    } else {
        const div = document.createElement("div")
        div.className = "brief__text"
        div.innerHTML = zeige.textAlsHtml(text || "(Diese Mail hat keinen Text.)")
        inhalt.append(div)
    }

    // Anhänge
    const anhaenge = $("#brief-anhaenge")
    anhaenge.replaceChildren()
    for (const [i, a] of (mail.anhaenge || []).entries()) {
        const knopf = document.createElement("button")
        knopf.type = "button"
        knopf.className = "anhang"
        knopf.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8"/></svg><span></span><small></small>`
        knopf.querySelector("span").textContent = a.name
        knopf.querySelector("small").textContent = zeige.groesse(a.groesse || 0)
        knopf.addEventListener("click", () => ladeAnhang(i, a.name, knopf))
        anhaenge.append(knopf)
    }
    anhaenge.hidden = !(mail.anhaenge?.length)
    $("#lesen").scrollTop = 0
}

$("#bilder-laden").addEventListener("click", () => {
    zustand.bilderErlaubt = true
    zeichneMail()
})

async function ladeAnhang(index, name, knopf) {
    knopf.disabled = true
    try {
        const original = await daten.ladeOriginal(zustand.aktiv.roh_pfad)
        const teile = (original.attachments || []).filter((a) => a.disposition !== "inline")
        const anhang = teile[index]
        const url = URL.createObjectURL(new Blob([anhang.content], { type: anhang.mimeType }))
        const a = Object.assign(document.createElement("a"), { href: url, download: name })
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (fehler) {
        console.error(fehler)
        hinweis("Anhang konnte nicht geladen werden")
    } finally {
        knopf.disabled = false
    }
}

function schliesseMail() {
    zustand.aktiv = null
    $("#brief").hidden = true
    $("#lesen-leer").hidden = false
    $("#raum").classList.remove("lesemodus")
}
$("#brief-zurueck").addEventListener("click", () => {
    schliesseMail()
    document.querySelectorAll(".post[aria-current]").forEach((p) => p.removeAttribute("aria-current"))
})

// ---------- Aktionen ----------
document.querySelectorAll("[data-aktion]").forEach((knopf) => {
    knopf.addEventListener("click", () => fuehreAus(knopf.dataset.aktion, knopf))
})

async function fuehreAus(aktion, knopf) {
    const mail = zustand.aktiv
    if (!mail) return
    try {
        if (aktion === "archivieren") await verschiebe(mail, "archiv", "Archiviert")
        if (aktion === "wiederherstellen") await verschiebe(mail, "eingang", "Zurück im Eingang")
        if (aktion === "ungelesen") {
            await daten.aendere(mail.id, { gelesen: false })
            markiereInListe(mail.id, { gelesen: false })
            schliesseMail()
            aktualisiereZaehler()
        }
        if (aktion === "loeschen") {
            if (mail.ordner !== "papierkorb") return verschiebe(mail, "papierkorb", "In den Papierkorb gelegt")
            // Endgültig: zweiter Klick bestätigt
            if (!knopf.dataset.bestaetigen) {
                knopf.dataset.bestaetigen = "1"
                knopf.textContent = "Wirklich löschen?"
                return
            }
            await daten.loescheEndgueltig(mail.id, mail.roh_pfad)
            alleVerbindungenLoeschen({ typ: "mail", id: mail.id }).catch(console.error)
            entferneAusListe(mail.id)
            schliesseMail()
            hinweis("Endgültig gelöscht")
        }
        if (aktion === "antworten") hinweis("Antworten kommt mit dem Senden – im nächsten Schritt")
    } catch (fehler) {
        console.error(fehler)
        hinweis("Das hat nicht geklappt")
    }
}

async function verschiebe(mail, ziel, text) {
    await daten.aendere(mail.id, { ordner: ziel })
    entferneAusListe(mail.id)
    schliesseMail()
    aktualisiereZaehler()
    hinweis(text)
}

$("#neue-nachricht").addEventListener("click", () => hinweis("Schreiben kommt im nächsten Schritt"))

// ---------- Liste lokal anpassen ----------
function markiereInListe(id, felder) {
    const eintrag = zustand.liste.find((m) => m.id === id)
    if (eintrag) Object.assign(eintrag, felder)
    const el = document.querySelector(`.post[data-id="${id}"]`)
    if (el && "gelesen" in felder) el.classList.toggle("post--neu", !felder.gelesen)
}
function entferneAusListe(id) {
    zustand.liste = zustand.liste.filter((m) => m.id !== id)
    const el = document.querySelector(`.post[data-id="${id}"]`)
    if (el) {
        el.classList.add("post--weg")
        el.addEventListener("animationend", () => { el.remove(); if (!zustand.liste.length) zeigeLeer(zustand.ordner) }, { once: true })
    }
}

// ---------- Zähler ----------
async function aktualisiereZaehler() {
    try {
        const n = await daten.zaehleUngelesen()
        const zahl = $("#zahl-eingang")
        zahl.textContent = n
        zahl.hidden = n === 0
        document.title = n ? `(${n}) Grove Mail` : "Grove Mail"
    } catch (fehler) { console.error(fehler) }
}

// ---------- Live ----------
function beiLiveAenderung(ereignis) {
    const neu = ereignis.new
    if (ereignis.eventType === "INSERT" && neu.ordner === "eingang") {
        hinweis(`Neue Mail von ${neu.von_name || neu.von_adresse}`)
        aktualisiereZaehler()
        if (zustand.ordner === "eingang" && !zustand.suche) ladeListe()
    } else if (ereignis.eventType === "UPDATE" || ereignis.eventType === "DELETE") {
        aktualisiereZaehler()
    }
}

// ---------- Kurze Hinweise unten ----------
let hinweisTimer
function hinweis(text) {
    const el = $("#hinweis")
    el.textContent = text
    el.classList.add("sichtbar")
    clearTimeout(hinweisTimer)
    hinweisTimer = setTimeout(() => el.classList.remove("sichtbar"), 2600)
}
