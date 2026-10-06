// ==========================================================
// Myzel · Vorschläge beim Tippen von [[
// Zeigt passende Notiz-Titel direkt am Cursor an.
// ==========================================================
export function verbindeVorschlaege(feld, liste, holeTitel) {
    let aktiv = -1, treffer = [], start = -1

    function cursorPosition() {
        // Unsichtbarer Spiegel des Textfelds, um die Pixel-Position des Cursors zu finden
        const spiegel = document.createElement("div")
        const stil = getComputedStyle(feld)
        for (const k of ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "padding", "border", "boxSizing", "whiteSpace", "wordWrap", "width"]) {
            spiegel.style[k] = stil[k]
        }
        Object.assign(spiegel.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word" })
        spiegel.textContent = feld.value.slice(0, feld.selectionStart)
        const marke = document.createElement("span")
        marke.textContent = "​"
        spiegel.append(marke)
        document.body.append(spiegel)
        const pos = { x: marke.offsetLeft, y: marke.offsetTop + marke.offsetHeight }
        spiegel.remove()
        return pos
    }

    function schliesse() {
        liste.hidden = true
        start = -1; aktiv = -1
    }

    function zeige() {
        const vorText = feld.value.slice(0, feld.selectionStart)
        const m = vorText.match(/\[\[([^\[\]\n|]*)$/)
        if (!m) return schliesse()
        start = feld.selectionStart - m[1].length
        const suche = m[1].toLowerCase()
        treffer = holeTitel().filter((t) => t.toLowerCase().includes(suche)).slice(0, 7)
        if (suche && !treffer.some((t) => t.toLowerCase() === suche)) treffer.push({ neu: m[1] })
        if (!treffer.length) return schliesse()
        aktiv = 0
        liste.replaceChildren(...treffer.map((t, i) => {
            const el = document.createElement("button")
            el.type = "button"
            el.className = "vorschlag" + (i === aktiv ? " aktiv" : "")
            el.innerHTML = typeof t === "string" ? "" : "<small>Neue Notiz:</small> "
            el.append(typeof t === "string" ? t : t.neu)
            el.addEventListener("mousedown", (e) => { e.preventDefault(); waehle(i) })
            return el
        }))
        const pos = cursorPosition()
        liste.style.left = `${Math.min(pos.x, feld.clientWidth - 240)}px`
        liste.style.top = `${pos.y - feld.scrollTop + 6}px`
        liste.hidden = false
    }

    function waehle(i) {
        const t = treffer[i]
        const titel = typeof t === "string" ? t : t.neu.trim()
        const nach = feld.value.slice(feld.selectionStart).replace(/^[^\]\n]*\]\]/, "")
        feld.value = feld.value.slice(0, start) + titel + "]]" + nach
        const cursor = start + titel.length + 2
        feld.setSelectionRange(cursor, cursor)
        schliesse()
        feld.dispatchEvent(new Event("input", { bubbles: true }))
    }

    feld.addEventListener("input", zeige)
    feld.addEventListener("click", zeige)
    feld.addEventListener("blur", () => setTimeout(schliesse, 100))
    feld.addEventListener("keydown", (e) => {
        if (liste.hidden) return
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            aktiv = (aktiv + (e.key === "ArrowDown" ? 1 : -1) + treffer.length) % treffer.length
            liste.querySelectorAll(".vorschlag").forEach((el, i) => el.classList.toggle("aktiv", i === aktiv))
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault()
            waehle(aktiv)
        } else if (e.key === "Escape") {
            schliesse()
        }
    })
}
