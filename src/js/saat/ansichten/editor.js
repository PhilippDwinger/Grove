// ==========================================================
// Saat · Editor für Lerndateien
// Links: Datei-Angaben + Kartenliste · Mitte: Karte mit Vorderseite, Antwort und
// Rückseiten-Blöcken (hinzufügen, verschieben, entfernen) · rechts: Live-Vorschau.
// Alles wird automatisch gespeichert (kurz nach der letzten Eingabe).
// Die Formulare der Blöcke entstehen aus den Feld-Beschreibungen in bloecke.js.
// ==========================================================
import { esc } from "../../kern/html.js"
import { bestaetigen } from "../../kern/dialog.js"
import { S, BLOCK_SYMBOL } from "../symbole.js"
import { BLOECKE, GRUPPEN, SPRACHEN, spracheName } from "../bloecke.js"
import { neueKarte, neuerBlock, istExtern } from "../format.js"
import { idSauber, normal, neueId } from "../hilfen.js"
import { vorderseite, rueckseite, aktivieren, medienUrlVergessen } from "../darstellung.js"
import { herunterladen } from "../paket.js"
import { dialog, meldung, fehlerMeldung, dateiWaehlen, stufeMarke, leerHtml, BILD } from "./ui.js"
import { ctxFuer } from "./kontext.js"
import { zeichenflaeche, schablonenHtml } from "./zeichenflaeche.js"
import { stricheKompakt } from "../zeichnen-kern.js"

export const ruhig = true

const st = {
    app: null, el: null, deck: null, nurLesen: false, gewaehlt: null, suche: "",
    vorschau: true, timer: null, status: "gespeichert", vorschauTimer: null,
}

const kartenNr = () => st.deck.karten.findIndex((k) => k.id === st.gewaehlt)
const aktuelleKarte = () => st.deck.karten.find((k) => k.id === st.gewaehlt) ?? null

// ---------- Speichern ----------
function aendern({ liste = false, vorschau = true } = {}) {
    if (st.nurLesen) return
    statusSetzen("ungespeichert")
    clearTimeout(st.timer)
    st.timer = setTimeout(speichern, 600)
    if (liste) listeZeichnen()
    if (vorschau) vorschauSpaeter()
}

async function speichern() {
    clearTimeout(st.timer)
    st.timer = null
    if (st.nurLesen || !st.deck) return
    statusSetzen("speichert")
    try {
        await st.app.lager.deckSpeichern(structuredClone(st.deck))
        statusSetzen("gespeichert")
    } catch (f) {
        statusSetzen("fehler")
        fehlerMeldung(f)
    }
}

function statusSetzen(s) {
    st.status = s
    const el = st.el?.querySelector("[data-status]")
    if (!el) return
    el.dataset.status = s
    el.innerHTML = { gespeichert: `${S.haken}<span>Gespeichert</span>`, ungespeichert: `<span>Änderungen …</span>`, speichert: `<span>Speichert …</span>`, fehler: `${S.warnung}<span>Nicht gespeichert</span>`, lesen: `<span>Nur lesen</span>` }[s]
}

export function verlassen() {
    if (st.timer) speichern()
    document.removeEventListener("keydown", tastatur)
}

