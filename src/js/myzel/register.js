// ==========================================================
// Myzel · Anmeldung im Grove-Register
// Damit findet die Suche (Strg+K) Notizen, und "Verknüpfen"
// kann Notizen mit Dingen aus anderen Diensten verbinden.
// ==========================================================
import { supabase } from "../kern/supabase.js"
import { dienstRegistrieren } from "../kern/register.js"

const alsTreffer = (n) => ({
    id: n.id,
    titel: n.titel || "Ohne Titel",
    untertitel: n.tags?.length ? n.tags.map((t) => `#${t}`).join(" ") : "Notiz",
})

dienstRegistrieren({
    typ: "myzel",
    name: "Myzel",
    url: (id) => `/dienste/myzel/#${id}`,

    // Leerer Text = zuletzt geänderte Notizen
    suchen: async (text) => {
        let abfrage = supabase.from("notizen").select("id, titel, tags")
            .eq("archiviert", false)
            .order("geaendert_am", { ascending: false })
            .limit(8)
        const s = text.replace(/[,()%*\\]/g, " ").trim()   // Zeichen, die den Filter stören würden
        if (s) abfrage = abfrage.or(`titel.ilike.%${s}%,inhalt.ilike.%${s}%`)
        const { data, error } = await abfrage
        if (error) throw error
        return data.map(alsTreffer)
    },

    holen: async (id) => {
        const { data, error } = await supabase.from("notizen").select("id, titel, tags").eq("id", id).maybeSingle()
        if (error) throw error
        return data ? alsTreffer(data) : null
    },
})
