// ==========================================================
// Grove · Thema-Daten (für Laub, den Gestaltungs-Dienst)
//
// Hier steht WAS man einstellen kann – thema.js wendet es an,
// die Laub-Seite zeigt es zum Auswählen.
//
//   STANDARD          das Original-Design („Lichtung“). Wird nie verändert.
//   DIENST_STANDARD   was je Dienst anders ist (Zeichen, Karten-Bild, …)
//   PRESETS           fertige Looks zum Anwenden
//   SCHRIFTEN, ZEICHEN, KARTEN, SZENEN, MUSTER,
//   HINTERGRUENDE, ZEICHEN_EFFEKTE, BEGRUESSUNGEN,
//   EINGAENGE, HOVER, SEITENWECHSEL   → die Auswahl-Listen
//
// Einstellungen eines Nutzers sind immer nur die ÄNDERUNGEN:
//   { grove: { farben: { amber: "#…" } }, dienste: { myzel: { … } } }
// Was fehlt, kommt aus dem Standard. Darum ist „Zurücksetzen“ einfach {}.
// ==========================================================

export const STANDARD = {
    farben: {
        ground: "#1C1420", "ground-deep": "#160F19", surface: "#241A27", "surface-hi": "#2A1F2C",
        border: "#2E2231", "border-hi": "#3A2C3D",
        amber: "#E3A15A", "amber-light": "#F2C08A", flieder: "#C9A7D1",
        text: "#EFE6D6", "text-soft": "#CDBFAE", muted: "#A8957F",
        gut: "#BFE3B4", fehler: "#E8907E",
    },
    schrift: { titel: "fraunces", text: "instrument", groesse: 100 },
    form: { ecken: 1 },
    symbole: { strich: 0, enden: "rund" },          // strich 0 = wie gezeichnet
    flaeche: { korn: 6, schein: 100, muster: "keins", musterStaerke: 7, musterGroesse: 48 },
    bilder: { einfaerben: true, logo: "grove", zeichen: null, karte: null, szene: "lichtung" },
    bewegung: {
        stufe: "voll", tempo: 1,
        hintergrund: "keiner", hintergrundStaerke: 100,
        zeichen: "keins", begruessung: "aufsteigen", eingang: "aufsteigen",
        hover: "heben", seitenwechsel: "keiner",
    },
}

// Was je Dienst vom Standard abweicht (gehört zum Original-Design)
export const DIENST_STANDARD = {
    lichtung: { bewegung: { hintergrund: "gluehwuermchen" } },
    mail:     { bilder: { zeichen: "mail",   karte: "mail" } },
    myzel:    { bilder: { zeichen: "myzel",  karte: "myzel" } },
    rinde:    { bilder: { zeichen: "rinde",  karte: "rinde" } },
    laub:     { bilder: { zeichen: "laub",   karte: "laub" } },
    bridge:   { bilder: { zeichen: "bridge", karte: "bridge" } },
}

// Geltungsbereiche in Laub (Reihenfolge = Anzeige)
export const BEREICHE = [
    { id: "grove",    name: "Ganz Grove", zeichen: null },
    { id: "lichtung", name: "Lichtung",   zeichen: null },
    { id: "mail",     name: "Grove Mail", zeichen: "mail" },
    { id: "myzel",    name: "Myzel",      zeichen: "myzel" },
    { id: "rinde",    name: "Rinde",      zeichen: "rinde" },
    { id: "laub",     name: "Laub",       zeichen: "laub" },
    { id: "bridge",   name: "Bridge",     zeichen: "bridge" },
]

