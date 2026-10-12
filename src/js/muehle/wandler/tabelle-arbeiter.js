// ==========================================================
// Mühle · Tabellen – läuft in einem eigenen Web Worker (abgeschotteter Hintergrund-Prozess)
//
// Warum? SheetJS („xlsx“ 0.18.5 von npm) hat zwei bekannte Schwächen bei präparierten
// Dateien (Prototype Pollution, ReDoS). Im Worker hat SheetJS seinen eigenen Speicher:
// Eine böse Datei kommt weder an Grove noch an die Anmeldung heran, und hängt sie,
// beendet tabelle.js den Worker nach einer Minute einfach.
//
// Nachricht rein:  { aufgabe: "analysieren" | "umwandeln", datei, ziel, optionen }
// Antwort raus:    { info } | { ergebnisse: [{ name, daten, mime }] } | { fehler }
// ==========================================================
import * as XLSX from "xlsx"
import { neuerName, endung, alsText } from "../hilfen.js"

// CSV: Trennzeichen raten (deutsches Excel nimmt ;)
function trennzeichenRaten(text) {
    const zeile = text.split(/\r?\n/).find((z) => z.trim()) || ""
    const zaehl = (z) => zeile.split(z).length - 1
    return [";", "\t", ","].sort((a, b) => zaehl(b) - zaehl(a))[0]
}

async function jsonListe(datei) {
    const daten = JSON.parse(await alsText(datei))
    if (Array.isArray(daten)) return daten
    const erste = Object.values(daten ?? {})[0]
    return Array.isArray(erste) ? erste : null
}

async function mappeLesen(datei) {
    const e = endung(datei.name)
    if (e === ".json") {
        const liste = await jsonListe(datei)
        if (!liste) throw new Error("Das JSON ist keine Liste von Einträgen.")
        const mappe = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(mappe, XLSX.utils.json_to_sheet(liste.map((z) => (typeof z === "object" && z ? z : { wert: z }))), "Tabelle")
        return mappe
    }
    if (e === ".csv" || e === ".tsv") {
        const text = await alsText(datei)
        return XLSX.read(text, { type: "string", FS: e === ".tsv" ? "\t" : trennzeichenRaten(text), raw: true })
    }
    return XLSX.read(new Uint8Array(await datei.arrayBuffer()), { type: "array", cellDates: true })
}

// Eigene CSV-Ausgabe: Anführungszeichen nur wo nötig, Zahlen auf Wunsch mit Komma
function csv(zeilen, trenner, zahlen) {
    const zelle = (w) => {
        const t = typeof w === "number" ? (zahlen === "de" ? String(w).replace(".", ",") : String(w))
            : w instanceof Date ? w.toLocaleDateString(zahlen === "de" ? "de-DE" : "en-CA") : String(w ?? "")
        return /["\n\r]/.test(t) || t.includes(trenner) ? `"${t.replace(/"/g, '""')}"` : t
    }
    return zeilen.map((z) => z.map(zelle).join(trenner)).join("\r\n") + "\r\n"
}

async function analysieren(datei) {
    if (endung(datei.name) === ".json") {
        try { if (!(await jsonListe(datei))) return { unpassend: true } } catch { return { unpassend: true } }
    }
    return { blaetter: (await mappeLesen(datei)).SheetNames }
}

async function umwandeln(datei, ziel, o) {
    const mappe = await mappeLesen(datei)
    const name = neuerName(datei.name, ziel.endung)
    if (ziel.id === "xlsx" || ziel.id === "ods") {
        const mime = ziel.id === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/vnd.oasis.opendocument.spreadsheet"
        return [{ name, daten: XLSX.write(mappe, { type: "array", bookType: ziel.id }), mime }]
    }
    const blatt = mappe.Sheets[o.blatt && mappe.Sheets[o.blatt] ? o.blatt : mappe.SheetNames[0]]
    if (ziel.id === "csv") {
        const zeilen = XLSX.utils.sheet_to_json(blatt, { header: 1, defval: "", blankrows: false, raw: true })
        // BOM vorne: damit Excel Umlaute richtig zeigt
        return [{ name, daten: "﻿" + csv(zeilen, o.trenner || ";", o.zahlen || "de"), mime: "text/csv" }]
    }
    if (ziel.id === "json") {
        const liste = XLSX.utils.sheet_to_json(blatt, { defval: "" })
        return [{ name, daten: JSON.stringify(liste, null, o.einrueckung ? 2 : 0) + "\n", mime: "application/json" }]
    }
    if (ziel.id === "md") {
        const zeilen = XLSX.utils.sheet_to_json(blatt, { header: 1, defval: "", blankrows: false }).map((z) => z.map((w) => String(w ?? "")))
        const breite = Math.max(...zeilen.map((z) => z.length), 1)
        const zelle = (w) => w.replace(/\|/g, "\\|").replace(/\n/g, " ")
        const reihe = (z) => `| ${Array.from({ length: breite }, (_, i) => zelle(z[i] ?? "")).join(" | ")} |`
        const [kopf = [], ...rest] = zeilen
        return [{ name, daten: [reihe(kopf), `|${" --- |".repeat(breite)}`, ...rest.map(reihe)].join("\n") + "\n", mime: "text/markdown" }]
    }
    return [{ name, daten: XLSX.utils.sheet_to_html(blatt), mime: "text/html" }]
}

self.onmessage = async ({ data }) => {
    try {
        if (data.aufgabe === "analysieren") self.postMessage({ info: await analysieren(data.datei) })
        else self.postMessage({ ergebnisse: await umwandeln(data.datei, data.ziel, data.optionen) })
    } catch (f) {
        self.postMessage({ fehler: f?.message || String(f) })
    }
}
