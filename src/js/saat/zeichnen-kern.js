// ==========================================================
// Saat · Zeichnen vergleichen (ohne KI, offline, in wenigen Millisekunden)
//
// Beide Bilder (deine Zeichnung und die Schablone) werden gleich vorbereitet:
//   1. Auf das umschließende Rechteck zuschneiden und mittig auf ein 48×48-Raster skalieren
//      (Seitenverhältnis bleibt) → Größe und Position auf der Fläche sind egal.
//   2. Auf 1 Feld breite Mittellinien ausdünnen (Zhang-Suen) – so zählt die FORM, nicht die Strichdicke
//      (dicke Schrift-Schablone vs. dünner Stift wären sonst schwer vergleichbar).
//   3. Abstandskarte (Chamfer-Abstandstransformation): für jedes Feld der Abstand zur nächsten Linie.
//   4. Treffsicherheit = Anteil deiner Linien, die nah (≤ 3 Felder) an der Schablone liegen.
//      Abdeckung     = Anteil der Schablone, die du nah genug nachgezeichnet hast.
//   5. Ähnlichkeit = harmonisches Mittel beider (F1). Richtig ab 0,85 (zaehlt()).
//   Geeicht mit 25 Kanji in verzerrten, dünnen Fremdschriften als „Handschrift“: ~97 % der richtigen
//   Zeichen zählen, ~3 % der falschen fälschlich (meist fast gleiche wie 人/入, 大/犬).
// Strichreihenfolge und -richtung sind bewusst egal; Kritzeln über alles fällt durch
// die Treffsicherheit, halbe Zeichen durch die Abdeckung.
// Rein rechnerisch – das Bild der Schablone aus Text liefert die Oberfläche (Canvas).
// ==========================================================

export const N = 48
export const SCHWELLE = 0.85
// Zählt als richtig: insgesamt ähnlich UND den größten Teil der Schablone getroffen UND nicht wild gekritzelt
export const zaehlt = (e) => e.wert >= SCHWELLE && e.abdeckung >= 0.75 && e.treffsicherheit >= 0.7
const RAND = 3

// Striche: [[x, y, x, y, …], …] in beliebigen Koordinaten → Raster
export function strichRaster(striche, n = N) {
    const punkte = striche.flat()
    const raster = new Uint8Array(n * n)
    if (punkte.length < 2) return raster
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const s of striche) for (let i = 0; i < s.length; i += 2) {
        minX = Math.min(minX, s[i]); maxX = Math.max(maxX, s[i]); minY = Math.min(minY, s[i + 1]); maxY = Math.max(maxY, s[i + 1])
    }
    const breite = Math.max(maxX - minX, maxY - minY, 1e-6)
    const f = (n - 1 - 2 * RAND) / breite
    const ox = RAND + ((n - 1 - 2 * RAND) - (maxX - minX) * f) / 2
    const oy = RAND + ((n - 1 - 2 * RAND) - (maxY - minY) * f) / 2
    const dicke = Math.max(1, Math.round(n * 0.035))
    const setzen = (x, y) => {
        for (let dy = -dicke; dy <= dicke; dy++) for (let dx = -dicke; dx <= dicke; dx++) {
            if (dx * dx + dy * dy > dicke * dicke + 0.5) continue
            const px = Math.round(x) + dx, py = Math.round(y) + dy
            if (px >= 0 && py >= 0 && px < n && py < n) raster[py * n + px] = 1
        }
    }
    for (const s of striche) {
        if (s.length === 2) { setzen(ox + (s[0] - minX) * f, oy + (s[1] - minY) * f); continue }
        for (let i = 0; i + 3 < s.length; i += 2) {
            const x0 = ox + (s[i] - minX) * f, y0 = oy + (s[i + 1] - minY) * f
            const x1 = ox + (s[i + 2] - minX) * f, y1 = oy + (s[i + 3] - minY) * f
            const schritte = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2))
            for (let k = 0; k <= schritte; k++) setzen(x0 + (x1 - x0) * k / schritte, y0 + (y1 - y0) * k / schritte)
        }
    }
    return raster
}

// Graustufen/Alpha-Bild (z. B. Text aus einem Canvas) → Raster
export function bildRaster(werte, w, h, n = N, grenze = 96) {
    let minX = w, minY = h, maxX = -1, maxY = -1
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (werte[y * w + x] > grenze) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
    }
    const raster = new Uint8Array(n * n)
    if (maxX < 0) return raster
    const breite = Math.max(maxX - minX + 1, maxY - minY + 1)
    const f = (n - 2 * RAND) / breite
    const ox = RAND + ((n - 2 * RAND) - (maxX - minX + 1) * f) / 2
    const oy = RAND + ((n - 2 * RAND) - (maxY - minY + 1) * f) / 2
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        if (werte[y * w + x] <= grenze) continue
        const px = Math.floor(ox + (x - minX) * f), py = Math.floor(oy + (y - minY) * f)
        if (px >= 0 && py >= 0 && px < n && py < n) raster[py * n + px] = 1
    }
    return raster
}

