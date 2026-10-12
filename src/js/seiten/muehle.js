// ==========================================================
// Mühle · Seite (src/dienste/muehle/index.html) – Dateien umwandeln
// 1 Rein (Dateien, Harz, Myzel) → 2 Ziel wählen → 3 Einstellen → 4 Ergebnis
// Welche Formate es gibt, steht in js/muehle/wandler.js (Register).
// Adressen: ?harz=<id> · ?harzpfad=<name> · ?notiz=<id>  (öffnet direkt mit dieser Datei)
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub
import "../kern/schutz.js"
import "../glocke.js"
import "../nutzermenue.js"
import "../kern/alle-dienste.js"
import "../../css/kern.css"
import { sucheEinrichten } from "../kern/suche.js"
import { esc } from "../kern/html.js"
import { passendeWandler } from "../muehle/wandler.js"
import { endung } from "../muehle/hilfen.js"
import { harzListe, ausHarz, inHarzAblegen, notizenListe, ausMyzel } from "../muehle/quellen.js"
import { groesseText, dateiArt } from "../harz/speicher.js"
import { SYMBOLE } from "../harz/symbole.js"

sucheEinrichten()

const seite = document.getElementById("muehle")
const z = {
    dateien: [],
    infos: new Map(),       // wandler.id → Ergebnis von analysieren() (für die erste passende Datei)
    wahl: null,             // { wandler, ziel }
    optionen: {},
    ergebnisse: [],         // [{ name, blob, quelle }]
    arbeitet: false,
}
const SPEICHER = "grove-muehle-optionen"
const gemerkt = (() => { try { return JSON.parse(localStorage.getItem(SPEICHER)) || {} } catch { return {} } })()

seite.innerHTML = `
  <header class="mu-kopf">
    <h1>Mühle</h1>
    <p>Gib Dateien hinein, wähl aus, was herauskommen soll – fertig. Alles passiert auf deinem Gerät, nichts wird hochgeladen.</p>
  </header>

  <section class="mu-schritt" data-schritt="rein">
    <h2><span class="mu-nr">1</span> Was soll rein?</h2>
    <div class="mu-eingang" data-eingang>
      <div class="mu-eingang__bild" aria-hidden="true">${SYMBOLE.hoch}</div>
      <p><strong>Dateien hierher ziehen</strong><span>Bilder, Dokumente, PDFs, Tabellen, Audio, Video, ZIP …</span></p>
      <div class="mu-eingang__knoepfe">
        <label class="g-knopf mu-knopf">Dateien wählen<input type="file" multiple hidden data-wahl></label>
        <button class="g-knopf-leise" type="button" data-aus="harz">Aus Harz</button>
        <button class="g-knopf-leise" type="button" data-aus="myzel">Notiz aus Myzel</button>
      </div>
    </div>
    <ul class="mu-dateien" data-dateien></ul>
  </section>

  <section class="mu-schritt" data-schritt="ziel" hidden>
    <h2><span class="mu-nr">2</span> Was soll raus?</h2>
    <div data-ziele></div>
  </section>

  <section class="mu-schritt" data-schritt="einstellen" hidden>
    <h2><span class="mu-nr">3</span> Einstellen</h2>
    <form class="mu-optionen" data-optionen novalidate></form>
    <div class="mu-los">
      <button class="g-knopf" type="button" data-los>Umwandeln</button>
      <div class="mu-fortschritt" data-fortschritt hidden><div class="mu-balken"><span></span></div><small></small></div>
    </div>
  </section>

  <section class="mu-schritt" data-schritt="fertig" hidden>
    <h2><span class="mu-nr">4</span> Fertig</h2>
    <div class="mu-sammel" data-sammel></div>
    <ul class="mu-ergebnisse" data-ergebnisse></ul>
  </section>

  <div class="mu-meldung" data-meldung role="status" aria-live="polite" hidden></div>`