// ---------- Farben: Beschriftung für Laub ----------
export const FARB_GRUPPEN = [
    { name: "Flächen", felder: [
        ["ground", "Grund", "Hintergrund jeder Seite"],
        ["ground-deep", "Tiefe", "Kopfzeile, Seitenleisten"],
        ["surface", "Karte", "Karten und Felder"],
        ["surface-hi", "Karte hell", "Hervorgehobenes, Menüs"],
    ] },
    { name: "Linien", felder: [
        ["border", "Linie", "feine Trennlinien"],
        ["border-hi", "Linie stark", "Rahmen von Knöpfen und Karten"],
    ] },
    { name: "Akzente", felder: [
        ["amber", "Akzent", "Logo, Knöpfe, Markierungen"],
        ["amber-light", "Akzent hell", "Hover, aktiver Text"],
        ["flieder", "Zweitakzent", "Sonderzeichen, Polarlicht"],
    ] },
    { name: "Text", felder: [
        ["text", "Text", "Überschriften, Fließtext"],
        ["text-soft", "Text sanft", "Beschreibungen"],
        ["muted", "Text leise", "Hinweise, Datum"],
    ] },
    { name: "Signale", felder: [
        ["gut", "Erfolg", "„Aktiv“, Gespeichert"],
        ["fehler", "Fehler", "Warnungen, Löschen"],
    ] },
]

// ---------- Schriften (Google Fonts) ----------
// laden = Teil der Google-Fonts-Adresse; leer = ist schon in jeder Seite geladen
export const SCHRIFTEN = [
    { id: "fraunces",     name: "Fraunces",          art: "Serif · warm",       familie: "'Fraunces', Georgia, serif", laden: "" },
    { id: "instrument",   name: "Instrument Sans",   art: "Sans · klar",        familie: "'Instrument Sans', 'Segoe UI', system-ui, sans-serif", laden: "" },
    { id: "playfair",     name: "Playfair Display",  art: "Serif · elegant",    familie: "'Playfair Display', Georgia, serif", laden: "Playfair+Display:ital,wght@0,400;0,600;1,400" },
    { id: "dmserif",      name: "DM Serif Display",  art: "Serif · kräftig",    familie: "'DM Serif Display', Georgia, serif", laden: "DM+Serif+Display:ital@0;1" },
    { id: "abril",        name: "Abril Fatface",     art: "Plakat · Jazz",      familie: "'Abril Fatface', Georgia, serif", laden: "Abril+Fatface" },
    { id: "cormorant",    name: "Cormorant",         art: "Serif · fein",       familie: "'Cormorant Garamond', Georgia, serif", laden: "Cormorant+Garamond:ital,wght@0,400;0,600;1,400" },
    { id: "lora",         name: "Lora",              art: "Serif · ruhig",      familie: "'Lora', Georgia, serif", laden: "Lora:ital,wght@0,400;0,600;1,400" },
    { id: "spacegrotesk", name: "Space Grotesk",     art: "Sans · technisch",   familie: "'Space Grotesk', system-ui, sans-serif", laden: "Space+Grotesk:wght@400;500;600;700" },
    { id: "caveat",       name: "Caveat",            art: "Handschrift",        familie: "'Caveat', cursive", laden: "Caveat:wght@500;700" },
    { id: "inter",        name: "Inter",             art: "Sans · neutral",     familie: "'Inter', system-ui, sans-serif", laden: "Inter:wght@400;500;600;700" },
    { id: "dmsans",       name: "DM Sans",           art: "Sans · freundlich",  familie: "'DM Sans', system-ui, sans-serif", laden: "DM+Sans:wght@400;500;600;700" },
    { id: "nunito",       name: "Nunito Sans",       art: "Sans · rund",        familie: "'Nunito Sans', system-ui, sans-serif", laden: "Nunito+Sans:wght@400;600;700" },
    { id: "worksans",     name: "Work Sans",         art: "Sans · offen",       familie: "'Work Sans', system-ui, sans-serif", laden: "Work+Sans:wght@400;500;600;700" },
    { id: "atkinson",     name: "Atkinson Hyperlegible", art: "Sans · sehr gut lesbar", familie: "'Atkinson Hyperlegible', system-ui, sans-serif", laden: "Atkinson+Hyperlegible:wght@400;700" },
    { id: "plexmono",     name: "IBM Plex Mono",     art: "Mono · Schreibmaschine", familie: "'IBM Plex Mono', ui-monospace, monospace", laden: "IBM+Plex+Mono:wght@400;500;600" },
]

