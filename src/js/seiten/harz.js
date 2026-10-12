// ==========================================================
// Harz · Seite (src/dienste/harz/index.html) – Dateien
//
// Grundidee: Die Datei selbst bleibt auf dem Gerät (Speicher aus js/harz/speicher.js),
// Supabase kennt nur ihren Steckbrief (js/harz/daten.js). So sieht man auf jedem
// Gerät alle Dateien, öffnen kann man sie dort, wo sie liegen.
// Später holt Bridge Dateien von einem Gerät aufs andere.
//
// Ablauf beim Laden: Gerät + Speicher bestimmen → lokale Dateien auflisten →
// Steckbriefe holen → abgleichen (neue lokale Dateien bekommen automatisch einen
// Steckbrief, z. B. was du im Explorer in den Ordner gelegt hast) → anzeigen.
// Offline: nur die Dateien dieses Geräts, Steckbriefe folgen beim nächsten Laden.
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub
import "../kern/schutz.js"
import "../glocke.js"
import "../nutzermenue.js"
import "../kern/alle-dienste.js"
import "../../css/kern.css"
import { sucheEinrichten } from "../kern/suche.js"
import { esc } from "../kern/html.js"
import { verbindungsBereich } from "../kern/verknuepfen.js"
import { bestaetigen, eingabe } from "../kern/dialog.js"
import { speicherSchuetzen, speicherStand } from "../kern/app.js"
import { diesesGeraet, geraetMelden, geraetUmbenennen, geraeteListe } from "../kern/geraet.js"
import { SPEICHER, aktiverSpeicher, speicherWaehlen, speicherVon, sichererName, freierName, teilen, dateiArt, groesseText } from "../harz/speicher.js"
import { SYMBOLE } from "../harz/symbole.js"
import * as daten from "../harz/daten.js"

sucheEinrichten()

const seite = document.getElementById("harz")
const z = {
    geraet: null,            // { id, name }
    geraete: new Map(),      // id → { name, art, zuletzt_gesehen }
    speicher: null,          // aktiver Speicher
    bereit: false,           // Zugriff auf den Speicher?
    lokal: new Map(),        // pfad → { pfad, groesse, typ, geaendert }
    liste: [],               // Einträge für die Anzeige
    offline: false,
    filter: "alle",          // "alle" | "hier"
    suche: "",
    gewaehlt: new URLSearchParams(location.search).get("datei"),
    vorschauUrl: null,
}

const datum = (d) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
const geraetName = (id) => (id === z.geraet?.id ? z.geraet.name : z.geraete.get(id)?.name) || "unbekanntes Gerät"

// ---------- Einträge ----------
function ausSteckbrief(s) {
    const hier = s.geraet_id === z.geraet.id && s.speicher === z.speicher.id
    return { ...s, hier, fehlt: hier && z.bereit && !z.lokal.has(s.pfad), nurLokal: false }
}
function ausLokal(d) {
    return { id: "lokal:" + d.pfad, name: d.pfad, pfad: d.pfad, groesse: d.groesse, typ: d.typ, geaendert_am: d.geaendert,
        erstellt_am: d.geaendert, speicher: z.speicher.id, geraet_id: z.geraet.id, hier: true, fehlt: false, nurLokal: true }
}

// ---------- Laden ----------
async function laden() {
    z.geraet = await diesesGeraet()
    z.speicher = await aktiverSpeicher()
    z.bereit = await z.speicher.bereit().catch(() => false)
    z.lokal = new Map()
    if (z.bereit) for (const d of await z.speicher.liste().catch(() => [])) z.lokal.set(d.pfad, d)

    let steckbriefe = []
    try {
        await geraetMelden()
        const [s, g] = await Promise.all([daten.alleSteckbriefe(), geraeteListe()])
        steckbriefe = s
        z.geraete = new Map(g.map((x) => [x.id, x]))
        z.offline = false
    } catch (fehler) {
        console.warn("Harz offline:", fehler)
        z.offline = true
    }

    if (z.offline) z.liste = [...z.lokal.values()].map(ausLokal)
    else {
        if (z.bereit) steckbriefe = await abgleichen(steckbriefe)
        z.liste = steckbriefe.map(ausSteckbrief)
    }
    zeichnen()
}

