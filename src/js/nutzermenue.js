// ==========================================================
// Grove · Nutzermenü (auf jeder geschützten Seite)
// Füllt alle Elemente mit diesen data-Attributen:
//   data-nutzer-name     → Anzeigename (sonst Username, sonst E-Mail)
//   data-nutzer-email    → E-Mail
//   data-nutzer-initial  → Avatar: Bild, falls vorhanden – sonst erster Buchstabe
//   data-logout          → Klick = ausloggen
// ==========================================================
import { supabase } from "./kern/supabase.js"
import { getCurrentUser, logOut } from "./kern/auth.js"
import { loadProfile } from "./kern/profil.js"

// Wohin es nach dem Ausloggen geht (die Konto-Seite ändert das beim Löschen)
export const abmeldung = { ziel: "/login.html" }

// Lädt Nutzer + Profil einmal und merkt es sich für alle, die fragen
let geladen = null
export function ladeNutzer({ neu = false } = {}) {
    if (geladen === null || neu) {
        geladen = (async () => {
            const user = await getCurrentUser()
            if (user === null) return null
            const profil = await loadProfile().catch(() => null)
            const name = profil?.display_name || profil?.username || user.email
            return { user, profil, name }
        })()
    }
    return geladen
}

// Kopfzeile neu füllen (z. B. nachdem man im Konto den Namen geändert hat)
export async function zeigeNutzer({ neu = false } = {}) {
    const nutzer = await ladeNutzer({ neu })
    if (nutzer === null) return
    document.querySelectorAll("[data-nutzer-name]").forEach((el) => { el.textContent = nutzer.name })
    document.querySelectorAll("[data-nutzer-email]").forEach((el) => { el.textContent = nutzer.user.email })
    document.querySelectorAll("[data-nutzer-initial]").forEach((el) => {
        if (nutzer.profil?.avatar_url) {
            const bild = document.createElement("img")
            bild.src = nutzer.profil.avatar_url
            bild.alt = ""
            el.replaceChildren(bild)
        } else {
            el.textContent = nutzer.name.charAt(0).toUpperCase()
        }
    })
}

await zeigeNutzer()

// Ausloggen
document.querySelectorAll("[data-logout]").forEach((knopf) => {
    knopf.addEventListener("click", async () => {
        knopf.disabled = true
        try {
            await logOut()
        } finally {
            window.location.href = abmeldung.ziel
        }
    })
})

// Klick außerhalb schließt offene Menüs (Nutzermenü, Glocke)
document.addEventListener("click", (e) => {
    document.querySelectorAll("details.ausklapp[open]").forEach((d) => {
        if (!d.contains(e.target)) d.removeAttribute("open")
    })
})
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll("details.ausklapp[open]").forEach((d) => d.removeAttribute("open"))
})

// Ausgeloggt in einem anderen Tab? Dann auch hier raus.
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.href = abmeldung.ziel
})
