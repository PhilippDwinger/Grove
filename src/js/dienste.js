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
        pfad: null,
        bild: "/bilder/dienste/bridge.svg",
        status: "bald",
    },
]

export const statusText = {
    aktiv: "Aktiv",
    vorschau: "Vorschau",
    bald: "Bald",
}
