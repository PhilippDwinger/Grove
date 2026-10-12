// ==========================================================
// Grove · Vite-Plugin „App“ (PWA = installierbare Web-App)
//
// Macht drei Dinge, damit keine Seite etwas extra braucht:
//   1. fügt in JEDE .html-Seite die App-Angaben in den <head> ein
//      (Manifest, Farbe der App-Leiste, iPhone-Icon)
//   2. erzeugt /manifest.webmanifest aus src/js/dienste.js
//      → jeder Dienst wird automatisch ein Kurzbefehl (Rechtsklick aufs App-Icon)
//   3. baut den Service Worker (src/sw.js) mit einer neuen Versionsnummer,
//      damit nach jedem Build alte Zwischenspeicher verschwinden
//
// Ändern: App-Name, Farben, Icons → APP unten. Neue Kopf-Zeile → kopfTags().
// ==========================================================
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dienste } from '../src/js/dienste.js'

export const APP = {
  name: 'Grove',
  kurzname: 'Grove',
  beschreibung: 'Deine persönliche digitale Welt – Mail, Notizen, Passwörter, Dateien und Geräte, alles verbunden.',
  farbe: '#1C1420',            // Grund – App-Leiste & Startbildschirm (Laub passt sie im Browser live an)
  start: '/',
  icons: [
    { src: '/bilder/marke/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/bilder/marke/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/bilder/marke/app/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  appleIcon: '/bilder/marke/app/apple-touch-icon.png',
}

export function manifest() {
  return {
    name: APP.name,
    short_name: APP.kurzname,
    description: APP.beschreibung,
    lang: 'de',
    id: APP.start,
    start_url: APP.start,
    scope: '/',
    display: 'standalone',
    background_color: APP.farbe,
    theme_color: APP.farbe,
    icons: APP.icons,
    // Kurzbefehle: alle Dienste, die man öffnen kann (nicht „bald“)
    shortcuts: dienste
      .filter((d) => d.pfad && d.status !== 'bald')
      .slice(0, 10)
      .map((d) => ({ name: d.name, short_name: d.name, description: d.art, url: d.pfad, icons: [{ src: APP.icons[0].src, sizes: '192x192' }] })),
  }
}

function kopfTags() {
  const tag = (tag, attrs) => ({ tag, attrs, injectTo: 'head' })
  return [
    tag('link', { rel: 'manifest', href: '/manifest.webmanifest' }),
    tag('meta', { name: 'theme-color', content: APP.farbe }),
    tag('link', { rel: 'apple-touch-icon', href: APP.appleIcon }),
    tag('meta', { name: 'mobile-web-app-capable', content: 'yes' }),
    tag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }),
    tag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }),
    tag('meta', { name: 'apple-mobile-web-app-title', content: APP.kurzname }),
  ]
}

export default function groveApp({ src }) {
  const version = Date.now().toString(36)
  const swQuelle = () => readFileSync(resolve(src, 'sw.js'), 'utf8').replaceAll('__GROVE_VERSION__', version)

  return {
    name: 'grove-app',
    transformIndexHtml: () => kopfTags(),
    // npm run dev: Manifest + Service Worker direkt ausliefern
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json')
          return res.end(JSON.stringify(manifest(), null, 2))
        }
        if (req.url === '/sw.js') {
          res.setHeader('Content-Type', 'text/javascript')
          return res.end(swQuelle())
        }
        next()
      })
    },
    // npm run build: beide Dateien in dist/ schreiben
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(manifest(), null, 2) })
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: swQuelle() })
    },
  }
}
