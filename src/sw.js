// ==========================================================
// Grove · Service Worker
// Ein kleines Script, das der Browser im Hintergrund laufen lässt.
// Es sitzt zwischen Grove und dem Netz und entscheidet bei jeder Anfrage:
// aus dem Zwischenspeicher (Cache) oder frisch aus dem Netz?
// Dadurch startet Grove als App schnell und zeigt offline eine eigene Seite.
//
// Wird von werkzeug/app-plugin.js gebaut (__GROVE_VERSION__ = Build-Nummer).
// Neue Regel → Eintrag in REGELN (die erste passende entscheidet).
// Supabase & andere Server laufen NIE über den Cache (immer live).
// ==========================================================
const VERSION = "__GROVE_VERSION__"
const CACHE = {
  seiten: `grove-seiten-${VERSION}`,
  dateien: `grove-dateien-${VERSION}`,
  schriften: "grove-schriften",          // ändert sich nie → bleibt über Versionen
}
const OFFLINE = "/offline.html"
const SCHRIFT_SERVER = ["fonts.googleapis.com", "fonts.gstatic.com"]

// ---------- Strategien ----------
// Netz zuerst: immer aktuell, offline die letzte Fassung (für Seiten)
const netzZuerst = (cacheName, ersatz) => async (anfrage, url) => {
  const schluessel = url.origin + url.pathname              // ?eintrag=… egal: gleiche Seite
  try {
    const antwort = await fetch(anfrage)
    if (antwort.ok && antwort.type === "basic") (await caches.open(cacheName)).put(schluessel, antwort.clone())
    return antwort
  } catch {
    return (await caches.match(schluessel)) || (ersatz && (await caches.match(ersatz))) || Response.error()
  }
}
// Cache zuerst: für Dateien, die sich nie ändern (Build-Dateien mit Prüfsumme im Namen, Schriften)
const cacheZuerst = (cacheName) => async (anfrage) => {
  const treffer = await caches.match(anfrage)
  if (treffer) return treffer
  const antwort = await fetch(anfrage)
  if (antwort.ok || antwort.type === "opaque") (await caches.open(cacheName)).put(anfrage, antwort.clone())
  return antwort
}
// Alt sofort, neu im Hintergrund: für Bilder und Icons
const altUndNeu = (cacheName) => async (anfrage) => {
  const cache = await caches.open(cacheName)
  const treffer = await cache.match(anfrage)
  const neu = fetch(anfrage).then((antwort) => { if (antwort.ok) cache.put(anfrage, antwort.clone()); return antwort }).catch(() => treffer)
  return treffer || neu
}

// ---------- Regeln ----------
const REGELN = [
  { name: "Schriften",        wenn: (u) => SCHRIFT_SERVER.includes(u.hostname),            wie: cacheZuerst(CACHE.schriften) },
  { name: "Fremde Server",    wenn: (u) => u.origin !== self.location.origin,               wie: null },   // Supabase, Worker … → durchreichen
  { name: "Service Worker",   wenn: (u) => u.pathname === "/sw.js",                         wie: null },
  { name: "Seiten",           wenn: (u, a) => a.mode === "navigate",                        wie: netzZuerst(CACHE.seiten, OFFLINE) },
  { name: "Build-Dateien",    wenn: (u) => u.pathname.startsWith("/assets/"),               wie: cacheZuerst(CACHE.dateien) },
  { name: "Bilder & Icons",   wenn: (u) => u.pathname.startsWith("/bilder/") || u.pathname === "/manifest.webmanifest", wie: altUndNeu(CACHE.dateien) },
]

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request
  if (anfrage.method !== "GET") return
  const url = new URL(anfrage.url)
  const regel = REGELN.find((r) => r.wenn(url, anfrage))
  if (regel?.wie) ereignis.respondWith(regel.wie(anfrage, url))
})

// ---------- Installieren & Aufräumen ----------
// Beim Installieren: Offline-Seite + ihre Build-Dateien vorab speichern
self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil((async () => {
    try {
      const antwort = await fetch(OFFLINE, { cache: "reload" })
      if (!antwort.ok) return
      await (await caches.open(CACHE.seiten)).put(OFFLINE, antwort.clone())
      const text = await antwort.text()
      const teile = [...text.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await (await caches.open(CACHE.dateien)).addAll(teile)
    } catch { /* offline beim Installieren – klappt beim nächsten Mal */ }
  })())
  self.skipWaiting()                       // neue Version sofort übernehmen
})

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil((async () => {
    const behalten = new Set(Object.values(CACHE))
    for (const name of await caches.keys()) if (name.startsWith("grove-") && !behalten.has(name)) await caches.delete(name)
    await self.clients.claim()
  })())
})

// ---------- Push (vorbereitet) ----------
// Sobald ein Server Push schickt (z. B. Bridge: „Task fertig“), erscheint hier die Meldung.
// Erwartet JSON: { titel, text, link }
self.addEventListener("push", (ereignis) => {
  let daten = {}
  try { daten = ereignis.data?.json() || {} } catch { daten = { text: ereignis.data?.text() } }
  ereignis.waitUntil(self.registration.showNotification(daten.titel || "Grove", {
    body: daten.text || "",
    icon: "/bilder/marke/app/icon-192.png",
    badge: "/bilder/marke/favicon.svg",
    data: { link: daten.link || "/" },
  }))
})
self.addEventListener("notificationclick", (ereignis) => {
  ereignis.notification.close()
  const ziel = new URL(ereignis.notification.data?.link || "/", self.location.origin).href
  ereignis.waitUntil((async () => {
    const fenster = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
    const offen = fenster.find((f) => f.url === ziel)
    if (offen) return offen.focus()
    return self.clients.openWindow(ziel)
  })())
})
