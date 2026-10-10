// ==========================================================
// Myzel · Seite (src/dienste/myzel/index.html)
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import "../kern/schutz.js"
import "../glocke.js"
import { ladeNutzer } from "../nutzermenue.js"
import { deutscheMeldung } from "../kern/meldungen.js"
import * as daten from "../myzel/daten.js"
import { zuHtml, auszug, linkTitel, benenneUm } from "../myzel/markdown.js"
import { verbindeVorschlaege } from "../myzel/vorschlaege.js"
import { erstelleNetz } from "../myzel/netz.js"
import "../kern/alle-dienste.js"
import { sucheEinrichten } from "../kern/suche.js"
import { verbindungsBereich } from "../kern/verknuepfen.js"
import { alleVerbindungenLoeschen } from "../kern/verbindungen.js"

sucheEinrichten()

const $ = (s) => document.querySelector(s)

// ---------- Zustand ----------
let notizen = []          // alle Notizen (ohne archivierte)
let links = []            // Verknüpfungen Notiz → Notiz
let aktiv = null          // geöffnete Notiz
let modus = "lesen"       // "lesen" | "schreiben"
let tagFilter = null
let suchTreffer = null    // Set von IDs oder null
let ungespeichert = false
let speicherTimer = null
let netz = null

const nachId = (id) => notizen.find((n) => n.id === id)
const nachTitel = (t) => notizen.find((n) => n.titel.trim().toLowerCase() === t.trim().toLowerCase())

// ---------- Start ----------
const nutzer = await ladeNutzer()
try {
    ;[notizen, links] = await Promise.all([daten.ladeAlle(), daten.ladeLinks()])
} catch (fehler) {
    console.error(fehler)
    status(deutscheMeldung(fehler), "fehler")
}
zeichneListe()
zeichneTagFilter()
const start = location.hash.slice(1)
if (start === "netz") zeigeAnsicht("netz")
else if (nachId(start)) oeffne(start)

if (nutzer) daten.beobachte(nutzer.user.id, beiLiveAenderung)

// Suche (Strg+K) oder "Verbunden mit" springt auf /dienste/myzel/#<id> – auch, wenn Myzel schon offen ist
window.addEventListener("hashchange", () => {
    const ziel = location.hash.slice(1)
    if (ziel === "netz") zeigeAnsicht("netz")
    else if (nachId(ziel) && ziel !== aktiv?.id) oeffne(ziel)
})

// ---------- Liste ----------
function sichtbareNotizen() {
    return notizen
        .filter((n) => !tagFilter || n.tags.includes(tagFilter))
        .filter((n) => !suchTreffer || suchTreffer.has(n.id))
        .sort((a, b) => b.geaendert_am.localeCompare(a.geaendert_am))
}

function zeichneListe() {
    const liste = $("#liste")
    const sichtbar = sichtbareNotizen()
    liste.replaceChildren()
    for (const n of sichtbar) {
        const el = $("#notiz-vorlage").content.firstElementChild.cloneNode(true)
        el.dataset.id = n.id
        el.querySelector("strong").textContent = n.titel || "Ohne Titel"
        el.querySelector(".auszug").textContent = auszug(n.inhalt, 90) || "Leer"
        el.querySelector(".meta").textContent = wann(n.geaendert_am) + (n.tags.length ? " · #" + n.tags.join(" #") : "")
        if (aktiv?.id === n.id) el.setAttribute("aria-current", "true")
        el.addEventListener("click", () => oeffne(n.id))
        liste.append(el)
    }
    $("#liste-leer").hidden = sichtbar.length > 0
    $("#liste-leer-text").textContent = suchTreffer || tagFilter ? "Nichts gefunden." : "Noch keine Notizen – leg die erste an."
    $("#anzahl").textContent = `${notizen.length} Notiz${notizen.length === 1 ? "" : "en"}`
}

function zeichneTagFilter() {
    const zaehler = new Map()
    notizen.forEach((n) => n.tags.forEach((t) => zaehler.set(t, (zaehler.get(t) || 0) + 1)))
    const tags = [...zaehler].sort((a, b) => b[1] - a[1]).slice(0, 12)
    const box = $("#tag-filter")
    box.replaceChildren(...tags.map(([t, n]) => {
        const b = document.createElement("button")
        b.type = "button"
        b.className = "tag" + (t === tagFilter ? " tag--an" : "")
        b.textContent = `#${t}`
        b.title = `${n} Notiz${n === 1 ? "" : "en"}`
        b.addEventListener("click", () => { tagFilter = tagFilter === t ? null : t; zeichneTagFilter(); zeichneListe() })
        return b
    }))
    box.hidden = tags.length === 0
}