// ---------- Bilder ----------
const Z = "/bilder/zeichen/"
export const ZEICHEN = [
    { id: "grove",    name: "Grove",       datei: "/bilder/marke/grove-logo-klein.svg" },
    { id: "mail",     name: "Brief",       datei: "/bilder/dienste/mail-zeichen.svg" },
    { id: "myzel",    name: "Myzel",       datei: "/bilder/dienste/myzel-zeichen.svg" },
    { id: "rinde",    name: "Rinde",       datei: "/bilder/dienste/rinde-zeichen.svg" },
    { id: "laub",     name: "Laub",        datei: Z + "laub.svg" },
    { id: "bridge",   name: "Brücke",      datei: Z + "bridge.svg" },
    { id: "blatt",    name: "Blatt",       datei: Z + "blatt.svg" },
    { id: "eichel",   name: "Eichel",      datei: Z + "eichel.svg" },
    { id: "pilz",     name: "Pilz",        datei: Z + "pilz.svg" },
    { id: "tanne",    name: "Tanne",       datei: Z + "tanne.svg" },
    { id: "farn",     name: "Farn",        datei: Z + "farn.svg" },
    { id: "mond",     name: "Mond",        datei: Z + "mond.svg" },
    { id: "stern",    name: "Stern",       datei: Z + "stern.svg" },
    { id: "laterne",  name: "Laterne",     datei: Z + "laterne.svg" },
    { id: "flamme",   name: "Flamme",      datei: Z + "flamme.svg" },
    { id: "platte",   name: "Platte",      datei: Z + "platte.svg" },
    { id: "note",     name: "Note",        datei: Z + "note.svg" },
    { id: "welle",    name: "Welle",       datei: Z + "welle.svg" },
    { id: "feder",    name: "Feder",       datei: Z + "feder.svg" },
    { id: "schluessel", name: "Schlüssel", datei: Z + "schluessel.svg" },
    { id: "kristall", name: "Kristall",    datei: Z + "kristall.svg" },
    { id: "kompass",  name: "Kompass",     datei: Z + "kompass.svg" },
]

const D = "/bilder/dienste/"
export const KARTEN = [
    { id: "mail",        name: "Briefe",          datei: D + "mail.svg" },
    { id: "myzel",       name: "Myzel",           datei: D + "myzel.svg" },
    { id: "rinde",       name: "Jahresringe",     datei: D + "rinde.svg" },
    { id: "bridge",      name: "Bridge",          datei: D + "bridge.svg" },
    { id: "laub",        name: "Laub",            datei: D + "laub.svg" },
    { id: "mehr",        name: "Keimling",        datei: D + "mehr.svg" },
    { id: "mondplatte",  name: "Mondplatte",      datei: D + "mondplatte.svg" },
    { id: "bergsee",     name: "Bergsee",         datei: D + "bergsee.svg" },
    { id: "laternenpfad", name: "Laternenpfad",   datei: D + "laternenpfad.svg" },
    { id: "pilzkreis",   name: "Pilzkreis",       datei: D + "pilzkreis.svg" },
    { id: "notenbaum",   name: "Notenbaum",       datei: D + "notenbaum.svg" },
    { id: "sternbild",   name: "Sternbild",       datei: D + "sternbild.svg" },
    { id: "hain",        name: "Hain",            datei: D + "hain.svg" },
]

const S = "/bilder/szenen/"
export const SZENEN = [
    { id: "lichtung", name: "Lichtung bei Nacht", datei: "/bilder/lichtung.svg" },
    { id: "morgen",   name: "Morgennebel",        datei: S + "morgen.svg" },
    { id: "herbst",   name: "Herbstwald",         datei: S + "herbst.svg" },
    { id: "bergsee",  name: "Bergsee",            datei: S + "bergsee.svg" },
    { id: "buehne",   name: "Jazzkeller",         datei: S + "buehne.svg" },
    { id: "keine",    name: "Keine Szene",        datei: null },
]

// Muster für den Seitenhintergrund – farbe = Akzent mit Deckkraft
export const MUSTER = [
    { id: "keins",    name: "Keins" },
    { id: "ringe",    name: "Jahresringe" },
    { id: "punkte",   name: "Punkte" },
    { id: "maserung", name: "Maserung" },
    { id: "blaetter", name: "Blätter" },
    { id: "wellen",   name: "Schallwellen" },
    { id: "sterne",   name: "Sterne" },
]

