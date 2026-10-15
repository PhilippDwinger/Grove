// ==========================================================
// Grove · Dienste-Liste
// Jeder Eintrag erscheint automatisch als Karte im Hauptmenü.
//
// Neuen Dienst hinzufügen:
//   1. Hier einen Eintrag ergänzen
//   2. Seite anlegen: src/dienste/<id>/index.html  (Vorlage: src/dienste/mail/index.html)
//   3. Bild ablegen:  public/bilder/dienste/<id>.svg
//
// status:  "aktiv"    → läuft, Karte ist klickbar
//          "vorschau" → Oberfläche steht, Technik fehlt noch, Karte ist klickbar
//          "bald"     → nur angekündigt, Karte ist nicht klickbar
// ==========================================================

export const dienste = [
    {
        id: "mail",
        name: "Grove Mail",
        art: "E-Mail",
        beschreibung: "Dein Postfach mit eigener Grove-Adresse – schreiben, empfangen, sortieren.",
        pfad: "/dienste/mail/",
        bild: "/bilder/dienste/mail.svg",
        status: "vorschau",
    },
    {
        id: "myzel",
        name: "Myzel",
        art: "Verknüpfte Notizen",
        beschreibung: "Deine Gedanken, verbunden wie das Geflecht unter dem Waldboden. Mit [[ verknüpfst du Notizen.",
        pfad: "/dienste/myzel/",
        bild: "/bilder/dienste/myzel.svg",
        status: "aktiv",
    },
    {
        id: "rinde",
        name: "Rinde",
        art: "Passwörter",
        beschreibung: "Passwörter erzeugen und sicher aufbewahren – verschlüsselt, bevor sie deinen Browser verlassen.",
        pfad: "/dienste/rinde/",
        bild: "/bilder/dienste/rinde.svg",
        status: "aktiv",
    },
    {
        id: "laub",
        name: "Laub",
        art: "Gestaltung",
        beschreibung: "Gestalte Grove, wie es dir gefällt: Farben, Schriften, Zeichen, Bilder und Bewegung – mit Presets.",
        pfad: "/dienste/laub/",
        bild: "/bilder/dienste/laub.svg",
        status: "aktiv",
    },
    {
        id: "bridge",
        name: "Bridge",
        art: "Geräte & Aufgaben",
        beschreibung: "Deine Geräte sprechen miteinander und geben sich gegenseitig Aufgaben.",
        pfad: "/dienste/bridge/",
        bild: "/bilder/dienste/bridge.svg",
        status: "vorschau",
    },
    {
        id: "harz",
        name: "Harz",
        art: "Dateien",
        beschreibung: "Deine Dateien – sie bleiben auf deinen Geräten, Grove kennt nur ihren Steckbrief.",
        pfad: "/dienste/harz/",
        bild: "/bilder/dienste/harz.svg",
        status: "aktiv",
    },
    {
        id: "muehle",
        name: "Mühle",
        art: "Umwandeln",
        beschreibung: "Dateien und Notizen in andere Formate verwandeln – Bilder, Dokumente, PDF, Tabellen, Audio, Video.",
        pfad: "/dienste/muehle/",
        bild: "/bilder/dienste/muehle.svg",
        status: "aktiv",
    },
    {
        id: "saat",
        name: "Saat",
        art: "Lernen",
        beschreibung: "Sprachen, Begriffe und Wissen lernen – mit klugen Wiederholungen. Alles bleibt lokal, auch ohne Konto.",
        pfad: "/dienste/saat/",
        bild: "/bilder/dienste/saat.svg",
        status: "aktiv",
    },
    // NUR ZUM TESTEN – fliegt später wieder raus (siehe CLAUDE.md → „Gewächshaus entfernen“)
    {
        id: "gewaechshaus",
        name: "Gewächshaus",
        art: "Nur zum Testen",
        beschreibung: "Hier wachsen neue Animationen und Design-Ideen, bevor sie nach Grove umziehen.",
        pfad: "/dienste/gewaechshaus/",
        bild: "/bilder/dienste/gewaechshaus.svg",
        status: "vorschau",
    },
]

export const statusText = {
    aktiv: "Aktiv",
    vorschau: "Vorschau",
    bald: "Bald",
}
