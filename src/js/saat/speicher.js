// ==========================================================
// Saat · Verzeichnisse (wo die Dateien des Lernspeichers liegen)
//
// Alle Speicherorte sprechen dieselbe kleine Schnittstelle:
//   lesen(pfad) → Blob|null · lesenText(pfad) → string|null · schreiben(pfad, inhalt)
//   anhaengen(pfad, text) · liste(ordner) → [{ name, art, groesse, geaendert }]
//   loeschen(pfad) · existiert(pfad)
//
//   handleVerzeichnis   – ein echter Ordner (File System Access API, Chrome/Edge am PC)
//                         ODER das private Dateisystem des Browsers (OPFS) – gleiche Technik
//   idbVerzeichnis      – Ersatz, wenn der Browser beides nicht kann (IndexedDB)
//   speicherVerzeichnis – nur im Arbeitsspeicher (Tests, ZIP-Import vor dem Zusammenführen)
// ==========================================================

const teile = (pfad) => String(pfad).split("/").filter((t) => t && t !== ".")
const istFehlt = (f) => f?.name === "NotFoundError" || f?.name === "TypeMismatchError" || f?.code === 8

async function alsBlob(inhalt) {
    if (inhalt instanceof Blob) return inhalt
    if (typeof inhalt === "string") return new Blob([inhalt], { type: "text/plain;charset=utf-8" })
    return new Blob([inhalt])
}

// ---------- echter Ordner / OPFS ----------
export function handleVerzeichnis(wurzel, { name = wurzel?.name || "Ordner", art = "ordner" } = {}) {
    async function ordner(pfadTeile, anlegen) {
        let h = wurzel
        for (const t of pfadTeile) h = await h.getDirectoryHandle(t, { create: anlegen })
        return h
    }
    async function datei(pfad, anlegen = false) {
        const t = teile(pfad)
        const o = await ordner(t.slice(0, -1), anlegen)
        return o.getFileHandle(t.at(-1), { create: anlegen })
    }
    return {
        art, name, handle: wurzel,
        async lesen(pfad) {
            try { return await (await datei(pfad)).getFile() } catch (f) { if (istFehlt(f)) return null; throw f }
        },
        async lesenText(pfad) { const b = await this.lesen(pfad); return b ? b.text() : null },
        async schreiben(pfad, inhalt) {
            const h = await datei(pfad, true)
            const w = await h.createWritable()          // schreibt in eine Kopie, ersetzt erst beim close() → nie halbe Dateien
            try { await w.write(await alsBlob(inhalt)) } catch (f) { await w.abort?.(); throw f }
            await w.close()
        },
        async anhaengen(pfad, text) {
            const h = await datei(pfad, true)
            const vorher = await h.getFile()
            const w = await h.createWritable({ keepExistingData: true })
            try {
                await w.seek(vorher.size)
                await w.write(text)
            } catch (f) { await w.abort?.(); throw f }
            await w.close()
        },
        async liste(pfad = "") {
            let o
            try { o = await ordner(teile(pfad), false) } catch (f) { if (istFehlt(f)) return []; throw f }
            const out = []
            for await (const [name, h] of o.entries()) {
                if (h.kind === "directory") out.push({ name, art: "ordner" })
                else { const f = await h.getFile(); out.push({ name, art: "datei", groesse: f.size, geaendert: f.lastModified }) }
            }
            return out.sort((a, b) => a.name.localeCompare(b.name))
        },
        async loeschen(pfad) {
            const t = teile(pfad)
            try { await (await ordner(t.slice(0, -1), false)).removeEntry(t.at(-1), { recursive: true }) } catch (f) { if (!istFehlt(f)) throw f }
        },
        async existiert(pfad) { return (await this.lesen(pfad)) !== null },
    }
}

