// Grove · Vite-Konfiguration
// Baut index.html UND alle Seiten in design/beispiele/ mit nach dist/.
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

const beispiele = Object.fromEntries(
  readdirSync(resolve(root, 'design/beispiele'))
    .filter((datei) => datei.endsWith('.html'))
    .map((datei) => [datei.replace('.html', ''), resolve(root, 'design/beispiele', datei)])
)

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        ...beispiele,
      },
    },
  },
})