// ---------- Aufbau ----------
export function zeigen(el, app, [deckId, kartenId] = []) {
    st.app = app
    st.el = el
    const d = app.lager.decks.get(deckId)
    if (!d) {
        el.innerHTML = leerHtml({ bild: BILD.lupe, titel: "Lerndatei nicht gefunden", text: "Vielleicht wurde sie gelöscht oder umbenannt.", knoepfe: `<a class="g-knopf" href="#saatgut">Zum Saatgut</a>` })
        return
    }
    if (st.deck?.id !== deckId) st.suche = ""
    st.deck = structuredClone(d.deck)
    st.nurLesen = d.nurLesen
    st.gewaehlt = kartenId && st.deck.karten.some((k) => k.id === kartenId) ? kartenId : st.deck.karten[0]?.id ?? null
    const deck = st.deck

    el.innerHTML = `
    <section class="sa-editor${st.vorschau ? " mit-vorschau" : ""}">
        <header class="sa-editor__kopf">
            <a class="g-knopf-text" href="#saatgut">← Saatgut</a>
            <input class="sa-editor__titel" data-meta="titel" value="${esc(deck.titel)}" aria-label="Titel der Lerndatei" ${st.nurLesen ? "readonly" : ""}>
            <span class="sa-status" data-status></span>
            <div class="sa-editor__knoepfe">
                <button class="g-knopf-leise" type="button" data-vorschau-an aria-pressed="${st.vorschau}">${S.auge} Vorschau</button>
                <button class="g-knopf-leise" type="button" data-teilen>${S.teilen} Teilen</button>
            </div>
        </header>
        ${st.nurLesen ? `<p class="sa-hinweis sa-hinweis--warm">${S.warnung}<span>Diese Datei stammt aus einer neueren Saat-Version. Du kannst sie ansehen und damit lernen, aber nicht ändern – sonst gingen Inhalte verloren.</span></p>` : ""}
        ${d.deck.kurs ? `<p class="sa-hinweis">${S.kurs}<span>Diese Lerndatei ist ein Kurs von Grove. Du kannst sie ändern – beim Aktualisieren des Kurses wird sie aber ersetzt (die alte Fassung landet in der Sicherung).</span></p>` : ""}
        ${d.ergaenzt && !st.nurLesen ? `<p class="sa-hinweis">${S.info}<span>Beim Öffnen wurde die Datei ergänzt (z. B. fehlende IDs oder ältere Formatversion). Mit der nächsten Änderung wird das in der Datei festgehalten.</span><button class="g-knopf-leise" type="button" data-jetzt-speichern>Jetzt speichern</button></p>` : ""}
        <div class="sa-editor__haupt">
            <aside class="sa-editor__seite">
                <details class="sa-editor__meta">
                    <summary>Angaben zur Datei</summary>
                    <div class="sa-felder">
                        <label class="sa-feld"><span>Beschreibung</span><textarea data-meta="beschreibung" rows="2">${esc(deck.beschreibung)}</textarea></label>
                        <label class="sa-feld"><span>Autor</span><input data-meta="autor" value="${esc(deck.autor)}"></label>
                        <label class="sa-feld"><span>Lerngebiet <small>z. B. Japanisch, Biologie – dein Lernprofil lernt je Gebiet mit</small></span><input data-meta="gebiet" value="${esc(deck.gebiet)}" list="sa-gebiete"></label>
                        <div class="sa-feld-reihe">
                            <label class="sa-feld"><span>Sprache vorne</span>${spracheFeld("data-meta=\"sprachen.vorne\"", deck.sprachen?.vorne)}</label>
                            <label class="sa-feld"><span>Sprache hinten</span>${spracheFeld("data-meta=\"sprachen.hinten\"", deck.sprachen?.hinten)}</label>
                        </div>
                        <p class="sa-klein">Datei-ID <code>${esc(deck.id)}</code> · ${esc(d.datei)}</p>
                    </div>
                </details>
                <div class="sa-editor__kartenkopf">
                    <input class="sa-suche sa-suche--klein" type="search" placeholder="In dieser Datei suchen" value="${esc(st.suche)}" data-kartensuche aria-label="Karten in dieser Datei suchen">
                    <button class="g-knopf" type="button" data-neue-karte title="Neue Karte (Strg+Enter)" ${st.nurLesen ? "disabled" : ""}>${S.plus}<span>Karte</span></button>
                </div>
                <button class="g-knopf-text" type="button" data-vorhandene ${st.nurLesen ? "hidden" : ""}>${S.kette} Karte aus anderer Datei übernehmen</button>
                <ol class="sa-editor__karten" data-kartenliste></ol>
            </aside>
            <div class="sa-editor__karte" data-karte-editor></div>
            <aside class="sa-editor__vorschau" data-vorschau ${st.vorschau ? "" : "hidden"}></aside>
        </div>
        <datalist id="sa-sprachen">${SPRACHEN.filter(([c]) => c).map(([c, n]) => `<option value="${c}">${esc(n)}</option>`).join("")}</datalist>
        <datalist id="sa-gebiete">${[...new Set([...st.app.lager.decks.values()].map((x) => x.deck.gebiet).filter(Boolean))].map((g) => `<option value="${esc(g)}">`).join("")}</datalist>
    </section>`

    statusSetzen(st.nurLesen ? "lesen" : "gespeichert")
    if (st.nurLesen) el.querySelectorAll(".sa-editor__meta input, .sa-editor__meta textarea, .sa-editor__meta select").forEach((x) => (x.disabled = true))

    // Datei-Angaben
    el.querySelectorAll("[data-meta]").forEach((f) => f.addEventListener("input", () => {
        const pfad = f.dataset.meta.split(".")
        if (pfad.length === 2) deck[pfad[0]] = { ...deck[pfad[0]], [pfad[1]]: f.value.trim() }
        else deck[pfad[0]] = pfad[0] === "titel" ? f.value : f.value
        aendern({ vorschau: pfad[0] === "sprachen" })
    }))
    el.querySelector('[data-meta="titel"]').addEventListener("blur", (e) => { if (!e.target.value.trim()) { e.target.value = deck.titel = "Ohne Titel"; aendern() } })
    el.querySelector("[data-jetzt-speichern]")?.addEventListener("click", (e) => { speichern(); e.target.closest(".sa-hinweis").remove() })
    el.querySelector("[data-kartensuche]").addEventListener("input", (e) => { st.suche = e.target.value; listeZeichnen() })
    el.querySelector("[data-neue-karte]").addEventListener("click", karteHinzufuegen)
    el.querySelector("[data-vorhandene]").addEventListener("click", vorhandeneUebernehmen)
    el.querySelector("[data-vorschau-an]").addEventListener("click", (e) => {
        st.vorschau = !st.vorschau
        e.currentTarget.setAttribute("aria-pressed", st.vorschau)
        el.querySelector(".sa-editor").classList.toggle("mit-vorschau", st.vorschau)
        el.querySelector("[data-vorschau]").hidden = !st.vorschau
        vorschauZeichnen()
    })
    el.querySelector("[data-teilen]").addEventListener("click", async () => {
        try {
            if (st.timer) await speichern()
            const ex = await app.lager.deckExport(deck.id)
            herunterladen(ex.blob, ex.name)
            meldung(ex.fehlend.length ? `${ex.name} – ${ex.fehlend.length} Medium/Medien fehlten` : `${ex.name} heruntergeladen`)
        } catch (f) { fehlerMeldung(f) }
    })
    document.removeEventListener("keydown", tastatur)
    document.addEventListener("keydown", tastatur)

    listeZeichnen()
    karteZeichnen()
}

function tastatur(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !document.querySelector("dialog[open]")) { e.preventDefault(); karteHinzufuegen() }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); speichern() }
}

const spracheFeld = (attr, wert) => `<input ${attr} value="${esc(wert || "")}" list="sa-sprachen" placeholder="z. B. ja" maxlength="20" autocomplete="off">`

// ---------- Kartenliste ----------
function listeZeichnen() {
    const box = st.el.querySelector("[data-kartenliste]")
    if (!box) return
    const q = normal(st.suche)
    const l = st.app.lager
    const jetzt = l.jetzt()
    const karten = st.deck.karten.map((k, i) => ({ k, i })).filter(({ k }) => !q || normal(`${k.vorne?.text} ${k.vorne?.zusatz} ${k.antwort} ${k.id}`).includes(q))
    if (!st.deck.karten.length) {
        box.innerHTML = `<li class="sa-klein sa-editor__leer">Noch keine Karten. Leg mit „+ Karte“ los.</li>`
        return
    }
    box.innerHTML = karten.map(({ k, i }) => {
        const schluessel = l.index.schluessel(st.deck.id, k.id)
        const e = schluessel ? l.eintrag(schluessel) : null
        return `<li><button type="button" class="sa-editor__eintrag${k.id === st.gewaehlt ? " ist-aktiv" : ""}" data-karte="${esc(k.id)}">
            <span class="sa-editor__nr">${i + 1}</span>
            <span class="sa-editor__text"><strong>${esc(k.vorne?.text || "(leer)")}</strong><small>${esc(k.antwort || "")}</small></span>
            ${schluessel ? stufeMarke(l.beherrschung(schluessel, jetzt), { text: false }) : ""}
            ${e && e.vorkommen.length > 1 ? `<span class="sa-marke" title="Steht in ${e.vorkommen.length} Lerndateien – gemeinsamer Lernstand">${S.kette}</span>` : ""}
        </button></li>`
    }).join("") || `<li class="sa-klein sa-editor__leer">Keine Treffer.</li>`
    box.querySelectorAll("[data-karte]").forEach((b) => b.addEventListener("click", () => {
        st.gewaehlt = b.dataset.karte
        history.replaceState(null, "", `#editor/${encodeURIComponent(st.deck.id)}/${encodeURIComponent(st.gewaehlt)}`)
        listeZeichnen()
        karteZeichnen()
    }))
}

