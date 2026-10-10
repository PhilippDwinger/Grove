// ==========================================================
// Laub · Palette aus einer einzigen Farbe ableiten
// Konzept HSL: Farbton (h, 0–360°), Sättigung (s) und Helligkeit (l).
// Wir behalten den Farbton der gewählten Farbe und bauen daraus alle
// Flächen, Linien und Texte – dunkel oder hell.
// ==========================================================

export function hexZuHsl(hex) {
    const n = parseInt(hex.slice(1), 16)
    let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
        h *= 60
    }
    return [h, s * 100, l * 100]
}

export function hslZuHex(h, s, l) {
    s /= 100; l /= 100
    const k = (n) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase()
}

// grundton = die Akzentfarbe, die man mag; hell = helles Thema
export function paletteAus(grundton, hell = false) {
    const [h, s] = hexZuHsl(grundton)
    const sat = Math.max(35, Math.min(85, s))
    const ruhig = Math.min(28, sat * 0.35)     // Flächen nur leicht eingefärbt
    if (!hell) return {
        ground: hslZuHex(h, ruhig, 10), "ground-deep": hslZuHex(h, ruhig, 7.5),
        surface: hslZuHex(h, ruhig, 13), "surface-hi": hslZuHex(h, ruhig, 15.5),
        border: hslZuHex(h, ruhig, 17), "border-hi": hslZuHex(h, ruhig * 0.9, 22),
        amber: hslZuHex(h, sat, 62), "amber-light": hslZuHex(h, sat * 0.9, 75),
        flieder: hslZuHex((h + 150) % 360, 40, 74),
        text: hslZuHex(h, 30, 90), "text-soft": hslZuHex(h, 18, 77), muted: hslZuHex(h, 14, 58),
        gut: hslZuHex(110, 45, 80), fehler: hslZuHex(10, 70, 70),
    }
    return {
        ground: hslZuHex(h, 30, 95), "ground-deep": hslZuHex(h, 26, 91),
        surface: hslZuHex(h, 40, 99), "surface-hi": hslZuHex(h, 34, 97),
        border: hslZuHex(h, 22, 86), "border-hi": hslZuHex(h, 18, 78),
        amber: hslZuHex(h, sat, 40), "amber-light": hslZuHex(h, sat, 31),
        flieder: hslZuHex((h + 150) % 360, 30, 42),
        text: hslZuHex(h, 16, 13), "text-soft": hslZuHex(h, 10, 29), muted: hslZuHex(h, 8, 45),
        gut: hslZuHex(130, 35, 36), fehler: hslZuHex(6, 52, 46),
    }
}
