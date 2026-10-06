// ==========================================================
// Grove Mail · Daten
// Alles, was mit Supabase redet. Die Seite (seiten/mail.js)
// ruft nur diese Funktionen auf – kein SQL, kein Supabase dort.
// ==========================================================
import { supabase } from "../kern/supabase.js"

const LISTEN_SPALTEN = "id, von_name, von_adresse, betreff, vorschau, gelesen, markiert, datum, anhaenge, ordner"

export async function ladeListe(ordner, suche = "") {
    let abfrage = supabase.from("mails").select(LISTEN_SPALTEN)
        .eq("ordner", ordner)
        .order("datum", { ascending: false })
        .limit(200)

    const s = suche.replace(/[,()%*\\]/g, " ").trim()
    if (s) {
        const muster = `%${s}%`
        abfrage = abfrage.or(
            `betreff.ilike.${muster},von_name.ilike.${muster},von_adresse.ilike.${muster},vorschau.ilike.${muster}`
        )
    }
    const { data, error } = await abfrage
    if (error) throw error
    return data
}

export async function ladeMail(id) {
    const { data, error } = await supabase.from("mails").select("*").eq("id", id).single()
    if (error) throw error
    return data
}

export async function zaehleUngelesen() {
    const { count, error } = await supabase.from("mails")
        .select("id", { count: "exact", head: true })
        .eq("ordner", "eingang").eq("gelesen", false)
    if (error) throw error
    return count ?? 0
}

export async function aendere(id, felder) {
    const { error } = await supabase.from("mails").update(felder).eq("id", id)
    if (error) throw error
}

export async function loescheEndgueltig(id, rohPfad) {
    const { error } = await supabase.from("mails").delete().eq("id", id)
    if (error) throw error
    // Original-Datei darf nur der Server löschen – bleibt bis zur Aufräum-Funktion liegen.
}

// Original-Mail (.eml) laden und zerlegen – für Anhänge und sehr große Mails
export async function ladeOriginal(rohPfad) {
    const { data, error } = await supabase.storage.from("mail").download(rohPfad)
    if (error) throw error
    const { default: PostalMime } = await import("postal-mime")
    return PostalMime.parse(await data.arrayBuffer())
}

// Live: neue/geänderte Mails dieses Nutzers
export function beobachte(userId, beiAenderung) {
    return supabase.channel(`mails-${userId}`)
        .on("postgres_changes",
            { event: "*", schema: "public", table: "mails", filter: `user_id=eq.${userId}` },
            beiAenderung)
        .subscribe()
}
