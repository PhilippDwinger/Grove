// ==========================================================
// Grove Mail · Empfangs-Worker
// Cloudflare ruft email() für jede eingehende Mail auf.
//   1. Empfänger prüfen  → gibt es den Grove-Nutzer?
//   2. Original (.eml) in Supabase Storage speichern
//   3. Mail zerlegen (Absender, Betreff, Text, Anhänge)
//   4. Zeile in der Tabelle "mails" anlegen → erscheint sofort in Grove Mail
// ==========================================================
import PostalMime from "postal-mime"

// Große Mails zerlegt der Browser selbst (spart Rechenzeit im Gratis-Plan)
const MAX_ZERLEGEN = 512 * 1024

export default {
    async email(message, env) {
        const empfaenger = message.to.toLowerCase()
        const [lokal, domain] = empfaenger.split("@")

        if (domain !== env.MAIL_DOMAIN) {
            message.setReject("Unbekannte Domain")
            return
        }

        // paddy+newsletter@… → paddy
        const username = lokal.split("+")[0]
        if (!/^[a-z0-9][a-z0-9._-]{1,29}$/.test(username)) {
            message.setReject("Diese Adresse gibt es nicht")
            return
        }

        const userId = await rpc(env, "grove_mail_finde_nutzer", { name: username })
        if (!userId) {
            message.setReject("Diese Adresse gibt es nicht")
            return
        }

        // Original lesen und speichern
        const roh = await new Response(message.raw).arrayBuffer()
        const mailId = crypto.randomUUID()
        const rohPfad = `${userId}/${mailId}.eml`
        await speichereDatei(env, rohPfad, roh)

        // Zerlegen – bei großen Mails nur den Kopf
        let teile
        if (roh.byteLength <= MAX_ZERLEGEN) {
            teile = await PostalMime.parse(roh)
        } else {
            teile = await PostalMime.parse(nurKopf(roh))
            teile.zuGross = true
        }

        const text = teile.text || (teile.html ? htmlZuText(teile.html) : "")

        await einfuegen(env, "mails", {
            id: mailId,
            user_id: userId,
            ordner: "eingang",
            von_name: teile.from?.name || null,
            von_adresse: (teile.from?.address || message.from || "unbekannt").toLowerCase(),
            an: adressen(teile.to).length ? adressen(teile.to) : [empfaenger],
            cc: adressen(teile.cc),
            betreff: teile.subject || "",
            vorschau: kurz(text, 160),
            text: teile.zuGross ? null : (teile.text || null),
            html: teile.zuGross ? null : (teile.html || null),
            roh_pfad: rohPfad,
            anhaenge: (teile.attachments || [])
                .filter((a) => a.disposition !== "inline")
                .map((a) => ({ name: a.filename || "Anhang", typ: a.mimeType, groesse: groesseVon(a.content) })),
            message_id: teile.messageId || null,
            in_reply_to: teile.inReplyTo || null,
            datum: gueltigesDatum(teile.date),
        })
    },
}

// ---------- Supabase (über die REST-Schnittstelle, ohne Extra-Bibliothek) ----------
function kopf(env, extra = {}) {
    const key = env.SUPABASE_SECRET_KEY
    const h = { apikey: key, ...extra }
    // Alte service_role-Keys (JWT, beginnen mit "eyJ") brauchen zusätzlich Authorization
    if (key.startsWith("eyJ")) h.Authorization = `Bearer ${key}`
    return h
}

async function rpc(env, funktion, daten) {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${funktion}`, {
        method: "POST",
        headers: kopf(env, { "Content-Type": "application/json" }),
        body: JSON.stringify(daten),
    })
    if (!r.ok) throw new Error(`RPC ${funktion}: ${r.status} ${await r.text()}`)
    return r.json()
}

async function einfuegen(env, tabelle, zeile) {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${tabelle}`, {
        method: "POST",
        headers: kopf(env, { "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify(zeile),
    })
    if (!r.ok) throw new Error(`Einfügen in ${tabelle}: ${r.status} ${await r.text()}`)
}

async function speichereDatei(env, pfad, inhalt) {
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/mail/${pfad}`, {
        method: "POST",
        headers: kopf(env, { "Content-Type": "message/rfc822" }),
        body: inhalt,
    })
    if (!r.ok) throw new Error(`Speichern ${pfad}: ${r.status} ${await r.text()}`)
}

// ---------- Hilfen ----------
function nurKopf(roh) {
    const bytes = new Uint8Array(roh, 0, Math.min(roh.byteLength, 64 * 1024))
    const s = new TextDecoder("latin1").decode(bytes)
    const ende = s.search(/\r?\n\r?\n/)
    return (ende > 0 ? s.slice(0, ende) : s) + "\r\n\r\n"
}

function adressen(liste) {
    return (liste || []).flatMap((a) => (a.group ? a.group : [a])).map((a) => a.address?.toLowerCase()).filter(Boolean)
}

function htmlZuText(html) {
    return html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
}

function kurz(text, n) {
    const t = (text || "").replace(/\s+/g, " ").trim()
    return t.length > n ? t.slice(0, n - 1) + "…" : t
}

function groesseVon(inhalt) {
    if (!inhalt) return 0
    return typeof inhalt === "string" ? inhalt.length : inhalt.byteLength
}

function gueltigesDatum(d) {
    const datum = d ? new Date(d) : new Date()
    return isNaN(datum) ? new Date().toISOString() : datum.toISOString()
}
