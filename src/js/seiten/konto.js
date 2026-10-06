// ==========================================================
// Grove · Mein Konto (konto.html)
// ==========================================================
import "../kern/schutz.js"
import "../glocke.js"
import { supabase } from "../kern/supabase.js"
import { saveProfile } from "../kern/profil.js"
import { ladeNutzer, zeigeNutzer, abmeldung } from "../nutzermenue.js"
import { deutscheMeldung } from "../kern/meldungen.js"
import { MAIL_DOMAIN } from "../mail/konfig.js"

const $ = (s) => document.querySelector(s)

let nutzer = await ladeNutzer()
if (nutzer) fuelleFormulare()

function fuelleFormulare() {
    const { user, profil } = nutzer
    $("#anzeigename").value = profil?.display_name || ""
    $("#anzeigename").placeholder = profil?.username || "z. B. Paddy"
    $("#username").textContent = profil?.username || "—"
    $("#mail-adresse").textContent = profil?.username ? `${profil.username.toLowerCase()}@${MAIL_DOMAIN}` : ""
    $("#neue-email").value = user.email
    $("#avatar-entfernen").hidden = !profil?.avatar_url
}

// Kleine Hilfe für Rückmeldungen unter jedem Formular
function melde(id, text, art = "ok") {
    const el = $(id)
    el.textContent = text
    el.dataset.art = art
}
async function mitKnopf(formular, arbeit) {
    const knopf = formular.querySelector("button[type=submit]")
    knopf.disabled = true
    try { await arbeit() } finally { knopf.disabled = false }
}
async function neuLaden() {
    nutzer = await ladeNutzer({ neu: true })
    await zeigeNutzer()
    fuelleFormulare()
}

// ---------- Anzeigename ----------
$("#profil-form").addEventListener("submit", (e) => {
    e.preventDefault()
    mitKnopf(e.target, async () => {
        const name = $("#anzeigename").value.trim()
        try {
            await saveProfile({ display_name: name || null })
            await neuLaden()
            melde("#profil-meldung", "Gespeichert.")
        } catch (fehler) {
            melde("#profil-meldung", deutscheMeldung(fehler), "fehler")
        }
    })
})

// ---------- Avatar ----------
// Das Bild wird im Browser auf 256×256 verkleinert (spart Speicher), dann hochgeladen.
$("#avatar-datei").addEventListener("change", async (e) => {
    const datei = e.target.files[0]
    e.target.value = ""
    if (!datei) return
    if (datei.size > 10 * 1024 * 1024) return melde("#profil-meldung", "Das Bild ist zu groß (max. 10 MB).", "fehler")

    melde("#profil-meldung", "Bild wird hochgeladen …")
    try {
        const bild = await verkleinere(datei, 256)
        const pfad = `${nutzer.user.id}/avatar-${Date.now()}.webp`
        const { error } = await supabase.storage.from("avatare").upload(pfad, bild, { contentType: "image/webp" })
        if (error) throw error
        const { data } = supabase.storage.from("avatare").getPublicUrl(pfad)

        const altesBild = nutzer.profil?.avatar_url
        await saveProfile({ avatar_url: data.publicUrl })
        if (altesBild) entferneDatei(altesBild)
        await neuLaden()
        melde("#profil-meldung", "Neues Bild gespeichert.")
    } catch (fehler) {
        console.error(fehler)
        melde("#profil-meldung", deutscheMeldung(fehler), "fehler")
    }
})

$("#avatar-entfernen").addEventListener("click", async () => {
    const altesBild = nutzer.profil?.avatar_url
    try {
        await saveProfile({ avatar_url: null })
        if (altesBild) entferneDatei(altesBild)
        await neuLaden()
        melde("#profil-meldung", "Bild entfernt.")
    } catch (fehler) {
        melde("#profil-meldung", deutscheMeldung(fehler), "fehler")
    }
})

function entferneDatei(url) {
    const pfad = url.split("/avatare/")[1]
    if (pfad) supabase.storage.from("avatare").remove([pfad]).catch(console.error)
}

// Bild quadratisch zuschneiden und als WebP verkleinern
async function verkleinere(datei, groesse) {
    const bitmap = await createImageBitmap(datei)
    const seite = Math.min(bitmap.width, bitmap.height)
    const leinwand = Object.assign(document.createElement("canvas"), { width: groesse, height: groesse })
    leinwand.getContext("2d").drawImage(
        bitmap, (bitmap.width - seite) / 2, (bitmap.height - seite) / 2, seite, seite, 0, 0, groesse, groesse)
    return new Promise((ok) => leinwand.toBlob(ok, "image/webp", 0.88))
}

// ---------- E-Mail ändern ----------
$("#email-form").addEventListener("submit", (e) => {
    e.preventDefault()
    mitKnopf(e.target, async () => {
        const email = $("#neue-email").value.trim()
        if (email === nutzer.user.email) return melde("#email-meldung", "Das ist schon deine Login-E-Mail.", "fehler")
        const { error } = await supabase.auth.updateUser({ email }, {
            emailRedirectTo: `${location.origin}/konto.html`,
        })
        if (error) return melde("#email-meldung", deutscheMeldung(error), "fehler")
        melde("#email-meldung", `Fast fertig: Bestätige die Änderung über den Link, den wir an ${email} geschickt haben.`)
    })
})

// ---------- Passwort ändern ----------
// Zur Sicherheit erst das aktuelle Passwort prüfen (falls jemand an deinem offenen Laptop sitzt).
$("#passwort-form").addEventListener("submit", (e) => {
    e.preventDefault()
    mitKnopf(e.target, async () => {
        const aktuell = $("#pw-aktuell").value
        const neu = $("#pw-neu").value
        if (neu.length < 8) return melde("#passwort-meldung", "Das neue Passwort muss mindestens 8 Zeichen haben.", "fehler")
        if (neu !== $("#pw-neu2").value) return melde("#passwort-meldung", "Die neuen Passwörter stimmen nicht überein.", "fehler")

        const pruefung = await supabase.auth.signInWithPassword({ email: nutzer.user.email, password: aktuell })
        if (pruefung.error) return melde("#passwort-meldung", "Das aktuelle Passwort stimmt nicht.", "fehler")

        const { error } = await supabase.auth.updateUser({ password: neu })
        if (error) return melde("#passwort-meldung", deutscheMeldung(error), "fehler")
        e.target.reset()
        melde("#passwort-meldung", "Passwort geändert.")
    })
})

// ---------- Konto löschen ----------
$("#loeschen-wort").addEventListener("input", (e) => {
    $("#loeschen-knopf").disabled = e.target.value.trim() !== "LÖSCHEN"
})
$("#loeschen-form").addEventListener("submit", (e) => {
    e.preventDefault()
    if ($("#loeschen-wort").value.trim() !== "LÖSCHEN") return
    mitKnopf(e.target, async () => {
        if (nutzer.profil?.avatar_url) entferneDatei(nutzer.profil.avatar_url)
        const { error } = await supabase.rpc("grove_konto_loeschen")
        if (error) return melde("#loeschen-meldung", deutscheMeldung(error), "fehler")
        abmeldung.ziel = "/login.html?info=geloescht"
        await supabase.auth.signOut().catch(() => {})
        window.location.href = abmeldung.ziel
    })
})