// Lokale Dateien ohne Steckbrief bekommen einen (z. B. im Explorer hineingelegt oder offline hochgeladen)
async function abgleichen(steckbriefe) {
    const bekannt = new Set(steckbriefe.filter((s) => s.geraet_id === z.geraet.id && s.speicher === z.speicher.id).map((s) => s.pfad))
    for (const d of z.lokal.values()) {
        if (bekannt.has(d.pfad)) continue
        try {
            steckbriefe.unshift(await daten.steckbriefAnlegen({
                name: d.pfad, pfad: d.pfad, groesse: d.groesse, typ: d.typ || null, speicher: z.speicher.id, geraet_id: z.geraet.id,
            }))
        } catch (f) { console.warn("Steckbrief fehlt:", d.pfad, f) }
    }
    return steckbriefe
}

// ---------- Gerüst ----------
seite.innerHTML = `
  <header class="hz-kopf">
    <div>
      <h1>Harz</h1>
      <p>Deine Dateien bleiben auf deinen Geräten. Online liegt nur ein Steckbrief mit Name, Größe und Gerät, damit Suche und Verknüpfen überall funktionieren.</p>
    </div>
    <div class="hz-kopf__knoepfe">
      <button class="g-knopf-leise hz-knopf-symbol" type="button" data-einstellungen>${SYMBOLE.zahnrad} Speicher &amp; Gerät</button>
      <label class="g-knopf hz-hochladen">${SYMBOLE.hoch} Hochladen<input type="file" multiple hidden data-datei-wahl></label>
    </div>
  </header>
  <div class="hz-hinweise" aria-live="polite"></div>
  <div class="hz-werkzeug">
    <input class="hz-suche" type="search" placeholder="Dateien durchsuchen" aria-label="Dateien durchsuchen" data-suchfeld>
    <div class="hz-segment" role="group" aria-label="Welche Dateien">
      <button type="button" data-filter="alle" aria-pressed="true">Alle Geräte</button>
      <button type="button" data-filter="hier" aria-pressed="false">Dieses Gerät</button>
    </div>
    <span class="hz-stand" data-stand></span>
  </div>
  <div class="hz-haupt">
    <div class="hz-liste" data-liste></div>
    <aside class="hz-detail" data-detail hidden></aside>
  </div>
  <div class="hz-ablegen" data-ablegen hidden><div>${SYMBOLE.hoch}<span>Loslassen zum Ablegen</span></div></div>
  <div class="hz-meldung" data-meldung role="status" aria-live="polite" hidden></div>`

const el = (sel) => seite.querySelector(sel)

// ---------- Anzeige ----------
function zeichnen() {
    hinweiseZeichnen()
    listeZeichnen()
    detailZeichnen()
}

async function hinweiseZeichnen() {
    const h = []
    if (z.offline) h.push({ text: "Offline: Du siehst nur die Dateien auf diesem Gerät. Hochladen geht trotzdem – der Steckbrief folgt, sobald du wieder online bist." })
    if (!z.bereit && z.speicher.id === "ordner") {
        const name = await z.speicher.ordnerName()
        h.push(name
            ? { text: `Grove braucht wieder Zugriff auf deinen Ordner „${name}“.`, knopf: "Zugriff erlauben", tun: ordnerZugriff }
            : { text: "Es ist noch kein Ordner gewählt.", knopf: "Speicher wählen", tun: einstellungen })
    }
    if (z.speicher.id === "browser" && z.lokal.size) {
        const stand = await speicherStand()
        if (!stand.geschuetzt) h.push({ text: "Tipp: Lass deinen Speicher schützen, damit der Browser die Dateien nie von selbst aufräumt.", knopf: "Schützen", tun: schuetzen })
    }
    const box = el(".hz-hinweise")
    box.innerHTML = h.map((x, i) => `<div class="hz-hinweis"><span>${esc(x.text)}</span>${x.knopf ? `<button class="g-knopf-leise" type="button" data-hinweis="${i}">${esc(x.knopf)}</button>` : ""}</div>`).join("")
    box.querySelectorAll("[data-hinweis]").forEach((k) => k.addEventListener("click", () => h[k.dataset.hinweis].tun()))
}

function sichtbareEintraege() {
    const s = z.suche.toLowerCase()
    return z.liste.filter((e) => (z.filter === "alle" || e.geraet_id === z.geraet.id) && (!s || e.name.toLowerCase().includes(s)))
}

