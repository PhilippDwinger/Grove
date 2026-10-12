// ==========================================================
// Mühle · Quellen & Ziele in Grove
//   Rein:  Dateien aus Harz (dieses Gerät), Notizen aus Myzel (als .md)
//   Raus:  Ergebnis in Harz ablegen – und automatisch mit dem Original verbinden
// Jede Datei, die aus Grove kommt, trägt datei.quelle = { typ, id } mit sich.
// ==========================================================
import { supabase } from "../kern/supabase.js"
import { diesesGeraet } from "../kern/geraet.js"
import { verknuepfen } from "../kern/verbindungen.js"
import { aktiverSpeicher, speicherVon, freierName, sichererName } from "../harz/speicher.js"
import * as harz from "../harz/daten.js"

const mitQuelle = (datei, quelle) => { datei.quelle = quelle; return datei }

// ---------- Harz ----------
// Alle Dateien, die HIER liegen (aktiver Speicher), mit Steckbrief-ID, falls vorhanden
export async function harzListe() {
    const sp = await aktiverSpeicher()
    if (!(await sp.bereit().catch(() => false))) return { speicher: sp, dateien: [], zugriff: false }
    const lokal = await sp.liste()
    let steck = []
    try {
        const g = await diesesGeraet()
        steck = (await harz.alleSteckbriefe()).filter((s) => s.geraet_id === g.id && s.speicher === sp.id)
    } catch { /* offline: ohne IDs */ }
    const ids = new Map(steck.map((s) => [s.pfad, s.id]))
    return { speicher: sp, zugriff: true, dateien: lokal.map((d) => ({ ...d, name: d.pfad, id: ids.get(d.pfad) ?? null })).sort((a, b) => b.geaendert - a.geaendert) }
}

export async function ausHarz({ id = null, pfad = null }) {
    let speicher = await aktiverSpeicher()
    if (id) {
        const s = await harz.steckbrief(id)
        if (!s) throw new Error("Die Datei gibt es in Harz nicht mehr.")
        if (s.geraet_id !== (await diesesGeraet()).id) throw new Error(`„${s.name}“ liegt auf einem anderen Gerät – öffne die Mühle dort.`)
        speicher = speicherVon(s.speicher) || speicher
        pfad = s.pfad
    }
    if (!(await speicher.bereit({ fragen: true }).catch(() => false))) throw new Error("Kein Zugriff auf den Harz-Speicher.")
    const f = await speicher.lesen(pfad)
    return mitQuelle(new File([f], pfad, { type: f.type, lastModified: f.lastModified }), id ? { typ: "harz", id } : null)
}

export async function inHarzAblegen(name, blob, quelle = null) {
    const sp = await aktiverSpeicher()
    if (!(await sp.bereit({ fragen: true }).catch(() => false))) throw new Error("Kein Zugriff auf den Harz-Speicher.")
    const pfad = freierName(sichererName(name), new Set((await sp.liste()).map((d) => d.pfad)))
    await sp.schreiben(pfad, blob)
    let id = null
    try {
        const g = await diesesGeraet()
        id = (await harz.steckbriefAnlegen({ name: pfad, pfad, groesse: blob.size, typ: blob.type || null, speicher: sp.id, geraet_id: g.id })).id
        if (quelle?.id) await verknuepfen({ typ: "harz", id }, quelle).catch(() => {})
    } catch { /* offline: Steckbrief folgt beim nächsten Öffnen von Harz */ }
    return { pfad, id }
}

// ---------- Myzel ----------
export async function notizenListe(text = "") {
    let q = supabase.from("notizen").select("id, titel, geaendert_am").eq("archiviert", false).order("geaendert_am", { ascending: false }).limit(40)
    if (text) q = q.ilike("titel", `%${text.replace(/[%_]/g, (z) => "\\" + z)}%`)
    const { data, error } = await q
    if (error) throw error
    return data
}

export async function ausMyzel(id) {
    const { data, error } = await supabase.from("notizen").select("id, titel, inhalt").eq("id", id).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Die Notiz gibt es nicht mehr.")
    const name = `${sichererName(data.titel || "Notiz")}.md`
    return mitQuelle(new File([data.inhalt || ""], name, { type: "text/markdown" }), { typ: "myzel", id })
}
