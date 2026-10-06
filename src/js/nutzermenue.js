// ==========================================================
// Grove · Nutzermenü (auf jeder geschützten Seite)
// Füllt alle Elemente mit diesen data-Attributen:
//   data-nutzer-name     → Username (oder E-Mail, falls kein Username)
//   data-nutzer-email    → E-Mail
//   data-nutzer-initial  → erster Buchstabe (für den runden Avatar)
//   data-logout          → Klick = ausloggen
// ==========================================================
import { supabase } from "./kern/supabase.js"
import { getCurrentUser, logOut } from "./kern/auth.js"
import { loadProfile } from "./kern/profil.js"

// Lädt Nutzer + Profil einmal und merkt es sich für alle, die fragen
let geladen = null
export function ladeNutzer() {
    if (geladen === null) {
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

function fuelle(selektor, text) {
    document.querySelectorAll(selektor).forEach((el) => { el.textContent = text })
}

const nutzer = await ladeNutzer()
if (nutzer !== null) {
    fuelle("[data-nutzer-name]", nutzer.name)
    fuelle("[data-nutzer-email]", nutzer.user.email)
    fuelle("[data-nutzer-initial]", nutzer.name.charAt(0).toUpperCase())
}

// Ausloggen
document.querySelectorAll("[data-logout]").forEach((knopf) => {
    knopf.addEventListener("click", async () => {
        knopf.disabled = true
        try {
            await logOut()
        } finally {
            window.location.href = "/login.html"
        }
    })
})

// Ausgeloggt in einem anderen Tab? Dann auch hier raus.
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.href = "/login.html"
})
