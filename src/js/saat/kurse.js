// ==========================================================
// Saat · Kurse von Grove
// Fertige Lerndateien, die als Script mitgeliefert werden. „Herunterladen“ legt sie in den
// AKTUELLEN Lernspeicher (saatgut/kurs-<id>.saat). Ob ein Kurs geladen ist, steht nur dort –
// wechselst du den Speicher, zeigt Saat den Kurs dort als „nicht geladen“ an.
// Die Inhalte werden erst beim Herunterladen nachgeladen (import()), damit Saat schnell startet.
//
// NEUER KURS: Datei js/saat/kurse/<id>.js mit export const KURS = { …Lerndatei… }
// und hier ein Eintrag. Version erhöhen, wenn sich der Inhalt ändert → „Aktualisieren“.
// ==========================================================

export const KURSE = [
    {
        id: "grove-baeume",
        version: 1,
        titel: "Bäume",
        untertitel: "80 Baumarten – von der Eiche bis zum Drachenblutbaum",
        beschreibung: "Deutsche Namen und botanische Namen, mit Familie, Herkunft, Erkennungsmerkmalen und Merksätzen. Geordnet von bekannt zu unbekannt: erst die Bäume vor deiner Haustür, dann Raritäten und Exoten aus aller Welt.",
        gebiet: "Botanik",
        karten: 80,
        symbol: "baum",
        laden: () => import("./kurse/baeume.js").then((m) => m.KURS),
    },
]

export const deckIdFuer = (kursId) => `kurs-${kursId}`
export const kursVon = (deck) => (deck?.kurs && typeof deck.kurs.id === "string" ? deck.kurs : null)
