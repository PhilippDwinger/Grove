# Saat – Dateiformate

Saat (Grove-Dienst „Lernen“, `/dienste/saat/`) trennt strikt zwischen **Inhalten** (teilbar) und
**deinem Lernstand** (privat). Alles sind offene, lesbare Formate (JSON, JSON Lines, ZIP).

| Datei | Inhalt | teilen? |
|---|---|---|
| `*.saat` | Lerndatei (Karten, Blöcke) – UTF-8-JSON | ja |
| `*.saatpaket` | ZIP: Lerndatei + ihre lokalen Medien (`medien/…`) | ja |
| `*.saatstand` | ZIP: Lernprotokoll + Profil + Entscheidungen (ohne Lerndateien) | nein (privat) |
| `*.saatprofil` | JSON: persönliches Lernprofil | nein (privat) |
| `saat-speicher-*.zip` | ganze Sicherung eines Lernspeichers | nein (privat) |

## Lerndatei (`.saat`, Formatversion 2)

```json
{
  "format": "grove-saat",
  "version": 2,
  "id": "d-japanisch-essen",
  "titel": "Japanisch · Essen & Trinken",
  "beschreibung": "Erste Wörter rund ums Essen",
  "autor": "Paddy",
  "gebiet": "Japanisch",
  "sprachen": { "vorne": "ja", "hinten": "de" },
  "tags": ["beispiel"],
  "erstellt": "2026-10-15T08:00:00.000Z",
  "geaendert": "2026-10-15T08:00:00.000Z",
  "karten": [
    {
      "id": "jp-taberu",
      "vorne": { "text": "食べる", "zusatz": "たべる · taberu", "bloecke": [] },
      "antwort": "essen",
      "alternativen": ["speisen"],
      "ablenker": ["trinken", "schlafen"],
      "hinten": [
        { "id": "s1", "typ": "satz", "text": "毎日ご飯を食べます。", "lesung": "Mainichi gohan o tabemasu.", "sprache": "ja" },
        { "id": "u1", "typ": "uebersetzung", "text": "Ich esse jeden Tag Reis.", "bezug": "s1" },
        { "id": "m1", "typ": "merksatz", "text": "**Tabe**-ru: Am **Tab**lett wird gegessen." }
      ],
      "verknuepft": [{ "id": "jp-nomu", "art": "verwandt" }],
      "tags": ["verb"],
      "gebiet": "Japanisch"
    }
  ]
}
```

### Karten

- **`id`** (Pflicht, stabil): Buchstaben, Ziffern und `. _ : ~ -`, max. 80 Zeichen. **Der Lernstand hängt an der ID.**
  Dieselbe ID in mehreren Dateien = dieselbe Karte mit einem gemeinsamen Lernstand.
  Fehlt sie, erzeugt Saat beim Lesen eine stabile ID aus Datei-ID + Vorderseite + Antwort (und schreibt sie beim nächsten Speichern fest).
- **`vorne`**: `text` (Begriff/Frage), `zusatz` (Lesung, Wortart …), optional `bloecke` (z. B. ein Bild als Frage).
- **`antwort`**: kurze Lösung. Wird im Auswahl-Modus als Antwortmöglichkeit gezeigt – darum knapp halten (≤ 80 Zeichen).
- **`alternativen`**: gelten ebenfalls als richtig (werden nie als falsche Auswahl angeboten).
- **`ablenker`**: optionale falsche Antworten für den Auswahl-Modus. Ohne sie wählt Saat passende Antworten anderer Karten.
- **`hinten`**: Liste von Blöcken (Reihenfolge = Anzeige).
- **`verknuepft`**, **`tags`**, **`gebiet`** (überschreibt das Lerngebiet der Datei, wichtig fürs Lernprofil).
- Unbekannte Felder bleiben beim Speichern erhalten.

### Blocktypen

Jeder Block: `{ "id": "…", "typ": "…", …Felder }`. Texte dürfen `**fett**`, `*kursiv*`, `` `code` `` und Listen (`- …`) enthalten.