function karteHinzufuegen() {
    if (st.nurLesen) return
    const k = neueKarte()
    const i = kartenNr()
    st.deck.karten.splice(i < 0 ? st.deck.karten.length : i + 1, 0, k)
    st.gewaehlt = k.id
    st.suche = ""
    const suche = st.el.querySelector("[data-kartensuche]")
    if (suche) suche.value = ""
    aendern({ liste: true })
    karteZeichnen()
    st.el.querySelector('[data-k="vorne.text"]')?.focus()
}

async function vorhandeneUebernehmen() {
    const id = await karteWaehlen(st.app, { titel: "Karte aus anderer Datei übernehmen", hinweis: "Die Karte wird mit derselben ID in diese Datei kopiert. Dadurch teilen sich beide Dateien ihren Lernstand." })
    if (!id) return
    if (st.deck.karten.some((k) => k.id === id)) { meldung("Diese Karte ist schon in dieser Datei"); return }
    const e = [...st.app.lager.index.eintraege.values()].find((x) => x.id === id)
    if (!e) return
    const k = structuredClone(e.karte)
    st.deck.karten.push(k)
    st.gewaehlt = k.id
    aendern({ liste: true })
    karteZeichnen()
    meldung("Übernommen – der Lernstand gilt in beiden Dateien")
}

// ---------- Karte bearbeiten ----------
function karteZeichnen() {
    const box = st.el.querySelector("[data-karte-editor]")
    st.zeichnenEigen = false
    const k = aktuelleKarte()
    if (!k) {
        box.innerHTML = leerHtml({ bild: BILD.beet, titel: st.deck.karten.length ? "Wähle links eine Karte" : "Leere Lerndatei", text: st.deck.karten.length ? "" : "Jede Karte hat eine Vorderseite (Begriff oder Frage), eine kurze Antwort und eine Rückseite, die du aus Blöcken zusammenstellst." })
        vorschauZeichnen()
        return
    }
    const nr = kartenNr()
    const ro = st.nurLesen ? "readonly" : ""
    box.innerHTML = `
    <div class="sa-ke">
        <div class="sa-ke__kopf">
            <h2>Karte ${nr + 1} <small>von ${st.deck.karten.length}</small></h2>
            <div class="sa-ke__knoepfe" ${st.nurLesen ? "hidden" : ""}>
                <button class="sa-symbolknopf" type="button" data-k-hoch title="Nach oben" aria-label="Karte nach oben" ${nr === 0 ? "disabled" : ""}>${S.hoch}</button>
                <button class="sa-symbolknopf" type="button" data-k-runter title="Nach unten" aria-label="Karte nach unten" ${nr === st.deck.karten.length - 1 ? "disabled" : ""}>${S.runter}</button>
                <button class="sa-symbolknopf" type="button" data-k-kopie title="Als neue Karte duplizieren" aria-label="Duplizieren">${S.kopie}</button>
                <button class="sa-symbolknopf sa-gefahr" type="button" data-k-weg title="Karte löschen" aria-label="Karte löschen">${S.papierkorb}</button>
            </div>
        </div>

        <section class="sa-ke__teil">
            <h3>Vorderseite</h3>
            <label class="sa-feld"><span>Begriff, Vokabel oder Frage</span><input class="sa-feld--gross" data-k="vorne.text" value="${esc(k.vorne?.text)}" ${ro} lang="${esc(st.deck.sprachen?.vorne || "")}"></label>
            <label class="sa-feld"><span>Zusatz <small>Lesung, Umschrift, Wortart …</small></span><input data-k="vorne.zusatz" value="${esc(k.vorne?.zusatz)}" ${ro}></label>
        </section>

        <section class="sa-ke__teil">
            <h3>Antwort</h3>
            <label class="sa-feld"><span>Antwort <small>kurz und knapp – sie erscheint auch im Auswahl-Modus</small></span><input class="sa-feld--gross" data-k="antwort" value="${esc(k.antwort)}" ${ro}></label>
            ${chipsFeld("alternativen", "Gilt auch als richtig", "Enter oder Komma fügt hinzu", k.alternativen)}
            ${chipsFeld("ablenker", "Falsche Antworten für den Auswahl-Modus", "optional – sonst wählt Saat passende aus anderen Karten", k.ablenker)}
            ${chipsFeld("eingaben", "Weitere Lösungen zum Eintippen", "gelten im Schreiben-Modus als richtig – z. B. Romaji oder Kana zu einem Kanji", k.eingaben)}
        </section>

        <section class="sa-ke__teil">
            <h3>Rückseite</h3>
            <div class="sa-bloecke" data-bloecke="hinten">${bloeckeHtml(k.hinten || [], k)}</div>
            ${st.nurLesen ? "" : `<button class="g-knopf-leise sa-block-neu" type="button" data-block-neu="hinten">${S.plus} Block hinzufügen</button>`}
        </section>

        <details class="sa-ke__mehr sa-ke__zeichnen" ${k.zeichnen ? "open" : ""}>
            <summary>${S.pinsel} Zeichnen-Modus ${k.zeichnen ? `<span class="sa-marke">an</span>` : ""}</summary>
            <div data-zeichnen-editor></div>
        </details>

        <details class="sa-ke__mehr">
            <summary>Mehr: Bild auf der Vorderseite, Tags, Lerngebiet, ID</summary>
            <section class="sa-ke__teil">
                <h3>Zusätzliche Blöcke auf der Vorderseite <small>z. B. ein Bild als Frage</small></h3>
                <div class="sa-bloecke" data-bloecke="vorne">${bloeckeHtml(k.vorne?.bloecke || [], k)}</div>
                ${st.nurLesen ? "" : `<button class="g-knopf-leise sa-block-neu" type="button" data-block-neu="vorne">${S.plus} Block auf der Vorderseite</button>`}
            </section>
            ${chipsFeld("tags", "Tags", "z. B. verb, kapitel-3 – helfen beim Suchen und bei der Wahl fairer Antwortmöglichkeiten", k.tags)}
            <label class="sa-feld"><span>Lerngebiet dieser Karte <small>leer = wie die Datei (${esc(st.deck.gebiet || "allgemein")})</small></span><input data-k="gebiet" value="${esc(k.gebiet || "")}" list="sa-gebiete" ${ro}></label>
            <label class="sa-feld"><span>Karten-ID <small>der Lernstand hängt an der ID – gleiche ID in mehreren Dateien = eine Karte</small></span>
                <span class="sa-feld-reihe"><input data-id-feld value="${esc(k.id)}" spellcheck="false" ${ro}><button class="g-knopf-leise" type="button" data-id-setzen ${st.nurLesen ? "hidden" : ""}>Ändern</button></span></label>
        </details>
    </div>`

    // einfache Felder
    box.querySelectorAll("[data-k]").forEach((f) => f.addEventListener("input", () => {
        const [a, b] = f.dataset.k.split(".")
        if (b) k[a] = { ...k[a], [b]: f.value }
        else if (a === "gebiet") { if (f.value.trim()) k.gebiet = f.value.trim(); else delete k.gebiet }
        else k[a] = f.value
        aendern({ liste: a === "vorne" || a === "antwort" })
    }))
    chipsAktivieren(box, k)
    box.querySelectorAll("[data-bloecke]").forEach((b) => bloeckeAktivieren(b, k))
    zeichnenEditor(box.querySelector("[data-zeichnen-editor]"), k)
    box.querySelectorAll("[data-block-neu]").forEach((b) => b.addEventListener("click", () => blockPalette(k, b.dataset.blockNeu)))

    box.querySelector("[data-k-hoch]")?.addEventListener("click", () => verschieben(-1))
    box.querySelector("[data-k-runter]")?.addEventListener("click", () => verschieben(1))
    box.querySelector("[data-k-kopie]")?.addEventListener("click", () => {
        const kopie = structuredClone(k)
        kopie.id = neueId("k")
        for (const b of [...(kopie.hinten || []), ...(kopie.vorne?.bloecke || [])]) b.id = neueId("b", 6)
        st.deck.karten.splice(nr + 1, 0, kopie)
        st.gewaehlt = kopie.id
        aendern({ liste: true })
        karteZeichnen()
        meldung("Dupliziert – mit neuer ID (eigener Lernstand)")
    })
    box.querySelector("[data-k-weg]")?.addEventListener("click", () => {
        const i = kartenNr()
        const [weg] = st.deck.karten.splice(i, 1)
        st.gewaehlt = st.deck.karten[Math.min(i, st.deck.karten.length - 1)]?.id ?? null
        aendern({ liste: true })
        karteZeichnen()
        meldung("Karte gelöscht", {
            rueckgaengig: async () => {
                st.deck.karten.splice(i, 0, weg)
                st.gewaehlt = weg.id
                aendern({ liste: true })
                karteZeichnen()
            },
        })
    })
    box.querySelector("[data-id-setzen]")?.addEventListener("click", () => idAendern(k, box.querySelector("[data-id-feld]").value.trim()))
    vorschauZeichnen()
}