// Chamfer-Abstandstransformation (3-4), Ergebnis in „Feldern“
function abstaende(raster, n) {
    const G = 1e6
    const d = new Float32Array(n * n)
    for (let i = 0; i < n * n; i++) d[i] = raster[i] ? 0 : G
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = y * n + x
        if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 3)
        if (y > 0) {
            d[i] = Math.min(d[i], d[i - n] + 3)
            if (x > 0) d[i] = Math.min(d[i], d[i - n - 1] + 4)
            if (x < n - 1) d[i] = Math.min(d[i], d[i - n + 1] + 4)
        }
    }
    for (let y = n - 1; y >= 0; y--) for (let x = n - 1; x >= 0; x--) {
        const i = y * n + x
        if (x < n - 1) d[i] = Math.min(d[i], d[i + 1] + 3)
        if (y < n - 1) {
            d[i] = Math.min(d[i], d[i + n] + 3)
            if (x < n - 1) d[i] = Math.min(d[i], d[i + n + 1] + 4)
            if (x > 0) d[i] = Math.min(d[i], d[i + n - 1] + 4)
        }
    }
    for (let i = 0; i < n * n; i++) d[i] /= 3
    return d
}

// Zhang-Suen-Ausdünnung: Linien auf ihre 1 Feld breite Mittellinie reduzieren
export function duennen(raster, n = N) {
    const a = Uint8Array.from(raster)
    const P = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? 0 : a[y * n + x])
    let geaendert = true
    while (geaendert) {
        geaendert = false
        for (const schritt of [0, 1]) {
            const weg = []
            for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
                if (!a[y * n + x]) continue
                const p = [P(x, y - 1), P(x + 1, y - 1), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1), P(x - 1, y + 1), P(x - 1, y), P(x - 1, y - 1)]
                const b = p.reduce((s, v) => s + v, 0)
                if (b < 2 || b > 6) continue
                let wechsel = 0
                for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) wechsel++
                if (wechsel !== 1) continue
                if (schritt === 0 ? p[0] * p[2] * p[4] === 0 && p[2] * p[4] * p[6] === 0 : p[0] * p[2] * p[6] === 0 && p[0] * p[4] * p[6] === 0) weg.push(y * n + x)
            }
            for (const i of weg) a[i] = 0
            if (weg.length) geaendert = true
        }
    }
    return a
}

// Ähnlichkeit zweier Raster: { wert 0..1, treffsicherheit, abdeckung }
export function aehnlichkeit(zeichnung, schablone, { n = N, toleranz = 3, mittellinien = true } = {}) {
    if (mittellinien) { zeichnung = duennen(zeichnung, n); schablone = duennen(schablone, n) }
    let za = 0, sa = 0
    for (let i = 0; i < n * n; i++) { za += zeichnung[i]; sa += schablone[i] }
    if (!za || !sa) return { wert: 0, treffsicherheit: 0, abdeckung: 0 }
    const dz = abstaende(zeichnung, n), ds = abstaende(schablone, n)
    let treffer = 0, gedeckt = 0
    for (let i = 0; i < n * n; i++) {
        if (zeichnung[i] && ds[i] <= toleranz) treffer++
        if (schablone[i] && dz[i] <= toleranz) gedeckt++
    }
    const t = treffer / za, a = gedeckt / sa
    return { wert: t + a ? (2 * t * a) / (t + a) : 0, treffsicherheit: t, abdeckung: a }
}

// Striche klein machen: auf 0..1000 runden und Punkte mit < 6 Einheiten Abstand weglassen
export function stricheKompakt(striche, breite, hoehe) {
    const s = Math.max(breite, hoehe) || 1
    return striche.map((strich) => {
        const out = []
        let lx = null, ly = null
        for (let i = 0; i < strich.length; i += 2) {
            const x = Math.round((strich[i] / s) * 1000), y = Math.round((strich[i + 1] / s) * 1000)
            if (lx !== null && Math.hypot(x - lx, y - ly) < 6 && i < strich.length - 2) continue
            out.push(x, y); lx = x; ly = y
        }
        return out
    }).filter((x) => x.length >= 2)
}

// Hat eine Karte eine Zeichen-Schablone?
// Karte.zeichnen = { aufgabe?, text?, striche? } – ohne Striche gilt der Text (Standard: Vorderseite) als Schablone
export const schablonenText = (karte) => (karte?.zeichnen?.text || karte?.vorne?.text || "").trim()
export const zeichenTauglich = (karte) => !!(karte?.zeichnen && (karte.zeichnen.striche?.length || schablonenText(karte)))
export const zeichenAufgabe = (karte) => karte?.zeichnen?.aufgabe?.trim() || karte?.antwort || ""
