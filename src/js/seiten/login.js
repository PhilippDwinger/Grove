import { signIn } from "../kern/auth.js";

const formular = document.querySelector("#login-form")
const meldung = document.querySelector("#auth-meldung")

formular.addEventListener("submit", async (event) => {
    event.preventDefault()
    const email = document.querySelector("#login-email").value
    const password = document.querySelector("#login-passwort").value

    try {
        const user = await signIn({email: email, password: password})
        window.location.href = "/"
    } catch (error) {
        meldung.textContent = error.message
    }
})