function verschieben(richtung) {
    const i = kartenNr()
    const j = i + richtung
    if (j < 0 || j >= st.deck.karten.length) return
    const [k] = st.deck.karten.splice(i, 1)
    st.deck.karten.splice(j, 0, k)
    aendern({ liste: true, vorschau: false })
    karteZeichnen()
}

async function idAendern(k, neu) {
    if (neu === k.id) return
    if (!idSauber(neu)) return meldung("Erlaubt sind Buchstaben, Ziffern und . _ : ~ - (höchstens 80 Zeichen, nicht mit einem Zeichen beginnen)", { art: "fehler", dauer: 5000 })
    if (st.deck.karten.some((x) => x !== k && x.id === neu)) return meldung("Diese ID gibt es in dieser Datei schon", { art: "fehler" })
    const l = st.app.lager
    const alterSchluessel = l.index.schluessel(st.deck.id, k.id)
    const hatStand = alterSchluessel && l.zustand(alterSchluessel)
    const anderswo = [...l.index.eintraege.values()].find((e) => e.id === neu)
    const text = [
        hatStand ? "Der bisherige Lernstand bleibt bei der alten ID – unter der neuen beginnt die Karte von vorn." : "",
        anderswo ? `Die ID „${neu}“ gibt es schon in „${anderswo.deck.titel}“ (${anderswo.karte.vorne?.text} → ${anderswo.karte.antwort}). Dann zählen beide als dieselbe Karte.` : "",
    ].filter(Boolean).join(" ")
    if (text && !(await bestaetigen({ titel: "ID ändern?", text, ja: "Ändern" }))) return
    const alt = k.id
    k.id = neu
    // Verweise in dieser Datei mitziehen
    for (const x of st.deck.karten) {
        for (const b of [...(x.hinten || []), ...(x.vorne?.bloecke || [])]) if (b.typ === "verweis") b.karten = (b.karten || []).map((id) => (id === alt ? neu : id))
        x.verknuepft = (x.verknuepft || []).map((v) => (v.id === alt ? { ...v, id: neu } : v))
    }
    st.gewaehlt = neu
    aendern({ liste: true })
    karteZeichnen()
}

