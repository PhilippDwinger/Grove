// ==========================================================
// Grove Mail · Anmeldung im Grove-Register
// Damit findet die Suche (Strg+K) Mails, und "Verknüpfen"
// kann Mails mit Notizen, Passwörtern usw. verbinden.
// ==========================================================
import { supabase } from "../kern/supabase.js"
import { dienstRegistrieren } from "../kern/register.js"
import { ORDNER } from "./konfig.js"

const alsTreffer = (m) => ({
    id: m.id,
    titel: m.betreff || "(kein Betreff)",
    untertitel: `${m.von_name || m.von_adresse || "Unbekannt"} · ${ORDNER[m.ordner] || m.ordner}`,
})

dienstRegistrieren({
    typ: "mail",
    name: "Grove Mail",
    url: (id) => `/dienste/mail/?mail=${encodeURIComponent(id)}`,

    // Leerer Text = neueste Mails
    suchen: async (text) => {
        let abfrage = supabase.from("mails").select("id, betreff, von_name, von_adresse, ordner")
            .neq("ordner", "papierkorb")
            .order("datum", { ascending: false })
            .limit(8)
        const s = text.replace(/[,()%*\\]/g, " ").trim()
        if (s) {
            const m = `%${s}%`
            abfrage = abfrage.or(`betreff.ilike.${m},von_name.ilike.${m},von_adresse.ilike.${m},vorschau.ilike.${m}`)
        }
        const { data, error } = await abfrage
        if (error) throw error
        return data.map(alsTreffer)
    },

    holen: async (id) => {
        const { data, error } = await supabase.from("mails")
            .select("id, betreff, von_name, von_adresse, ordner").eq("id", id).maybeSingle()
        if (error) throw error
        return data ? alsTreffer(data) : null
    },
})
