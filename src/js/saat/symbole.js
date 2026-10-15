// ==========================================================
// Saat · Symbole (24×24, Linien in currentColor – passen sich jedem Laub-Thema an)
// Die vier Wachstumsstufen zeigen die Beherrschung einer Karte:
//   Samenkorn = noch nicht gelernt · Keim = schlecht · Halm = okay · Ähre = gut
// ==========================================================
const svg = (inhalt, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${inhalt}</svg>`

export const STUFEN = {
    neu: svg(`<path d="M12 20.5c-3 0-5-2.6-5-5.6C7 11 9.8 8 12 6.5c2.2 1.5 5 4.5 5 8.4 0 3-2 5.6-5 5.6z"/><path d="M12 11v6" opacity=".55"/>`),
    schlecht: svg(`<path d="M12 21v-6"/><path d="M12 15c0-3-2.2-4.6-5-4.6 0 2.9 2 4.6 5 4.6z"/><path d="M5 21h14" opacity=".5"/>`),
    okay: svg(`<path d="M12 21V9"/><path d="M12 14c0-3-2.4-5-5.5-5 0 3.2 2.3 5 5.5 5z"/><path d="M12 11.5c0-3 2.4-5 5.5-5 0 3.2-2.3 5-5.5 5z"/><path d="M5 21h14" opacity=".5"/>`),
    gut: svg(`<path d="M12 21V4"/><path d="M12 8.5c-1.8-.4-2.8-1.8-2.8-3.6 1.8.3 2.8 1.6 2.8 3.6zM12 8.5c1.8-.4 2.8-1.8 2.8-3.6-1.8.3-2.8 1.6-2.8 3.6zM12 12.5c-1.8-.4-2.8-1.8-2.8-3.6 1.8.3 2.8 1.6 2.8 3.6zM12 12.5c1.8-.4 2.8-1.8 2.8-3.6-1.8.3-2.8 1.6-2.8 3.6zM12 16.5c-1.8-.4-2.8-1.8-2.8-3.6 1.8.3 2.8 1.6 2.8 3.6zM12 16.5c1.8-.4 2.8-1.8 2.8-3.6-1.8.3-2.8 1.6-2.8 3.6z"/><path d="M5 21h14" opacity=".5"/>`),
}
export const STUFEN_NAME = { gut: "Gut", okay: "Okay", schlecht: "Schlecht", neu: "Noch nicht gelernt" }

export const S = {
    plus: svg(`<path d="M12 5v14M5 12h14"/>`),
    stift: svg(`<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>`),
    papierkorb: svg(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>`),
    hoch: svg(`<path d="M12 19V5M6 11l6-6 6 6"/>`),
    runter: svg(`<path d="M12 5v14M6 13l6 6 6-6"/>`),
    kopie: svg(`<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>`),
    teilen: svg(`<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>`),
    holen: svg(`<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>`),
    ordner: svg(`<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`),
    spielen: svg(`<path d="M8 5.5v13l11-6.5z"/>`),
    pause: svg(`<path d="M9 5v14M15 5v14"/>`),
    zu: svg(`<path d="M6 6l12 12M18 6L6 18"/>`),
    haken: svg(`<path d="M5 12.5l4.5 4.5L19 7"/>`),
    zurueck: svg(`<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/>`),
    zahnrad: svg(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
    suche: svg(`<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>`),
    stapel: svg(`<rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v10"/>`),
    auswahl: svg(`<circle cx="6" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><path d="M11 6h9M11 12h9M11 18h9"/>`),
    blitz: svg(`<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>`),
    profil: svg(`<path d="M3 17c3-5 5.5-7 9-7s6 2 9 7"/><path d="M3 21h18"/><circle cx="12" cy="6" r="2.5"/>`),
    warnung: svg(`<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>`),
    info: svg(`<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>`),
    lautsprecher: svg(`<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>`),
    auge: svg(`<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>`),
    griff: svg(`<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>`, ` stroke-width="2.4"`),
    karte: svg(`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>`),
    kette: svg(`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`),
    weiter: svg(`<path d="M5 12h14M13 6l6 6-6 6"/>`),
    tastatur: svg(`<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.5M9.5 10h.5M13 10h.5M16.5 10h1M7 14h10"/>`),
    pinsel: svg(`<path d="M18.5 3.5a2.1 2.1 0 0 1 3 3L11 17l-4-4z"/><path d="M7 13c-2.5 0-4 1.8-4 4 0 1.5-.6 2.6-1.5 3.5 3.5.5 8-.5 8.5-4z"/>`),
    sprechblase: svg(`<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 10h.5M12 10h.5M16 10h.5" stroke-width="2.4"/>`),
    kurs: svg(`<path d="M12 4L2 9l10 5 10-5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>`),
    flamme: svg(`<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.5-5.4 3.6-8.3.5 1.9 1.6 3 2.9 3.6-.2-3 1-5.6 3.4-7.6-.4 3.4 4.1 6 4.1 11.6 0 4-3 6.9-7.5 6.9z"/><path d="M12 21c-1.6 0-2.7-1.1-2.7-2.6 0-1.6 1.4-2.4 2.7-4.4 1.3 2 2.7 2.8 2.7 4.4 0 1.5-1.1 2.6-2.7 2.6z"/>`),
    baum: svg(`<path d="M12 22v-7"/><path d="M12 15c-4.4 0-7-2.3-7-5.5 0-2.4 1.6-4 3.4-4.4C9 3.2 10.4 2 12 2s3 1.2 3.6 3.1c1.8.4 3.4 2 3.4 4.4 0 3.2-2.6 5.5-7 5.5z"/><path d="M12 15l-3-3M12 13l3-2.5"/>`),
    kalender: svg(`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`),
}