// Suche (wartet kurz, bis du fertig getippt hast)
let suchTimer
$("#suche").addEventListener("input", (e) => {
    clearTimeout(suchTimer)
    suchTimer = setTimeout(async () => {
        try { suchTreffer = await daten.suche(e.target.value) } catch (f) { console.error(f); suchTreffer = null }
        zeichneListe()
    }, 250)
})

// ---------- Neue Notiz ----------
$("#neu").addEventListener("click", () => neueNotiz())
async function neueNotiz(titel = "") {
    await speichereJetzt()
    try {
        const n = await daten.neu({ titel, tags: tagFilter ? [tagFilter] : [] })
        notizen.unshift(n)
        zeichneListe()
        oeffne(n.id, { schreiben: true })
        ;(titel ? $("#inhalt") : $("#titel")).focus()
    } catch (fehler) {
        status(deutscheMeldung(fehler), "fehler")
    }
}

// ---------- Öffnen ----------
async function oeffne(id, { schreiben = false } = {}) {
    if (aktiv?.id !== id) await speichereJetzt()
    const n = nachId(id)
    if (!n) return
    aktiv = n
    history.replaceState(null, "", `#${id}`)
    zeigeAnsicht("notiz")
    $("#notiz-leer").hidden = true
    $("#blatt").hidden = false
    $("#seite").hidden = false
    $("#arbeit").classList.add("offen")
    $("#titel").value = n.titel
    $("#inhalt").value = n.inhalt
    setzeModus(schreiben || !n.inhalt.trim() ? "schreiben" : "lesen")
    zeichneSeite()
    // Verbunden mit (Grove-weit: Mails, Passwörter, …) – getrennt von den [[Links]]
    $("#grove-verbindungen").replaceChildren()
    verbindungsBereich($("#grove-verbindungen"), { typ: "myzel", id })
    document.querySelectorAll(".notiz-eintrag").forEach((el) => el.toggleAttribute("aria-current", el.dataset.id === id))
    status("")
}

function setzeModus(m) {
    modus = m
    $("#blatt").dataset.modus = m
    $("#modus").textContent = m === "lesen" ? "Bearbeiten" : "Fertig"
    if (m === "lesen") {
        $("#lesen").innerHTML = zuHtml(aktiv.inhalt, (t) => !!nachTitel(t)) ||
            `<p class="leise">Noch leer. Tippe auf „Bearbeiten“.</p>`
    } else {
        passeHoeheAn()
    }
}
$("#modus").addEventListener("click", () => setzeModus(modus === "lesen" ? "schreiben" : "lesen"))
$("#lesen").addEventListener("dblclick", () => { setzeModus("schreiben"); $("#inhalt").focus() })
document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e" && aktiv) {
        e.preventDefault(); setzeModus(modus === "lesen" ? "schreiben" : "lesen")
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); speichereJetzt() }
})

// Klick auf eine Verknüpfung im Lesemodus
$("#lesen").addEventListener("click", (e) => {
    const a = e.target.closest("a.wurzel")
    if (!a) return
    e.preventDefault()
    const ziel = nachTitel(a.dataset.titel)
    if (ziel) oeffne(ziel.id)
    else neueNotiz(a.dataset.titel)
})

$("#blatt-zurueck").addEventListener("click", async () => {
    await speichereJetzt()
    aktiv = null
    $("#arbeit").classList.remove("offen")
    $("#blatt").hidden = true
    $("#seite").hidden = true
    $("#notiz-leer").hidden = false
    history.replaceState(null, "", location.pathname)
})

// ---------- Schreiben & automatisch speichern ----------
const textfeld = $("#inhalt")
verbindeVorschlaege(textfeld, $("#vorschlaege"),
    () => notizen.filter((n) => n.titel && n.id !== aktiv?.id).map((n) => n.titel))

