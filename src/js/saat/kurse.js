// ==========================================================
// Saat · Kurse von Grove
// Fertige Lerndateien, die als Script mitgeliefert werden. „Herunterladen“ legt sie in den
// AKTUELLEN Lernspeicher (saatgut/kurs-<id>.saat). Ob ein Kurs geladen ist, steht nur dort –
// wechselst du den Speicher, zeigt Saat den Kurs dort als „nicht geladen“ an.
// Die Inhalte werden erst beim Herunterladen nachgeladen (import()), damit Saat schnell startet.
//
// NEUER KURS: Datei js/saat/kurse/<id>.js mit export const KURS = { …Lerndatei… }
// und hier ein Eintrag (optional `medien` für mitgelieferte Bilder, `titelbild` aus ansichten/kurse.js). Version erhöhen, wenn sich der Inhalt ändert → „Aktualisieren“.
// ==========================================================

export const KURSE = [
    {
        id: "grove-baeume",
        version: 3,
        titel: "Bäume",
        untertitel: "80 Baumarten am Foto erkennen – von der Eiche bis zum Drachenblutbaum",
        beschreibung: "Du siehst ein Foto und sagst, welcher Baum das ist. Dazu botanischer Name, Familie, Herkunft, Erkennungsmerkmale, Fun Fact und Merksätze. Geordnet von bekannt zu unbekannt: erst die Bäume vor deiner Haustür, dann Raritäten und Exoten aus aller Welt.",
        gebiet: "Botanik",
        karten: 80,
        symbol: "baum",
        titelbild: "baeume",
        laden: () => import("./kurse/baeume.js").then((m) => m.KURS),
        // { "medien/…": URL } – Dateien, die beim Herunterladen mit in den Lernspeicher kommen
        medien: () => import("./kurse/baeume-medien.js").then((m) => m.MEDIEN),
    },
]

export const deckIdFuer = (kursId) => `kurs-${kursId}`
export const kursVon = (deck) => (deck?.kurs && typeof deck.kurs.id === "string" ? deck.kurs : null)
