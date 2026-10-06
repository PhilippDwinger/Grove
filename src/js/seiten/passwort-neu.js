// Grove · Neues Passwort setzen
// Der Link aus der Mail bringt eine vorübergehende Anmeldung mit (steht in der Adresse).
// Supabase liest sie automatisch aus – danach darf man das Passwort ändern.
import { supabase } from "../kern/supabase.js"
import { deutscheMeldung } from "../kern/meldungen.js"

const formular = document.querySelector("#neu-form")
const meldung = document.querySelector("#auth-meldung")
const info = document.querySelector("#auth-info")
const ungueltig = document.querySelector("#link-ungueltig")

let bereit = false
function zeigeFormular() {
    if (bereit) return
    bereit = true
    formular.hidden = false
    ungueltig.hidden = true
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || session) zeigeFormular()
})

// Kommt nach 2 Sekunden keine Anmeldung zustande, war der Link ungültig
const { data } = await supabase.auth.getSession()
if (data.session) zeigeFormular()
setTimeout(() => { if (!bereit) ungueltig.hidden = false }, 2000)

formular.addEventListener("submit", async (event) => {
    event.preventDefault()
    meldung.textContent = ""
    const passwort = document.querySelector("#neu-passwort").value
    const passwort2 = document.querySelector("#neu-passwort2").value

    if (passwort.length < 8) {
        meldung.textContent = "Das Passwort muss mindestens 8 Zeichen haben."
        return
    }
    if (passwort !== passwort2) {
        meldung.textContent = "Die Passwörter stimmen nicht überein."
        return
    }

    const { error } = await supabase.auth.updateUser({ password: passwort })
    if (error) {
        meldung.textContent = deutscheMeldung(error)
        return
    }
    info.textContent = "Gespeichert! Du wirst gleich weitergeleitet …"
    setTimeout(() => { window.location.href = "/" }, 1500)
})