// ---------- Listen als Chips (Alternativen, Ablenker, Tags) ----------
function chipsFeld(name, label, hilfe, werte = []) {
    return `<div class="sa-feld"><span>${esc(label)} <small>${esc(hilfe)}</small></span>
        <div class="sa-chipsfeld" data-chips="${name}">
            ${(werte || []).map((w, i) => `<span class="sa-chip">${esc(w)}${st.nurLesen ? "" : `<button type="button" data-chip-weg="${i}" aria-label="${esc(w)} entfernen">${S.zu}</button>`}</span>`).join("")}
            ${st.nurLesen ? "" : `<input type="text" aria-label="${esc(label)}" placeholder="${werte?.length ? "" : "hinzufügen …"}">`}
        </div></div>`
}
function chipsAktivieren(box, k) {
    box.querySelectorAll("[data-chips]").forEach((feld) => {
        const name = feld.dataset.chips
        const input = feld.querySelector("input")
        const neuZeichnen = () => {
            const tmp = document.createElement("div")
            tmp.innerHTML = chipsFeld(name, "", "", k[name])
            feld.replaceWith(tmp.querySelector(".sa-feld").lastElementChild)
            const neu = box.querySelector(`[data-chips="${name}"]`)
            chipsAktivieren(neu.parentElement, k)
            neu.querySelector("input")?.focus()
        }
        const uebernehmen = () => {
            const teile = input.value.split(",").map((x) => x.trim()).filter(Boolean)
            if (!teile.length) return false
            k[name] = [...new Set([...(k[name] || []), ...teile])]
            input.value = ""
            aendern()
            neuZeichnen()
            return true
        }
        input?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); uebernehmen() }
            if (e.key === "Backspace" && !input.value && k[name]?.length) { k[name] = k[name].slice(0, -1); aendern(); neuZeichnen() }
        })
        input?.addEventListener("blur", () => { if (input.value.trim()) uebernehmen() })
        feld.querySelectorAll("[data-chip-weg]").forEach((b) => b.addEventListener("click", () => {
            k[name] = k[name].filter((_, i) => i !== +b.dataset.chipWeg)
            aendern()
            neuZeichnen()
        }))
        feld.addEventListener("click", (e) => { if (e.target === feld) input?.focus() })
    })
}

// ---------- Blöcke ----------
const blockListe = (k, wo) => (wo === "vorne" ? (k.vorne.bloecke ??= []) : (k.hinten ??= []))

function bloeckeHtml(liste, k) {
    if (!liste.length) return `<p class="sa-klein sa-bloecke__leer">Noch keine Blöcke.</p>`
    return liste.map((b, i) => blockHtml(b, i, liste.length, k)).join("")
}

function blockHtml(b, i, n, k) {
    const def = BLOECKE[b.typ]
    if (!def) {
        return `<article class="sa-be sa-be--unbekannt" data-i="${i}"><header class="sa-be__kopf">${BLOCK_SYMBOL.unbekannt}<strong>Unbekannter Block „${esc(b.typ)}“</strong>
            <span class="sa-be__knoepfe">${st.nurLesen ? "" : `<button class="sa-symbolknopf sa-gefahr" type="button" data-b-weg title="Entfernen" aria-label="Entfernen">${S.papierkorb}</button>`}</span></header>
            <p class="sa-klein">Stammt aus einer neueren Saat-Version und bleibt unverändert erhalten.</p></article>`
    }
    return `<article class="sa-be sa-be--${b.typ}" data-i="${i}">
        <header class="sa-be__kopf">
            <span class="sa-be__symbol">${BLOCK_SYMBOL[b.typ]}</span><strong>${esc(def.name)}</strong>
            <span class="sa-be__knoepfe" ${st.nurLesen ? "hidden" : ""}>
                <button class="sa-symbolknopf" type="button" data-b-hoch title="Nach oben" aria-label="Block nach oben" ${i === 0 ? "disabled" : ""}>${S.hoch}</button>
                <button class="sa-symbolknopf" type="button" data-b-runter title="Nach unten" aria-label="Block nach unten" ${i === n - 1 ? "disabled" : ""}>${S.runter}</button>
                <button class="sa-symbolknopf" type="button" data-b-kopie title="Duplizieren" aria-label="Block duplizieren">${S.kopie}</button>
                <button class="sa-symbolknopf sa-gefahr" type="button" data-b-weg title="Entfernen" aria-label="Block entfernen">${S.papierkorb}</button>
            </span>
        </header>
        <div class="sa-be__felder">${def.felder.map((f) => feldHtml(f, b, k)).join("")}</div>
    </article>`
}

