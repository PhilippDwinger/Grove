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
