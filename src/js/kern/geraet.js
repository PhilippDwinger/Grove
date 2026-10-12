// ==========================================================
// Grove-Kern: Dieses Gerät
// Jeder Browser / jede installierte Grove-App bekommt beim ersten Start eine
// zufällige Kennung + einen Namen ("Windows-PC", änderbar z. B. in "Laptop").
// Die Kennung bleibt lokal gespeichert; in Supabase (Tabelle geraete) steht
// nur Kennung + Name, damit andere Geräte "liegt auf deinem Laptop" anzeigen können.
// Bridge kann später genau diese Liste nutzen.
//
//   const g = await diesesGeraet()        // { id, name }
//   await geraetMelden()                  // "bin da" (zuletzt_gesehen)
//   await geraetUmbenennen("Laptop")
//   await geraeteListe()                  // alle deine Geräte aus Supabase
// ==========================================================
import { supabase } from "./supabase.js"
import { idb } from "./idb.js"

const SCHLUESSEL = "geraet"

// Grober Name aus dem Browser – nur ein Vorschlag
export function geraeteArt() {
    const ua = navigator.userAgent
    if (/iphone/i.test(ua)) return "iPhone"
    if (/ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad"
    if (/android/i.test(ua)) return /mobile/i.test(ua) ? "Android-Handy" : "Android-Tablet"
    if (/windows/i.test(ua)) return "Windows-PC"
    if (/mac os/i.test(ua)) return "Mac"
    if (/linux/i.test(ua)) return "Linux-PC"
    return "Gerät"
}

async function speichern(g) {
    try { await idb.setzen(SCHLUESSEL, g) } catch { /* privates Fenster o. Ä. */ }
    try { localStorage.setItem("grove-geraet", JSON.stringify(g)) } catch { /* egal */ }
}

let geladen = null
export function diesesGeraet() {
    geladen ??= (async () => {
        let g = null
        try { g = await idb.holen(SCHLUESSEL) } catch { /* weiter mit localStorage */ }
        if (!g?.id) { try { g = JSON.parse(localStorage.getItem("grove-geraet")) } catch { g = null } }
        if (!g?.id) g = { id: crypto.randomUUID(), name: geraeteArt() }
        await speichern(g)
        return g
    })()
    return geladen
}

export async function geraetMelden() {
    const g = await diesesGeraet()
    const { error } = await supabase.from("geraete").upsert(
        { id: g.id, name: g.name, art: geraeteArt(), zuletzt_gesehen: new Date().toISOString() },
        { onConflict: "user_id,id" },
    )
    if (error) throw error
    return g
}

export async function geraetUmbenennen(name) {
    const g = await diesesGeraet()
    g.name = name.trim() || geraeteArt()
    await speichern(g)
    await geraetMelden()
    return g
}

export async function geraeteListe() {
    const { data, error } = await supabase.from("geraete").select("id, name, art, zuletzt_gesehen").order("zuletzt_gesehen", { ascending: false })
    if (error) throw error
    return data
}