function feldHtml(f, b, k) {
    const w = b[f.name]
    const ro = st.nurLesen ? "disabled" : ""
    const label = `<span>${esc(f.label)}</span>`
    switch (f.art) {
        case "text": return `<label class="sa-feld">${label}<input data-f="${f.name}" value="${esc(w ?? "")}" placeholder="${esc(f.platzhalter || "")}" ${ro}></label>`
        case "lang": return `<label class="sa-feld">${label}<textarea data-f="${f.name}" rows="${Math.min(10, Math.max(2, String(w ?? "").split("\n").length + 1))}" placeholder="${esc(f.platzhalter || "")}" class="${f.fest ? "sa-fest" : ""}" ${ro}>${esc(w ?? "")}</textarea></label>`
        case "sprache": return `<label class="sa-feld sa-feld--schmal">${label}${spracheFeld(`data-f="${f.name}" ${ro}`, w)}</label>`
        case "schalter": return `<label class="sa-schalter"><input type="checkbox" data-f="${f.name}" ${w !== false ? "checked" : ""} ${ro}><span>${esc(f.label)}</span></label>`
        case "bezug": {
            const andere = (k.hinten || []).filter((x) => x !== b && ["satz", "text", "geschichte"].includes(x.typ) && x.text)
            return `<label class="sa-feld">${label}<select data-f="${f.name}" ${ro}><option value="">Vorderseite (die Vokabel selbst)</option>${andere.map((x) =>
                `<option value="${esc(x.id)}"${w === x.id ? " selected" : ""}>${esc(BLOECKE[x.typ].name)}: ${esc(String(x.text).slice(0, 50))}</option>`).join("")}</select></label>`
        }
        case "quelle": {
            const art = f.medien
            const vorschau = !w ? `<span class="sa-klein">Noch nichts gewählt</span>`
                : art === "bild" ? `<img data-quelle="${esc(w)}" alt="">`
                : `<span class="sa-quelle__name">${BLOCK_SYMBOL.medien}${esc(istExtern(w) ? w : w.replace(/^medien\/[0-9a-f]{12}-/, ""))}</span>`
            return `<div class="sa-feld">${label}<div class="sa-quelle" data-quelle-feld="${f.name}" data-medien="${art}">
                <div class="sa-quelle__vorschau">${vorschau}</div>
                <div class="sa-quelle__eingabe">
                    <input data-f="${f.name}" value="${esc(w ?? "")}" placeholder="https://… oder Datei wählen" spellcheck="false" ${ro}>
                    ${st.nurLesen ? "" : `<button class="g-knopf-leise" type="button" data-q-datei>${S.ordner} Datei</button>`}
                </div></div></div>`
        }
        case "paare": {
            const liste = w || []
            return `<div class="sa-feld">${label}<div class="sa-paare">${liste.map((p, i) => `<div class="sa-paar" data-p="${i}">
                <input data-p-teil="text" value="${esc(p.text ?? "")}" placeholder="${esc(f.links)}" ${ro}>
                <input data-p-teil="zusatz" value="${esc(p.zusatz ?? "")}" placeholder="${esc(f.rechts)}" ${ro}>
                ${st.nurLesen ? "" : `<button class="sa-symbolknopf" type="button" data-p-weg aria-label="Entfernen">${S.zu}</button>`}</div>`).join("")}
                ${st.nurLesen ? "" : `<button class="g-knopf-text" type="button" data-p-neu>${S.plus} Beispiel</button>`}</div></div>`
        }
        case "tabelle": {
            const z = w?.length ? w : [[""]]
            const spalten = Math.max(...z.map((r) => r.length))
            return `<div class="sa-feld">${label}<div class="sa-tabelle-edit"><table><tbody>${z.map((r, ri) => `<tr>${Array.from({ length: spalten }, (_, ci) =>
                `<td><input data-zelle="${ri},${ci}" value="${esc(r[ci] ?? "")}" aria-label="Zeile ${ri + 1}, Spalte ${ci + 1}" ${ro}></td>`).join("")}</tr>`).join("")}</tbody></table></div>
                ${st.nurLesen ? "" : `<div class="sa-tabelle-knoepfe">
                    <button class="g-knopf-text" type="button" data-t="zeile+">${S.plus} Zeile</button><button class="g-knopf-text" type="button" data-t="spalte+">${S.plus} Spalte</button>
                    <button class="g-knopf-text" type="button" data-t="zeile-" ${z.length < 2 ? "disabled" : ""}>− Zeile</button><button class="g-knopf-text" type="button" data-t="spalte-" ${spalten < 2 ? "disabled" : ""}>− Spalte</button></div>`}</div>`
        }
        case "optionen": {
            const liste = w || []
            return `<div class="sa-feld">${label}<div class="sa-optionen-edit">${liste.map((o, i) => `<div class="sa-option-edit" data-o="${i}">
                <label class="sa-haken" title="richtig"><input type="checkbox" data-o-richtig ${o.richtig ? "checked" : ""} ${ro}><span>${S.haken}</span></label>
                <input data-o-text value="${esc(o.text ?? "")}" placeholder="Antwort ${i + 1}" ${ro}>
                ${st.nurLesen ? "" : `<button class="sa-symbolknopf" type="button" data-o-weg aria-label="Entfernen">${S.zu}</button>`}</div>`).join("")}
                ${st.nurLesen ? "" : `<button class="g-knopf-text" type="button" data-o-neu>${S.plus} Antwort</button>`}</div></div>`
        }
        case "karten": {
            const ids = w || []
            const l = st.app.lager
            return `<div class="sa-feld">${label}<div class="sa-chipsfeld sa-chipsfeld--karten">${ids.map((id, i) => {
                const e = [...l.index.eintraege.values()].find((x) => x.id === id) || null
                const hier = st.deck.karten.find((x) => x.id === id)
                const t = hier?.vorne?.text || e?.karte.vorne?.text
                return `<span class="sa-chip${t ? "" : " sa-chip--fehlt"}" title="${esc(id)}">${esc(t || id)}${st.nurLesen ? "" : `<button type="button" data-v-weg="${i}" aria-label="Entfernen">${S.zu}</button>`}</span>`
            }).join("")}${st.nurLesen ? "" : `<button class="g-knopf-text" type="button" data-v-neu>${S.plus} Karte wählen</button>`}</div></div>`
        }
        default: return ""
    }
}

function bloeckeAktivieren(container, k) {
    const wo = container.dataset.bloecke
    const liste = blockListe(k, wo)
    const neu = () => { container.innerHTML = bloeckeHtml(liste, k); bloeckeAktivieren(container, k) }
    container.querySelectorAll(".sa-be").forEach((el) => einBlock(container, el, k, liste, neu))
}

