import { signUp, getCurrentUser } from "../kern/auth.js"

const formular = document.querySelector("#register-form")
const meldung  = document.querySelector("#auth-meldung")

formular.addEventListener("submit", async (event) => {
    event.preventDefault()

    const username  = document.querySelector("#register-username").value.trim().toLowerCase()
    const email     = document.querySelector("#register-email").value.trim()
    const passwort  = document.querySelector("#register-passwort").value
    const passwort2 = document.querySelector("#register-passwort2").value

    // Der Username wird zur Mail-Adresse (username@groveme.eu.org) –
    // darum nur Kleinbuchstaben, Ziffern, Punkt, Minus und Unterstrich.
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
        meldung.textContent = "Der Username braucht 3–30 Zeichen: Buchstaben a–z, Ziffern, Punkt, Minus oder Unterstrich."
        return
    }

    if (passwort.length < 8) {
        meldung.textContent = "Das Passwort muss mindestens 8 Zeichen haben."
        return
    }

    if (passwort !== passwort2) {
        meldung.textContent = "Die Passwörter stimmen nicht überein."
        return
    }

    try {
        await signUp({email, password: passwort, username})

        if (await getCurrentUser()) {
            window.location.href = "/"
        }
        else {
            meldung.textContent = "Fast geschafft! Bitte bestätige deine E-Mail."
        }
    } catch (fehler) {
        meldung.textContent = fehler.message === "Database error saving new user"
            ? "Dieser Username ist schon vergeben."
            : fehler.message
    }
})