const el = (s) => seite.querySelector(s)
const schritt = (name) => el(`[data-schritt="${name}"]`)

let meldeTimer = null
function melden(text) {
    const m = el("[data-meldung]")
    m.textContent = text; m.hidden = false
    clearTimeout(meldeTimer)
    meldeTimer = setTimeout(() => { m.hidden = true }, 4000)
}

// ---------- 1 · Dateien ----------
async function hinzufuegen(neue) {
    for (const d of neue) if (!z.dateien.some((x) => x.name === d.name && x.size === d.size && x.lastModified === d.lastModified)) z.dateien.push(d)
    await neuBewerten()
}

function dateienZeichnen() {
    el("[data-dateien]").innerHTML = z.dateien.map((d, i) => {
        const art = dateiArt(d.name, d.type)
        return `<li class="mu-datei">
          <span class="hz-symbol" data-art="${art}">${SYMBOLE[art]}</span>
          <span class="mu-datei__name">${esc(d.name)}${d.quelle ? `<small>aus ${d.quelle.typ === "myzel" ? "Myzel" : "Harz"}</small>` : ""}</span>
          <span class="mu-datei__groesse">${groesseText(d.size)}</span>
          ${z.dateien.length > 1 ? `<span class="mu-datei__ordnen"><button type="button" data-hoch="${i}" aria-label="Nach oben" ${i ? "" : "disabled"}>↑</button><button type="button" data-runter="${i}" aria-label="Nach unten" ${i < z.dateien.length - 1 ? "" : "disabled"}>↓</button></span>` : ""}
          <button class="mu-weg" type="button" data-weg="${i}" aria-label="Entfernen">×</button>
        </li>`
    }).join("")
}

async function neuBewerten() {
    dateienZeichnen()
    z.infos = new Map()
    const wandler = passendeWandler(z.dateien)
    // Infos für Formatliste holen (z. B. Tabellenblätter, Video oder Audio?)
    await Promise.all(wandler.filter((w) => w.analysieren && !w.mehrere).map(async (w) => {
        try { z.infos.set(w.id, await w.analysieren(z.dateien.find((d) => w.passt(d)))) } catch { z.infos.set(w.id, null) }
    }))
    if (z.wahl && !wandler.includes(z.wahl.wandler)) z.wahl = null
    zieleZeichnen(wandler)
    schritt("ziel").hidden = !z.dateien.length
    schritt("einstellen").hidden = !z.wahl
    if (z.wahl) optionenZeichnen()
}

// ---------- 2 · Ziel ----------
const zieleVon = (w) => (typeof w.ziele === "function" ? w.ziele(z.infos.get(w.id)) : w.ziele) || []

function zieleZeichnen(wandler) {
    const box = el("[data-ziele]")
    if (!z.dateien.length) { box.innerHTML = ""; return }
    const gruppen = wandler.map((w) => ({ w, ziele: zieleVon(w) })).filter((g) => g.ziele.length)
    if (!gruppen.length) {
        box.innerHTML = `<p class="mu-leer">${z.dateien.length > 1 ? "Für diese Mischung gibt es nichts Gemeinsames. Nimm Dateien einer Art – oder pack alles in ein ZIP." : `Mit „${esc(endung(z.dateien[0].name) || z.dateien[0].name)}“ kann die Mühle (noch) nichts anfangen.`}</p>`
        return
    }
    box.innerHTML = gruppen.map(({ w, ziele }) => `
      <div class="mu-gruppe">
        <h3>${esc(w.name)}${!w.mehrere && z.dateien.length > 1 ? ` <small>· jede Datei einzeln</small>` : ""}</h3>
        <div class="mu-ziele">
          ${ziele.map((zi) => `
            <button type="button" class="mu-ziel" data-w="${w.id}" data-z="${zi.id}" aria-pressed="${z.wahl?.wandler === w && z.wahl?.ziel.id === zi.id}">
              <strong>${esc(zi.name)}</strong>
              <span>${esc(zi.text || "")}</span>
            </button>`).join("")}
        </div>
      </div>`).join("")
    box.querySelectorAll(".mu-ziel").forEach((k) => k.addEventListener("click", () => {
        const w = wandler.find((x) => x.id === k.dataset.w)
        z.wahl = { wandler: w, ziel: zieleVon(w).find((x) => x.id === k.dataset.z) }
        box.querySelectorAll(".mu-ziel").forEach((b) => b.setAttribute("aria-pressed", b === k))
        schritt("einstellen").hidden = false
        optionenZeichnen()
        schritt("einstellen").scrollIntoView({ behavior: "smooth", block: "nearest" })
    }))
}

