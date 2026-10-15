// ==========================================================
// Saat · Block-Register
// Die Rückseite einer Karte (und optional die Vorderseite) besteht aus Blöcken.
// Ein Blocktyp beschreibt hier nur Daten + Formularfelder. Wie er aussieht,
// steht in darstellung.js; der Editor baut seine Formulare aus `felder`.
//
// NEUER BLOCKTYP = ein Eintrag hier + eine Funktion in darstellung.js (DARSTELLER).
// Unbekannte Typen (z. B. aus einer neueren Saat-Version) bleiben beim Speichern
// unverändert erhalten und werden als „unbekannter Block“ angezeigt.
//
// Feldarten: text | lang (mehrzeilig, **fett** *kursiv*) | sprache | quelle (Bild/Audio/Video)
//            | zeilen (Liste) | paare (Text + Übersetzung) | tabelle | karten (Verweise)
//            | optionen (Auswahl mit richtig/falsch) | schalter | wahl | bezug (anderer Block)
// ==========================================================

export const GRUPPEN = [
    { id: "inhalt", name: "Inhalt" },
    { id: "sprache", name: "Sprache" },
    { id: "merken", name: "Merken" },
    { id: "ueben", name: "Üben" },
]

export const BLOECKE = {
    text: {
        name: "Text", gruppe: "inhalt", kurz: "Freier Text mit **fett**, *kursiv* und Listen",
        felder: [{ name: "text", art: "lang", label: "Text", platzhalter: "Erklärung, Definition, Notiz …" }],
        neu: () => ({ text: "" }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.text,
    },
    bild: {
        name: "Bild", gruppe: "inhalt", kurz: "Bild aus einer Datei oder von einer Adresse",
        felder: [
            { name: "quelle", art: "quelle", medien: "bild", label: "Bild" },
            { name: "alt", art: "text", label: "Beschreibung (für Screenreader)", platzhalter: "Was ist zu sehen?" },
            { name: "unterschrift", art: "text", label: "Bildunterschrift", platzhalter: "optional" },
        ],
        neu: () => ({ quelle: "", alt: "", unterschrift: "" }),
        leer: (b) => !b.quelle,
        zusammenfassung: (b) => b.unterschrift || b.alt || "Bild",
    },
    geschichte: {
        name: "Geschichte", gruppe: "merken", kurz: "Eine kurze Geschichte, die beim Merken hilft",
        felder: [
            { name: "titel", art: "text", label: "Titel", platzhalter: "optional" },
            { name: "text", art: "lang", label: "Geschichte", platzhalter: "Stell dir vor …" },
        ],
        neu: () => ({ titel: "", text: "" }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.titel || b.text,
    },
    satz: {
        name: "Beispielsatz", gruppe: "sprache", kurz: "Ein Satz, in dem der Begriff vorkommt",
        felder: [
            { name: "text", art: "lang", label: "Satz", platzhalter: "毎日ご飯を食べる。" },
            { name: "markierung", art: "text", label: "Hervorheben", platzhalter: "leer = Vorderseite der Karte" },
            { name: "lesung", art: "text", label: "Lesung / Umschrift", platzhalter: "optional, z. B. Mainichi gohan o taberu." },
            { name: "sprache", art: "sprache", label: "Sprache (zum Vorlesen)" },
        ],
        neu: () => ({ text: "", markierung: "", lesung: "", sprache: "" }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.text,
    },
    uebersetzung: {
        name: "Übersetzung", gruppe: "sprache", kurz: "Eine eigene Übersetzung – zur Vokabel oder zu einem Satz",
        felder: [
            { name: "text", art: "lang", label: "Übersetzung", platzhalter: "Ich esse jeden Tag Reis." },
            { name: "bezug", art: "bezug", label: "Gehört zu", platzhalter: "Vorderseite" },
            { name: "sprache", art: "sprache", label: "Sprache" },
            { name: "notiz", art: "text", label: "Anmerkung", platzhalter: "optional, z. B. wörtlich: …" },
        ],
        neu: () => ({ text: "", bezug: "", sprache: "", notiz: "" }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.text,
    },
    aussprache: {
        name: "Aussprache", gruppe: "sprache", kurz: "Lautschrift, Audio oder Vorlesen",
        felder: [
            { name: "lautschrift", art: "text", label: "Lautschrift", platzhalter: "z. B. [ta.be.ɾɯ] oder ta-BE-ru" },
            { name: "text", art: "text", label: "Vorzulesender Text", platzhalter: "leer = Vorderseite der Karte" },
            { name: "audio", art: "quelle", medien: "audio", label: "Audio (optional)" },
            { name: "sprache", art: "sprache", label: "Sprache (für das Vorlesen)" },
        ],
        neu: () => ({ lautschrift: "", text: "", audio: "", sprache: "" }),
        leer: () => false,
        zusammenfassung: (b) => b.lautschrift || "Aussprache",
    },
    merksatz: {
        name: "Eselsbrücke", gruppe: "merken", kurz: "Merksatz oder persönliche Merkhilfe",
        felder: [{ name: "text", art: "lang", label: "Merkhilfe", platzhalter: "Tabe-ru: am TABlett isst man …" }],
        neu: () => ({ text: "" }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.text,
    },
    beispiele: {
        name: "Beispiele", gruppe: "inhalt", kurz: "Weitere Beispiele und Anwendungsfälle",
        felder: [
            { name: "titel", art: "text", label: "Überschrift", platzhalter: "Beispiele" },
            { name: "eintraege", art: "paare", label: "Beispiele", links: "Beispiel", rechts: "Erklärung / Übersetzung (optional)" },
        ],
        neu: () => ({ titel: "", eintraege: [{ text: "", zusatz: "" }] }),
        leer: (b) => !(b.eintraege || []).some((e) => e.text?.trim()),
        zusammenfassung: (b) => (b.eintraege || []).map((e) => e.text).join(" · "),
    },
    hinweis: {
        name: "Tipp", gruppe: "merken", kurz: "Ein Hinweis, der erst auf Klick erscheint",
        felder: [
            { name: "text", art: "lang", label: "Tipp", platzhalter: "Denk an …" },
            { name: "verborgen", art: "schalter", label: "Zuerst verborgen" },
        ],
        neu: () => ({ text: "", verborgen: true }),
        leer: (b) => !b.text?.trim(),
        zusammenfassung: (b) => b.text,
    },
    tabelle: {
        name: "Tabelle", gruppe: "inhalt", kurz: "Konjugationen, Formen, Vergleiche",
        felder: [
            { name: "titel", art: "text", label: "Überschrift", platzhalter: "optional, z. B. Formen" },
            { name: "zeilen", art: "tabelle", label: "Tabelle" },
            { name: "kopf", art: "schalter", label: "Erste Zeile ist Überschrift" },
        ],
        neu: () => ({ titel: "", kopf: true, zeilen: [["Form", "Bedeutung"], ["", ""]] }),
        leer: (b) => !(b.zeilen || []).flat().some((x) => String(x).trim()),
        zusammenfassung: (b) => b.titel || (b.zeilen?.[0] || []).join(" | "),
    },
    verweis: {
        name: "Verwandte Karten", gruppe: "merken", kurz: "Verweise auf andere Lernkarten",
        felder: [
            { name: "titel", art: "text", label: "Überschrift", platzhalter: "Siehe auch" },
            { name: "karten", art: "karten", label: "Karten" },
        ],
        neu: () => ({ titel: "", karten: [] }),
        leer: (b) => !b.karten?.length,
        zusammenfassung: (b) => `${b.karten?.length || 0} Verweise`,
    },
    lueckentext: {
        name: "Lückentext", gruppe: "ueben", kurz: "Lücken mit {{doppelten Klammern}} – zum Ausfüllen",
        felder: [
            { name: "text", art: "lang", label: "Text mit Lücken", platzhalter: "Ich {{esse}} gern Reis. Varianten: {{isst|esst}}" },
            { name: "hinweis", art: "text", label: "Hinweis", platzhalter: "optional" },
        ],
        neu: () => ({ text: "", hinweis: "" }),
        leer: (b) => !/\{\{[^}]+\}\}/.test(b.text || ""),
        zusammenfassung: (b) => (b.text || "").replace(/\{\{([^}]+)\}\}/g, "___"),
    },
    auswahl: {
        name: "Mini-Quiz", gruppe: "ueben", kurz: "Eine Frage mit Antwortmöglichkeiten",
        felder: [
            { name: "frage", art: "text", label: "Frage", platzhalter: "Welche Form ist höflich?" },
            { name: "optionen", art: "optionen", label: "Antworten (Haken = richtig)" },
            { name: "erklaerung", art: "text", label: "Erklärung nach dem Antworten", platzhalter: "optional" },
        ],
        neu: () => ({ frage: "", optionen: [{ text: "", richtig: true }, { text: "", richtig: false }], erklaerung: "" }),
        leer: (b) => !(b.optionen || []).some((o) => o.text?.trim()),
        zusammenfassung: (b) => b.frage,
    },
    eintippen: {
        name: "Eintippen", gruppe: "ueben", kurz: "Antwort selbst schreiben – kleine Tippfehler werden verziehen",
        felder: [
            { name: "frage", art: "text", label: "Aufforderung", platzhalter: "Schreib es auf Japanisch" },
            { name: "erwartet", art: "text", label: "Erwartete Antwort", platzhalter: "leer = Antwort der Karte" },
        ],
        neu: () => ({ frage: "", erwartet: "" }),
        leer: () => false,
        zusammenfassung: (b) => b.frage || "Eintippen",
    },
    code: {
        name: "Code", gruppe: "inhalt", kurz: "Quelltext oder Formel in fester Breite",
        felder: [
            { name: "sprache", art: "text", label: "Sprache", platzhalter: "z. B. python, sql" },
            { name: "code", art: "lang", label: "Code", fest: true },
        ],
        neu: () => ({ sprache: "", code: "" }),
        leer: (b) => !b.code?.trim(),
        zusammenfassung: (b) => b.code,
    },
    medien: {
        name: "Audio / Video", gruppe: "inhalt", kurz: "Eine Aufnahme oder ein Video, lokal oder per Adresse",
        felder: [
            { name: "quelle", art: "quelle", medien: "medien", label: "Datei oder Adresse" },
            { name: "titel", art: "text", label: "Titel", platzhalter: "optional" },
        ],
        neu: () => ({ quelle: "", titel: "" }),
        leer: (b) => !b.quelle,
        zusammenfassung: (b) => b.titel || "Audio/Video",
    },
}

export const blockTyp = (typ) => BLOECKE[typ] ?? null

// Gebräuchliche Sprachen (frei eingebbar bleibt jede BCP-47-Kennung)
export const SPRACHEN = [
    ["", "—"], ["de", "Deutsch"], ["en", "Englisch"], ["ja", "Japanisch"], ["fr", "Französisch"], ["es", "Spanisch"],
    ["it", "Italienisch"], ["pt", "Portugiesisch"], ["nl", "Niederländisch"], ["sv", "Schwedisch"], ["pl", "Polnisch"],
    ["ru", "Russisch"], ["tr", "Türkisch"], ["zh", "Chinesisch"], ["ko", "Koreanisch"], ["ar", "Arabisch"], ["el", "Griechisch"], ["la", "Latein"],
]
export const spracheName = (code) => SPRACHEN.find(([c]) => c === code)?.[1] || code || ""