function listeZeichnen() {
    const liste = sichtbareEintraege()
    const hierGroesse = [...z.lokal.values()].reduce((n, d) => n + (d.groesse || 0), 0)
    el("[data-stand]").textContent = `${z.lokal.size} ${z.lokal.size === 1 ? "Datei" : "Dateien"} · ${groesseText(hierGroesse)} auf diesem Gerät`

    const box = el("[data-liste]")
    if (!liste.length) {
        box.innerHTML = z.liste.length
            ? `<p class="hz-leer">Nichts gefunden.</p>`
            : `<div class="hz-leer hz-leer--gross">
                 <img src="/bilder/dienste/harz.svg" alt="">
                 <strong>Noch keine Dateien</strong>
                 <span>Zieh Dateien hierher oder tippe auf „Hochladen“. Sie bleiben auf diesem Gerät.</span>
               </div>`
        return
    }
    box.innerHTML = liste.map((e) => {
        const art = dateiArt(e.name, e.typ || "")
        const marke = e.fehlt ? `<span class="hz-marke hz-marke--fehlt">fehlt</span>`
            : !e.hier ? `<span class="hz-marke">${SYMBOLE.geraet}${esc(e.geraet_id === z.geraet.id ? "anderer Speicher" : geraetName(e.geraet_id))}</span>` : ""
        return `
          <button type="button" class="hz-zeile${e.id === z.gewaehlt ? " is-aktiv" : ""}${e.hier && !e.fehlt ? "" : " is-fern"}" data-id="${esc(e.id)}">
            <span class="hz-symbol" data-art="${art}">${SYMBOLE[art]}</span>
            <span class="hz-zeile__name">${esc(e.name)}</span>
            <span class="hz-zeile__info">${groesseText(e.groesse)} · ${datum(e.geaendert_am)}</span>
            ${marke}
          </button>`
    }).join("")
}

async function detailZeichnen() {
    const box = el("[data-detail]")
    if (z.vorschauUrl) { URL.revokeObjectURL(z.vorschauUrl); z.vorschauUrl = null }
    const e = z.liste.find((x) => x.id === z.gewaehlt)
    seite.classList.toggle("hz--detail", !!e)
    if (!e) { box.hidden = true; box.innerHTML = ""; return }
    box.hidden = false
    const art = dateiArt(e.name, e.typ || "")
    const offenbar = e.hier && !e.fehlt
    box.innerHTML = `
      <div class="hz-detail__kopf">
        <h2>${esc(e.name)}</h2>
        <button class="hz-zu" type="button" aria-label="Schließen" data-zu>×</button>
      </div>
      <div class="hz-vorschau" data-vorschau><span class="hz-symbol hz-symbol--gross" data-art="${art}">${SYMBOLE[art]}</span></div>
      ${!offenbar ? `<p class="hz-fern">${e.fehlt
          ? "Diese Datei ist auf diesem Gerät nicht mehr da – vielleicht wurde sie im Explorer gelöscht oder verschoben."
          : e.geraet_id === z.geraet.id
              ? "Die Datei liegt auf diesem Gerät, aber in einem anderen Speicher. Wechsle in „Speicher & Gerät“ zurück, um sie zu öffnen."
              : `Liegt auf „${esc(geraetName(e.geraet_id))}“. Öffnen kannst du sie dort – später holt Bridge sie dir hierher.`}</p>` : ""}
      <dl class="hz-fakten">
        <dt>Größe</dt><dd>${groesseText(e.groesse)}</dd>
        <dt>Art</dt><dd>${esc(e.typ || teilen(e.name)[1].slice(1).toUpperCase() || "Datei")}</dd>
        <dt>Gerät</dt><dd>${esc(geraetName(e.geraet_id))}</dd>
        <dt>Speicher</dt><dd>${esc(speicherVon(e.speicher)?.name || e.speicher)}</dd>
        <dt>Abgelegt</dt><dd>${datum(e.erstellt_am)}</dd>
      </dl>
      <div class="hz-aktionen">
        ${offenbar ? `
          <button class="g-knopf" type="button" data-tun="oeffnen">Öffnen</button>
          <button class="g-knopf-leise" type="button" data-tun="laden">Herunterladen</button>
          <button class="g-knopf-leise" type="button" data-tun="umwandeln">Umwandeln</button>
          <button class="g-knopf-leise" type="button" data-tun="umbenennen">Umbenennen</button>
          <button class="g-knopf-leise hz-gefahr" type="button" data-tun="loeschen">Löschen</button>`
        : !e.nurLokal ? `<button class="g-knopf-leise hz-gefahr" type="button" data-tun="entfernen">Aus der Liste entfernen</button>` : ""}
      </div>
      <div data-verbunden></div>`

    box.querySelector("[data-zu]").addEventListener("click", () => waehlen(null))
    box.querySelectorAll("[data-tun]").forEach((k) => k.addEventListener("click", () => AKTIONEN[k.dataset.tun](e)))
    if (!e.nurLokal && !z.offline) verbindungsBereich(box.querySelector("[data-verbunden]"), { typ: "harz", id: e.id })
    if (offenbar) vorschauLaden(e, art, box.querySelector("[data-vorschau]"))
}

