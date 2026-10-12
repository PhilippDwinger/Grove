// ==========================================================
// Harz · Steckbriefe in Supabase (Tabelle harz_dateien, 008_harz_geraete.sql)
// NUR Name, Größe, Typ, Gerät – nie der Inhalt einer Datei.
// ==========================================================
import { supabase } from "../kern/supabase.js"

const TABELLE = "harz_dateien"
const FELDER = "id, name, pfad, groesse, typ, speicher, geraet_id, erstellt_am, geaendert_am"

export async function alleSteckbriefe() {
    const { data, error } = await supabase.from(TABELLE).select(FELDER).order("geaendert_am", { ascending: false })
    if (error) throw error
    return data
}

export async function steckbrief(id) {
    const { data, error } = await supabase.from(TABELLE).select(FELDER).eq("id", id).maybeSingle()
    if (error) throw error
    return data
}

export async function steckbriefAnlegen(felder) {
    const { data, error } = await supabase.from(TABELLE).insert(felder).select(FELDER).single()
    if (error) throw error
    return data
}

export async function steckbriefAendern(id, felder) {
    const { data, error } = await supabase.from(TABELLE)
        .update({ ...felder, geaendert_am: new Date().toISOString() }).eq("id", id).select(FELDER).single()
    if (error) throw error
    return data
}

// Verbindungen ("Verbunden mit") räumt ein Trigger in der Datenbank mit auf.
export async function steckbriefLoeschen(id) {
    const { error } = await supabase.from(TABELLE).delete().eq("id", id)
    if (error) throw error
}

export async function steckbriefeSuchen(text, anzahl = 8) {
    let q = supabase.from(TABELLE).select(FELDER).order("geaendert_am", { ascending: false }).limit(anzahl)
    if (text) q = q.ilike("name", `%${text.replace(/[%_]/g, (z) => "\\" + z)}%`)
    const { data, error } = await q
    if (error) throw error
    return data
}
