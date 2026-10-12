// Mühle · Hilfen für alle Wandler (eigene Datei, damit Wandler und Register sich nicht gegenseitig importieren)
export const endung = (name) => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(i).toLowerCase() : "" }
export const stamm = (name) => { const i = name.lastIndexOf("."); return i > 0 ? name.slice(0, i) : name }
export const neuerName = (name, neueEndung, zusatz = "") => `${stamm(name)}${zusatz}${neueEndung}`
export const istTyp = (datei, mimeAnfang, endungen) =>
    (mimeAnfang && datei.type?.startsWith(mimeAnfang)) || endungen.includes(endung(datei.name))

// Seiten-/Bereichsangabe "1-3, 5, 8-" → [0, 1, 2, 4, 7, 8, …] (0-basiert, nur gültige)
export function bereichLesen(text, anzahl) {
    const t = String(text || "").trim()
    if (!t || /^alle$/i.test(t)) return [...Array(anzahl).keys()]
    const raus = new Set()
    for (const teil of t.split(/[,;\s]+/).filter(Boolean)) {
        const m = teil.match(/^(\d*)\s*-\s*(\d*)$/)
        if (m) {
            const von = m[1] ? +m[1] : 1, bis = m[2] ? +m[2] : anzahl
            for (let i = von; i <= bis; i++) if (i >= 1 && i <= anzahl) raus.add(i - 1)
        } else if (/^\d+$/.test(teil) && +teil >= 1 && +teil <= anzahl) raus.add(+teil - 1)
    }
    return [...raus].sort((a, b) => a - b)
}

// Datei als Text lesen (UTF-8, BOM weg)
export async function alsText(datei) { return (await datei.text()).replace(/^﻿/, "") }