function passeHoeheAn() {
    textfeld.style.height = "auto"
    textfeld.style.height = Math.max(textfeld.scrollHeight, 320) + "px"
}

for (const feld of [$("#titel"), textfeld]) {
    feld.addEventListener("input", () => {
        if (!aktiv) return
        ungespeichert = true
        if (feld === textfeld) passeHoeheAn()
        status("…")
        clearTimeout(speicherTimer)
        speicherTimer = setTimeout(speichereJetzt, 700)
    })
}
window.addEventListener("beforeunload", (e) => { if (ungespeichert) { speichereJetzt(); e.preventDefault() } })
document.addEventListener("visibilitychange", () => { if (document.hidden) speichereJetzt() })

async function speichereJetzt() {
    clearTimeout(speicherTimer)
    if (!aktiv || !ungespeichert) return
    ungespeichert = false
    const n = aktiv
    const altTitel = n.titel
    const titel = $("#titel").value.trim()
    const inhalt = textfeld.value

    if (titel && notizen.some((x) => x.id !== n.id && x.titel.trim().toLowerCase() === titel.toLowerCase())) {
        status("Diesen Titel gibt es schon", "fehler")
        ungespeichert = true
        return
    }
    status("Speichert …")
    try {
        const gespeichert = await daten.speichere(n.id, { titel, inhalt })
        Object.assign(n, gespeichert)
        await aktualisiereLinks(n)
        if (altTitel && titel && altTitel !== titel) await benenneVerweiseUm(n.id, altTitel, titel)
        zeichneListe()
        zeichneSeite()
        if (netz) netz.setzeDaten(notizen, links, aktiv?.id)
        status("Gespeichert", "ok")
    } catch (fehler) {
        console.error(fehler)
        ungespeichert = true
        status(fehler.code === "23505" ? "Diesen Titel gibt es schon" : deutscheMeldung(fehler), "fehler")
    }
}

// [[Titel]] im Text → Verknüpfungen in der Datenbank
async function aktualisiereLinks(n) {
    const ziele = [...new Set(linkTitel(n.inhalt).map((t) => nachTitel(t)?.id).filter((id) => id && id !== n.id))]
    links = await daten.setzeLinks(n.id, ziele, links)
}

// Wird eine Notiz umbenannt, ziehen die [[Verweise]] in anderen Notizen mit
async function benenneVerweiseUm(id, alt, neu) {
    const quellen = links.filter((l) => l.nach_id === id).map((l) => nachId(l.von_id)).filter(Boolean)
    for (const q of quellen) {
        const text = benenneUm(q.inhalt, alt, neu)
        if (text !== q.inhalt) Object.assign(q, await daten.speichere(q.id, { inhalt: text }))
    }
}

// ---------- Seitenleiste: Tags, Verknüpfungen, Rückverweise ----------
function zeichneSeite() {
    if (!aktiv) return
    // Tags
    const tagBox = $("#tags")
    tagBox.replaceChildren(...aktiv.tags.map((t) => {
        const el = document.createElement("span")
        el.className = "tag tag--an"
        el.textContent = `#${t}`
        const x = document.createElement("button")
        x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", `Tag ${t} entfernen`)
        x.addEventListener("click", () => setzeTags(aktiv.tags.filter((y) => y !== t)))
        el.append(x)
        return el
    }))

    const ausgehend = links.filter((l) => l.von_id === aktiv.id).map((l) => nachId(l.nach_id)).filter(Boolean)
    const eingehend = links.filter((l) => l.nach_id === aktiv.id).map((l) => nachId(l.von_id)).filter(Boolean)
    zeichneVerweise($("#ausgehend"), ausgehend, "Noch keine. Schreib [[ im Text.")
    zeichneVerweise($("#eingehend"), eingehend, "Noch zeigt keine Notiz hierher.", true)
}

function zeichneVerweise(box, liste, leerText, mitZitat = false) {
    box.replaceChildren()
    if (!liste.length) {
        const p = document.createElement("p"); p.className = "leise"; p.textContent = leerText
        box.append(p); return
    }
    for (const n of liste) {
        const b = document.createElement("button")
        b.type = "button"; b.className = "verweis"
        const s = document.createElement("strong"); s.textContent = n.titel || "Ohne Titel"
        b.append(s)
        if (mitZitat) {
            const zeile = n.inhalt.split("\n").find((z) => z.toLowerCase().includes(`[[${aktiv.titel.toLowerCase()}`))
            if (zeile) { const sp = document.createElement("span"); sp.textContent = auszug(zeile, 80); b.append(sp) }
        }
        b.addEventListener("click", () => oeffne(n.id))
        box.append(b)
    }
}

