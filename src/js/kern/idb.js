// ==========================================================
// Grove-Kern: kleiner lokaler Speicher im Browser (IndexedDB)
// Für Dinge, die auf DIESEM Gerät bleiben sollen und nicht nach Supabase gehören:
// Geräte-Kennung, gewählter Ordner (Harz), Dateien als Ersatz-Speicher …
//
//   await idb.setzen("schluessel", wert)        // wert darf auch Datei/Blob/Ordner-Zugriff sein
//   await idb.holen("schluessel")
//   await idb.loeschen("schluessel")
//   await idb.schluessel("harz-dateien")         // alle Schlüssel einer Ablage
//
// Neue Ablage (Store): Namen in ABLAGEN ergänzen UND VERSION um 1 erhöhen.
// ==========================================================
const NAME = "grove"
const VERSION = 1
const ABLAGEN = ["werte", "harz-dateien"]

let offen = null
function oeffnen() {
    offen ??= new Promise((ok, fehler) => {
        const anfrage = indexedDB.open(NAME, VERSION)
        anfrage.onupgradeneeded = () => {
            for (const a of ABLAGEN) if (!anfrage.result.objectStoreNames.contains(a)) anfrage.result.createObjectStore(a)
        }
        anfrage.onsuccess = () => ok(anfrage.result)
        anfrage.onerror = () => { offen = null; fehler(anfrage.error) }
    })
    return offen
}

async function vorgang(ablage, art, fn) {
    const db = await oeffnen()
    return new Promise((ok, fehler) => {
        const t = db.transaction(ablage, art)
        const anfrage = fn(t.objectStore(ablage))
        t.oncomplete = () => ok(anfrage?.result)
        t.onerror = () => fehler(t.error)
        t.onabort = () => fehler(t.error)
    })
}

export const idb = {
    holen: (schluessel, ablage = "werte") => vorgang(ablage, "readonly", (s) => s.get(schluessel)),
    setzen: (schluessel, wert, ablage = "werte") => vorgang(ablage, "readwrite", (s) => s.put(wert, schluessel)),
    loeschen: (schluessel, ablage = "werte") => vorgang(ablage, "readwrite", (s) => s.delete(schluessel)),
    schluessel: (ablage = "werte") => vorgang(ablage, "readonly", (s) => s.getAllKeys()),
}