| `typ` | Felder |
|---|---|
| `text` | `text` |
| `bild` | `quelle`, `alt`, `unterschrift` |
| `geschichte` | `titel`, `text` |
| `satz` | `text`, `markierung` (leer = Vorderseite wird hervorgehoben), `lesung`, `sprache` |
| `uebersetzung` | `text`, `bezug` (ID eines Satz-/Textblocks, leer = Vorderseite), `sprache`, `notiz` |
| `aussprache` | `lautschrift`, `text` (leer = Vorderseite), `audio` (Quelle), `sprache` (Vorlesen per Sprachausgabe) |
| `merksatz` | `text` |
| `beispiele` | `titel`, `eintraege: [{ text, zusatz }]` |
| `hinweis` | `text`, `verborgen` (Standard `true`: erst auf Klick) |
| `tabelle` | `titel`, `kopf` (erste Zeile = Überschrift), `zeilen: [[…], …]` |
| `verweis` | `titel`, `karten: [IDs]` |
| `lueckentext` | `text` mit `{{Lösung}}` bzw. `{{Lösung|Variante}}`, `hinweis` |
| `auswahl` | `frage`, `optionen: [{ text, richtig }]`, `erklaerung` |
| `eintippen` | `frage`, `erwartet` (leer = Antwort der Karte; kleine Tippfehler werden verziehen) |
| `code` | `sprache`, `code` |
| `medien` | `quelle` (Audio oder Video), `titel` |

**Quellen:** `https://…` (extern, braucht Internet) oder `medien/<datei>` (lokal im Lernspeicher; Saat benennt Dateien
`<prüfsumme>-<name>`, damit nichts verwechselt wird). Fehlt eine Datei, zeigt die Karte einen Hinweis statt abzubrechen.

**Erweitern:** Neuer Blocktyp = Eintrag in `src/js/saat/bloecke.js` (Felder → Editor entsteht automatisch) + Darsteller in
`src/js/saat/darstellung.js`. Unbekannte Typen (z. B. aus neueren Versionen) werden angezeigt als „unbekannter Block“ und beim Speichern unverändert behalten.

### Ältere und einfache Formen

Version 1 (zum schnellen Schreiben von Hand) wird beim Öffnen automatisch angehoben:

```json
{ "format": "grove-saat", "version": 1, "titel": "Englisch", "karten": [
  { "id": "en-house", "frage": "house", "antwort": "Haus", "notiz": "auch: Gebäude", "beispiel": "My house is small." }
] }
```

Außerdem liest Saat `{ "cards": [{ "front", "back" }] }` sowie Tabellen (CSV/TSV/TXT: `Vorderseite;Antwort;Notiz`).
Dateien mit **höherer** Version als bekannt werden nur angezeigt (nicht bearbeitet), damit nichts verloren geht.

## Lernspeicher (Ordner)

```
saat.json              Kennung { format: "grove-saat-speicher", version, id }
LIESMICH.txt
saatgut/*.saat         Lerndateien
medien/                lokale Medien
profil.json (+ .bak)   Lernprofil
fortschritt/
  protokoll-JJJJ-MM.jsonl   Lernprotokoll (eine Abfrage pro Zeile, nur Anhängen)
  identitaeten.json         Entscheidungen bei ID-Konflikten
  dateien.json              pausierte Lerndateien
sicherung/JJJJ-MM-TT/  tägliche Sicherung (14 Tage)
papierkorb/            gelöschte Lerndateien
```

Ganzen Ordner kopieren = umziehen. Der Lernstand ist **kein** Zustand pro Datei, sondern das Protokoll:

```json
{"v":1,"id":"e-…","t":1792091495686,"k":"jp-taberu","a":"karte","b":3,"ms":4210,"d":"d-bsp-jp-essen","fp":"0dp3aar","g":"Japanisch"}
{"v":1,"id":"e-…","t":1792091512345,"k":"jp-nomu","a":"auswahl","ok":true,"d":"d-bsp-jp-verben","fp":"…","g":"Japanisch","vz":true}
{"v":1,"id":"e-…","t":1792091519999,"a":"aufheben","ref":"e-…"}
```

`a`: `karte` (Bewertung `b` 1–4), `auswahl` (`ok`), `zuruecksetzen`, `aufheben` (Rückgängig). `vz` = vorgezogen, `fp` = Kern-Abdruck der Karte
(Vorderseite + Antwort) zum Erkennen von Konflikten. Zusammenführen = Zeilen vereinigen (gleiche `id` = gleiche Abfrage).

## Lernprofil (`profil.json` / `.saatprofil`)

```json
{ "format": "grove-saat-profil", "version": 1, "id": "p-…",
  "einstellungen": { "zielQuote": 0.9, "neuProTag": 20, "maxProTag": 300, "neueReihenfolge": "datei", "vorlesen": true },
  "modell": { "algorithmus": "saat-fsrs5", "w": [19 FSRS-Parameter], "faktor": 1.12,
              "gebiete": { "Japanisch": { "faktor": 0.94, "n": 120 } },
              "mcGewicht": 0.35, "erkanntBonus": 0.6, "kurzMax": 1.5 },
  "anpassung": { "letzte": 1792091495686, "beobachtungen": 340, "verlauf": [{ "datum", "faktor", "n", "quote", "erwartet" }] } }
```