export function musterSvg(id, farbe, deckkraft = 0.07) {
    const f = farbe, o = deckkraft
    const s = {
        ringe: `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' fill='none' stroke='${f}' stroke-opacity='${o}' stroke-width='1.4'><circle cx='48' cy='48' r='40'/><circle cx='47' cy='49' r='30'/><circle cx='46' cy='50' r='20'/><circle cx='0' cy='0' r='22'/><circle cx='96' cy='96' r='22'/></svg>`,
        punkte: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><circle cx='4' cy='4' r='1.6' fill='${f}' fill-opacity='${o * 1.6}'/><circle cx='16' cy='16' r='1' fill='${f}' fill-opacity='${o * 1.2}'/></svg>`,
        maserung: `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='80' fill='none' stroke='${f}' stroke-opacity='${o}' stroke-width='1.2'><path d='M0 10 C40 4 80 18 160 10'/><path d='M0 30 C50 22 90 40 160 30'/><path d='M0 52 C30 46 110 60 160 52'/><path d='M0 70 C60 64 100 78 160 70'/><ellipse cx='110' cy='40' rx='12' ry='5'/></svg>`,
        blaetter: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='${f}' fill-opacity='${o * 1.3}'><path d='M20 34 C10 30 8 18 14 8 C24 14 28 26 20 34 Z'/><path d='M60 74 C52 72 48 62 52 54 C62 58 66 68 60 74 Z' transform='rotate(40 58 64)'/></svg>`,
        wellen: `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='40' fill='none' stroke='${f}' stroke-opacity='${o}' stroke-width='1.4'><path d='M0 20 Q15 6 30 20 T60 20 T90 20 T120 20'/></svg>`,
        sterne: `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' fill='${f}' fill-opacity='${o * 2}'><circle cx='10' cy='14' r='1'/><circle cx='52' cy='8' r='.7'/><circle cx='74' cy='44' r='1.2'/><circle cx='30' cy='60' r='.8'/><path d='M62 70 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z'/></svg>`,
    }[id]
    return s ? `url("data:image/svg+xml,${encodeURIComponent(s)}")` : "none"
}

// ---------- Bewegung ----------
// Kleiner Zufallsgenerator mit festem Startwert: gleiche Animation sieht jedes Mal gleich aus
function zufall(start) {
    let x = start
    return () => ((x = (x * 9301 + 49297) % 233280) / 233280)
}
function teile(anzahl, start, fn) {
    const r = zufall(start)
    return Array.from({ length: anzahl }, (_, i) => fn(r, i)).join("")
}
const NOTE = `<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8" cy="18" rx="5" ry="3.6" transform="rotate(-20 8 18)"/><rect x="11.6" y="3" width="2" height="15"/><path d="M13.6 3 C17 4 20 6 19 10 C18 8 16 7 13.6 7 Z"/></svg>`
const BLATT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C4 20 2 11 6 2 C15 5 19 13 12 22 Z" style="fill:var(--amber)" opacity=".85"/><path d="M12 21 C10 15 8 9 6.5 3.5" style="stroke:var(--ground)" stroke-width="1.2" fill="none"/></svg>`
const RINGE = `<svg viewBox="0 0 512 512" aria-hidden="true"><circle cx="256" cy="256" r="236" fill="none" stroke="currentColor" stroke-width="12"/><circle cx="251" cy="259" r="192" fill="none" stroke="currentColor" stroke-width="9" opacity=".85"/><circle cx="247" cy="262" r="150" fill="none" stroke="currentColor" stroke-width="9" opacity=".7"/><circle cx="244" cy="265" r="112" fill="none" stroke="currentColor" stroke-width="8" opacity=".85"/></svg>`

