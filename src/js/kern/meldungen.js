// ==========================================================
// Grove · Supabase-Fehlermeldungen auf Deutsch
// ==========================================================
const UEBERSETZUNG = {
    "Invalid login credentials": "E-Mail oder Passwort stimmt nicht.",
    "Email not confirmed": "Bitte bestätige zuerst deine E-Mail-Adresse – schau in dein Postfach.",
    "User already registered": "Mit dieser E-Mail gibt es schon ein Konto.",
    "Database error saving new user": "Dieser Username ist schon vergeben.",
    "Unable to validate email address: invalid format": "Diese E-Mail-Adresse sieht nicht richtig aus.",
    "missing email or phone": "Bitte gib deine E-Mail-Adresse ein.",
    "New password should be different from the old password.": "Das neue Passwort muss sich vom alten unterscheiden.",
    "Auth session missing!": "Du bist nicht (mehr) eingeloggt.",
}

export function deutscheMeldung(fehler) {
    const text = fehler?.message || String(fehler)
    if (UEBERSETZUNG[text]) return UEBERSETZUNG[text]
    if (/rate limit/i.test(text)) return "Zu viele Versuche – bitte warte ein paar Minuten."
    if (/Password should be at least/i.test(text)) return "Das Passwort ist zu kurz."
    if (/Failed to fetch|NetworkError/i.test(text)) return "Keine Verbindung – prüf dein Internet."
    return text
}