// Blocktypen
export const BLOCK_SYMBOL = {
    text: svg(`<path d="M5 6h14M5 10h14M5 14h10M5 18h7"/>`),
    bild: svg(`<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/>`),
    geschichte: svg(`<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/>`),
    satz: svg(`<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z"/><path d="M8 9h8M8 12.5h5"/>`),
    uebersetzung: svg(`<path d="M4 7h9M8.5 4v3M6 7c.5 3 2.5 5.5 5 6.5"/><path d="M11 7c-.5 3-3 6-6.5 7"/><path d="M13 20l3.5-8 3.5 8M14.2 17.3h4.6"/>`),
    aussprache: S.lautsprecher,
    merksatz: svg(`<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>`),
    beispiele: svg(`<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.5M4 12h.5M4 18h.5" stroke-width="2.6"/>`),
    hinweis: svg(`<path d="M9 21h6"/><path d="M8 17h8l-1-3.5a5 5 0 1 0-6 0z"/><path d="M12 3v1M4.2 6.2l.7.7M19.8 6.2l-.7.7"/>`),
    tabelle: svg(`<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9.5 4v16"/>`),
    verweis: S.kette,
    lueckentext: svg(`<path d="M3 12h4M17 12h4"/><rect x="9" y="9" width="6" height="6" rx="1" stroke-dasharray="2 2"/><path d="M3 7h18M3 17h18" opacity=".5"/>`),
    auswahl: svg(`<circle cx="7" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><path d="M12 7h8M12 17h8"/><path d="M6 17l.8.8L8.5 16"/>`),
    eintippen: svg(`<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.5M9.5 10h.5M13 10h.5M16.5 10h1M7 14h10"/>`),
    code: svg(`<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>`),
    medien: svg(`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9v6l5-3z"/>`),
    unbekannt: svg(`<rect x="4" y="4" width="16" height="16" rx="3" stroke-dasharray="3 2.5"/><path d="M10 10a2 2 0 1 1 2.5 1.9c-.3.1-.5.4-.5.7v.9M12 16v.4"/>`),
}
