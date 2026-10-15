// ==========================================================
// Saat · Antworten selbst schreiben – prüfen, ob eine Eingabe passt
//
// Gilt als richtig: Antwort, Alternativen und „Lösungen zum Eintippen“ (Feld `eingaben`,
// z. B. Romaji zu Kanji/Kana). Großzügig, aber nicht beliebig:
//   • Groß/klein, Leerraum, Satzzeichen (auch japanische 。、「」), Bindestriche egal
//   • ä/ö/ü/ß = ae/oe/ue/ss, Artikel vorne (der/die/das, the, to …) egal
//   • Katakana = Hiragana; Romaji: ā/â/aa = a, ō/ou/oo = o, ū/uu = u …
//   • Teile einer Antwort wie „Reis; Mahlzeit“ zählen einzeln, Klammern sind optional
//   • kleine Tippfehler bei längeren lateinischen Wörtern → „fast“ (zählt, mit Hinweis)
// ==========================================================
import { abstand } from "./hilfen.js"

const ARTIKEL = /^(der|die|das|den|dem|des|ein|eine|einen|the|a|an|to|le|la|les|l'|el|los|las|il|lo|gli)\s+/

function grund(text) {
    return String(text ?? "")
        .normalize("NFKC")
        .toLocaleLowerCase("de-DE")
        .replace(/[ァ-ヶ]/g, (z) => String.fromCharCode(z.charCodeAt(0) - 0x60))   // Katakana → Hiragana
        .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
        .replace(/[.,;:!?¡¿"'„“”‚‘’«»()\[\]{}…。、！？・「」『』〜~\-–—_/\\]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(ARTIKEL, "")
}

// Romaji: Längezeichen und doppelte Vokale zusammenfassen (nur für lateinische Schrift)
function romaji(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/ou/g, "o").replace(/([aeiou])\1+/g, "$1").replace(/n'/g, "n").replace(/\s+/g, "")
}

const ohneAkzent = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
const lateinisch = (t) => /^[a-z0-9 ]+$/.test(ohneAkzent(t))

// Alle Varianten einer Lösung (Teile, ohne Klammerzusatz)
export function varianten(loesung) {
    const out = new Set()
    const roh = String(loesung ?? "").trim()
    if (!roh) return []
    const teile = [roh, ...roh.split(/\s*[;|/]\s*/), roh.replace(/\s*\([^)]*\)\s*/g, " ").trim()]
    for (const t of teile) { const g = grund(t); if (g) out.add(g) }
    return [...out]
}

export function loesungenVon(karte) {
    return [karte?.antwort, ...(karte?.alternativen || []), ...(karte?.eingaben || [])].filter((x) => String(x ?? "").trim())
}

// Ergebnis: { ergebnis: "richtig" | "fast" | "falsch" | "leer", loesung } – loesung = die getroffene/nächste Lösung
export function eingabePruefen(eingabe, loesungen, { japanisch = false } = {}) {
    const e = grund(eingabe)
    if (!e) return { ergebnis: "leer", loesung: loesungen[0] ?? "" }
    let beste = null
    for (const l of loesungen) {
        for (const v of varianten(l)) {
            if (v === e) return { ergebnis: "richtig", loesung: l }
            if (lateinisch(v) && lateinisch(e)) {
                if (v.replace(/ /g, "") === e.replace(/ /g, "")) return { ergebnis: "richtig", loesung: l }
                if (japanisch || /[āēīōūâêîôû]/.test(String(l))) {
                    if (romaji(v) === romaji(e)) return { ergebnis: "richtig", loesung: l }
                }
                if (v.length >= 5) {
                    const d = abstand(e, v)
                    if (d <= Math.floor(v.length / 6) && (!beste || d < beste.d)) beste = { d, loesung: l }
                }
            }
        }
    }
    if (beste) return { ergebnis: "fast", loesung: beste.loesung }
    return { ergebnis: "falsch", loesung: loesungen[0] ?? "" }
}

// Taugt eine Karte zum Schreiben-Modus? (es gibt eine kurze Lösung)
export const schreibTauglich = (karte) => loesungenVon(karte).some((l) => l.length <= 80)
