// ==========================================================
// Myzel · Netz (Graph aller Notizen)
// Knoten = Notizen, Fäden = Verknüpfungen.
// Ziehen = verschieben, Mausrad / zwei Finger = zoomen,
// Knoten ziehen = umsortieren, Klick = Notiz öffnen.
// ==========================================================
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from "d3-force"

const FARBEN = {
    faden: "rgba(227,161,90,0.22)",
    fadenHell: "rgba(242,192,138,0.75)",
    knoten: "#E3A15A",
    knotenLeise: "rgba(227,161,90,0.45)",
    schrift: "rgba(239,230,214,0.85)",
    schriftLeise: "rgba(205,191,174,0.55)",
}

export function erstelleNetz(leinwand, { beiKlick }) {
    const ctx = leinwand.getContext("2d")
    let knoten = [], faeden = [], sim = null
    let sicht = { x: 0, y: 0, k: 1 }
    let schwebe = null, gezogen = null, verschoben = false
    let pfeil = null
    const zeiger = new Map()

    function groesse() {
        const r = leinwand.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        leinwand.width = r.width * dpr
        leinwand.height = r.height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        return r
    }

    function setzeDaten(notizen, links, fokusId = null) {
        const alt = new Map(knoten.map((k) => [k.id, k]))
        const grad = new Map()
        for (const l of links) {
            grad.set(l.von_id, (grad.get(l.von_id) || 0) + 1)
            grad.set(l.nach_id, (grad.get(l.nach_id) || 0) + 1)
        }
        knoten = notizen.map((n) => {
            const k = alt.get(n.id) || {}
            return Object.assign(k, { id: n.id, titel: n.titel || "Ohne Titel", grad: grad.get(n.id) || 0 })
        })
        const ids = new Set(knoten.map((k) => k.id))
        faeden = links.filter((l) => ids.has(l.von_id) && ids.has(l.nach_id))
            .map((l) => ({ source: l.von_id, target: l.nach_id }))

        const r = groesse()
        sim?.stop()
        sim = forceSimulation(knoten)
            .force("link", forceLink(faeden).id((d) => d.id).distance(80).strength(0.6))
            .force("abstossen", forceManyBody().strength(-220))
            .force("mitte", forceCenter(0, 0))
            .force("x", forceX(0).strength(0.04))
            .force("y", forceY(0).strength(0.04))
            .force("platz", forceCollide().radius((d) => radius(d) + 14))
            .on("tick", zeichne)
        if (!alt.size) sicht = { x: r.width / 2, y: r.height / 2, k: 1 }
        fokus(fokusId)
    }

    function fokus(id) { pfeil = id }

    function radius(k) { return 5 + Math.sqrt(k.grad) * 3 }

    function nachbarn(id) {
        const s = new Set([id])
        for (const f of faeden) {
            if (f.source.id === id) s.add(f.target.id)
            if (f.target.id === id) s.add(f.source.id)
        }
        return s
    }

    function zeichne() {
        const r = leinwand.getBoundingClientRect()
        ctx.clearRect(0, 0, r.width, r.height)
        ctx.save()
        ctx.translate(sicht.x, sicht.y)
        ctx.scale(sicht.k, sicht.k)

        const hervor = schwebe ? nachbarn(schwebe.id) : (pfeil ? nachbarn(pfeil) : null)

        // Fäden – leicht gebogen wie Pilzfäden
        for (const f of faeden) {
            const an = hervor && hervor.has(f.source.id) && hervor.has(f.target.id)
            ctx.strokeStyle = an ? FARBEN.fadenHell : FARBEN.faden
            ctx.lineWidth = (an ? 1.6 : 1) / sicht.k
            const mx = (f.source.x + f.target.x) / 2 + (f.target.y - f.source.y) * 0.12
            const my = (f.source.y + f.target.y) / 2 - (f.target.x - f.source.x) * 0.12
            ctx.beginPath()
            ctx.moveTo(f.source.x, f.source.y)
            ctx.quadraticCurveTo(mx, my, f.target.x, f.target.y)
            ctx.stroke()
        }

        // Knoten mit warmem Schein
        for (const k of knoten) {
            const leise = hervor && !hervor.has(k.id)
            const rad = radius(k)
            if (!leise) {
                const glow = ctx.createRadialGradient(k.x, k.y, 0, k.x, k.y, rad * 3)
                glow.addColorStop(0, "rgba(227,161,90,0.35)")
                glow.addColorStop(1, "rgba(227,161,90,0)")
                ctx.fillStyle = glow
                ctx.beginPath(); ctx.arc(k.x, k.y, rad * 3, 0, Math.PI * 2); ctx.fill()
            }
            ctx.fillStyle = leise ? FARBEN.knotenLeise : FARBEN.knoten
            ctx.beginPath(); ctx.arc(k.x, k.y, rad, 0, Math.PI * 2); ctx.fill()
            if (k.id === pfeil) {
                ctx.strokeStyle = "#F2C08A"; ctx.lineWidth = 2 / sicht.k
                ctx.beginPath(); ctx.arc(k.x, k.y, rad + 4, 0, Math.PI * 2); ctx.stroke()
            }
        }

        // Beschriftungen: bei Zoom alle, sonst die wichtigen
        ctx.textAlign = "center"
        ctx.font = `${13 / sicht.k}px "Instrument Sans", system-ui, sans-serif`
        for (const k of knoten) {
            const zeigen = sicht.k > 1.1 || k.grad >= 2 || (hervor && hervor.has(k.id)) || knoten.length < 25
            if (!zeigen) continue
            const leise = hervor && !hervor.has(k.id)
            ctx.fillStyle = leise ? FARBEN.schriftLeise : FARBEN.schrift
            ctx.fillText(kurz(k.titel), k.x, k.y + radius(k) + 15 / sicht.k)
        }
        ctx.restore()
    }

    function kurz(t) { return t.length > 28 ? t.slice(0, 27) + "…" : t }

    // ---------- Bedienung ----------
    function weltPunkt(e) {
        const r = leinwand.getBoundingClientRect()
        return { x: (e.clientX - r.left - sicht.x) / sicht.k, y: (e.clientY - r.top - sicht.y) / sicht.k }
    }
    function knotenBei(p) {
        for (let i = knoten.length - 1; i >= 0; i--) {
            const k = knoten[i]
            if ((k.x - p.x) ** 2 + (k.y - p.y) ** 2 < (radius(k) + 6) ** 2) return k
        }
        return null
    }

    leinwand.addEventListener("pointerdown", (e) => {
        leinwand.setPointerCapture(e.pointerId)
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY })
        verschoben = false
        if (zeiger.size === 1) {
            gezogen = knotenBei(weltPunkt(e))
            if (gezogen) { gezogen.fx = gezogen.x; gezogen.fy = gezogen.y; sim.alphaTarget(0.25).restart() }
        }
    })
    leinwand.addEventListener("pointermove", (e) => {
        const vorher = zeiger.get(e.pointerId)
        if (!vorher) {
            const k = knotenBei(weltPunkt(e))
            if (k !== schwebe) { schwebe = k; leinwand.style.cursor = k ? "pointer" : "grab"; zeichne() }
            return
        }
        const dx = e.clientX - vorher.x, dy = e.clientY - vorher.y
        if (Math.abs(dx) + Math.abs(dy) > 3) verschoben = true
        if (zeiger.size === 2) {
            // Zwei Finger: zoomen
            const [a, b] = [...zeiger.values()]
            const abstandVorher = Math.hypot(a.x - b.x, a.y - b.y)
            zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY })
            const [c, d] = [...zeiger.values()]
            const abstandJetzt = Math.hypot(c.x - d.x, c.y - d.y)
            zoome(abstandJetzt / abstandVorher, (c.x + d.x) / 2, (c.y + d.y) / 2)
            return
        }
        zeiger.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (gezogen) {
            const p = weltPunkt(e)
            gezogen.fx = p.x; gezogen.fy = p.y
        } else {
            sicht.x += dx; sicht.y += dy
            zeichne()
        }
    })
    function loslassen(e) {
        zeiger.delete(e.pointerId)
        if (gezogen) {
            if (!verschoben) beiKlick(gezogen.id)
            gezogen.fx = null; gezogen.fy = null
            sim.alphaTarget(0)
            gezogen = null
        }
    }
    leinwand.addEventListener("pointerup", loslassen)
    leinwand.addEventListener("pointercancel", loslassen)
    leinwand.addEventListener("pointerleave", () => { if (schwebe) { schwebe = null; zeichne() } })

    leinwand.addEventListener("wheel", (e) => {
        e.preventDefault()
        const r = leinwand.getBoundingClientRect()
        zoome(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY)
    }, { passive: false })

    function zoome(faktor, cx, cy) {
        const r = leinwand.getBoundingClientRect()
        const px = cx - r.left, py = cy - r.top
        const k = Math.min(4, Math.max(0.25, sicht.k * faktor))
        sicht.x = px - (px - sicht.x) * (k / sicht.k)
        sicht.y = py - (py - sicht.y) * (k / sicht.k)
        sicht.k = k
        zeichne()
    }

    new ResizeObserver(() => { groesse(); zeichne() }).observe(leinwand)

    return {
        setzeDaten,
        fokus: (id) => { fokus(id); zeichne() },
        stop: () => sim?.stop(),
        weiter: () => sim?.alpha(0.3).restart(),
    }
}
