// ==========================================================
// Grove · App (PWA) – wird von thema.js geladen, läuft also auf jeder Seite
//
//   • meldet den Service Worker an (/sw.js, nur im Build – bei npm run dev nie,
//     damit beim Entwickeln nichts Altes aus dem Zwischenspeicher kommt)
//   • „Als App installieren“ im Nutzermenü – immer sichtbar, solange nicht installiert.
//     Bietet der Browser es an: echter Dialog. Sonst Anleitung (iPhone, Firefox, npm run dev …)
//   • App-Leiste nimmt die Grundfarbe aus Laub an
//   • speicherSchuetzen() / speicherStand(): lokaler Speicher (für Dateien)
//
// Andere Dateien fragen den Zustand über `app` ab, z. B. app.installiert.
// ==========================================================

const istIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

export const app = {
    installiert: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    installierbar: false,          // true, sobald der Browser „Installieren“ anbietet
    online: navigator.onLine,
}

// ---------- Service Worker ----------
if ("serviceWorker" in navigator) {
    if (import.meta.env.PROD) {
        addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch((f) => console.warn("Service Worker:", f)))
    } else {
        navigator.serviceWorker.getRegistrations().then((liste) => liste.forEach((r) => r.unregister()))
    }
}

// ---------- Online / Offline ----------
function netzMelden() {
    app.online = navigator.onLine
    document.documentElement.toggleAttribute("data-offline", !app.online)
    dispatchEvent(new CustomEvent("grove-netz", { detail: { online: app.online } }))
}
addEventListener("online", netzMelden)
addEventListener("offline", netzMelden)
netzMelden()

// ---------- Installieren ----------
let aufforderung = null
addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()                 // eigenen Knopf zeigen statt Browser-Leiste
    aufforderung = e
    app.installierbar = true
    knopfAktualisieren()
})
addEventListener("appinstalled", () => {
    app.installiert = true
    aufforderung = null
    knopfAktualisieren()
})

export async function installieren() {
    if (aufforderung) {
        aufforderung.prompt()
        const { outcome } = await aufforderung.userChoice
        aufforderung = null
        app.installierbar = false
        knopfAktualisieren()
        return outcome === "accepted"
    }
    hinweis()
    return false
}

const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="3"/><path d="M12 7v7m-3-3 3 3 3-3"/><path d="M10 18.5h4"/></svg>`

function knopfAktualisieren() {
    const panel = document.querySelector(".nutzer__panel")
    if (!panel) return
    let knopf = panel.querySelector("[data-installieren]")
    const zeigen = !app.installiert                     // immer zeigen – ohne Browser-Angebot erklärt er, wie es geht
    if (!zeigen) { knopf?.remove(); return }
    if (knopf) return
    knopf = document.createElement("button")
    knopf.type = "button"
    knopf.className = "knopf-leise"
    knopf.dataset.installieren = ""
    knopf.innerHTML = `${ICON} Als App installieren`
    knopf.addEventListener("click", installieren)
    const ausloggen = panel.querySelector("[data-logout]")
    if (ausloggen) ausloggen.before(knopf)
    else panel.append(knopf)
}

// Anleitung, wenn der Browser (noch) keinen Installieren-Dialog anbietet
function hinweisText() {
    if (import.meta.env.DEV) return {
        titel: "Erst in der fertigen Version",
        schritte: ["Beim Entwickeln (<strong>npm run dev</strong>) lässt sich Grove nicht installieren.",
            "Zum Ausprobieren: <strong>npm run build</strong>, dann <strong>npm run preview</strong> und die angezeigte Adresse öffnen.",
            "Oder einfach auf deiner Render-Seite."],
        text: "Dort erscheint dann der echte Installieren-Dialog.",
    }
    if (istIOS) return {
        titel: "Grove als App",
        schritte: ["Unten in Safari auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil).", "<strong>Zum Home-Bildschirm</strong> wählen.", "Oben rechts <strong>Hinzufügen</strong>."],
        text: "Danach startet Grove wie eine App – mit eigenem Icon und ohne Browserleiste.",
    }
    if (/firefox/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent)) return {
        titel: "Grove als App",
        schritte: ["Firefox am PC kann leider keine Web-Apps installieren.", "Öffne Grove in <strong>Chrome</strong> oder <strong>Edge</strong> – dort klappt es mit einem Klick."],
        text: "",
    }
    return {
        titel: "Grove als App",
        schritte: ["Rechts in der Adressleiste auf das <strong>Installieren-Symbol</strong> klicken (Bildschirm mit Pfeil).",
            "Oder im Browser-Menü <strong>⋮</strong> → <strong>Grove installieren</strong> bzw. <strong>App installieren</strong>.",
            "Am Handy: Menü <strong>⋮</strong> → <strong>Zum Startbildschirm hinzufügen</strong>."],
        text: "Taucht nichts davon auf, lade die Seite einmal neu – der Browser braucht beim ersten Besuch einen Moment.",
    }
}

function hinweis() {
    document.getElementById("app-hinweis")?.remove()
    const h = hinweisText()
    const d = document.createElement("dialog")
    d.id = "app-hinweis"
    d.className = "app-hinweis"
    d.innerHTML = `
      <h2>${h.titel}</h2>
      <ol>${h.schritte.map((x) => `<li>${x}</li>`).join("")}</ol>
      ${h.text ? `<p>${h.text}</p>` : ""}
      <form method="dialog"><button class="knopf-leise" type="submit">Alles klar</button></form>`
    document.body.append(d)
    d.addEventListener("close", () => d.remove())
    d.showModal()
}

// ---------- App-Leiste in Laub-Farbe ----------
function leistenFarbe() {
    const meta = document.querySelector('meta[name="theme-color"]')
    const farbe = getComputedStyle(document.documentElement).getPropertyValue("--ground").trim()
    if (meta && farbe) meta.content = farbe
}
addEventListener("grove-thema", leistenFarbe)

// ---------- Lokaler Speicher ----------
// Bittet den Browser, Grove-Daten nicht von selbst wegzuräumen, wenn der Platz knapp wird.
export async function speicherSchuetzen() {
    try {
        if (await navigator.storage?.persisted?.()) return true
        return (await navigator.storage?.persist?.()) ?? false
    } catch { return false }
}
// { belegt, gesamt (Bytes), geschuetzt }
export async function speicherStand() {
    try {
        const s = await navigator.storage?.estimate?.()
        return { belegt: s?.usage ?? null, gesamt: s?.quota ?? null, geschuetzt: !!(await navigator.storage?.persisted?.()) }
    } catch { return { belegt: null, gesamt: null, geschuetzt: false } }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { knopfAktualisieren(); leistenFarbe() })
else { knopfAktualisieren(); leistenFarbe() }