$("#tag-neu").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== ",") return
    e.preventDefault()
    const t = e.target.value.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-")
    e.target.value = ""
    if (t && !aktiv.tags.includes(t)) setzeTags([...aktiv.tags, t])
})
async function setzeTags(tags) {
    try {
        Object.assign(aktiv, await daten.speichere(aktiv.id, { tags }))
        zeichneSeite(); zeichneListe(); zeichneTagFilter()
    } catch (fehler) { status(deutscheMeldung(fehler), "fehler") }
}

// ---------- Aktionen ----------
$("#per-mail").addEventListener("click", () =>
    status("Kommt mit dem Senden in Grove Mail – dann hängt die Notiz als Verknüpfung an.", "info"))

$("#loeschen").addEventListener("click", async (e) => {
    const knopf = e.currentTarget
    if (!knopf.dataset.sicher) {
        knopf.dataset.sicher = "1"; knopf.textContent = "Wirklich löschen?"
        setTimeout(() => { delete knopf.dataset.sicher; knopf.textContent = "Notiz löschen" }, 3000)
        return
    }
    const id = aktiv.id
    try {
        ungespeichert = false
        await daten.loesche(id)
        alleVerbindungenLoeschen({ typ: "myzel", id }).catch(console.error)
        notizen = notizen.filter((n) => n.id !== id)
        links = links.filter((l) => l.von_id !== id && l.nach_id !== id)
        $("#blatt-zurueck").click()
        zeichneListe(); zeichneTagFilter()
        status("Gelöscht", "ok")
    } catch (fehler) { status(deutscheMeldung(fehler), "fehler") }
})

// ---------- Netz ----------
document.querySelectorAll("[data-ansicht]").forEach((b) =>
    b.addEventListener("click", () => zeigeAnsicht(b.dataset.ansicht)))

async function zeigeAnsicht(ansicht) {
    document.querySelectorAll("[data-ansicht]").forEach((b) =>
        b.setAttribute("aria-selected", String(b.dataset.ansicht === ansicht)))
    $("#notiz-ansicht").hidden = ansicht !== "notiz"
    $("#netz-ansicht").hidden = ansicht !== "netz"
    if (ansicht === "netz") {
        await speichereJetzt()
        history.replaceState(null, "", "#netz")
        if (!netz) netz = erstelleNetz($("#netz"), { beiKlick: (id) => oeffne(id) })
        netz.setzeDaten(notizen, links, aktiv?.id)
        $("#arbeit").classList.add("offen")
    } else {
        netz?.stop()
        if (!aktiv) $("#arbeit").classList.remove("offen")
    }
}

// ---------- Live: Änderungen von anderen Geräten ----------
function beiLiveAenderung({ eventType, new: neu, old }) {
    if (eventType === "DELETE") {
        notizen = notizen.filter((n) => n.id !== old.id)
    } else if (neu.archiviert) {
        notizen = notizen.filter((n) => n.id !== neu.id)
    } else {
        const vorhanden = nachId(neu.id)
        if (vorhanden) {
            if (vorhanden === aktiv && ungespeichert) return       // eigene Tipperei hat Vorrang
            const geaendert = vorhanden.inhalt !== neu.inhalt || vorhanden.titel !== neu.titel
            Object.assign(vorhanden, neu)
            if (vorhanden === aktiv && geaendert && document.activeElement !== textfeld) {
                $("#titel").value = neu.titel; textfeld.value = neu.inhalt
                setzeModus(modus)
            }
        } else {
            notizen.unshift(neu)
        }
    }
    zeichneListe(); zeichneTagFilter()
}

// ---------- Kleinkram ----------
function status(text, art = "") {
    const el = $("#status")
    el.textContent = text
    el.dataset.art = art
}

function wann(iso) {
    const d = new Date(iso), heute = new Date()
    if (d.toDateString() === heute.toDateString()) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("de-DE", { day: "numeric", month: "short" })
}