function einBlock(container, el, k, liste, neu) {
        const i = +el.dataset.i
        const b = liste[i]
        aktivieren(el, ctxFuer(st.app, st.deck))       // lädt Bild-Vorschauen
        const ersetzen = () => {
            const tmp = document.createElement("div")
            tmp.innerHTML = blockHtml(b, i, liste.length, k)
            const frisch = tmp.firstElementChild
            el.replaceWith(frisch)
            einBlock(container, frisch, k, liste, neu)
        }
        el.querySelector("[data-b-hoch]")?.addEventListener("click", () => { [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]]; aendern(); neu() })
        el.querySelector("[data-b-runter]")?.addEventListener("click", () => { [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]]; aendern(); neu() })
        el.querySelector("[data-b-kopie]")?.addEventListener("click", () => { liste.splice(i + 1, 0, { ...structuredClone(b), id: neueId("b", 6) }); aendern(); neu() })
        el.querySelector("[data-b-weg]")?.addEventListener("click", () => {
            const [weg] = liste.splice(i, 1)
            aendern(); neu()
            meldung(`Block „${BLOECKE[weg.typ]?.name || weg.typ}“ entfernt`, { rueckgaengig: async () => { liste.splice(i, 0, weg); aendern(); neu() } })
        })
        if (!b || !BLOECKE[b.typ]) return

        // einfache Felder
        el.querySelectorAll("[data-f]").forEach((f) => f.addEventListener(f.type === "checkbox" || f.tagName === "SELECT" ? "change" : "input", () => {
            b[f.dataset.f] = f.type === "checkbox" ? f.checked : f.value
            aendern()
        }))
        el.querySelectorAll("[data-quelle-feld] [data-f]").forEach((f) => f.addEventListener("change", ersetzen))
        el.querySelectorAll("textarea").forEach((t) => t.addEventListener("input", () => { t.rows = Math.min(14, Math.max(2, t.value.split("\n").length + 1)) }))

        // Medien
        el.querySelectorAll("[data-q-datei]").forEach((knopf) => knopf.addEventListener("click", async () => {
            const feld = knopf.closest("[data-quelle-feld]")
            const accept = { bild: "image/*", audio: "audio/*", medien: "audio/*,video/*" }[feld.dataset.medien] || ""
            const [datei] = await dateiWaehlen({ accept })
            if (!datei) return
            try {
                const pfad = await st.app.lager.medienSpeichern(datei)
                medienUrlVergessen(pfad)
                b[feld.dataset.quelleFeld] = pfad
                aendern()
                ersetzen()
            } catch (f) { fehlerMeldung(f) }
        }))

        // Beispiele (Paare)
        el.querySelectorAll("[data-p]").forEach((zeile) => {
            const p = b.eintraege[+zeile.dataset.p]
            zeile.querySelectorAll("[data-p-teil]").forEach((f) => f.addEventListener("input", () => { p[f.dataset.pTeil] = f.value; aendern() }))
            zeile.querySelector("[data-p-weg]")?.addEventListener("click", () => { b.eintraege.splice(+zeile.dataset.p, 1); aendern(); ersetzen() })
        })
        el.querySelector("[data-p-neu]")?.addEventListener("click", () => { (b.eintraege ??= []).push({ text: "", zusatz: "" }); aendern(); ersetzen(); setTimeout(() => container.querySelectorAll(`.sa-be[data-i="${i}"] [data-p-teil="text"]`).item(b.eintraege.length - 1)?.focus()) })

        // Tabelle
        el.querySelectorAll("[data-zelle]").forEach((f) => f.addEventListener("input", () => {
            const [r, c] = f.dataset.zelle.split(",").map(Number)
            b.zeilen ??= [[""]]
            while (b.zeilen.length <= r) b.zeilen.push([])
            while (b.zeilen[r].length <= c) b.zeilen[r].push("")
            b.zeilen[r][c] = f.value
            aendern()
        }))
        el.querySelectorAll("[data-t]").forEach((knopf) => knopf.addEventListener("click", () => {
            const z = (b.zeilen ??= [[""]])
            const spalten = Math.max(1, ...z.map((r) => r.length))
            if (knopf.dataset.t === "zeile+") z.push(Array(spalten).fill(""))
            if (knopf.dataset.t === "spalte+") z.forEach((r) => { while (r.length < spalten) r.push(""); r.push("") })
            if (knopf.dataset.t === "zeile-" && z.length > 1) z.pop()
            if (knopf.dataset.t === "spalte-" && spalten > 1) z.forEach((r) => r.splice(spalten - 1, 1))
            aendern(); ersetzen()
        }))

        // Mini-Quiz-Optionen
        el.querySelectorAll("[data-o]").forEach((zeile) => {
            const o = b.optionen[+zeile.dataset.o]
            zeile.querySelector("[data-o-text]").addEventListener("input", (e) => { o.text = e.target.value; aendern() })
            zeile.querySelector("[data-o-richtig]").addEventListener("change", (e) => { o.richtig = e.target.checked; aendern() })
            zeile.querySelector("[data-o-weg]")?.addEventListener("click", () => { b.optionen.splice(+zeile.dataset.o, 1); aendern(); ersetzen() })
        })
        el.querySelector("[data-o-neu]")?.addEventListener("click", () => { (b.optionen ??= []).push({ text: "", richtig: false }); aendern(); ersetzen() })

        // Verweise
        el.querySelectorAll("[data-v-weg]").forEach((x) => x.addEventListener("click", () => { b.karten.splice(+x.dataset.vWeg, 1); aendern(); ersetzen() }))
        el.querySelector("[data-v-neu]")?.addEventListener("click", async () => {
            const id = await karteWaehlen(st.app, { titel: "Verwandte Karte wählen", ausser: [k.id, ...(b.karten || [])] })
            if (!id) return
            ;(b.karten ??= []).push(id)
            aendern(); ersetzen()
        })
}

// Auswahl der Blocktypen
async function blockPalette(k, wo) {
    let gewaehlt = null
    await dialog({
        titel: "Block hinzufügen", breit: true, knoepfe: [],
        html: GRUPPEN.map((g) => `<h3 class="sa-palette__gruppe">${esc(g.name)}</h3><div class="sa-palette">${Object.entries(BLOECKE).filter(([, d]) => d.gruppe === g.id).map(([typ, d]) =>
            `<button type="button" class="sa-palette__typ" data-typ="${typ}">${BLOCK_SYMBOL[typ]}<strong>${esc(d.name)}</strong><span>${esc(d.kurz)}</span></button>`).join("")}</div>`).join(""),
        beimOeffnen: (d) => d.querySelectorAll("[data-typ]").forEach((b) => b.addEventListener("click", () => { gewaehlt = b.dataset.typ; d.close("ok") })),
    })
    if (!gewaehlt) return
    const b = neuerBlock(gewaehlt)
    if (gewaehlt === "satz" && st.deck.sprachen?.vorne) b.sprache = st.deck.sprachen.vorne
    if (gewaehlt === "uebersetzung" && st.deck.sprachen?.hinten) b.sprache = st.deck.sprachen.hinten
    if (gewaehlt === "uebersetzung") { const satz = [...(k.hinten || [])].reverse().find((x) => x.typ === "satz"); if (satz) b.bezug = satz.id }
    if (gewaehlt === "aussprache" && st.deck.sprachen?.vorne) b.sprache = st.deck.sprachen.vorne
    const liste = blockListe(k, wo)
    liste.push(b)
    aendern()
    const container = st.el.querySelector(`[data-bloecke="${wo}"]`)
    container.innerHTML = bloeckeHtml(liste, k)
    bloeckeAktivieren(container, k)
    const neu = container.querySelector(`.sa-be[data-i="${liste.length - 1}"]`)
    neu?.scrollIntoView({ behavior: "smooth", block: "center" })
    neu?.querySelector("input:not([type=checkbox]), textarea")?.focus({ preventScroll: true })
}

// ---------- Vorschau ----------
function vorschauSpaeter() {
    clearTimeout(st.vorschauTimer)
    st.vorschauTimer = setTimeout(vorschauZeichnen, 250)
}
function vorschauZeichnen() {
    const box = st.el?.querySelector("[data-vorschau]")
    if (!box || box.hidden) return
    const k = aktuelleKarte()
    if (!k) { box.innerHTML = ""; return }
    const ctx = ctxFuer(st.app, st.deck)
    box.innerHTML = `<p class="sa-ueber">So sieht die Karte beim Lernen aus</p>
        <article class="sa-lernkarte sa-lernkarte--vorschau ist-offen">
            <div class="sa-lernkarte__vorne">${vorderseite(k, ctx)}</div>
            <div class="sa-lernkarte__hinten">${rueckseite(k, ctx)}</div>
        </article>
        <p class="sa-klein">Sprachen: ${esc(spracheName(st.deck.sprachen?.vorne) || "–")} → ${esc(spracheName(st.deck.sprachen?.hinten) || "–")}</p>`
    aktivieren(box, ctx)
}

