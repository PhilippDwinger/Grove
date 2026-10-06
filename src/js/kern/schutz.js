import { getCurrentUser } from "./auth.js";

const user = await getCurrentUser()
if (user === null) {
    window.location.href = "/login.html"
} else {
    // Seite freigeben – das CSS blendet sie erst jetzt ein (siehe src/css/app.css)
    document.body.classList.add("geprueft")
}