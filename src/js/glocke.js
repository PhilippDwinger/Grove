// ==========================================================
// Grove · Benachrichtigungen (Glocke in der Kopfzeile)
// Jeder Dienst kann eine Zeile in "benachrichtigungen" anlegen –
// sie erscheint hier sofort. Neue Mails kommen automatisch dazu.
// ==========================================================
import { supabase } from "./kern/supabase.js"
import { ladeNutzer } from "./nutzermenue.js"

const glocke = document.querySelector("#glocke")
if (glocke) starte()

async function starte() {
    const nutzer = await ladeNutzer()
    if (!nutzer) return

    const liste = glocke.querySelector(".glocke__liste")
    const punkt = glocke.querySelector(".glocke__punkt")
    const leer = glocke.querySelector(".glocke__leer")
    const vorlage = document.querySelector("#glocke-vorlage")
    let eintraege = []

    async function lade() {
        const { data, error } = await supabase.from("benachrichtigungen")
            .select("*").order("erstellt_am", { ascending: false }).limit(30)
        if (error) { console.error(error); return }
        eintraege = data
        zeichne()
    }

    function zeichne() {
        liste.replaceChildren()
        for (const b of eintraege) {
            const el = vorlage.content.firstElementChild.cloneNode(true)
            el.classList.toggle("ungelesen", !b.gelesen)
            el.dataset.dienst = b.dienst
            el.querySelector(".meldung__titel").textContent = b.titel
            el.querySelector(".meldung__text").textContent = b.text
            el.querySelector(".meldung__zeit").textContent = wannGewesen(b.erstellt_am)
            if (b.link) el.href = b.link; else el.removeAttribute("href")
            el.addEventListener("click", () => markiere([b.id]))
            liste.append(el)
        }
        const ungelesen = eintraege.filter((b) => !b.gelesen).length
        punkt.textContent = ungelesen > 9 ? "9+" : ungelesen
        punkt.hidden = ungelesen === 0
        leer.hidden = eintraege.length > 0
        glocke.querySelector("[data-alle-gelesen]").hidden = ungelesen === 0
        glocke.querySelector("summary").setAttribute("aria-label",
            ungelesen ? `Benachrichtigungen, ${ungelesen} neu` : "Benachrichtigungen")
    }

    async function markiere(ids) {
        if (!ids.length) return
        eintraege.forEach((b) => { if (ids.includes(b.id)) b.gelesen = true })
        zeichne()
        const { error } = await supabase.from("benachrichtigungen").update({ gelesen: true }).in("id", ids)
        if (error) console.error(error)
    }

    glocke.querySelector("[data-alle-gelesen]").addEventListener("click", (e) => {
        e.preventDefault()
        markiere(eintraege.filter((b) => !b.gelesen).map((b) => b.id))
    })

    // Live: neue Benachrichtigung → oben einfügen, Glocke wackelt kurz
    supabase.channel(`glocke-${nutzer.user.id}`)
        .on("postgres_changes",
            { event: "INSERT", schema: "public", table: "benachrichtigungen", filter: `user_id=eq.${nutzer.user.id}` },
            (ereignis) => {
                eintraege.unshift(ereignis.new)
                zeichne()
                glocke.classList.remove("wackelt")
                void glocke.offsetWidth          // Animation neu starten
                glocke.classList.add("wackelt")
            })
        .subscribe()

    await lade()
}

function wannGewesen(iso) {
    const sek = (Date.now() - new Date(iso)) / 1000
    if (sek < 60) return "gerade eben"
    if (sek < 3600) return `vor ${Math.floor(sek / 60)} Min.`
    if (sek < 86400) return `vor ${Math.floor(sek / 3600)} Std.`
    if (sek < 7 * 86400) return `vor ${Math.floor(sek / 86400)} Tag${sek >= 2 * 86400 ? "en" : ""}`
    return new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "short" })
}
