// ==========================================================
// Grove · Fotos für den Saat-Kurs „Bäume“ holen
//   node werkzeug/baumbilder.mjs          fehlende Fotos laden
//   node werkzeug/baumbilder.mjs --neu    alle neu laden
//   node werkzeug/baumbilder.mjs --fotos  Zeichnungen/Bildtafeln durch echte Fotos ersetzen
//
// Der Kurs fragt „Welcher Baum ist das?“ – darum nur FOTOS, keine Bildtafeln (die tragen oft den Namen im Bild).
// Reihenfolge: WAHL → Artikelbild de.wikipedia → Wikidata-Bild der Art (P18) → Artikelbild en.wikipedia → Commons-Suche.
//
// Quelle: Hauptbild des Wikipedia-Artikels (erst deutscher Name, dann botanischer Name, dann en.wikipedia),
// Datei + Urheber + Lizenz über die Wikimedia-API. Nur freie Lizenzen (CC, Public Domain).
// Ergebnis: src/js/saat/kurse/baeume/<id>.jpg (~500 px breit) + src/js/saat/kurse/baeume-bilder.js
// Danach in kurse.js / baeume.js die Kurs-Version erhöhen, damit Nutzer „Aktualisieren“ sehen.
//
// Unpassendes Foto? Unten in WAHL die gewünschte Commons-Datei eintragen und mit --neu (oder Datei löschen) neu laden.
// ==========================================================
import { mkdir, writeFile, access } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { KURS } from "../src/js/saat/kurse/baeume.js"
import { BILDER as ALT } from "../src/js/saat/kurse/baeume-bilder.js"

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..")
const ORDNER = join(WURZEL, "src/js/saat/kurse/baeume")
const LISTE = join(WURZEL, "src/js/saat/kurse/baeume-bilder.js")
const BREITE = 500
const KOPF = { "User-Agent": "GroveSaat/1.0 (https://github.com/PhilippDwinger/Grove; Lernkurs Baeume)" }
const NEU = process.argv.includes("--neu")
const NUR_FOTOS = process.argv.includes("--fotos")

// Dateinamen, die nach Zeichnung, Bildtafel, Karte oder Herbarbeleg klingen
const KEIN_FOTO = /k(ö|oe|o)hler|thom[eé]|sturm|lindman|nordens|hempel|medizinal|illustrat|zeichnung|drawing|painting|tafel|plate|flora|herbar|specimen|karte|(^|[^a-z])(map|range)([^a-z]|$)|verbreitung|distribution|areal|\.svg$|\.png$|\.tiff?$|\.gif$/i
const MALER = /painter|illustrat|k(ö|oe|o)hler|sturm|thom[eé]|lindman|engraver|lithograph/i
const istFoto = (datei, autor = "") => !!datei && !KEIN_FOTO.test(datei) && !MALER.test(autor)

// Feste Bildwahl je Baum (Commons-Dateiname ohne „File:“), wenn das Artikelbild nicht passt
const WAHL = {
    // stieleiche: "Quercus robur.jpg",
}
// Gesperrte Dateien je Baum (z. B. Name steht sichtbar im Bild) – werden mit --fotos ersetzt
const NICHT = {
    omorika: ["Picea_omorika_twigs_and_cones.JPG"],     // Etikett „Picea omorika“ im Bild
}
const gesperrt = (id, datei) => (NICHT[id] || []).includes(datei)

