// ==========================================================
// Laub · Seite (src/dienste/laub/index.html)
// Der Gestaltungs-Dienst: Farben, Schrift, Form, Zeichen, Bilder,
// Bewegung, Animationen und Hintergrund – für ganz Grove oder
// für jeden Dienst einzeln. Dazu Presets (fertige und eigene).
//
// Aufbau:  Bereich wählen (oben)  →  Abschnitt wählen (links)
//          →  einstellen (Mitte)  →  Vorschau (rechts)
// Jede Änderung geht sofort über thema.js an Seite + Speicher.
// ==========================================================
import "../kern/thema.js"                        // zuerst: Gestaltung aus Laub (Farben, Schriften, Bewegung)
import "../kern/schutz.js"
import "../glocke.js"
import "../nutzermenue.js"
import "../kern/alle-dienste.js"
import { sucheEinrichten } from "../kern/suche.js"
import * as T from "../kern/thema.js"
import * as D from "../kern/thema-daten.js"
import { GALERIE } from "../laub/galerie-daten.js"
import { paletteAus } from "../laub/palette.js"
import { vorschauErstellen } from "../laub/vorschau.js"
import {
    ctx, el, wert, setze, zeile, kacheln, segmente, schieber, schalter, aktualisieren, holen,
} from "../laub/bausteine.js"

sucheEinrichten()

