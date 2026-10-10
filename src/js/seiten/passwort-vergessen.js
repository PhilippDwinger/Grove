// Grove · Passwort vergessen → Supabase schickt einen Link zu passwort-neu.html
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import { supabase } from "../kern/supabase.js"
import { deutscheMeldung } from "../kern/meldungen.js"

const formular = document.querySelector("#vergessen-form")
const meldung = document.querySelector("#auth-meldung")
const info = document.querySelector("#auth-info")
const knopf = formular.querySelector("button")

formular.addEventListener("submit", async (event) => {
    event.preventDefault()
    meldung.textContent = ""
    info.textContent = ""
    const email = document.querySelector("#vergessen-email").value.trim()
    if (!email) {
        meldung.textContent = "Bitte gib deine E-Mail-Adresse ein."
        return
    }

    knopf.disabled = true
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/passwort-neu.html`,
    })
    knopf.disabled = false

    if (error) {
        meldung.textContent = deutscheMeldung(error)
        return
    }
    // Absichtlich immer dieselbe Antwort – so verrät Grove nicht, welche Adressen ein Konto haben.
    info.textContent = "Falls es ein Konto mit dieser Adresse gibt, ist der Link unterwegs. Schau in dein Postfach (auch im Spam)."
    formular.reset()
})
