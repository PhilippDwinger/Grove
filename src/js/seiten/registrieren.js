import { signUp, getCurrentUser } from "../kern/auth.js"

const formular = document.querySelector("#register-form")
const meldung  = document.querySelector("#auth-meldung")

formular.addEventListener("submit", async (event) => {
    event.preventDefault()

    const username  = document.querySelector("#register-username").value.trim()
    const email     = document.querySelector("#register-email").value.trim()
    const passwort  = document.querySelector("#register-passwort").value
    const passwort2 = document.querySelector("#register-passwort2").value

    if (passwort !== passwort2) {
        meldung.textContent = "Password isn't equal!"
        return
    }

    if (passwort.length < 8) {
        meldung.textContent = "Password is too short"
        return
    }

    if (username === "") {
        meldung.textContent = "Username can't be empty"
        return
    }

    try {
        const user = await signUp({email, password: passwort, username})

        if (await getCurrentUser()) {
            window.location.href = "/"
        }
        else {
            meldung.textContent = "Fast geschafft! Bitte bestätige deine E-Mail."
        }
    } catch (fehler) {
        meldung.textContent = fehler.message
    }
})
