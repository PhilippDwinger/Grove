import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import { signIn } from "../kern/auth.js"
import { deutscheMeldung } from "../kern/meldungen.js"

const formular = document.querySelector("#login-form")
const meldung = document.querySelector("#auth-meldung")
const info = document.querySelector("#auth-info")

// Hinweise, wenn man von einer anderen Seite hierher geschickt wurde (login.html?info=…)
const INFOS = {
    passwort: "Dein neues Passwort ist gespeichert. Du kannst dich jetzt einloggen.",
    geloescht: "Dein Konto wurde gelöscht. Mach's gut!",
}
info.textContent = INFOS[new URLSearchParams(location.search).get("info")] || ""

formular.addEventListener("submit", async (event) => {
    event.preventDefault()
    info.textContent = ""
    const email = document.querySelector("#login-email").value.trim()
    const password = document.querySelector("#login-passwort").value

    try {
        await signIn({ email, password })
        window.location.href = "/"
    } catch (error) {
        meldung.textContent = deutscheMeldung(error)
    }
})