const warte = (ms) => new Promise((r) => setTimeout(r, ms))
async function json(url) {
    for (let versuch = 0; versuch < 4; versuch++) {
        const a = await fetch(url, { headers: KOPF })
        if (a.status === 429 || a.status >= 500) { await warte(1500 * (versuch + 1)); continue }
        if (!a.ok) throw new Error(`${a.status} bei ${url}`)
        return a.json()
    }
    throw new Error(`zu viele Versuche: ${url}`)
}
const api = (wiki, params) => json(`https://${wiki}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params }))

async function artikel(wiki, titel) {
    const r = await api(wiki, { action: "query", titles: titel, redirects: "1", prop: "pageimages|pageprops", piprop: "name", ppprop: "wikibase_item" })
    const seite = r.query?.pages?.[0]
    return seite && !seite.missing ? { bild: seite.pageimage || null, wikidata: seite.pageprops?.wikibase_item || null } : null
}
async function wikidataBilder(q) {
    if (!q) return []
    const r = await api("www.wikidata.org", { action: "wbgetclaims", entity: q, property: "P18" })
    return (r.claims?.P18 || []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean).map((n) => n.replace(/ /g, "_"))
}
async function commonsSuche(botanisch) {
    const r = await api("commons.wikimedia.org", { action: "query", list: "search", srnamespace: "6", srlimit: "15", srsearch: `"${botanisch}" tree filetype:bitmap` })
    return (r.query?.search || []).map((x) => x.title.replace(/^File:/, "").replace(/ /g, "_"))
}
// Kandidaten der Reihe nach; erste echte Foto-Datei gewinnt
async function kandidaten(id, name, botanisch) {
    const liste = []
    if (WAHL[id]) liste.push(WAHL[id])
    const de = (await artikel("de.wikipedia.org", name)) || (await artikel("de.wikipedia.org", botanisch))
    if (de?.bild) liste.push(de.bild)
    liste.push(...(await wikidataBilder(de?.wikidata)))
    const en = await artikel("en.wikipedia.org", botanisch)
    if (en?.bild) liste.push(en.bild)
    if (!de?.wikidata) liste.push(...(await wikidataBilder(en?.wikidata)))
    liste.push(...(await commonsSuche(botanisch).catch(() => [])))
    return [...new Set(liste)]
}

const ohneHtml = (t = "") => t.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()

async function bildinfo(datei) {
    const r = await api("commons.wikimedia.org", { action: "query", titles: `File:${datei}`, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: String(BREITE) })
    const info = r.query?.pages?.[0]?.imageinfo?.[0]
    if (!info) return null
    const m = info.extmetadata || {}
    const lizenz = ohneHtml(m.LicenseShortName?.value || "")
    return {
        url: info.thumburl || info.url,
        autor: ohneHtml(m.Artist?.value || "unbekannt").slice(0, 80) || "unbekannt",
        lizenz,
        frei: /^(cc|public domain|pd)|gfdl/i.test(lizenz),
        quelle: info.descriptionurl,
    }
}

const gibt = (p) => access(p).then(() => true, () => false)

await mkdir(ORDNER, { recursive: true })
const bilder = { ...ALT }
let neu = 0, fehlt = []
for (const karte of KURS.karten) {
    const id = karte.id.replace(/^baum-/, "")
    const ziel = join(ORDNER, `${id}.jpg`)
    if (!NEU && bilder[id] && (await gibt(ziel)) && !(NUR_FOTOS && (!istFoto(bilder[id].datei, bilder[id].autor) || gesperrt(id, bilder[id].datei)))) continue
    const name = karte.antwort, botanisch = karte.alternativen[0]
    try {
        let datei = null, info = null
        for (const kandidat of await kandidaten(id, name, botanisch)) {
            if (kandidat !== WAHL[id] && (!istFoto(kandidat) || gesperrt(id, kandidat))) continue
            const i = await bildinfo(kandidat).catch(() => null)
            if (i?.frei && (kandidat === WAHL[id] || istFoto(kandidat, i.autor))) { datei = kandidat; info = i; break }
        }
        if (!info) { fehlt.push(`${name}: kein freies Foto gefunden`); continue }
        const a = await fetch(info.url, { headers: KOPF })
        if (!a.ok) { fehlt.push(`${name}: Download ${a.status}`); continue }
        await writeFile(ziel, Buffer.from(await a.arrayBuffer()))
        bilder[id] = { datei, autor: info.autor, lizenz: info.lizenz, quelle: info.quelle }
        neu++
        console.log(`✓ ${name.padEnd(30)} ${datei}`)
        await warte(250)                       // freundlich zu den Wikimedia-Servern
    } catch (f) {
        fehlt.push(`${name}: ${f.message}`)
    }
}

const sortiert = Object.fromEntries(KURS.karten.map((k) => k.id.replace(/^baum-/, "")).filter((id) => bilder[id]).map((id) => [id, bilder[id]]))
await writeFile(LISTE, `// AUTOMATISCH erzeugt von werkzeug/baumbilder.mjs – nicht von Hand bearbeiten.
// Fotos: Wikimedia Commons (freie Lizenzen). Datei: kurse/baeume/<id>.jpg
export const BILDER = ${JSON.stringify(sortiert, null, 4)}
`)
console.log(`\n${neu} Fotos neu, ${Object.keys(sortiert).length} von ${KURS.karten.length} vorhanden.`)
if (fehlt.length) console.log("Ohne Foto:\n  " + fehlt.join("\n  "))