// nr = Nummer in der Animations-Bibliothek (docs/design/ANIMATIONEN.md)
export const HINTERGRUENDE = [
    { id: "keiner",         name: "Keiner",         nr: null, html: () => "" },
    { id: "gluehwuermchen", name: "Glühwürmchen",   nr: 11, html: () => `<div class="a11">${"<span></span>".repeat(10)}</div>` },
    { id: "sternschnuppen", name: "Sternschnuppen", nr: 31, html: () => `<div class="a31">${teile(5, 7, (r, i) =>
        `<i style="--x:${30 + r() * 70}%;--y:${r() * 40}%;--d:${8 + r() * 8}s;--v:${-(i * 2.7 + r() * 3)}s"></i>`)}</div>` },
    { id: "regen",          name: "Regen",          nr: 32, html: () => `<div class="a32">${teile(36, 3, (r) =>
        `<i style="--x:${r() * 100}%;--d:${0.9 + r() * 0.7}s;--v:${-r() * 2}s;--o:${0.3 + r() * 0.5}"></i>`)}</div>` },
    { id: "sporen",         name: "Sporen",         nr: 33, html: () => `<div class="a33">${teile(18, 11, (r) =>
        `<i style="--x:${r() * 100}%;--d:${12 + r() * 12}s;--v:${-r() * 20}s;--g:${2 + r() * 3}px"></i>`)}</div>` },
    { id: "nebel",          name: "Nebel",          nr: 34, html: () => `<div class="a34">${teile(3, 5, (r, i) =>
        `<i style="--y:${-15 + i * 12}%;--d:${30 + r() * 20}s;--v:${-r() * 30}s"></i>`)}</div>` },
    { id: "schnee",         name: "Schnee",         nr: 35, html: () => `<div class="a35">${teile(30, 17, (r) =>
        `<i style="--x:${r() * 100}%;--d:${9 + r() * 10}s;--v:${-r() * 18}s;--g:${2 + r() * 4}px"></i>`)}</div>` },
    { id: "polarlicht",     name: "Polarlicht",     nr: 36, html: () => `<div class="a36"><i style="--y:0%;--d:18s"></i><i style="--y:14%;--d:24s;--v:-9s"></i></div>` },
    { id: "noten",          name: "Noten",          nr: 12, html: () => `<div class="a12">${NOTE.repeat(5)}</div>` },
    { id: "blaetter",       name: "Fallende Blätter", nr: 13, html: () => `<div class="a13">${BLATT.repeat(6)}</div>` },
    { id: "ringe",          name: "Treibende Ringe", nr: 30, html: () => `<div class="a30">${RINGE}${RINGE}</div>` },
    { id: "hain",           name: "Wachsender Hain", nr: 22, html: () => `<div class="a22">${teile(9, 13, (r, i) =>
        `<i style="--i:${i};--h:${70 + r() * 110}px;--o:${0.4 + r() * 0.5}"></i>`)}</div>` },
]

export const ZEICHEN_EFFEKTE = [
    { id: "keins",     name: "Ruhig",      nr: null, klasse: "" },
    { id: "atmen",     name: "Atmet",      nr: 2,  klasse: "a02" },
    { id: "glimmen",   name: "Glimmt",     nr: 37, klasse: "a37" },
    { id: "schaukeln", name: "Schaukelt",  nr: 38, klasse: "a38" },
    { id: "bass",      name: "Bass",       nr: 39, klasse: "a39" },
]

// Begrüßung auf der Lichtung („Guten Abend, Paddy.“)
export const BEGRUESSUNGEN = [
    { id: "aufsteigen",      name: "Steigt auf",       nr: null },
    { id: "schreibmaschine", name: "Schreibmaschine",  nr: 18 },
    { id: "worte",           name: "Worte steigen",    nr: 26 },
    { id: "nebel",           name: "Aus dem Nebel",    nr: 42 },
    { id: "welle",           name: "Welle",            nr: 9 },
    { id: "buehnenlicht",    name: "Bühnenlicht",      nr: 14 },
    { id: "glanz",           name: "Goldener Glanz",   nr: 19 },
    { id: "neon",            name: "Neon-Schild",      nr: 23 },
]

// Wie Karten und Listen erscheinen
export const EINGAENGE = [
    { id: "aufsteigen",   name: "Steigen auf",   nr: null },
    { id: "einblenden",   name: "Blenden ein",   nr: null },
    { id: "wachsen",      name: "Wachsen",       nr: 43 },
    { id: "aufblaettern", name: "Blättern auf",  nr: 44 },
    { id: "keiner",       name: "Sofort da",     nr: null },
]

// Karten beim Drüberfahren
export const HOVER = [
    { id: "heben",    name: "Heben sich",  nr: null },
    { id: "leuchten", name: "Leuchten",    nr: 40 },
    { id: "kippen",   name: "Kippen (3D)", nr: 41 },
    { id: "ruhig",    name: "Ruhig",       nr: null },
]

