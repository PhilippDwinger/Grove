// ==========================================================
// Saat · Darstellung von Karten und Blöcken (Lernansicht, Vorschau im Editor)
//   vorderseite(karte, ctx) / rueckseite(karte, ctx) → HTML-Text (alles escaped)
//   aktivieren(element, ctx) → Klicks, Aufgaben, Vorlesen, Medien laden
// ctx = { lager, sprachen: { vorne, hinten }, karteVon(id) → { vorne, antwort } | null,
//         oeffnen(id), vorlesen: bool }
// Neuer Blocktyp: Eintrag in bloecke.js + Funktion in DARSTELLER.
// ==========================================================
import { esc } from "../kern/html.js"
import { BLOCK_SYMBOL, S } from "./symbole.js"
import { BLOECKE } from "./bloecke.js"
import { istExtern } from "./format.js"
import { normalAntwort, abstand } from "./hilfen.js"

// ---------- kleine Textformatierung (bewusst schlicht, sicher) ----------
export function inline(text) {
    return esc(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
}
export function absaetze(text) {
    return String(text ?? "").trim().split(/\n\s*\n/).map((absatz) => {
        const zeilen = absatz.split("\n")
        if (zeilen.every((z) => /^\s*[-•]\s+/.test(z))) return `<ul>${zeilen.map((z) => `<li>${inline(z.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")}</ul>`
        if (zeilen.every((z) => /^\s*\d+[.)]\s+/.test(z))) return `<ol>${zeilen.map((z) => `<li>${inline(z.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("")}</ol>`
        return `<p>${zeilen.map(inline).join("<br>")}</p>`
    }).join("")
}
function markieren(text, wort) {
    const t = esc(text)
    const w = String(wort || "").trim()
    if (!w) return t
    const ew = esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return t.replace(new RegExp(ew, "gi"), (m) => `<mark>${m}</mark>`)
}
const lang = (code) => (code ? ` lang="${esc(code)}"` : "")
const kopf = (typ, titel) => `<header class="sb__kopf">${BLOCK_SYMBOL[typ] ?? BLOCK_SYMBOL.unbekannt}<span>${esc(titel)}</span></header>`
const medienTag = (art, quelle, extra = "") =>
    `<${art} data-quelle="${esc(quelle)}"${extra}${art === "img" ? "" : ` controls preload="metadata"></${art}`}>`

// ---------- Darsteller je Blocktyp ----------
const DARSTELLER = {
    text: (b) => `<div class="sb__text">${absaetze(b.text)}</div>`,
    bild: (b) => `<figure class="sb__bild">${medienTag("img", b.quelle, ` alt="${esc(b.alt || "")}" loading="lazy"`)}${b.unterschrift ? `<figcaption>${inline(b.unterschrift)}</figcaption>` : ""}</figure>`,
    geschichte: (b) => `${kopf("geschichte", b.titel || "Geschichte")}<div class="sb__text sb__erzaehlt">${absaetze(b.text)}</div>`,
    satz: (b, ctx, karte) => `
        <p class="sb__satz"${lang(b.sprache || ctx.sprachen?.vorne)}>${markieren(b.text, b.markierung || karte.vorne?.text)}</p>
        ${b.lesung ? `<p class="sb__lesung">${esc(b.lesung)}</p>` : ""}
        ${ctx.vorlesen !== false ? `<button type="button" class="sb-mini" data-vorlesen="${esc(b.text)}" data-sprache="${esc(b.sprache || ctx.sprachen?.vorne || "")}" title="Vorlesen">${S.lautsprecher}</button>` : ""}`,
    uebersetzung: (b, ctx, karte) => {
        const bezug = b.bezug ? (karte.hinten || []).find((x) => x.id === b.bezug) : null
        const worauf = bezug ? (bezug.text || "").replace(/\{\{|\}\}/g, "") : ""
        return `<p class="sb__uebersetzung"${lang(b.sprache || ctx.sprachen?.hinten)}>${inline(b.text)}</p>
            ${worauf && !istDirektDanach(karte, b) ? `<p class="sb__bezug">zu: <span${lang(bezug.sprache)}>${esc(worauf)}</span></p>` : ""}
            ${b.notiz ? `<p class="sb__notiz">${inline(b.notiz)}</p>` : ""}`
    },
    aussprache: (b, ctx, karte) => {
        const text = b.text || karte.vorne?.text || ""
        const sprache = b.sprache || ctx.sprachen?.vorne || ""
        return `<div class="sb__aussprache">
            ${b.audio ? medienTag("audio", b.audio) : ""}
            ${ctx.vorlesen !== false && text ? `<button type="button" class="g-knopf-leise sb-vorlesen" data-vorlesen="${esc(text)}" data-sprache="${esc(sprache)}">${S.lautsprecher}<span>Anhören</span></button>` : ""}
            ${b.lautschrift ? `<span class="sb__laut">${esc(b.lautschrift)}</span>` : ""}
        </div>`
    },
    merksatz: (b) => `${kopf("merksatz", "Eselsbrücke")}<div class="sb__text">${absaetze(b.text)}</div>`,
    beispiele: (b) => `${kopf("beispiele", b.titel || "Beispiele")}<ul class="sb__beispiele">${(b.eintraege || []).filter((e) => e.text?.trim()).map((e) =>
        `<li><span>${inline(e.text)}</span>${e.zusatz ? `<small>${inline(e.zusatz)}</small>` : ""}</li>`).join("")}</ul>`,
    hinweis: (b) => b.verborgen === false
        ? `${kopf("hinweis", "Tipp")}<div class="sb__text">${absaetze(b.text)}</div>`
        : `<button type="button" class="sb-aufdecken" data-aufdecken>${BLOCK_SYMBOL.hinweis}<span>Tipp anzeigen</span></button><div class="sb__text" hidden>${absaetze(b.text)}</div>`,
    tabelle: (b) => {
        const zeilen = (b.zeilen || []).filter((z) => z.some((x) => String(x).trim()))
        if (!zeilen.length) return ""
        const [erste, ...rest] = zeilen
        const zelle = (t, tag) => `<${tag}>${inline(t)}</${tag}>`
        return `${b.titel ? kopf("tabelle", b.titel) : ""}<div class="sb__tabelle"><table>
            ${b.kopf !== false ? `<thead><tr>${erste.map((x) => zelle(x, "th")).join("")}</tr></thead><tbody>` : `<tbody><tr>${erste.map((x) => zelle(x, "td")).join("")}</tr>`}
            ${rest.map((z) => `<tr>${z.map((x) => zelle(x, "td")).join("")}</tr>`).join("")}</tbody></table></div>`
    },
    verweis: (b, ctx) => `${kopf("verweis", b.titel || "Verwandte Karten")}<div class="sb__verweise">${(b.karten || []).map((id) => {
        const k = ctx.karteVon?.(id)
        return k ? `<button type="button" class="sb-verweis" data-karte="${esc(id)}"><span${lang(ctx.sprachen?.vorne)}>${esc(k.vorne)}</span><small>${esc(k.antwort)}</small></button>`
            : `<span class="sb-verweis sb-verweis--fehlt" title="Diese Karte ist in keiner geladenen Lerndatei">${esc(id)}</span>`
    }).join("")}</div>`,
    lueckentext: (b) => {
        let n = 0
        const teile = esc(b.text || "").replace(/\{\{([^}]+)\}\}/g, (_, loesung) => {
            const breite = Math.max(3, ...loesung.split("|").map((x) => [...x].length)) + 1
            return `<input class="sb-luecke" data-loesung="${loesung}" data-n="${n++}" style="--zeichen:${breite}" autocomplete="off" spellcheck="false" aria-label="Lücke ${n}">`
        })
        return `${kopf("lueckentext", "Lückentext")}<form class="sb-aufgabe" data-luecken novalidate><p class="sb__luecken">${teile}</p>
            ${b.hinweis ? `<p class="sb__notiz">${inline(b.hinweis)}</p>` : ""}
            <div class="sb-aufgabe__fuss"><button class="g-knopf-leise" type="submit">Prüfen</button><button class="g-knopf-text" type="button" data-loesen>Lösung zeigen</button><span class="sb-aufgabe__ergebnis" role="status"></span></div></form>`
    },
    auswahl: (b) => `${kopf("auswahl", "Mini-Quiz")}<div class="sb-aufgabe" data-quiz>
        ${b.frage ? `<p class="sb__frage">${inline(b.frage)}</p>` : ""}
        <div class="sb-quiz">${(b.optionen || []).filter((o) => o.text?.trim()).map((o) => `<button type="button" data-richtig="${o.richtig ? 1 : 0}">${inline(o.text)}</button>`).join("")}</div>
        ${b.erklaerung ? `<p class="sb__notiz" hidden data-erklaerung>${inline(b.erklaerung)}</p>` : ""}</div>`,
    eintippen: (b, ctx, karte) => `${kopf("eintippen", "Eintippen")}<form class="sb-aufgabe" data-tippen="${esc(b.erwartet || karte.antwort || "")}" data-alternativen="${esc(JSON.stringify(b.erwartet ? [] : karte.alternativen || []))}" novalidate>
        ${b.frage ? `<p class="sb__frage">${inline(b.frage)}</p>` : ""}
        <div class="sb-tippen"><input type="text" autocomplete="off" spellcheck="false" aria-label="Deine Antwort"><button class="g-knopf-leise" type="submit">Prüfen</button></div>
        <span class="sb-aufgabe__ergebnis" role="status"></span></form>`,
    code: (b) => `<pre class="sb__code"${b.sprache ? ` data-sprache="${esc(b.sprache)}"` : ""}><code>${esc(b.code)}</code></pre>`,
    medien: (b) => `<figure class="sb__medien">${/\.(mp3|m4a|ogg|opus|wav|flac|aac)(\?|$)/i.test(b.quelle) ? medienTag("audio", b.quelle) : medienTag("video", b.quelle, ` playsinline`)}${b.titel ? `<figcaption>${inline(b.titel)}</figcaption>` : ""}</figure>`,
}

// Übersetzung direkt unter ihrem Satz braucht keinen „zu: …“-Hinweis
function istDirektDanach(karte, block) {
    const liste = karte.hinten || []
    const i = liste.indexOf(block)
    return i > 0 && liste[i - 1].id === block.bezug
}

export function blockHtml(b, ctx, karte) {
    const def = BLOECKE[b.typ]
    const fn = DARSTELLER[b.typ]
    if (!def || !fn) {
        return `<section class="sb sb--unbekannt">${kopf("unbekannt", `Unbekannter Block „${b.typ}“`)}<p class="sb__notiz">Dieser Inhalt stammt aus einer neueren Saat-Version. Er bleibt in der Datei erhalten.</p></section>`
    }
    if (def.leer(b) && b.typ !== "aussprache") return ""
    const inhalt = fn(b, ctx, karte)
    return inhalt.trim() ? `<section class="sb sb--${b.typ}" data-block="${esc(b.id || "")}">${inhalt}</section>` : ""
}

export function vorderseite(karte, ctx = {}) {
    const v = karte.vorne || {}
    return `<div class="sk-vorne">
        ${v.text ? `<p class="sk-begriff"${lang(ctx.sprachen?.vorne)}>${esc(v.text)}</p>` : ""}
        ${v.zusatz ? `<p class="sk-zusatz">${esc(v.zusatz)}</p>` : ""}
        ${(v.bloecke || []).map((b) => blockHtml(b, ctx, karte)).join("")}
    </div>`
}

export function rueckseite(karte, ctx = {}) {
    const alt = (karte.alternativen || []).filter(Boolean)
    return `<div class="sk-hinten">
        ${karte.antwort ? `<p class="sk-antwort"${lang(ctx.sprachen?.hinten)}>${esc(karte.antwort)}</p>` : ""}
        ${alt.length ? `<p class="sk-alternativen">auch: ${alt.map(esc).join(" · ")}</p>` : ""}
        <div class="sk-bloecke">${(karte.hinten || []).map((b) => blockHtml(b, ctx, karte)).join("")}</div>
    </div>`
}

// ---------- Leben einhauchen ----------
const objektUrls = new Map()   // medien/… → blob:-Adresse (bleibt für die Sitzung)

export function aktivieren(el, ctx = {}) {
    el.querySelectorAll("[data-aufdecken]").forEach((k) => k.addEventListener("click", () => {
        k.nextElementSibling.hidden = false
        k.remove()
    }))
    el.querySelectorAll("[data-vorlesen]").forEach((k) => vorlesenKnopf(k))
    el.querySelectorAll("[data-karte]").forEach((k) => k.addEventListener("click", () => ctx.oeffnen?.(k.dataset.karte)))
    el.querySelectorAll("form[data-luecken]").forEach(lueckenAufgabe)
    el.querySelectorAll("[data-quiz]").forEach(quizAufgabe)
    el.querySelectorAll("form[data-tippen]").forEach(tippAufgabe)
    el.querySelectorAll("[data-quelle]").forEach((m) => medienLaden(m, ctx.lager))
}

async function medienLaden(m, lager) {
    const quelle = m.dataset.quelle
    const fehlt = (text) => {
        const ersatz = document.createElement("div")
        ersatz.className = "sb-medium-fehlt"
        ersatz.innerHTML = `${S.warnung}<span>${esc(text)}</span>`
        m.replaceWith(ersatz)
    }
    if (!quelle) return fehlt("Kein Medium angegeben")
    if (istExtern(quelle) || quelle.startsWith("data:")) {
        m.addEventListener("error", () => fehlt(navigator.onLine ? `Nicht erreichbar: ${quelle}` : "Offline – dieses Medium liegt im Internet"), { once: true })
        m.src = quelle
        return
    }
    if (!objektUrls.has(quelle)) {
        const blob = await lager?.medienDatei(quelle)
        objektUrls.set(quelle, blob ? URL.createObjectURL(blob) : null)
    }
    const url = objektUrls.get(quelle)
    if (!url) return fehlt(`Fehlt im Lernspeicher: ${quelle.replace(/^medien\//, "")}`)
    m.addEventListener("error", () => fehlt(`Datei beschädigt: ${quelle.replace(/^medien\//, "")}`), { once: true })
    m.src = url
}
export function medienUrlVergessen(quelle) { objektUrls.delete(quelle) }

// Vorlesen über die Sprachausgabe des Geräts (funktioniert offline, wenn eine Stimme installiert ist)
function stimme(sprache) {
    const alle = window.speechSynthesis?.getVoices?.() || []
    if (!sprache) return alle.find((v) => v.default) || alle[0] || null
    const s = sprache.toLowerCase()
    return alle.find((v) => v.lang.toLowerCase() === s) || alle.find((v) => v.lang.toLowerCase().startsWith(s.split("-")[0])) || null
}
export function vorlesen(text, sprache) {
    if (!("speechSynthesis" in window)) return false
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    if (sprache) u.lang = sprache
    const v = stimme(sprache)
    if (v) u.voice = v
    u.rate = 0.9
    speechSynthesis.speak(u)
    return true
}
function vorlesenKnopf(k) {
    if (!("speechSynthesis" in window)) { k.hidden = true; return }
    const pruefen = () => {
        const spr = k.dataset.sprache
        const stimmen = speechSynthesis.getVoices()
        if (spr && stimmen.length && !stimme(spr)) {
            k.disabled = true
            k.title = "Auf diesem Gerät ist keine passende Stimme installiert"
        }
    }
    pruefen()
    speechSynthesis.addEventListener?.("voiceschanged", pruefen, { once: true })
    k.addEventListener("click", (e) => { e.stopPropagation(); vorlesen(k.dataset.vorlesen, k.dataset.sprache) })
}

// ---------- Aufgaben ----------
const passt = (eingabe, loesungen) => {
    const n = normalAntwort(eingabe)
    if (!n) return "leer"
    for (const l of loesungen) {
        const z = normalAntwort(l)
        if (n === z) return "richtig"
        if (z.length >= 5 && abstand(n, z) <= Math.floor(z.length / 6)) return "fast"
    }
    return "falsch"
}

function lueckenAufgabe(form) {
    const ergebnis = form.querySelector(".sb-aufgabe__ergebnis")
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        let richtig = 0
        const felder = [...form.querySelectorAll(".sb-luecke")]
        for (const f of felder) {
            const r = passt(f.value, f.dataset.loesung.split("|"))
            f.dataset.ergebnis = r
            if (r !== "falsch" && r !== "leer") richtig++
        }
        ergebnis.textContent = richtig === felder.length ? "Alles richtig." : `${richtig} von ${felder.length} richtig`
        ergebnis.dataset.gut = richtig === felder.length ? "1" : "0"
    })
    form.querySelector("[data-loesen]").addEventListener("click", () => {
        for (const f of form.querySelectorAll(".sb-luecke")) { f.value = f.dataset.loesung.split("|")[0]; f.dataset.ergebnis = "geloest" }
        ergebnis.textContent = ""
    })
}

function quizAufgabe(box) {
    const knoepfe = box.querySelectorAll(".sb-quiz button")
    knoepfe.forEach((k) => k.addEventListener("click", () => {
        if (box.dataset.fertig) return
        box.dataset.fertig = "1"
        knoepfe.forEach((x) => { x.disabled = true; if (x.dataset.richtig === "1") x.dataset.ergebnis = "richtig" })
        if (k.dataset.richtig !== "1") k.dataset.ergebnis = "falsch"
        const erk = box.querySelector("[data-erklaerung]")
        if (erk) erk.hidden = false
    }))
}

function tippAufgabe(form) {
    const feld = form.querySelector("input")
    const ergebnis = form.querySelector(".sb-aufgabe__ergebnis")
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        const loesungen = [form.dataset.tippen, ...JSON.parse(form.dataset.alternativen || "[]")]
        const r = passt(feld.value, loesungen)
        feld.dataset.ergebnis = r
        ergebnis.textContent = r === "richtig" ? "Richtig." : r === "fast" ? `Fast – richtig wäre: ${form.dataset.tippen}` : r === "leer" ? "" : `Richtig wäre: ${form.dataset.tippen}`
        ergebnis.dataset.gut = r === "richtig" || r === "fast" ? "1" : "0"
    })
}