// ---------- 3 · Einstellungen ----------
const schluessel = () => `${z.wahl.wandler.id}:${z.wahl.ziel.id}`

function optionenZeichnen() {
    const felder = z.wahl.ziel.optionen || []
    const alt = gemerkt[schluessel()] || {}
    z.optionen = Object.fromEntries(felder.map((f) => [f.id, alt[f.id] ?? f.standard]))
    const form = el("[data-optionen]")
    if (!felder.length) { form.innerHTML = `<p class="mu-leer">Hier gibt es nichts einzustellen.</p>`; return }
    form.innerHTML = felder.map((f) => `<div class="mu-feld" data-feld="${f.id}">${feldHtml(f, z.optionen[f.id])}${f.hilfe ? `<small>${esc(f.hilfe)}</small>` : ""}</div>`).join("")
    form.querySelectorAll("[data-wert]").forEach((eingabe) => {
        const f = felder.find((x) => x.id === eingabe.dataset.wert)
        const lesen = () => {
            if (f.art === "schalter") return eingabe.checked
            if (f.art === "zahl" || f.art === "regler") return eingabe.value === "" ? f.standard : +eingabe.value
            return eingabe.value
        }
        eingabe.addEventListener(f.art === "text" || f.art === "zahl" ? "input" : "change", () => setzen(f.id, lesen()))
        if (f.art === "regler") eingabe.addEventListener("input", () => { form.querySelector(`[data-zeige="${f.id}"]`).textContent = `${eingabe.value} ${f.einheit || ""}` })
    })
    form.querySelectorAll("[data-segment]").forEach((k) => k.addEventListener("click", () => {
        setzen(k.dataset.segment, k.dataset.v)
        k.parentElement.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b === k))
    }))
    sichtbarkeit()
}