const $ = (s) => document.querySelector(s)
const panel = $("#panel")
const ICON = (pfad) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pfad}</svg>`

const ABSCHNITTE = [
    { id: "presets",  name: "Presets",         icon: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>' },
    { id: "farben",   name: "Farben",          icon: '<path d="M12 21c-4.5 0-8-3.5-8-8 0-5 4-9 9-9 4.4 0 7 2.6 7 5.6 0 2.3-1.8 3.9-4 3.9h-1.6a1.6 1.6 0 0 0-1.1 2.8c.4.4.6.9.6 1.4 0 1.8-.9 3.3-1.9 3.3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.5" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>' },
    { id: "schrift",  name: "Schrift",         icon: '<path d="M4 20L10 4h1l6 16"/><path d="M6.5 14h8"/><path d="M17 20h4"/>' },
    { id: "form",     name: "Form & Symbole",  icon: '<rect x="3" y="3" width="8" height="8" rx="3"/><circle cx="17" cy="7" r="4"/><path d="M7 14l4 7H3z"/><path d="M14 14h7v7h-7z"/>' },
    { id: "bilder",   name: "Zeichen & Bilder", icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>' },
    { id: "bewegung", name: "Bewegung",        icon: '<path d="M3 12h3l3-8 4 16 3-8h5"/>' },
    { id: "galerie",  name: "Animationen",     icon: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>' },
    { id: "flaeche",  name: "Hintergrund",     icon: '<path d="M3 17c3-3 6 3 9 0s6 3 9 0"/><path d="M3 12c3-3 6 3 9 0s6 3 9 0"/><path d="M3 7c3-3 6 3 9 0s6 3 9 0"/>' },
]

// ---------- Startzustand aus der Adresse: ?fuer=myzel#farben ----------
const params = new URLSearchParams(location.search)
ctx.bereich = D.BEREICHE.some((b) => b.id === params.get("fuer")) ? params.get("fuer") : "grove"
let abschnitt = ABSCHNITTE.some((a) => a.id === location.hash.slice(1)) ? location.hash.slice(1) : "presets"
let aktualisierer = []          // zusätzliche Auffrischer des aktuellen Abschnitts

const vorschau = vorschauErstellen($("#vorschau"))

// ==========================================================
// Bereiche (Ganz Grove / Lichtung / Dienste)
// ==========================================================
function bereicheZeichnen() {
    const liste = $("#bereiche")
    liste.replaceChildren(...D.BEREICHE.map((b) => {
        const zeichen = b.zeichen ? T.zeichenDatei(b.zeichen) : T.zeichenDatei("grove")
        return el("button", {
            type: "button", role: "tab", class: "bereich", dataset: { bereich: b.id, themaDienst: b.id === "grove" ? undefined : b.id },
            onclick: () => bereichWaehlen(b.id),
        }, el("img", { src: zeichen, alt: "" }), el("span", {}, b.name), el("i", { class: "bereich__punkt", title: "hat eigene Einstellungen" }))
    }))
    bereicheMarkieren()
}
function bereicheMarkieren() {
    document.querySelectorAll(".bereich").forEach((b) => {
        const id = b.dataset.bereich
        b.setAttribute("aria-selected", String(id === ctx.bereich))
        const eigene = id === "grove" ? T.laub.einstellungen.grove : T.laub.einstellungen.dienste?.[id]
        b.classList.toggle("hat-eigene", !!eigene && Object.keys(eigene).length > 0)
    })
}
function bereichWaehlen(id) {
    ctx.bereich = id
    const url = new URL(location.href)
    if (id === "grove") url.searchParams.delete("fuer"); else url.searchParams.set("fuer", id)
    history.replaceState(null, "", url)
    bereicheMarkieren()
    panelZeichnen()
    vorschau.zeichnen()
}

// ==========================================================
// Abschnitte
// ==========================================================
function navZeichnen() {
    $("#nav").replaceChildren(...ABSCHNITTE.map((a) => el("button", {
        type: "button", class: "nav-punkt", dataset: { abschnitt: a.id },
        onclick: () => { abschnitt = a.id; history.replaceState(null, "", "#" + a.id); navMarkieren(); panelZeichnen(); panel.scrollIntoView({ block: "nearest" }) },
    }, el("span", { html: ICON(a.icon) }), a.name)))
    navMarkieren()
}
function navMarkieren() {
    document.querySelectorAll(".nav-punkt").forEach((b) => b.toggleAttribute("aria-current", b.dataset.abschnitt === abschnitt))
}

function panelZeichnen() {
    aktualisierer = []
    const bauer = { presets, farben, schrift, form, bilder, bewegung, galerie, flaeche }[abschnitt]
    const a = ABSCHNITTE.find((x) => x.id === abschnitt)
    panel.replaceChildren(
        el("header", { class: "panel-kopf" }, el("h2", {}, a.name), bereichsHinweis()),
        ...bauer().filter(Boolean),
    )
    alleAktualisieren()
}

function bereichsHinweis() {
    const b = D.BEREICHE.find((x) => x.id === ctx.bereich)
    const eigene = ctx.bereich === "grove" ? T.laub.einstellungen.grove : T.laub.einstellungen.dienste?.[ctx.bereich]
    const hatEigene = eigene && Object.keys(eigene).length > 0
    const text = ctx.bereich === "grove"
        ? "Gilt überall in Grove – außer ein Dienst hat eigene Einstellungen."
        : `Gilt nur für ${b.name}. Alles, was du hier nicht änderst, erbt ${b.name} von „Ganz Grove“.`
    return el("div", { class: "panel-bereich" },
        el("p", {}, text),
        hatEigene ? el("button", {
            type: "button", class: "knopf-text", onclick: () => { T.bereichZuruecksetzen(ctx.bereich); hinweis(`${b.name} zurückgesetzt`); panelZeichnen() },
        }, ctx.bereich === "grove" ? "Ganz Grove zurücksetzen" : `${b.name} zurücksetzen`) : null)
}

function alleAktualisieren() {
    panel.querySelector(".panel-bereich")?.replaceWith(bereichsHinweis())
    aktualisieren(panel)
    aktualisierer.forEach((f) => f())
}

// ==========================================================
// 1 · Presets
// ==========================================================
function presetMini(einst) {
    // Ein kleines Fenster in den Farben des Presets
    const w = T.wirksam(ctx.bereich === "grove" ? "lichtung" : ctx.bereich, einst)
    const p = T.palette(w)
    const fenster = el("span", { class: "pmini" },
        el("span", { class: "pmini__kopf" }, el("i", {}), el("i", {}), el("i", {})),
        el("span", { class: "pmini__titel" }, "Aa"),
        el("span", { class: "pmini__karte" }, el("span", { class: "pmini__linie" }), el("span", { class: "pmini__linie kurz" }), el("span", { class: "pmini__knopf" })),
        el("span", { class: "pmini__farben" }, ...["amber", "amber-light", "flieder", "text-soft"].map((k) => el("i", { style: { background: p[k] } }))),
    )
    T.variablenSetzen(fenster, T.variablen(w))
    return fenster
}

let presetZiel = "alles"     // bei einem Dienst: „alles“ oder „nur“ diesen Dienst
function presets() {
    T.schriftenLaden(D.PRESETS.flatMap((p) => [p.einstellungen.grove?.schrift?.titel, p.einstellungen.grove?.schrift?.text]).filter(Boolean))
    const b = D.BEREICHE.find((x) => x.id === ctx.bereich)
    const anwenden = (einst, name) => {
        if (ctx.bereich !== "grove" && presetZiel === "nur") {
            T.aendern((e) => { e.dienste[ctx.bereich] = T.tiefMischen(einst.grove, einst.dienste?.[ctx.bereich]) })
            hinweis(`„${name}“ gilt jetzt für ${b.name}`)
        } else {
            T.setzen(structuredClone(einst))
            hinweis(`„${name}“ angewendet`)
        }
    }
    const istAktiv = (einst) => JSON.stringify(T.laub.einstellungen) === JSON.stringify(einst)
        || (!Object.keys(T.laub.einstellungen).length && !Object.keys(einst).length)

    const ziel = ctx.bereich === "grove" ? null : el("div", { class: "preset-ziel" },
        el("span", {}, "Preset anwenden auf"),
        (() => {
            const g = el("div", { class: "segmente", role: "radiogroup" })
            for (const [id, name] of [["alles", "Ganz Grove"], ["nur", `nur ${b.name}`]]) {
                g.append(el("button", { type: "button", role: "radio", "aria-checked": String(presetZiel === id), onclick: () => { presetZiel = id; panelZeichnen() } }, name))
            }
            return g
        })())

    const karte = (p, eigene = false) => {
        const k = el("article", { class: "preset" + (p.standard ? " preset--standard" : "") },
            presetMini(p.einstellungen),
            el("div", { class: "preset__text" },
                el("strong", {}, p.name, p.standard ? el("small", {}, "Original") : null),
                p.text ? el("p", {}, p.text) : el("p", {}, "Gespeichert am " + new Date(p.erstellt).toLocaleDateString("de-DE"))),
            el("div", { class: "preset__aktionen" },
                el("button", { type: "button", class: "knopf-voll", onclick: () => anwenden(p.einstellungen, p.name) }, p.standard ? "Zurück zum Original" : "Anwenden"),
                eigene ? el("button", { type: "button", class: "knopf-text", title: "Mit dem aktuellen Look überschreiben", onclick: () => { T.presetUeberschreiben(p.id); hinweis(`„${p.name}“ aktualisiert`) } }, "Überschreiben") : null,
                eigene ? el("button", { type: "button", class: "knopf-text", onclick: async () => { await kopieren(T.presetCode(p.einstellungen, p.name)); hinweis("Preset-Code kopiert – zum Teilen einfach einfügen") } }, "Teilen") : null,
                eigene ? loeschKnopf(() => { T.presetLoeschen(p.id); panelZeichnen(); hinweis(`„${p.name}“ gelöscht`) }) : null,
            ),
            el("span", { class: "preset__aktiv" }, "Aktiv"))
        aktualisierer.push(() => k.classList.toggle("ist-aktiv", ctx.bereich === "grove" || presetZiel === "alles" ? istAktiv(p.einstellungen) : false))
        return k
    }

    const name = el("input", { type: "text", placeholder: "Name, z. B. „Mein Abend“", maxlength: 40, "aria-label": "Name für das Preset" })
    const speichern = el("form", { class: "preset-neu", novalidate: true, onsubmit: (e) => {
        e.preventDefault()
        const p = T.presetSpeichern(name.value)
        name.value = ""
        hinweis(`„${p.name}“ gespeichert`)
        panelZeichnen()
    } }, name, el("button", { type: "submit", class: "knopf-voll" }, "Aktuellen Look speichern"))

    const code = el("textarea", { rows: 3, placeholder: "GROVE-LAUB:…", "aria-label": "Preset-Code", spellcheck: "false" })
    const codeMeldung = el("p", { class: "fehlertext", role: "alert" })
    const einfuegen = el("details", { class: "preset-code" },
        el("summary", {}, "Preset-Code einfügen"),
        el("p", { class: "lz__hinweis" }, "Hat dir jemand einen Grove-Look geschickt? Code hier einfügen – er landet bei deinen Presets."),
        code, codeMeldung,
        el("button", { type: "button", class: "knopf-leise", onclick: () => {
            try {
                const { name: n, einstellungen } = T.presetAusCode(code.value)
                T.presetHinzufuegen(n, einstellungen)
                hinweis(`„${n}“ hinzugefügt`)
                panelZeichnen()
            } catch { codeMeldung.textContent = "Das ist kein gültiger Preset-Code." }
        } }, "Hinzufügen"))

    return [
        el("p", { class: "panel-intro" }, "Ein Preset ändert alles auf einmal – Farben, Schrift, Bilder und Bewegung. Danach kannst du jedes Detail weiter anpassen."),
        ziel,
        el("div", { class: "presets" }, ...D.PRESETS.map((p) => karte(p))),
        el("h3", { class: "panel-zwischen" }, "Deine Presets"),
        speichern,
        T.laub.presets.length
            ? el("div", { class: "presets" }, ...T.laub.presets.map((p) => karte(p, true)))
            : el("p", { class: "leer-text" }, "Noch keine eigenen Presets. Stell dir etwas zusammen und speichere es oben."),
        einfuegen,
    ]
}

// ==========================================================
// 2 · Farben
// ==========================================================
function farben() {
    // Generator: aus einer Farbe eine ganze Palette
    const grundton = el("input", { type: "color", value: wert("farben.amber"), "aria-label": "Grundfarbe" })
    let hell = !T.palette(T.wirksam(ctx.bereich)).dunkel
    const hellWahl = el("div", { class: "segmente", role: "radiogroup" })
    const hellKnoepfe = [["dunkel", "Dunkel"], ["hell", "Hell"]].map(([id, n]) => el("button", {
        type: "button", role: "radio", onclick: () => { hell = id === "hell"; hellKnoepfe.forEach((b) => b.setAttribute("aria-checked", String((b.textContent === "Hell") === hell))) },
    }, n))
    hellWahl.append(...hellKnoepfe)
    hellKnoepfe.forEach((b) => b.setAttribute("aria-checked", String((b.textContent === "Hell") === hell)))

    const generator = el("div", { class: "generator" },
        el("label", { class: "generator__farbe" }, grundton, el("span", {}, "Lieblingsfarbe")),
        hellWahl,
        el("button", { type: "button", class: "knopf-voll", onclick: () => {
            const neu = paletteAus(grundton.value, hell)
            T.aendern((e) => { const ziel = ctx.bereich === "grove" ? e.grove : (e.dienste[ctx.bereich] ??= {}); ziel.farben = neu })
            hinweis("Neue Palette erzeugt")
        } }, "Palette erzeugen"))

    // Lesbarkeit prüfen (Kontrast nach WCAG: ab 4,5 : 1 gut lesbar)
    const lesbar = el("div", { class: "lesbarkeit" })
    aktualisierer.push(() => {
        const p = T.palette(T.wirksam(ctx.bereich))
        const werte = [
            ["Text auf Grund", T.kontrast(p.text, p.ground)],
            ["Leiser Text", T.kontrast(p.muted, p.ground)],
            ["Knopf-Beschriftung", T.kontrast(p["auf-akzent"], p.amber)],
        ]
        lesbar.replaceChildren(...werte.map(([n, k]) => el("span", { class: "lesbar " + (k >= 4.5 ? "gut" : k >= 3 ? "mittel" : "schlecht") },
            el("b", {}, k.toFixed(1).replace(".", ",") + " : 1"), n)))
    })

    const gruppen = D.FARB_GRUPPEN.map((g) => el("div", { class: "farbgruppe" },
        el("h3", { class: "panel-zwischen" }, g.name),
        el("div", { class: "farbfelder" }, ...g.felder.map(([k, name, hinweisText]) => farbfeld(k, name, hinweisText)))))

    return [
        zeile({ titel: "Aus einer Farbe ableiten", hinweis: "Wähl eine Farbe, die du magst – Laub baut daraus eine ganze, stimmige Palette.", inhalt: generator }),
        zeile({ titel: "Lesbarkeit", hinweis: "Kontrast zwischen Text und Hintergrund. Ab 4,5 : 1 ist alles gut lesbar.", inhalt: lesbar }),
        ...gruppen,
    ]
}

function farbfeld(k, name, hinweisText) {
    const pfad = "farben." + k
    const wahl = el("input", { type: "color", "aria-label": name })
    const hex = el("input", { type: "text", class: "farbfeld__hex", maxlength: 7, spellcheck: "false", "aria-label": name + " als Hex-Wert" })
    const muster = el("span", { class: "farbfeld__muster" }, wahl)
    wahl.addEventListener("input", () => setze(pfad, wahl.value.toUpperCase()))
    hex.addEventListener("change", () => {
        const v = hex.value.trim().replace(/^#?/, "#").toUpperCase()
        if (/^#[0-9A-F]{6}$/.test(v)) setze(pfad, v); else hex.value = wert(pfad)
    })
    const z = zeile({ titel: name, hinweis: hinweisText, pfad, klasse: "lz--farbe", inhalt: el("div", { class: "farbfeld" }, muster, hex) })
    aktualisierer.push(() => {
        const v = wert(pfad)
        muster.style.background = v
        if (document.activeElement !== wahl) wahl.value = v.toLowerCase()
        if (document.activeElement !== hex) hex.value = v
    })
    return z
}

// ==========================================================
// 3 · Schrift
// ==========================================================
function schrift() {
    T.schriftenLaden(D.SCHRIFTEN.map((s) => s.id))
    const titel = kacheln({
        pfad: "schrift.titel", optionen: D.SCHRIFTEN, klasse: "kacheln--schrift",
        inhalt: (s) => el("span", { class: "schriftprobe", style: { fontFamily: s.familie } }, "Grove"),
        beschriftung: (s) => el("span", {}, s.name, el("small", {}, s.art)),
    })
    const text = kacheln({
        pfad: "schrift.text", optionen: D.SCHRIFTEN, klasse: "kacheln--schrift kacheln--text",
        inhalt: (s) => el("span", { class: "schriftprobe schriftprobe--text", style: { fontFamily: s.familie } }, "Heute Abend spielt Musik im Grove."),
        beschriftung: (s) => el("span", {}, s.name, el("small", {}, s.art)),
    })
    return [
        zeile({ titel: "Überschriften", hinweis: "Für Titel, Begrüßung und Namen der Dienste.", pfad: "schrift.titel", inhalt: titel }),
        zeile({ titel: "Fließtext", hinweis: "Für alles andere – Menüs, Listen, Texte.", pfad: "schrift.text", inhalt: text }),
        zeile({ titel: "Größe", hinweis: "Macht die ganze Schrift in Grove größer oder kleiner.", pfad: "schrift.groesse",
            inhalt: schieber({ pfad: "schrift.groesse", min: 85, max: 125, schritt: 5, format: (v) => v + " %", links: "A", rechts: el("span", { style: { fontSize: "1.3em" } }, "A") }) }),
    ]
}

// ==========================================================
// 4 · Form & Symbole
// ==========================================================
function form() {
    const ecken = el("div", { class: "eckenprobe" }, el("span", {}), el("span", {}), el("span", {}))
    const symbole = el("div", { class: "symbolprobe" }, ...[
        '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
        '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
        '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
        '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
        '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
        '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    ].map((p) => el("span", { html: ICON(p) })))
    return [
        zeile({ titel: "Ecken", hinweis: "Wie rund Karten, Knöpfe und Felder sind.", pfad: "form.ecken",
            inhalt: el("div", {}, schieber({ pfad: "form.ecken", min: 0, max: 2, schritt: 0.05, format: (v) => v === 0 ? "eckig" : v === 1 ? "Standard" : Math.round(v * 100) + " %", links: "eckig", rechts: "rund" }), ecken) }),
        zeile({ titel: "Strichstärke der Symbole", hinweis: "Alle Linien-Symbole in Menüs und Knöpfen.", pfad: "symbole.strich",
            inhalt: el("div", {}, segmente({ pfad: "symbole.strich", optionen: [{ id: 0, name: "Wie gezeichnet" }, { id: 1.3, name: "Fein" }, { id: 1.8, name: "Mittel" }, { id: 2.4, name: "Kräftig" }] }), symbole) }),
        zeile({ titel: "Linienenden", hinweis: "Runde Enden wirken weich, eckige technisch.", pfad: "symbole.enden",
            inhalt: segmente({ pfad: "symbole.enden", optionen: [{ id: "rund", name: "Rund" }, { id: "eckig", name: "Eckig" }] }) }),
    ]
}

// ==========================================================
// 5 · Zeichen & Bilder
// ==========================================================
function bilder() {
    const b = ctx.bereich
    const istDienst = b !== "grove" && b !== "lichtung"
    const zeichenKacheln = (pfad) => kacheln({
        pfad, optionen: D.ZEICHEN, klasse: "kacheln--zeichen",
        inhalt: (z) => el("img", { src: z.datei, alt: "" }),
    })
    const teile = []
    if (!istDienst) {
        teile.push(zeile({ titel: "Grove-Zeichen", hinweis: "Das Logo oben links auf der Lichtung und im Konto.", pfad: "bilder.logo", inhalt: zeichenKacheln("bilder.logo") }))
        teile.push(zeile({ titel: "Szene der Lichtung", hinweis: "Das große Bild oben im Hauptmenü (und auf der 404-Seite).", pfad: "bilder.szene",
            inhalt: kacheln({ pfad: "bilder.szene", optionen: D.SZENEN, klasse: "kacheln--szene",
                inhalt: (s) => s.datei ? el("img", { src: s.datei, alt: "" }) : el("span", { class: "kachel__leer" }, "—") }) }))
    } else {
        teile.push(zeile({ titel: "Zeichen", hinweis: "Das Symbol oben links im Dienst und in der Auswahl hier.", pfad: "bilder.zeichen", inhalt: zeichenKacheln("bilder.zeichen") }))
        teile.push(zeile({ titel: "Bild auf der Karte", hinweis: "Die Illustration auf der Karte des Dienstes in der Lichtung.", pfad: "bilder.karte",
            inhalt: kacheln({ pfad: "bilder.karte", optionen: D.KARTEN, klasse: "kacheln--karte", inhalt: (k) => el("img", { src: k.datei, alt: "" }) }) }))
    }
    teile.push(zeile({ titel: "In Themenfarben einfärben", hinweis: "Bilder und Zeichen übernehmen die Farben deines Looks. Aus = immer in den Originalfarben.", pfad: "bilder.einfaerben",
        inhalt: schalter({ pfad: "bilder.einfaerben", text: "Bilder einfärben" }) }))
    if (!istDienst) teile.push(el("p", { class: "panel-intro" }, "Zeichen und Karten-Bilder der einzelnen Dienste stellst du oben beim jeweiligen Dienst ein."))
    return teile
}

// ==========================================================
// 6 · Bewegung
// ==========================================================
function bewegung() {
    const b = ctx.bereich
    const mitLichtung = b === "grove" || b === "lichtung"
    const stufe = el("div", { class: "stufen", role: "radiogroup", dataset: { wahlPfad: "bewegung.stufe" } },
        ...D.STUFEN.map((s) => el("button", { type: "button", role: "radio", class: "stufe", dataset: { wahl: s.id }, onclick: () => setze("bewegung.stufe", s.id) },
            el("strong", {}, s.name), el("span", {}, s.text))))

    const hintergrund = kacheln({ pfad: "bewegung.hintergrund", optionen: D.HINTERGRUENDE, klasse: "kacheln--atmo",
        inhalt: (h) => { const box = el("span", { class: "atmo-probe" }); T.atmoSetzen(box, h.id); return box },
        beschriftung: (h) => el("span", {}, h.name, h.nr ? el("small", {}, String(h.nr).padStart(2, "0")) : null) })

    const zeichen = kacheln({ pfad: "bewegung.zeichen", optionen: D.ZEICHEN_EFFEKTE, klasse: "kacheln--effekt",
        inhalt: (e) => el("img", { src: T.zeichenDatei(b === "grove" || b === "lichtung" ? wert("bilder.logo") : wert("bilder.zeichen")) || T.zeichenDatei("grove"), alt: "", class: e.klasse }),
        beschriftung: (e) => el("span", {}, e.name, e.nr ? el("small", {}, String(e.nr).padStart(2, "0")) : null) })

    const gruss = kacheln({ pfad: "bewegung.begruessung", optionen: D.BEGRUESSUNGEN, klasse: "kacheln--gruss",
        inhalt: (g) => { const h = el("span", { class: "grussprobe" }); begruessungProbe(h, g.id); return h },
        beschriftung: (g) => el("span", {}, g.name, g.nr ? el("small", {}, String(g.nr).padStart(2, "0")) : null),
    })
    gruss.querySelectorAll(".kachel").forEach((k) => k.addEventListener("pointerenter", () => {
        const h = k.querySelector(".grussprobe"); begruessungProbe(h, k.dataset.wahl)
    }))

    const eingang = kacheln({ pfad: "bewegung.eingang", optionen: D.EINGAENGE, klasse: "kacheln--eingang",
        inhalt: (e) => el("span", { class: "eingangprobe", dataset: { eingang: e.id } }, el("i", { style: "--i:0" }), el("i", { style: "--i:1" }), el("i", { style: "--i:2" })),
        beschriftung: (e) => el("span", {}, e.name, e.nr ? el("small", {}, String(e.nr).padStart(2, "0")) : null) })
    eingang.querySelectorAll(".kachel").forEach((k) => k.addEventListener("pointerenter", () => {
        const p = k.querySelector(".eingangprobe"); p.classList.remove("laeuft"); void p.offsetWidth; p.classList.add("laeuft")
    }))
    eingang.querySelectorAll(".eingangprobe").forEach((p) => p.classList.add("laeuft"))

    const hover = kacheln({ pfad: "bewegung.hover", optionen: D.HOVER, klasse: "kacheln--hover",
        inhalt: (h) => el("span", { class: "hoverprobe" + (h.id === "leuchten" ? " a40" : h.id === "kippen" ? " a41" : ""), dataset: { hover: h.id } }, el("i", {}), el("i", {})),
        beschriftung: (h) => el("span", {}, h.name, h.nr ? el("small", {}, String(h.nr).padStart(2, "0")) : null) })

    return [
        zeile({ titel: "Wie viel Bewegung?", pfad: "bewegung.stufe", inhalt: stufe }),
        zeile({ titel: "Tempo", hinweis: "Alle Animationen langsamer oder schneller.", pfad: "bewegung.tempo",
            inhalt: schieber({ pfad: "bewegung.tempo", min: 0.25, max: 2, schritt: 0.25, format: (v) => v === 1 ? "normal" : v.toLocaleString("de-DE") + " ×", links: "gemächlich", rechts: "flott" }) }),
        zeile({ titel: "Hintergrund", hinweis: mitLichtung ? "Läuft auf der Lichtung oben im Bild, in den Diensten hinter der Seite." : "Läuft hinter der Seite dieses Dienstes.", pfad: "bewegung.hintergrund",
            inhalt: el("div", {}, hintergrund, schieber({ pfad: "bewegung.hintergrundStaerke", min: 20, max: 100, schritt: 5, format: (v) => v + " %", links: "zart", rechts: "kräftig" })) }),
        zeile({ titel: "Zeichen in der Kopfzeile", hinweis: "Eine kleine Daueranimation für das Zeichen oben links.", pfad: "bewegung.zeichen", inhalt: zeichen }),
        mitLichtung ? zeile({ titel: "Begrüßung", hinweis: "Wie „Guten Abend, …“ auf der Lichtung erscheint. Fahr über eine Kachel, um sie abzuspielen.", pfad: "bewegung.begruessung", inhalt: gruss }) : null,
        zeile({ titel: "Erscheinen", hinweis: "Wie Karten beim Öffnen einer Seite auftauchen. Drüberfahren spielt es ab.", pfad: "bewegung.eingang", inhalt: eingang }),
        zeile({ titel: "Karten beim Drüberfahren", hinweis: "Probier es direkt an den Kacheln aus.", pfad: "bewegung.hover", inhalt: hover }),
        zeile({ titel: "Seitenwechsel", hinweis: "Übergang, wenn du zwischen Seiten wechselst (in Chrome und Edge).", pfad: "bewegung.seitenwechsel",
            inhalt: segmente({ pfad: "bewegung.seitenwechsel", optionen: D.SEITENWECHSEL }) }),
    ].filter(Boolean)
}

function begruessungProbe(h, art) {
    T.begruessungSetzen(h, "Guten Abend.", art)
}

// ==========================================================
// 7 · Animationen (Galerie aller Nummern)
// ==========================================================
const PLAETZE = {
    hintergrund: { pfad: "bewegung.hintergrund", liste: D.HINTERGRUENDE, name: "Als Hintergrund" },
    zeichen:     { pfad: "bewegung.zeichen",     liste: D.ZEICHEN_EFFEKTE, name: "Fürs Zeichen" },
    begruessung: { pfad: "bewegung.begruessung", liste: D.BEGRUESSUNGEN, name: "Als Begrüßung" },
    eingang:     { pfad: "bewegung.eingang",     liste: D.EINGAENGE, name: "Zum Erscheinen" },
    hover:       { pfad: "bewegung.hover",       liste: D.HOVER, name: "Für Karten" },
}
// Wo kann eine Nummer eingesetzt werden?
function plaetzeFuer(nr) {
    return Object.entries(PLAETZE).flatMap(([id, p]) => {
        const o = p.liste.find((x) => x.nr === nr)
        return o ? [{ platz: id, ...p, wert: o.id }] : []
    })
}
// Feste Bühnen-Größen: große Animationen werden verkleinert
const ZOOM = { 1: .5, 2: .6, 3: .6, 4: .6, 5: .55, 6: .7, 7: .65, 9: .6, 10: .8, 14: .55, 15: .62, 16: .62, 17: .6, 18: .5, 19: .55, 20: .6, 21: .6, 23: .55, 24: .7, 25: .8, 26: .55, 27: .7, 28: .75, 29: .7, 40: .7, 41: .7, 42: .6, 43: .8, 44: .8 }
const FUELLT = new Set([11, 12, 13, 22, 30, 31, 32, 33, 34, 35, 36, 28])

let galerieFilter = "alle"
function galerie() {
    const filter = [["alle", "Alle"], ["hintergrund", "Hintergrund"], ["zeichen", "Zeichen"], ["begruessung", "Begrüßung"], ["eingang", "Erscheinen"], ["hover", "Karten"], ["weitere", "Ohne festen Platz"]]
    const leiste = el("div", { class: "filter", role: "radiogroup", "aria-label": "Animationen filtern" },
        ...filter.map(([id, n]) => el("button", { type: "button", role: "radio", "aria-checked": String(galerieFilter === id), onclick: () => { galerieFilter = id; panelZeichnen() } }, n)))
    const sichtbar = GALERIE.filter((a) => {
        const p = plaetzeFuer(a.nr)
        return galerieFilter === "alle" || (galerieFilter === "weitere" ? !p.length : p.some((x) => x.platz === galerieFilter))
    })
    const beobachter = new IntersectionObserver((eintraege) => eintraege.forEach((e) => e.target.classList.toggle("laeuft", e.isIntersecting)), { rootMargin: "80px" })
    const raster = el("div", { class: "galerie" }, ...sichtbar.map((a) => {
        const p = plaetzeFuer(a.nr)
        const buehne = el("div", { class: "galerie__buehne" + (FUELLT.has(a.nr) ? " fuellt" : ""), html: `<div class="galerie__zoom" style="zoom:${ZOOM[a.nr] || 1}">${a.html}</div>`,
            title: "Klicken: neu abspielen" })
        buehne.addEventListener("click", () => { const z = buehne.firstElementChild; const h = z.innerHTML; z.innerHTML = ""; void z.offsetWidth; z.innerHTML = h })
        const kachel = el("article", { class: "galerie__kachel", dataset: { nr: a.nr } },
            buehne,
            el("div", { class: "galerie__text" },
                el("strong", {}, el("span", { class: "galerie__nr" }, String(a.nr).padStart(2, "0")), a.name),
                el("p", {}, a.text)),
            el("div", { class: "galerie__aktionen" },
                ...(p.length ? p.map((x) => {
                    const knopf = el("button", { type: "button", class: "knopf-leise klein", onclick: () => { setze(x.pfad, x.wert); hinweis(`Nr. ${a.nr} eingesetzt: ${x.name.replace(/^(Als|Fürs|Zum|Für) /, "")}`) } }, x.name)
                    aktualisierer.push(() => { const an = wert(x.pfad) === x.wert; knopf.classList.toggle("ist-an", an); knopf.textContent = an ? "✓ " + x.name.replace(/^(Als|Fürs|Zum|Für) /, "") : x.name })
                    return knopf
                }) : [el("span", { class: "galerie__frei" }, `Noch ohne festen Platz – sag Claude „Nr. ${a.nr}“, dann baut er sie ein.`)])))
        beobachter.observe(kachel)
        return kachel
    }))
    return [
        el("p", { class: "panel-intro" }, `Alle ${GALERIE.length} Animationen aus Groves Bibliothek. Viele kannst du direkt auf einen Platz legen. Klick auf eine Bühne spielt sie neu ab.`),
        leiste, raster,
    ]
}

// ==========================================================
// 8 · Hintergrund
// ==========================================================
function flaeche() {
    const muster = kacheln({ pfad: "flaeche.muster", optionen: D.MUSTER, klasse: "kacheln--muster",
        inhalt: (m) => { const box = el("span", { class: "musterprobe" }); box.style.backgroundImage = D.musterSvg(m.id, T.palette(T.wirksam(ctx.bereich)).amber, 0.22); return box } })
    aktualisierer.push(() => muster.querySelectorAll(".musterprobe").forEach((box, i) => {
        box.style.backgroundImage = D.musterSvg(D.MUSTER[i].id, T.palette(T.wirksam(ctx.bereich)).amber, 0.22)
    }))
    return [
        zeile({ titel: "Filmkorn", hinweis: "Feines Rauschen über allem – der Nachtclub-Look.", pfad: "flaeche.korn",
            inhalt: schieber({ pfad: "flaeche.korn", min: 0, max: 15, schritt: 1, format: (v) => v ? v + " %" : "aus", links: "aus", rechts: "stark" }) }),
        zeile({ titel: "Schein von oben", hinweis: "Der warme Lichtschein am oberen Rand jeder Seite.", pfad: "flaeche.schein",
            inhalt: schieber({ pfad: "flaeche.schein", min: 0, max: 100, schritt: 5, format: (v) => v ? v + " %" : "aus", links: "aus", rechts: "voll" }) }),
        zeile({ titel: "Muster", hinweis: "Ein ganz leises Muster im Seitenhintergrund.", pfad: "flaeche.muster",
            inhalt: el("div", {}, muster,
                schieber({ pfad: "flaeche.musterStaerke", min: 2, max: 20, schritt: 1, format: (v) => v + " %", links: "zart", rechts: "deutlich" }),
                schieber({ pfad: "flaeche.musterGroesse", min: 24, max: 120, schritt: 4, format: (v) => v + " px", links: "klein", rechts: "groß" })) }),
    ]
}

// ==========================================================
// Helfer
// ==========================================================
function loeschKnopf(beiBestaetigt) {
    const k = el("button", { type: "button", class: "knopf-text knopf-text--warn" }, "Löschen")
    k.addEventListener("click", () => {
        if (k.dataset.sicher) return beiBestaetigt()
        k.dataset.sicher = "1"; k.textContent = "Wirklich löschen?"
        setTimeout(() => { if (k.isConnected) { delete k.dataset.sicher; k.textContent = "Löschen" } }, 3500)
    })
    return k
}

async function kopieren(text) {
    try { await navigator.clipboard.writeText(text) } catch { prompt("Preset-Code kopieren:", text) }
}

let hinweisTimer
function hinweis(text) {
    const h = $("#hinweis")
    h.textContent = text
    h.classList.add("sichtbar")
    clearTimeout(hinweisTimer)
    hinweisTimer = setTimeout(() => h.classList.remove("sichtbar"), 2400)
}

// Speicherstand oben rechts
const STATUS = {
    speichert: ["Speichert …", "laeuft"],
    gespeichert: ["Gespeichert", "ok"],
    lokal: ["Nur auf diesem Gerät", "lokal"],
    fehler: ["Nicht gespeichert", "fehler"],
}
function statusZeigen(s) {
    const [text, art] = STATUS[s] || STATUS.lokal
    const el = $("#status")
    el.textContent = text
    el.dataset.art = art
    el.title = s === "lokal" ? "Die Tabelle „gestaltung“ fehlt in Supabase (supabase/migrations/007_gestaltung.sql). Bis dahin speichert Laub nur in diesem Browser." : ""
}
window.addEventListener("grove-laub", (e) => statusZeigen(e.detail.status))
statusZeigen(T.laub.status)

// Rückgängig
$("#rueckgaengig").addEventListener("click", () => { if (T.rueckgaengig()) hinweis("Rückgängig gemacht") })
document.addEventListener("keydown", (e) => {
    const tippt = /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName) && document.activeElement.type !== "range" && document.activeElement.type !== "color"
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey && !tippt) {
        e.preventDefault()
        if (T.rueckgaengig()) hinweis("Rückgängig gemacht")
    }
})

// Jede Änderung (auch aus einem anderen Tab) → Oberfläche + Vorschau nachziehen
window.addEventListener("grove-thema", () => {
    alleAktualisieren()
    bereicheMarkieren()
    vorschau.zeichnen()
    $("#rueckgaengig").disabled = !T.kannRueckgaengig()
})

// ---------- Los geht's ----------
bereicheZeichnen()
navZeichnen()
panelZeichnen()
vorschau.zeichnen()