export const SEITENWECHSEL = [
    { id: "keiner",      name: "Direkt" },
    { id: "ueberblenden", name: "Überblenden" },
    { id: "gleiten",     name: "Gleiten" },
]

export const STUFEN = [
    { id: "voll",   name: "Voll",   text: "Alles bewegt sich, wie eingestellt." },
    { id: "dezent", name: "Dezent", text: "Nur kurze Übergänge – keine Dauer-Animationen." },
    { id: "aus",    name: "Aus",    text: "Nichts bewegt sich." },
]

// ---------- Presets ----------
// Jedes Preset ist nur eine Liste von Änderungen gegenüber dem Standard.
export const PRESETS = [
    {
        id: "lichtung", name: "Lichtung", text: "Das Original: Nachthimmel, Amber und Jazz.",
        standard: true, einstellungen: {},
    },
    {
        id: "morgentau", name: "Morgentau", text: "Hell und ruhig wie ein Morgen im Nebel.",
        einstellungen: { grove: {
            farben: { ground: "#F3EEE4", "ground-deep": "#E9E1D2", surface: "#FFFCF6", "surface-hi": "#F8F2E7",
                border: "#E3D9C8", "border-hi": "#D2C4AE", amber: "#B5612A", "amber-light": "#93491A", flieder: "#85598F",
                text: "#2A221D", "text-soft": "#4D423A", muted: "#786A5D", gut: "#3E7A47", fehler: "#B3473A" },
            schrift: { titel: "lora", text: "nunito" },
            flaeche: { korn: 3, schein: 60 },
            bewegung: { hintergrund: "nebel", zeichen: "atmen", begruessung: "nebel", eingang: "einblenden" },
        }, dienste: { lichtung: { bilder: { szene: "morgen" }, bewegung: { hintergrund: "nebel" } } } },
    },
    {
        id: "herbstlaub", name: "Herbstlaub", text: "Rost, Kupfer und fallende Blätter.",
        einstellungen: { grove: {
            farben: { ground: "#1F1512", "ground-deep": "#170F0C", surface: "#2A1C17", "surface-hi": "#33221B",
                border: "#3A2820", "border-hi": "#4A3328", amber: "#E07B39", "amber-light": "#F4A66A", flieder: "#D9A0A0",
                text: "#F2E6DA", "text-soft": "#D6C2B0", muted: "#A88E78", gut: "#C7D9A0", fehler: "#EC8F7C" },
            schrift: { titel: "playfair" },
            flaeche: { muster: "maserung", musterStaerke: 6 },
            bewegung: { hintergrund: "blaetter", zeichen: "schaukeln", eingang: "wachsen" },
        }, dienste: { lichtung: { bilder: { szene: "herbst" }, bewegung: { hintergrund: "blaetter" } } } },
    },
    {
        id: "jazzkeller", name: "Jazzkeller", text: "Messing, Samt und Neon um Mitternacht.",
        einstellungen: { grove: {
            farben: { ground: "#12131F", "ground-deep": "#0C0D16", surface: "#1A1C2B", "surface-hi": "#222538",
                border: "#262940", "border-hi": "#33375A", amber: "#D4AF37", "amber-light": "#F0D27A", flieder: "#E07AA8",
                text: "#EDE8F5", "text-soft": "#C4BED6", muted: "#8F89A8", gut: "#9ED9B8", fehler: "#F08A8A" },
            schrift: { titel: "abril", text: "dmsans" },
            bewegung: { hintergrund: "noten", zeichen: "bass", begruessung: "neon", hover: "leuchten" },
        }, dienste: { lichtung: { bilder: { szene: "buehne" }, bewegung: { hintergrund: "noten" } } } },
    },
    {
        id: "moos", name: "Moos", text: "Tiefgrün, weich, mit Sporen in der Luft.",
        einstellungen: { grove: {
            farben: { ground: "#121A15", "ground-deep": "#0D1410", surface: "#19231C", "surface-hi": "#1F2B23",
                border: "#24322A", "border-hi": "#2F4136", amber: "#9CC873", "amber-light": "#C2E3A0", flieder: "#B7A6D9",
                text: "#E6EFE4", "text-soft": "#BFCFBF", muted: "#8DA192", gut: "#A8E0B8", fehler: "#E8907E" },
            schrift: { titel: "lora", text: "worksans" },
            form: { ecken: 1.4 },
            flaeche: { muster: "punkte", musterStaerke: 6 },
            bewegung: { hintergrund: "sporen", eingang: "wachsen" },
        }, dienste: { lichtung: { bewegung: { hintergrund: "sporen" } } } },
    },
    {
        id: "frost", name: "Mondfrost", text: "Kühles Silberblau, leiser Schneefall.",
        einstellungen: { grove: {
            farben: { ground: "#111723", "ground-deep": "#0C111B", surface: "#18202E", "surface-hi": "#1E2838",
                border: "#232E40", "border-hi": "#2E3B52", amber: "#9EC3E6", "amber-light": "#CFE3F5", flieder: "#C7B5E8",
                text: "#EAF0F7", "text-soft": "#C3CEDC", muted: "#8C9AAD", gut: "#A9DCC4", fehler: "#EE9A9A" },
            schrift: { titel: "cormorant", text: "inter" },
            bewegung: { hintergrund: "schnee", zeichen: "glimmen", begruessung: "nebel" },
        }, dienste: { lichtung: { bilder: { szene: "bergsee" }, bewegung: { hintergrund: "schnee" } } } },
    },
    {
        id: "abendrot", name: "Abendrot", text: "Koralle und Pflaume, Polarlicht am Himmel.",
        einstellungen: { grove: {
            farben: { ground: "#1E1220", "ground-deep": "#170D18", surface: "#28172A", "surface-hi": "#301C33",
                border: "#36203A", "border-hi": "#462A4B", amber: "#F08A6C", "amber-light": "#FFB59A", flieder: "#C9A7D1",
                text: "#F7E8E6", "text-soft": "#DCC2C4", muted: "#AD8F96", gut: "#BFE3B4", fehler: "#F2A0A0" },
            schrift: { titel: "dmserif" },
            bewegung: { hintergrund: "polarlicht", hover: "kippen", begruessung: "worte" },
        }, dienste: { lichtung: { bewegung: { hintergrund: "sternschnuppen" } } } },
    },
    {
        id: "tagebuch", name: "Tagebuch", text: "Papier, Tinte und Schreibmaschine.",
        einstellungen: { grove: {
            farben: { ground: "#F7F3EA", "ground-deep": "#EEE8DB", surface: "#FFFEFA", "surface-hi": "#F9F5EC",
                border: "#E6DECF", "border-hi": "#D4C9B6", amber: "#2F6690", "amber-light": "#204C6E", flieder: "#9A4F74",
                text: "#22262B", "text-soft": "#454B52", muted: "#727A82", gut: "#3C7D5A", fehler: "#B0433A" },
            schrift: { titel: "plexmono", text: "plexmono", groesse: 96 },
            form: { ecken: 0.35 },
            symbole: { strich: 1.4, enden: "eckig" },
            flaeche: { korn: 4, schein: 0, muster: "maserung", musterStaerke: 4 },
            bewegung: { begruessung: "schreibmaschine", eingang: "aufblaettern", hover: "ruhig" },
        }, dienste: { lichtung: { bilder: { szene: "keine" }, bewegung: { hintergrund: "keiner" } } } },
    },
    {
        id: "ruhe", name: "Ruhe", text: "Fokus: gedeckte Farben, nichts lenkt ab.",
        einstellungen: { grove: {
            farben: { ground: "#18181A", "ground-deep": "#121214", surface: "#1F1F22", "surface-hi": "#252528",
                border: "#2A2A2E", "border-hi": "#36363B", amber: "#D9B98C", "amber-light": "#E9D3B2", flieder: "#B9B2CC",
                text: "#ECEAE6", "text-soft": "#C9C6C0", muted: "#95918A", gut: "#B8D6B0", fehler: "#E39A8C" },
            schrift: { titel: "inter", text: "inter" },
            flaeche: { korn: 0, schein: 0 },
            symbole: { strich: 1.6 },
            bewegung: { stufe: "dezent", hintergrund: "keiner", hover: "ruhig" },
        }, dienste: { lichtung: { bewegung: { hintergrund: "keiner" } } } },
    },
]