// ---------- Karte wählen (für Verweise und „aus anderer Datei übernehmen“) ----------
export async function karteWaehlen(app, { titel, hinweis = "", ausser = [] }) {
    const l = app.lager
    const kandidaten = new Map()
    for (const k of st.deck?.karten || []) kandidaten.set(k.id, { id: k.id, vorne: k.vorne?.text, antwort: k.antwort, datei: st.deck.titel })
    for (const e of l.index.eintraege.values()) if (!kandidaten.has(e.id)) kandidaten.set(e.id, { id: e.id, vorne: e.karte.vorne?.text, antwort: e.karte.antwort, datei: e.deck.titel })
    const liste = [...kandidaten.values()].filter((x) => !ausser.includes(x.id))
    let gewaehlt = null
    await dialog({
        titel, knoepfe: [],
        html: `${hinweis ? `<p class="sa-klein">${esc(hinweis)}</p>` : ""}<input class="sa-suche" type="search" placeholder="Suchen …" data-w-suche autofocus><ul class="sa-wahlliste" data-w-liste></ul>`,
        beimOeffnen: (d) => {
            const ul = d.querySelector("[data-w-liste]")
            const zeichnen = (q = "") => {
                const n = normal(q)
                const treffer = liste.filter((x) => !n || normal(`${x.vorne} ${x.antwort} ${x.id}`).includes(n)).slice(0, 60)
                ul.innerHTML = treffer.map((x) => `<li><button type="button" data-id="${esc(x.id)}"><strong>${esc(x.vorne || x.id)}</strong><span>${esc(x.antwort || "")}</span><small>${esc(x.datei)}</small></button></li>`).join("") || `<li class="sa-klein">Nichts gefunden.</li>`
                ul.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => { gewaehlt = b.dataset.id; d.close("ok") }))
            }
            d.querySelector("[data-w-suche]").addEventListener("input", (e) => zeichnen(e.target.value))
            zeichnen()
        },
    })
    return gewaehlt
}

// ---------- Zeichnen-Modus: Schablone vorbereiten ----------
// Ohne Striche dient ein Text als Schablone (Standard: die Vorderseite, z. B. ein Kanji).
// Alternativ zeichnest du die Schablone selbst – sie wird kompakt (0…1000) gespeichert.
function zeichnenEditor(el, k) {
    if (!el) return
    const an = !!k.zeichnen
    const z = k.zeichnen || {}
    const ro = st.nurLesen ? "disabled" : ""
    const eigen = !!z.striche?.length
    el.innerHTML = `
        <label class="sa-schalter"><input type="checkbox" data-z-an ${an ? "checked" : ""} ${ro}><span>Diese Karte auch im Zeichnen-Modus abfragen</span></label>
        ${an ? `<div class="sa-felder">
            <label class="sa-feld"><span>Aufgabe <small>leer = die Antwort der Karte („${esc(k.antwort || "…")}“)</small></span><input data-z="aufgabe" value="${esc(z.aufgabe || "")}" placeholder="z. B. Schreib das Kanji für „Wasser“" ${ro}></label>
            <div class="sa-segment" role="group" aria-label="Art der Schablone">
                <button type="button" data-z-art="text" aria-pressed="${!eigen}">Text als Schablone</button>
                <button type="button" data-z-art="striche" aria-pressed="${eigen}">Selbst zeichnen</button>
            </div>
            ${eigen || st.zeichnenEigen ? `
                <p class="sa-klein">Zeichne die richtige Lösung. Größe und Position sind egal – verglichen wird die Form.</p>
                <div data-z-feld></div>
                <div class="sa-knopfreihe"><button class="g-knopf" type="button" data-z-uebernehmen ${ro}>${S.haken} Als Schablone speichern</button>${eigen ? `<span class="sa-klein">Gespeichert: ${z.striche.length} ${z.striche.length === 1 ? "Strich" : "Striche"}</span>` : ""}</div>`
            : `
                <label class="sa-feld"><span>Text der Schablone <small>leer = Vorderseite („${esc(k.vorne?.text || "")}“), gezeichnet mit der Schrift deines Geräts</small></span><input data-z="text" value="${esc(z.text || "")}" lang="ja" ${ro}></label>`}
            <div class="sa-schablone-vorschau"><span class="sa-klein">So wird verglichen:</span>${schablonenHtml(k)}</div>
        </div>` : ""}`
    el.querySelector("[data-z-an]")?.addEventListener("change", (e) => {
        if (e.target.checked) k.zeichnen = { aufgabe: "", text: "" }
        else delete k.zeichnen
        aendern()
        zeichnenEditor(el, k)
        el.closest("details").querySelector("summary").innerHTML = `${S.pinsel} Zeichnen-Modus ${k.zeichnen ? `<span class="sa-marke">an</span>` : ""}`
    })
    el.querySelectorAll("[data-z]").forEach((f) => f.addEventListener("input", () => {
        k.zeichnen[f.dataset.z] = f.value
        aendern()
        if (f.dataset.z === "text") { clearTimeout(f._t); f._t = setTimeout(() => { el.querySelector(".sa-schablone-vorschau").innerHTML = `<span class="sa-klein">So wird verglichen:</span>${schablonenHtml(k)}` }, 300) }
    }))
    el.querySelectorAll("[data-z-art]").forEach((b) => b.addEventListener("click", () => {
        if (st.nurLesen) return
        if (b.dataset.zArt === "text") { delete k.zeichnen.striche; st.zeichnenEigen = false; aendern() }
        else st.zeichnenEigen = true
        zeichnenEditor(el, k)
    }))
    const feldEl = el.querySelector("[data-z-feld]")
    if (feldEl) {
        const f = zeichenflaeche(feldEl, { hoehe: 240, hinweis: "Schablone zeichnen" })
        if (z.striche?.length) requestAnimationFrame(() => f.setzen(z.striche))
        el.querySelector("[data-z-uebernehmen]")?.addEventListener("click", () => {
            if (f.leer()) { meldung("Zeichne zuerst die Schablone"); return }
            const { w, h } = f.groesse()
            k.zeichnen.striche = stricheKompakt(f.striche(), w, h)
            st.zeichnenEigen = false
            aendern()
            zeichnenEditor(el, k)
            meldung("Schablone gespeichert")
        })
    }
}
