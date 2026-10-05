// Grove · Vite-Konfiguration
// Baut automatisch ALLE .html-Dateien im Hauptordner (index.html, login.html, …)
// und alle Seiten in design/beispiele/ mit nach dist/.
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

function htmlSeiten(ordner, prefix = '') {
  return Object.fromEntries(
    readdirSync(resolve(root, ordner))
      .filter((datei) => datei.endsWith('.html'))
      .map((datei) => [prefix + datei.replace('.html', ''), resolve(root, ordner, datei)])
  )
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        ...htmlSeiten('.'),
        ...htmlSeiten('design/beispiele', 'beispiele-'),
      },
    },
  },
})
