// Harz meldet sich im Grove-Register an: Strg+K findet Dateien (nach Namen),
// und Dateien lassen sich mit Notizen, Mails und Passwörtern verbinden.
import { dienstRegistrieren } from "../kern/register.js"
import { steckbrief, steckbriefeSuchen } from "./daten.js"
import { groesseText } from "./speicher.js"

const alsTreffer = (d) => ({ id: d.id, titel: d.name, untertitel: `Datei · ${groesseText(d.groesse)}` })

dienstRegistrieren({
    typ: "harz",
    name: "Harz",
    url: (id) => `/dienste/harz/?datei=${encodeURIComponent(id)}`,
    suchen: async (text) => (await steckbriefeSuchen(text)).map(alsTreffer),
    holen: async (id) => { const d = await steckbrief(id); return d ? alsTreffer(d) : null },
})