// ---------- Arbeitsspeicher ----------
export function speicherVerzeichnis(name = "Arbeitsspeicher", start = {}) {
    const dateien = new Map()        // pfad → { blob, geaendert }
    for (const [p, inhalt] of Object.entries(start)) dateien.set(teile(p).join("/"), { blob: inhalt instanceof Blob ? inhalt : new Blob([inhalt]), geaendert: Date.now() })
    return {
        art: "arbeitsspeicher", name, dateien,
        async lesen(pfad) { return dateien.get(teile(pfad).join("/"))?.blob ?? null },
        async lesenText(pfad) { const b = await this.lesen(pfad); return b ? b.text() : null },
        async schreiben(pfad, inhalt) { dateien.set(teile(pfad).join("/"), { blob: await alsBlob(inhalt), geaendert: Date.now() }) },
        async anhaengen(pfad, text) {
            const p = teile(pfad).join("/")
            const alt = dateien.get(p)?.blob
            dateien.set(p, { blob: new Blob(alt ? [alt, text] : [text]), geaendert: Date.now() })
        },
        async liste(pfad = "") {
            const pre = teile(pfad).join("/")
            const out = new Map()
            for (const [p, d] of dateien) {
                if (pre && !p.startsWith(pre + "/")) continue
                const rest = pre ? p.slice(pre.length + 1) : p
                const [kopf, ...weiter] = rest.split("/")
                if (weiter.length) out.set(kopf, { name: kopf, art: "ordner" })
                else out.set(kopf, { name: kopf, art: "datei", groesse: d.blob.size, geaendert: d.geaendert })
            }
            return [...out.values()].sort((a, b) => a.name.localeCompare(b.name))
        },
        async loeschen(pfad) {
            const p = teile(pfad).join("/")
            for (const k of [...dateien.keys()]) if (k === p || k.startsWith(p + "/")) dateien.delete(k)
        },
        async existiert(pfad) { return dateien.has(teile(pfad).join("/")) },
    }
}

// ---------- IndexedDB (Ersatz für ältere Browser) ----------
export function idbVerzeichnis(dbName = "grove-saat") {
    let offen = null
    const db = () => offen ??= new Promise((ok, fehler) => {
        const a = indexedDB.open(dbName, 1)
        a.onupgradeneeded = () => a.result.createObjectStore("dateien")
        a.onsuccess = () => ok(a.result)
        a.onerror = () => { offen = null; fehler(a.error) }
    })
    const vorgang = async (art, fn) => {
        const d = await db()
        return new Promise((ok, fehler) => {
            const t = d.transaction("dateien", art)
            const anfrage = fn(t.objectStore("dateien"))
            t.oncomplete = () => ok(anfrage?.result)
            t.onerror = () => fehler(t.error)
            t.onabort = () => fehler(t.error)
        })
    }
    const p = (pfad) => teile(pfad).join("/")
    return {
        art: "browser-idb", name: "Browser-Speicher",
        async lesen(pfad) { return (await vorgang("readonly", (s) => s.get(p(pfad))))?.blob ?? null },
        async lesenText(pfad) { const b = await this.lesen(pfad); return b ? b.text() : null },
        async schreiben(pfad, inhalt) { const blob = await alsBlob(inhalt); await vorgang("readwrite", (s) => s.put({ blob, geaendert: Date.now() }, p(pfad))) },
        async anhaengen(pfad, text) {
            const alt = await this.lesen(pfad)
            await this.schreiben(pfad, new Blob(alt ? [alt, text] : [text]))
        },
        async liste(pfad = "") {
            const pre = p(pfad)
            const schluessel = await vorgang("readonly", (s) => s.getAllKeys())
            const out = new Map()
            for (const k of schluessel) {
                if (pre && !k.startsWith(pre + "/")) continue
                const rest = pre ? k.slice(pre.length + 1) : k
                const [kopf, ...weiter] = rest.split("/")
                if (weiter.length) out.set(kopf, { name: kopf, art: "ordner" })
                else { const b = await this.lesen(k); out.set(kopf, { name: kopf, art: "datei", groesse: b?.size ?? 0 }) }
            }
            return [...out.values()].sort((a, b) => a.name.localeCompare(b.name))
        },
        async loeschen(pfad) {
            const pre = p(pfad)
            const schluessel = await vorgang("readonly", (s) => s.getAllKeys())
            await vorgang("readwrite", (s) => { for (const k of schluessel) if (k === pre || k.startsWith(pre + "/")) s.delete(k) })
        },
        async existiert(pfad) { return (await this.lesen(pfad)) !== null },
    }
}

// Alle Dateien eines Verzeichnisses rekursiv (für ZIP-Sicherung und Zusammenführen)
export async function alleDateien(verz, pfad = "") {
    const out = []
    for (const e of await verz.liste(pfad)) {
        const voll = pfad ? `${pfad}/${e.name}` : e.name
        if (e.art === "ordner") out.push(...await alleDateien(verz, voll))
        else out.push(voll)
    }
    return out
}

// Kann der Browser in OPFS mit createWritable schreiben? (Safari konnte das lange nicht)
export function opfsSchreibbar() {
    return typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function"
        && typeof globalThis.FileSystemFileHandle === "function" && "createWritable" in FileSystemFileHandle.prototype
}