async function vorschauLaden(e, art, ziel) {
    if (!["bild", "video", "audio", "pdf", "text"].includes(art)) return
    try {
        const datei = await z.speicher.lesen(e.pfad)
        if (z.gewaehlt !== e.id) return
        if (art === "text") {
            const text = await datei.slice(0, 200_000).text()
            ziel.innerHTML = `<pre class="hz-text">${esc(text)}${datei.size > 200_000 ? "\n…" : ""}</pre>`
            return
        }
        z.vorschauUrl = URL.createObjectURL(datei)
        const url = z.vorschauUrl
        ziel.innerHTML = art === "bild" ? `<img src="${url}" alt="">`
            : art === "video" ? `<video src="${url}" controls preload="metadata"></video>`
            : art === "audio" ? `<audio src="${url}" controls></audio>`
            : `<iframe src="${url}" title="${esc(e.name)}"></iframe>`
    } catch (f) { console.warn("Vorschau:", f) }
}

function waehlen(id) {
    z.gewaehlt = id
    const url = new URL(location.href)
    if (id && !id.startsWith("lokal:")) url.searchParams.set("datei", id)
    else url.searchParams.delete("datei")
    history.replaceState(null, "", url)
    seite.querySelectorAll(".hz-zeile").forEach((z_) => z_.classList.toggle("is-aktiv", z_.dataset.id === id))
    detailZeichnen()
}

// ---------- Meldung unten ----------
let meldeTimer = null
function melden(text, { bleiben = false } = {}) {
    const m = el("[data-meldung]")
    m.textContent = text
    m.hidden = false
    clearTimeout(meldeTimer)
    if (!bleiben) meldeTimer = setTimeout(() => { m.hidden = true }, 3500)
}

// ---------- Hochladen ----------
async function hochladen(dateien) {
    dateien = [...dateien]
    if (!dateien.length) return
    if (!z.bereit) {
        if (z.speicher.id === "ordner") { if (!(await ordnerZugriff())) return }
        else return melden("Der Speicher ist gerade nicht erreichbar.")
    }
    const belegt = new Set(z.lokal.keys())
    let fertig = 0
    for (const f of dateien) {
        const pfad = freierName(sichererName(f.name), belegt)
        belegt.add(pfad)
        melden(dateien.length > 1 ? `Lege ab … ${fertig + 1} von ${dateien.length}` : `Lege „${pfad}“ ab …`, { bleiben: true })
        try {
            await z.speicher.schreiben(pfad, f)
        } catch (fehler) {
            melden(`„${f.name}“ ging nicht: ${fehler.message}`)
            continue
        }
        const d = { pfad, groesse: f.size, typ: f.type || "", geaendert: Date.now() }
        z.lokal.set(pfad, d)
        let eintrag = ausLokal(d)
        // Gibt es schon einen Steckbrief mit diesem Namen („fehlt“)? Dann den weiternutzen –
        // ein zweiter würde von der Datenbank abgelehnt, und die Datei stünde doppelt in der Liste.
        const alt = z.liste.find((x) => x.hier && x.fehlt && x.pfad === pfad)
        if (!z.offline) {
            try {
                eintrag = ausSteckbrief(alt
                    ? await daten.steckbriefAendern(alt.id, { groesse: f.size, typ: f.type || null })
                    : await daten.steckbriefAnlegen({
                        name: pfad, pfad, groesse: f.size, typ: f.type || null, speicher: z.speicher.id, geraet_id: z.geraet.id,
                    }))
            } catch (fehler) { console.warn("Steckbrief:", fehler) }
        }
        if (alt) z.liste = z.liste.filter((x) => x !== alt)
        z.liste.unshift(eintrag)
        fertig++
    }
    speicherSchuetzen()
    melden(fertig === 1 ? "Datei abgelegt" : `${fertig} Dateien abgelegt`)
    listeZeichnen()
    hinweiseZeichnen()
}

