// ==========================================================
// Grove Mail · Darstellung
// Datum, Initialen, Größen – und das sichere Anzeigen von Mails.
// ==========================================================
import DOMPurify from "dompurify"

// ---------- Datum: "21:40", "Gestern", "Mo.", "12.09.26" ----------
export function kurzesDatum(iso) {
    const d = new Date(iso), jetzt = new Date()
    const tage = Math.floor((startDesTages(jetzt) - startDesTages(d)) / 864e5)
    if (tage <= 0) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    if (tage === 1) return "Gestern"
    if (tage < 7) return d.toLocaleDateString("de-DE", { weekday: "short" })
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })
}
export function langesDatum(iso) {
    return new Date(iso).toLocaleString("de-DE", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
}
function startDesTages(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

export function initiale(name, adresse) {
    return ((name || adresse || "?").trim().charAt(0) || "?").toUpperCase()
}

export function groesse(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ---------- Klartext-Mail → sicheres HTML mit Links ----------
export function textAlsHtml(text) {
    const sicher = (text || "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return sicher
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        .split(/\n{2,}/).map((absatz) => `<p>${absatz.replace(/\n/g, "<br>")}</p>`).join("")
}

// ---------- HTML-Mail sicher anzeigen ----------
// 1. DOMPurify entfernt Scripte, Formulare und alles Gefährliche.
// 2. Die Mail läuft in einem abgeschotteten <iframe> (sandbox, ohne Scripte).
// 3. Eine Content-Security-Policy blockt Bilder von fremden Servern
//    (die verraten sonst, dass und wann du die Mail geöffnet hast),
//    bis du auf "Bilder laden" klickst.
export function hatExterneBilder(html) {
    return /(?:src|background)\s*=\s*["']?\s*https?:|url\(\s*["']?\s*https?:/i.test(html || "")
}

export function htmlFuerRahmen(html, { bilderErlaubt = false } = {}) {
    const rein = DOMPurify.sanitize(html, {
        WHOLE_DOCUMENT: true,
        FORBID_TAGS: ["script", "form", "input", "button", "textarea", "select", "iframe", "object", "embed", "base", "meta", "link"],
        FORBID_ATTR: ["onerror", "onload", "onclick"],
        ADD_ATTR: ["target"],
    })
    const bildQuellen = bilderErlaubt ? "data: cid: https: http:" : "data: cid:"
    const csp = `default-src 'none'; img-src ${bildQuellen}; style-src 'unsafe-inline'; font-src data:`
    const grund = `
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <base target="_blank">
        <style>
          html, body { margin: 0; padding: 0; }
          body { padding: 20px; font: 15px/1.6 system-ui, "Segoe UI", sans-serif; color: #1f1a22; background: #fff; overflow-wrap: anywhere; }
          img { max-width: 100%; height: auto; }
          table { max-width: 100%; }
        </style>`
    // Unsere Grundlagen ganz vorne in den <head> setzen
    return rein.includes("<head>") ? rein.replace("<head>", `<head>${grund}`) : `<head>${grund}</head>${rein}`
}

// Iframe an die Höhe des Inhalts anpassen
export function passeHoeheAn(rahmen) {
    const anpassen = () => {
        const doc = rahmen.contentDocument
        if (doc?.documentElement) rahmen.style.height = doc.documentElement.scrollHeight + "px"
    }
    rahmen.addEventListener("load", () => {
        anpassen()
        rahmen.contentDocument?.querySelectorAll("img").forEach((img) => img.addEventListener("load", anpassen))
        setTimeout(anpassen, 300)
    })
}
