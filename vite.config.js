// ==========================================================
// Grove · Vite-Konfiguration
//   src/          → die Website (Vite-Root)
//   src/public/   → Dateien, die 1:1 kopiert werden (Bilder)
//   .env          → liegt im Hauptordner (envDir)
//   dist/         → fertiger Build für Render
// Alle .html-Seiten in src/ werden automatisch gefunden.
// ==========================================================
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, relative } from 'node:path'
import { defineConfig } from 'vite'

const projekt = fileURLToPath(new URL('.', import.meta.url))
const src = resolve(projekt, 'src')

function htmlSeiten(ordner, seiten = {}) {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    if (eintrag.name === 'public' || eintrag.name.startsWith('.')) continue
    const pfad = resolve(ordner, eintrag.name)
    if (eintrag.isDirectory()) htmlSeiten(pfad, seiten)
    else if (eintrag.name.endsWith('.html')) {
      const name = relative(src, pfad).replace(/\\/g, '/').replace(/\.html$/, '').replace(/\//g, '-')
      seiten[name] = pfad
    }
  }
  return seiten
}

export default defineConfig({
  root: src,
  envDir: projekt,
  build: {
    outDir: resolve(projekt, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: htmlSeiten(src) },
  },
})
