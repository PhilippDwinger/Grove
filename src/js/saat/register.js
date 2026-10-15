// Saat meldet sich im Grove-Register an: Strg+K findet Lernkarten (Vorderseite, Antwort).
// Gesucht wird in einem kleinen Index, den die Saat-Seite in DIESEM Browser ablegt
// (IndexedDB) – nichts davon geht an einen Server. Ohne Index (Saat noch nie geöffnet): keine Treffer.
import { dienstRegistrieren } from "../kern/register.js"
import { idb } from "../kern/idb.js"

let cache = null
async function index() {
    cache ??= idb.holen("saat-suche").then((x) => x || []).catch(() => [])
    return cache
}
const norm = (t) => String(t || "").normalize("NFKC").toLocaleLowerCase("de-DE")
const alsTreffer = (e) => ({ id: e.k, titel: e.z ? `${e.v} · ${e.z}` : e.v, untertitel: `Lernkarte · ${e.a}` })

dienstRegistrieren({
    typ: "saat",
    name: "Saat",
    url: (id) => `/dienste/saat/#karte/${encodeURIComponent(id)}`,
    suchen: async (text) => {
        const q = norm(text).trim()
        if (!q) return []
        return (await index()).filter((e) => norm(`${e.v} ${e.z} ${e.a}`).includes(q)).slice(0, 8).map(alsTreffer)
    },
    holen: async (id) => { const e = (await index()).find((x) => x.k === id); return e ? alsTreffer(e) : null },
})