function feldHtml(f, wert) {
    const titel = `<span class="mu-feld__name">${esc(f.name)}</span>`
    // Kurze Auswahl → Knöpfe nebeneinander, längere → Liste (sonst bricht es unschön um)
    const kurz = f.art === "wahl" && f.werte.length <= 4 && f.werte.reduce((n, [, t]) => n + t.length, 0) <= 30
    if (kurz) return `${titel}<div class="mu-segment" role="group" aria-label="${esc(f.name)}">${f.werte.map(([v, n]) => `<button type="button" data-segment="${f.id}" data-v="${esc(v)}" aria-pressed="${String(v) === String(wert)}">${esc(n)}</button>`).join("")}</div>`
    if (f.art === "wahl") return `<label>${titel}<select data-wert="${f.id}">${f.werte.map(([v, n]) => `<option value="${esc(v)}" ${String(v) === String(wert) ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`
    if (f.art === "schalter") return `<label class="mu-schalter"><input type="checkbox" data-wert="${f.id}" ${wert ? "checked" : ""}><span class="mu-schalter__knopf" aria-hidden="true"></span>${titel}</label>`
    if (f.art === "regler") return `<label>${titel}<span class="mu-regler"><input type="range" data-wert="${f.id}" min="${f.min}" max="${f.max}" step="${f.schritt || 1}" value="${wert}"><output data-zeige="${f.id}">${wert} ${esc(f.einheit || "")}</output></span></label>`
    if (f.art === "zahl") return `<label>${titel}<span class="mu-zahl"><input type="number" inputmode="decimal" data-wert="${f.id}" min="${f.min ?? ""}" max="${f.max ?? ""}" step="${f.schritt || 1}" value="${wert}">${f.einheit ? `<em>${esc(f.einheit)}</em>` : ""}</span></label>`
    return `<label>${titel}<input type="text" data-wert="${f.id}" value="${esc(wert ?? "")}" autocomplete="off"></label>`
}

function setzen(id, wert) {
    z.optionen[id] = wert
    gemerkt[schluessel()] = { ...z.optionen }
    try { localStorage.setItem(SPEICHER, JSON.stringify(gemerkt)) } catch { /* egal */ }
    sichtbarkeit()
}
function sichtbarkeit() {
    for (const f of z.wahl.ziel.optionen || []) {
        const box = el(`[data-feld="${f.id}"]`)
        if (box) box.hidden = f.wenn ? !f.wenn(z.optionen) : false
    }
}

// ---------- Umwandeln ----------
function fortschritt(gesamt, nr) {
    const box = el("[data-fortschritt]")
    box.hidden = false
    return (anteil, text) => {
        const p = Math.max(0, Math.min(1, (nr + (anteil || 0)) / gesamt))
        box.querySelector("span").style.width = `${Math.round(p * 100)}%`
        if (text) box.querySelector("small").textContent = gesamt > 1 ? `${text} (${nr + 1} von ${gesamt})` : text
    }
}

async function umwandeln() {
    if (z.arbeitet || !z.wahl) return
    z.arbeitet = true
    const knopf = el("[data-los]")
    knopf.disabled = true; knopf.textContent = "Mühle läuft …"
    const { wandler: w, ziel } = z.wahl
    const o = { ...z.optionen }
    const neu = [], fehler = []
    try {
        if (w.mehrere) {
            const erg = await w.umwandeln(z.dateien, ziel, o, { fortschritt: fortschritt(1, 0) })
            const quelle = z.dateien.length === 1 ? z.dateien[0].quelle : null
            neu.push(...erg.map((e) => ({ ...e, quelle })))
        } else {
            const passende = z.dateien.filter((d) => w.passt(d))
            for (const [i, d] of passende.entries()) {
                try {
                    const erg = await w.umwandeln(d, ziel, o, { fortschritt: fortschritt(passende.length, i), info: z.infos.get(w.id) })
                    neu.push(...erg.map((e) => ({ ...e, quelle: d.quelle || null })))
                } catch (f) { console.error(f); fehler.push(`${d.name}: ${f.message}`) }
            }
        }
    } catch (f) { console.error(f); fehler.push(f.message) }
    fortschritt(1, 0)(1, fehler.length ? "Mit Fehlern fertig" : "Fertig")
    z.ergebnisse = neu
    ergebnisseZeichnen(fehler)
    knopf.disabled = false; knopf.textContent = "Umwandeln"
    z.arbeitet = false
}

// ---------- 4 · Ergebnis ----------
let vorschauUrls = []
function ergebnisseZeichnen(fehler = []) {
    vorschauUrls.forEach((u) => URL.revokeObjectURL(u)); vorschauUrls = []
    schritt("fertig").hidden = false
    const liste = el("[data-ergebnisse]")
    liste.innerHTML = fehler.map((f) => `<li class="mu-fehler">${esc(f)}</li>`).join("") + z.ergebnisse.map((e, i) => {
        const art = dateiArt(e.name, e.blob.type)
        let bild = `<span class="hz-symbol" data-art="${art}">${SYMBOLE[art]}</span>`
        if (art === "bild" && e.blob.size < 25_000_000) { const u = URL.createObjectURL(e.blob); vorschauUrls.push(u); bild = `<img class="mu-vorschau" src="${u}" alt="">` }
        return `<li class="mu-ergebnis">
          ${bild}
          <span class="mu-datei__name">${esc(e.name)}</span>
          <span class="mu-datei__groesse">${groesseText(e.blob.size)}</span>
          <span class="mu-ergebnis__knoepfe">
            <button class="g-knopf-leise" type="button" data-harz="${i}">In Harz</button>
            <button class="g-knopf" type="button" data-laden="${i}">Herunterladen</button>
          </span>
        </li>`
    }).join("")
    el("[data-sammel]").innerHTML = z.ergebnisse.length > 1 ? `
        <button class="g-knopf" type="button" data-alle-laden>Alle herunterladen (ZIP)</button>
        <button class="g-knopf-leise" type="button" data-alle-harz>Alle in Harz ablegen</button>` : ""
    liste.querySelectorAll("[data-laden]").forEach((k) => k.addEventListener("click", () => herunterladen(z.ergebnisse[+k.dataset.laden])))
    liste.querySelectorAll("[data-harz]").forEach((k) => k.addEventListener("click", () => ablegen([z.ergebnisse[+k.dataset.harz]], k)))
    el("[data-alle-laden]")?.addEventListener("click", alleAlsZip)
    el("[data-alle-harz]")?.addEventListener("click", (ev) => ablegen(z.ergebnisse, ev.currentTarget))
    schritt("fertig").scrollIntoView({ behavior: "smooth", block: "nearest" })
}

function herunterladen({ name, blob }) {
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement("a"), { href: url, download: name })
    document.body.append(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

async function alleAlsZip() {
    const { zipSync } = await import("fflate")
    const inhalt = {}
    for (const e of z.ergebnisse) {
        let n = e.name, i = 2
        while (inhalt[n]) n = e.name.replace(/(\.[^.]*)?$/, ` (${i++})$1`)
        inhalt[n] = [new Uint8Array(await e.blob.arrayBuffer()), { level: 0 }]
    }
    herunterladen({ name: `Mühle ${new Date().toISOString().slice(0, 10)}.zip`, blob: new Blob([zipSync(inhalt)], { type: "application/zip" }) })
}

async function ablegen(liste, knopf) {
    knopf.disabled = true
    let ok = 0
    for (const e of liste) {
        try { await inHarzAblegen(e.name, e.blob, e.quelle); ok++ }
        catch (f) { melden(f.message); break }
    }
    if (ok) {
        melden(ok === 1 ? "In Harz abgelegt" : `${ok} Dateien in Harz abgelegt`)
        knopf.textContent = "In Harz ✓"
    } else knopf.disabled = false
}

// ---------- Auswahl aus Harz / Myzel ----------
function auswahl({ titel, suchen = false, laden, eintrag, beiWahl }) {
    const d = document.createElement("dialog")
    d.className = "g-dialog mu-auswahl"
    d.innerHTML = `<form method="dialog">
        <h2>${esc(titel)}</h2>
        ${suchen ? `<input class="g-dialog__feld" type="search" placeholder="Suchen …" data-suche>` : ""}
        <ul class="mu-auswahl__liste" data-liste><li class="mu-leer">Lade …</li></ul>
        <div class="g-dialog__knoepfe"><button class="g-knopf-leise" value="zu" type="submit">Schließen</button></div>
      </form>`
    document.body.append(d)
    d.addEventListener("close", () => d.remove())
    const ul = d.querySelector("[data-liste]")
    async function fuellen(text = "") {
        try {
            const daten = await laden(text)
            ul.innerHTML = daten.length ? daten.map((x, i) => `<li><button type="button" data-i="${i}">${eintrag(x)}</button></li>`).join("") : `<li class="mu-leer">Nichts gefunden.</li>`
            ul.querySelectorAll("[data-i]").forEach((k) => k.addEventListener("click", async () => {
                k.disabled = true
                try { await beiWahl(daten[+k.dataset.i]); k.classList.add("is-drin") }
                catch (f) { melden(f.message); k.disabled = false }
            }))
        } catch (f) { ul.innerHTML = `<li class="mu-leer">${esc(f.message)}</li>` }
    }
    let t = null
    d.querySelector("[data-suche]")?.addEventListener("input", (ev) => { clearTimeout(t); t = setTimeout(() => fuellen(ev.target.value.trim()), 250) })
    d.showModal()
    fuellen()
}

el('[data-aus="harz"]').addEventListener("click", () => auswahl({
    titel: "Aus Harz",
    laden: async () => {
        const { dateien, zugriff } = await harzListe()
        if (!zugriff) throw new Error("Kein Zugriff auf den Harz-Speicher – öffne Harz einmal und erlaube den Zugriff.")
        if (!dateien.length) throw new Error("In Harz liegen auf diesem Gerät noch keine Dateien.")
        return dateien
    },
    eintrag: (x) => `<span>${esc(x.name)}</span><small>${groesseText(x.groesse)}</small>`,
    beiWahl: async (x) => hinzufuegen([await ausHarz(x.id ? { id: x.id } : { pfad: x.pfad })]),
}))
el('[data-aus="myzel"]').addEventListener("click", () => auswahl({
    titel: "Notiz aus Myzel",
    suchen: true,
    laden: notizenListe,
    eintrag: (n) => `<span>${esc(n.titel || "Ohne Titel")}</span><small>${new Date(n.geaendert_am).toLocaleDateString("de-DE")}</small>`,
    beiWahl: async (n) => hinzufuegen([await ausMyzel(n.id)]),
}))

// ---------- Ereignisse ----------
el("[data-wahl]").addEventListener("change", (ev) => { hinzufuegen([...ev.target.files]); ev.target.value = "" })
el("[data-los]").addEventListener("click", umwandeln)
el("[data-dateien]").addEventListener("click", (ev) => {
    const k = ev.target.closest("button")
    if (!k) return
    if (k.dataset.weg) z.dateien.splice(+k.dataset.weg, 1)
    else if (k.dataset.hoch) { const i = +k.dataset.hoch; [z.dateien[i - 1], z.dateien[i]] = [z.dateien[i], z.dateien[i - 1]] }
    else if (k.dataset.runter) { const i = +k.dataset.runter; [z.dateien[i + 1], z.dateien[i]] = [z.dateien[i], z.dateien[i + 1]] }
    else return
    if (!z.dateien.length) { schritt("einstellen").hidden = true; schritt("fertig").hidden = true; z.wahl = null }
    neuBewerten()
})

const eingang = el("[data-eingang]")
const hatDateien = (ev) => [...(ev.dataTransfer?.types || [])].includes("Files")
let tiefe = 0
addEventListener("dragenter", (ev) => { if (hatDateien(ev)) { ev.preventDefault(); tiefe++; eingang.classList.add("is-ziehen") } })
addEventListener("dragover", (ev) => { if (hatDateien(ev)) ev.preventDefault() })
addEventListener("dragleave", () => { if (--tiefe <= 0) { tiefe = 0; eingang.classList.remove("is-ziehen") } })
addEventListener("drop", (ev) => {
    if (!hatDateien(ev)) return
    ev.preventDefault(); tiefe = 0; eingang.classList.remove("is-ziehen")
    hinzufuegen([...ev.dataTransfer.files])
})

// Direkt mit einer Datei aus Harz / Myzel starten
;(async () => {
    const p = new URLSearchParams(location.search)
    try {
        if (p.get("harz")) await hinzufuegen([await ausHarz({ id: p.get("harz") })])
        else if (p.get("harzpfad")) await hinzufuegen([await ausHarz({ pfad: p.get("harzpfad") })])
        else if (p.get("notiz")) await hinzufuegen([await ausMyzel(p.get("notiz"))])
        if (z.dateien.length) schritt("ziel").scrollIntoView({ behavior: "smooth", block: "start" })
    } catch (f) { melden(f.message) }
})()