// Namen, die hier schon vergeben sind (fürs Umbenennen): lokale Dateien UND Steckbriefe dieses
// Speichers – auch „fehlt“-Einträge, sonst lehnt die Datenbank den Namen als doppelt ab
function belegteNamen(ausser = null) {
    const namen = new Set([...z.lokal.keys(), ...z.liste.filter((e) => e.hier).map((e) => e.pfad)])
    if (ausser) namen.delete(ausser)
    return namen
}

// ---------- Aktionen ----------
async function dateiHolen(e) { return z.speicher.lesen(e.pfad) }

const AKTIONEN = {
    async oeffnen(e) {
        const url = URL.createObjectURL(await dateiHolen(e))
        window.open(url, "_blank", "noopener")
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
    },
    async laden(e) {
        const url = URL.createObjectURL(await dateiHolen(e))
        const a = Object.assign(document.createElement("a"), { href: url, download: e.name })
        document.body.append(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
    },
    umwandeln(e) {          // → Mühle öffnet sich gleich mit dieser Datei
        location.href = e.nurLokal ? `/dienste/muehle/?harzpfad=${encodeURIComponent(e.pfad)}` : `/dienste/muehle/?harz=${encodeURIComponent(e.id)}`
    },
    async umbenennen(e) {
        const neu = await eingabe({ titel: "Umbenennen", wert: e.name, markieren: teilen(e.name)[0].length })
        if (!neu || neu === e.name) return
        const pfad = freierName(sichererName(neu), belegteNamen(e.pfad))
        try {
            await z.speicher.umbenennen(e.pfad, pfad)
        } catch (fehler) { return melden(`Umbenennen ging nicht: ${fehler.message}`) }
        const d = z.lokal.get(e.pfad)
        z.lokal.delete(e.pfad)
        z.lokal.set(pfad, { ...d, pfad })
        if (e.nurLokal) Object.assign(e, ausLokal({ ...d, pfad }))
        else {
            try { Object.assign(e, ausSteckbrief(await daten.steckbriefAendern(e.id, { name: pfad, pfad }))) }
            catch (fehler) {
                // Datei ist schon umbenannt – Steckbrief wird beim nächsten Laden abgeglichen
                console.warn("Steckbrief:", fehler)
                Object.assign(e, { name: pfad, pfad })
            }
        }
        z.gewaehlt = e.id
        listeZeichnen(); detailZeichnen()
        melden("Umbenannt")
    },
    async loeschen(e) {
        if (!(await bestaetigen({ titel: "Datei löschen?", text: `„${e.name}“ wird von diesem Gerät gelöscht. Das lässt sich nicht rückgängig machen.`, ja: "Löschen", gefahr: true }))) return
        try { await z.speicher.loeschen(e.pfad) } catch (fehler) { return melden(`Löschen ging nicht: ${fehler.message}`) }
        z.lokal.delete(e.pfad)
        if (!e.nurLokal) await daten.steckbriefLoeschen(e.id).catch((f) => console.warn(f))
        z.liste = z.liste.filter((x) => x !== e)
        waehlen(null); listeZeichnen(); hinweiseZeichnen()
        melden("Gelöscht")
    },
    async entfernen(e) {
        if (!(await bestaetigen({ titel: "Aus der Liste entfernen?", text: "Nur der Steckbrief verschwindet. Liegt die Datei noch auf dem anderen Gerät, taucht sie dort beim nächsten Öffnen von Harz wieder auf.", ja: "Entfernen" }))) return
        await daten.steckbriefLoeschen(e.id)
        z.liste = z.liste.filter((x) => x !== e)
        waehlen(null); listeZeichnen()
    },
}

// ---------- Speicher & Gerät ----------
async function schuetzen() {
    const ok = await speicherSchuetzen()
    melden(ok ? "Speicher ist jetzt geschützt" : "Der Browser hat das abgelehnt – als installierte App klappt es meist.")
    hinweiseZeichnen()
}

async function ordnerZugriff() {
    const ok = await z.speicher.bereit({ fragen: true }).catch(() => false)
    if (ok) await laden()
    else melden("Ohne Zugriff kann Harz den Ordner nicht öffnen.")
    return ok
}

// Alle lokalen Dateien von einem Speicher in einen anderen bringen
async function umziehen(alt, neu) {
    const belegt = new Set((await neu.liste()).map((d) => d.pfad))
    const meine = new Map(z.liste.filter((e) => e.hier && !e.nurLokal).map((e) => [e.pfad, e]))
    const alle = [...z.lokal.keys()]
    let n = 0, fehler = 0
    for (const pfad of alle) {
        melden(`Ziehe um … ${n + fehler + 1} von ${alle.length}`, { bleiben: true })
        const ziel = freierName(pfad, belegt)
        // Klappt eine Datei nicht, bleibt sie im alten Speicher – die anderen ziehen trotzdem um
        // (vorher brach der ganze Umzug ab und der Speicher wurde nicht gewechselt)
        try {
            await neu.schreiben(ziel, await alt.lesen(pfad))
        } catch (f) { console.warn("Umzug:", pfad, f); fehler++; continue }
        belegt.add(ziel)
        await alt.loeschen(pfad).catch((f) => console.warn(f))
        n++
        const e = meine.get(pfad)
        if (e) await daten.steckbriefAendern(e.id, { speicher: neu.id, pfad: ziel, name: ziel }).catch((f) => console.warn(f))
    }
    melden(fehler ? `${n} Dateien umgezogen, ${fehler} blieben im alten Speicher` : n ? `${n} Dateien umgezogen` : "Speicher gewechselt")
}

async function speicherWechseln(neuId) {
    const neu = speicherVon(neuId)
    if (!neu || neu === z.speicher) return
    if (neu.id === "ordner" && !(await neu.ordnerName())) {
        try { await neu.ordnerWaehlen() } catch { return false }
    }
    if (!(await neu.bereit({ fragen: true }).catch(() => false))) { melden("Ohne Zugriff geht das nicht."); return false }
    if (z.lokal.size && z.bereit) {
        const mit = await bestaetigen({ titel: "Dateien mitnehmen?", text: `Auf diesem Gerät liegen ${z.lokal.size} Dateien im Speicher „${z.speicher.name}“. Sollen sie nach „${neu.name}“ umziehen?`, ja: "Mitnehmen", nein: "Nein, dort lassen" })
        if (mit) await umziehen(z.speicher, neu)
    }
    await speicherWaehlen(neu.id)
    await laden()
    return true
}

async function einstellungen() {
    const stand = await speicherStand()
    const ordnerName = await speicherVon("ordner").ordnerName()
    const andere = [...z.geraete.values()].filter((g) => g.id !== z.geraet.id)
    const d = document.createElement("dialog")
    d.className = "g-dialog hz-einst"
    d.innerHTML = `
      <form method="dialog">
        <h2>Speicher &amp; Gerät</h2>
        <section>
          <h3>Dieses Gerät</h3>
          <div class="hz-einst__zeile">
            <input class="g-dialog__feld" type="text" value="${esc(z.geraet.name)}" data-geraetname aria-label="Gerätename">
            <button class="g-knopf-leise" type="button" data-umbenennen>Speichern</button>
          </div>
          <p class="hz-einst__klein">So heißt dieses Gerät auf deinen anderen Geräten („liegt auf …“).</p>
        </section>
        <section>
          <h3>Wo Harz hier speichert</h3>
          ${SPEICHER.map((s) => `
            <label class="hz-wahl${s.moeglich() ? "" : " is-aus"}">
              <input type="radio" name="speicher" value="${s.id}" ${s === z.speicher ? "checked" : ""} ${s.moeglich() ? "" : "disabled"}>
              <span><strong>${esc(s.name)}</strong><span>${esc(s.beschreibung)}${s.moeglich() ? "" : " – geht in diesem Browser nicht."}</span>
              ${s.id === "ordner" && s.moeglich() ? `<span class="hz-wahl__ordner">${ordnerName ? `Ordner: <b>${esc(ordnerName)}</b> · ` : ""}<button class="g-knopf-text" type="button" data-ordner>${ordnerName ? "Anderen Ordner wählen" : "Ordner wählen"}</button></span>` : ""}</span>
            </label>`).join("")}
        </section>
        <section>
          <h3>Platz</h3>
          <p class="hz-einst__klein">${stand.belegt != null ? `Grove belegt hier ${groesseText(stand.belegt)}${stand.gesamt ? ` von etwa ${groesseText(stand.gesamt)} möglichen` : ""}.` : "Der Browser verrät den Platz nicht."}
          ${stand.geschuetzt ? "Der Speicher ist geschützt." : `Noch nicht geschützt. <button class="g-knopf-text" type="button" data-schuetzen>Jetzt schützen</button>`}</p>
        </section>
        ${andere.length ? `<section><h3>Deine anderen Geräte</h3><ul class="hz-geraete">${andere.map((g) => `<li>${SYMBOLE.geraet}<span>${esc(g.name)}</span><small>zuletzt ${datum(g.zuletzt_gesehen)}</small></li>`).join("")}</ul></section>` : ""}
        <div class="g-dialog__knoepfe"><button class="g-knopf" value="ok" type="submit">Fertig</button></div>
      </form>`
    document.body.append(d)
    d.addEventListener("close", () => d.remove())
    d.querySelector("[data-umbenennen]").addEventListener("click", async () => {
        try { z.geraet = await geraetUmbenennen(d.querySelector("[data-geraetname]").value); melden("Gerätename gespeichert") }
        catch { melden("Speichern ging nicht (offline?)") }
    })
    d.querySelector("[data-schuetzen]")?.addEventListener("click", async () => { d.close(); await schuetzen() })
    d.querySelector("[data-ordner]")?.addEventListener("click", async (ev) => {
        ev.preventDefault()
        const ordner = speicherVon("ordner")
        try { await ordner.ordnerWaehlen() } catch { return }
        d.close()
        if (z.speicher === ordner) await laden()
        else await speicherWechseln("ordner")
    })
    d.querySelectorAll('input[name="speicher"]').forEach((r) => r.addEventListener("change", async () => {
        d.close()
        await speicherWechseln(r.value)
    }))
    d.showModal()
}

// ---------- Ereignisse ----------
seite.querySelector("[data-datei-wahl]").addEventListener("change", (ev) => { hochladen(ev.target.files); ev.target.value = "" })
seite.querySelector("[data-einstellungen]").addEventListener("click", einstellungen)
seite.querySelector("[data-suchfeld]").addEventListener("input", (ev) => { z.suche = ev.target.value.trim(); listeZeichnen() })
seite.querySelectorAll("[data-filter]").forEach((k) => k.addEventListener("click", () => {
    z.filter = k.dataset.filter
    seite.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b === k))
    listeZeichnen()
}))
seite.querySelector("[data-liste]").addEventListener("click", (ev) => {
    const zeile = ev.target.closest(".hz-zeile")
    if (zeile) waehlen(zeile.dataset.id === z.gewaehlt ? null : zeile.dataset.id)
})

// Dateien hereinziehen (ganze Seite)
let ziehTiefe = 0
const hatDateien = (ev) => [...(ev.dataTransfer?.types || [])].includes("Files")
addEventListener("dragenter", (ev) => { if (!hatDateien(ev)) return; ev.preventDefault(); ziehTiefe++; el("[data-ablegen]").hidden = false })
addEventListener("dragover", (ev) => { if (hatDateien(ev)) ev.preventDefault() })
addEventListener("dragleave", () => { if (--ziehTiefe <= 0) { ziehTiefe = 0; el("[data-ablegen]").hidden = true } })
addEventListener("drop", (ev) => {
    if (!hatDateien(ev)) return
    ev.preventDefault()
    ziehTiefe = 0
    el("[data-ablegen]").hidden = true
    hochladen(ev.dataTransfer.files)
})

// Zurück in Grove (z. B. nach dem Explorer): neu einlesen; online wieder: abgleichen
let letztesLaden = 0
function neuLaden() { if (Date.now() - letztesLaden > 3000) { letztesLaden = Date.now(); laden() } }
document.addEventListener("visibilitychange", () => { if (!document.hidden) neuLaden() })
addEventListener("grove-netz", (ev) => { if (ev.detail.online) laden() })

laden()
