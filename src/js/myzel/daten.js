// ==========================================================
// Myzel · Daten (Supabase)
// ==========================================================
import { supabase } from "../kern/supabase.js"

const SPALTEN = "id, titel, inhalt, tags, archiviert, erstellt_am, geaendert_am"

export async function ladeAlle() {
    const { data, error } = await supabase.from("notizen").select(SPALTEN)
        .eq("archiviert", false).order("geaendert_am", { ascending: false }).limit(2000)
    if (error) throw error
    return data
}

export async function ladeLinks() {
    const { data, error } = await supabase.from("verknuepfungen").select("id, von_id, nach_id")
        .eq("von_dienst", "myzel").eq("nach_dienst", "myzel")
    if (error) throw error
    return data
}

export async function neu(felder = {}) {
    const { data, error } = await supabase.from("notizen").insert({ titel: "", inhalt: "", ...felder })
        .select(SPALTEN).single()
    if (error) throw error
    return data
}

export async function speichere(id, felder) {
    const { data, error } = await supabase.from("notizen").update(felder).eq("id", id)
        .select(SPALTEN).single()
    if (error) throw error
    return data
}

export async function loesche(id) {
    const { error } = await supabase.from("notizen").delete().eq("id", id)
    if (error) throw error
}

// Volltextsuche: "baum wal" findet "Bäume" und "Waldrand" (Wortanfänge, deutsch)
export async function suche(text) {
    const woerter = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
    if (!woerter.length) return null
    const anfrage = woerter.map((w) => `${w}:*`).join(" & ")
    const { data, error } = await supabase.from("notizen").select("id")
        .eq("archiviert", false)
        .textSearch("suche", anfrage, { config: "german" })
        .limit(200)
    if (error) throw error
    return new Set(data.map((d) => d.id))
}

// Verknüpfungen einer Notiz auf den gewünschten Stand bringen
export async function setzeLinks(vonId, zielIds, bisher) {
    const soll = new Set(zielIds)
    const weg = bisher.filter((l) => l.von_id === vonId && !soll.has(l.nach_id))
    const vorhanden = new Set(bisher.filter((l) => l.von_id === vonId).map((l) => l.nach_id))
    const dazu = [...soll].filter((id) => !vorhanden.has(id))

    if (weg.length) {
        const { error } = await supabase.from("verknuepfungen").delete().in("id", weg.map((l) => l.id))
        if (error) throw error
    }
    let neue = []
    if (dazu.length) {
        const { data, error } = await supabase.from("verknuepfungen")
            .upsert(dazu.map((nach) => ({ von_dienst: "myzel", von_id: vonId, nach_dienst: "myzel", nach_id: nach })),
                { onConflict: "user_id,von_dienst,von_id,nach_dienst,nach_id,art", ignoreDuplicates: true })
            .select("id, von_id, nach_id")
        if (error) throw error
        neue = data
    }
    return bisher.filter((l) => !weg.includes(l)).concat(neue)
}

export function beobachte(userId, beiAenderung) {
    return supabase.channel(`notizen-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notizen", filter: `user_id=eq.${userId}` }, beiAenderung)
        .subscribe()
}
