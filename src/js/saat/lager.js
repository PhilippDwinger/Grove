// ==========================================================
// Saat · Lager – der Lernspeicher als Ganzes
//
// Ordner (überall gleich – auf einen anderen PC kopieren genügt):
//   saat.json                         Kennung des Lernspeichers
//   LIESMICH.txt                      kurze Erklärung für Menschen
//   saatgut/*.saat                    Lerndateien (Inhalte, teilbar)
//   medien/                           lokale Bilder/Audio (Name = Prüfsumme + Originalname)
//   profil.json                       persönliches Lernprofil (Einstellungen + Modell)
//   fortschritt/protokoll-JJJJ-MM.jsonl  jede Abfrage eine Zeile (der Lernstand)
//   fortschritt/identitaeten.json     Entscheidungen bei ID-Konflikten
//   fortschritt/dateien.json          pausierte Lerndateien u. Ä.
//   sicherung/JJJJ-MM-TT/             tägliche Sicherung (Profil, Entscheidungen, Monatsprotokoll)
//   papierkorb/                       gelöschte Lerndateien
//
// Wichtige Regeln: Lernstand liegt NIE in den Lerndateien. Nichts wird still überschrieben –
// vor dem Ersetzen landet die alte Fassung in sicherung/. JSON-Dateien haben eine .bak-Kopie.
// Nichts hiervon geht an einen Server.
// ==========================================================
import { deckLesen, deckSchreiben, neuesDeck, kernAbdruck, tabelleZuDeck, medienVerweise, FormatFehler, ENDUNG, PAKET_ENDUNG } from "./format.js"
import { anwenden, beherrschung, abrufJetzt } from "./planer.js"
import { neuesProfil, profilLesen, parameterFuer, anpassen, anpassenFaellig, PROFIL_FORMAT } from "./profil.js"
import { ereignis, nachspielen, protokollLesen, vereinigen, dateiFuer, zeile, letzteAbdruecke } from "./protokoll.js"
import { indexBauen, entscheidungenLesen, entscheidungenVereinigen } from "./identitaet.js"
import { faelligkeit } from "./sitzung.js"
import { zipBauen, zipLesen, verzeichnisZuZip } from "./paket.js"
import { alleDateien } from "./speicher.js"
import { TAG, neueId, tagSchluessel, tagesbeginn, idAusText, fnv } from "./hilfen.js"
import { tageAusProtokoll, tageZusammen } from "./statistik.js"
import { kursVon, deckIdFuer } from "./kurse.js"

export const PFAD = {
    kennung: "saat.json",
    liesmich: "LIESMICH.txt",
    saatgut: "saatgut",
    medien: "medien",
    fortschritt: "fortschritt",
    identitaeten: "fortschritt/identitaeten.json",
    dateien: "fortschritt/dateien.json",
    profil: "profil.json",
    sicherung: "sicherung",
    papierkorb: "papierkorb",
}
export const SPEICHER_FORMAT = "grove-saat-speicher"
const SICHERUNGEN_BEHALTEN = 14

const LIESMICH = `Saat – dein Lernspeicher (Grove)
=================================

Dieser Ordner gehört dir. Saat speichert hier alles, was es zum Lernen braucht –
nichts davon liegt auf einem Server.

  saatgut/       Lerndateien (*.saat). Du kannst sie teilen, kopieren, hineinlegen.
  medien/        Bilder und Audio, die deine Lerndateien verwenden.
  fortschritt/   Dein Lernstand: jede Abfrage eine Zeile (protokoll-JJJJ-MM.jsonl).
  profil.json    Dein persönliches Lernprofil (Einstellungen + wie dein Gedächtnis tickt).
  sicherung/     Tägliche Sicherungen. papierkorb/  Gelöschte Lerndateien.

Umziehen auf einen anderen Computer: Ordner einfach komplett kopieren und in Saat
„Vorhandenen Lernspeicher öffnen“ wählen. Bitte nichts in fortschritt/ von Hand ändern.
`

const istJson = (t) => { try { JSON.parse(t); return true } catch { return false } }

export class Lager extends EventTarget {
    constructor(verz, { jetzt = () => Date.now(), kanal = true } = {}) {
        super()
        this.verz = verz
        this.jetzt = jetzt
        this.kanalAn = kanal
        this.decks = new Map()        // deckId → { deck, datei, warnungen, nurLesen }
        this.kaputt = []              // [{ datei, fehler }]
        this.warnungen = []           // allgemeine Hinweise beim Laden
        this.ereignisse = []
        this.kaputteZeilen = 0
        this.profil = neuesProfil()
        this.entscheidungen = entscheidungenLesen(null)
        this.dateiEinst = {}
        this.zustaende = new Map()
        this.beobachtungen = []
        this.verlauf = new Map()
        this.index = indexBauen([])
        this.kennung = null
        this.medienCache = new Map()
    }

    static async oeffnen(verz, optionen) {
        const l = new Lager(verz, optionen)
        await l.einrichten()
        await l.laden()
        return l
    }

    // ---------- Einrichten & Laden ----------
    static async istLernspeicher(verz) { return verz.existiert(PFAD.kennung) }

    async einrichten() {
        const t = await this.verz.lesenText(PFAD.kennung)
        if (t && istJson(t)) return
        const jetzt = new Date(this.jetzt()).toISOString()
        const kennung = { format: SPEICHER_FORMAT, version: 1, id: neueId("s"), erstellt: jetzt, app: "Grove · Saat" }
        if (t) {
            this.warnungen.push("Die Kennung saat.json war beschädigt und wurde neu angelegt.")
            await this.verz.schreiben(PFAD.kennung + ".kaputt", t)
        }
        await this.verz.schreiben(PFAD.kennung, JSON.stringify(kennung, null, 2))
        if (!(await this.verz.existiert(PFAD.liesmich))) await this.verz.schreiben(PFAD.liesmich, LIESMICH)
        if (!(await this.verz.existiert(PFAD.profil))) await this.jsonSchreiben(PFAD.profil, neuesProfil(this.jetzt()))
    }

    async laden() {
        if (this.profilTimer) await this.profilSpeichernJetzt()     // nichts Ungespeichertes verlieren
        this.warnungen = this.warnungen.filter((w) => w.includes("saat.json"))
        this.kaputt = []
        this.medienCache.clear()
        this.kennung = (await this.jsonLesen(PFAD.kennung)).wert

        // Profil
        const p = await this.jsonLesen(PFAD.profil)
        const pr = profilLesen(p.wert)
        this.profil = pr.profil
        if (p.wert) this.warnungen.push(...pr.warnungen)
        const profilFehlte = !p.wert

        this.entscheidungen = entscheidungenLesen((await this.jsonLesen(PFAD.identitaeten)).wert)
        this.dateiEinst = (await this.jsonLesen(PFAD.dateien)).wert || {}

        // Lerndateien
        this.decks = new Map()
        for (const e of await this.verz.liste(PFAD.saatgut)) {
            if (e.art !== "datei" || !/\.(saat|json)$/i.test(e.name)) continue
            const datei = e.name
            try {
                const text = await this.verz.lesenText(`${PFAD.saatgut}/${datei}`)
                const r = deckLesen(text, { dateiname: datei })
                if (this.decks.has(r.deck.id)) {
                    const andere = this.decks.get(r.deck.id).datei
                    r.warnungen.push(`Hatte dieselbe Datei-ID wie „${andere}“ (wohl eine Kopie) – bekommt beim nächsten Speichern eine eigene.`)
                    r.deck.id = "d-" + fnv(r.deck.id + "|" + datei)
                }
                this.decks.set(r.deck.id, { deck: r.deck, datei, warnungen: r.warnungen, nurLesen: r.nurLesen, ergaenzt: r.geaendert })
            } catch (f) {
                this.kaputt.push({ datei, fehler: f instanceof FormatFehler ? f.message : `Konnte nicht gelesen werden (${f.message})` })
            }
        }

        // Protokoll
        let alle = []
        this.kaputteZeilen = 0
        for (const e of await this.verz.liste(PFAD.fortschritt)) {
            if (e.art !== "datei" || !/^protokoll-.*\.jsonl$/.test(e.name)) continue
            const r = protokollLesen(await this.verz.lesenText(`${PFAD.fortschritt}/${e.name}`))
            this.kaputteZeilen += r.kaputt
            alle.push(r.ereignisse)
        }
        this.ereignisse = vereinigen(...alle)
        if (this.kaputteZeilen) this.warnungen.push(`${this.kaputteZeilen} beschädigte Zeile(n) im Lernprotokoll wurden übersprungen.`)

        this.neuBerechnen()

        // Profil fehlte, aber es gibt Lernhistorie → aus dem Protokoll neu lernen (mehrere Schritte)
        if (profilFehlte && this.beobachtungen.length) {
            this.warnungen.push("Das Lernprofil fehlte – es wurde aus deinem Lernprotokoll neu berechnet.")
            await this.profilAnpassen({ schritte: 12 })
        } else if (profilFehlte) {
            await this.jsonSchreiben(PFAD.profil, this.profil)
        }
        // Lerntage im Profil mit dem Protokoll abgleichen (fehlende ergänzen)
        const tage = tageZusammen(this.profil.tage, this.tageBerechnen())
        if (JSON.stringify(tage) !== JSON.stringify(this.profil.tage)) {
            this.profil.tage = tage
            await this.jsonSchreiben(PFAD.profil, this.profil).catch(() => {})
        }
        await this.taeglichSichern().catch((f) => console.warn("Saat: Sicherung fehlgeschlagen", f))
        this.kanalEinrichten()
    }

    neuBerechnen() {
        const liste = [...this.decks.values()].sort((a, b) => a.datei.localeCompare(b.datei))
        this.index = indexBauen(liste.map((d) => ({ deck: d.deck, aktiv: this.deckAktiv(d.deck.id) })), {
            abdruecke: letzteAbdruecke(this.ereignisse),
            entscheidungen: this.entscheidungen,
        })
        const r = nachspielen(this.ereignisse, {
            profil: this.profil,
            alias: this.index.alias,
            gebietVon: (k) => this.index.eintraege.get(k)?.gebiet ?? null,
        })
        this.zustaende = r.zustaende
        this.beobachtungen = r.beobachtungen
        this.verlauf = r.verlauf
        this.aufgehoben = r.aufgehoben
        this.parameterCache = new Map()
        this.melden()
    }

    melden(art = "aenderung") { this.dispatchEvent(new Event(art)) }

    // ---------- Abfragen ----------
    pFuer(eintrag) {
        const g = typeof eintrag === "string" ? eintrag : eintrag?.gebiet ?? null
        if (!this.parameterCache.has(g)) this.parameterCache.set(g, parameterFuer(this.profil, g))
        return this.parameterCache.get(g)
    }
    eintrag(k) { return this.index.eintraege.get(k) ?? null }
    zustand(k) { return this.zustaende.get(k) ?? null }
    beherrschung(k, jetzt = this.jetzt()) { const e = this.eintrag(k); return beherrschung(this.zustand(k), jetzt, this.pFuer(e)) }
    abruf(k, jetzt = this.jetzt()) { return abrufJetzt(this.zustand(k), jetzt, this.pFuer(this.eintrag(k))) }

    faelligkeit({ nurDeck = null } = {}) {
        const e = this.profil.einstellungen
        return faelligkeit(this.index.eintraege.values(), this.zustaende, this.jetzt(), {
            neuProTag: nurDeck ? Infinity : e.neuProTag, reihenfolge: e.neueReihenfolge, pFuer: (x) => this.pFuer(x), nurDeck,
        })
    }

    // Verteilung der Beherrschung (für Übersichten) – optional nur für eine Datei
    verteilung({ nurDeck = null } = {}) {
        const out = { gut: 0, okay: 0, schlecht: 0, neu: 0 }
        const jetzt = this.jetzt()
        for (const e of this.index.eintraege.values()) {
            if (nurDeck && !e.vorkommen.some((v) => v.deckId === nurDeck)) continue
            out[beherrschung(this.zustand(e.schluessel), jetzt, this.pFuer(e))]++
        }
        return out
    }

    // Heute: Abfragen und Quote
    heute() {
        const start = tagesbeginn(this.jetzt())
        let abfragen = 0, richtig = 0
        for (let i = this.ereignisse.length - 1; i >= 0; i--) {
            const e = this.ereignisse[i]
            if (e.t < start) break
            if ((e.a !== "karte" && e.a !== "auswahl") || this.aufgehoben?.has(e.id)) continue
            abfragen++
            if (e.b >= 3 || e.ok) richtig++
        }
        return { abfragen, richtig, quote: abfragen ? richtig / abfragen : null }
    }

    // Wie viele Karten werden in den nächsten Tagen fällig?
    vorschauTage(tage = 7) {
        const start = tagesbeginn(this.jetzt())
        const out = Array.from({ length: tage }, (_, i) => ({ tag: start + i * TAG, anzahl: 0 }))
        for (const [k, z] of this.zustaende) {
            if (!this.eintrag(k)?.aktiv) continue
            const i = Math.max(0, Math.floor((z.faellig - start) / TAG))
            if (i < tage) out[i].anzahl++
        }
        return out
    }

    // Karte einer bestimmten Datei
    karteIn(deckId, kartenId) { return this.decks.get(deckId)?.deck.karten.find((k) => k.id === kartenId) ?? null }

    // ---------- Lernen ----------
    // aufgabe: { schluessel, deckId?, kartenId? } · ergebnis: { b: 1–4 } oder { ok: bool } · zusatz: { ms, vz }
    tageBerechnen() {
        return tageAusProtokoll(this.ereignisse, this.aufgehoben, { alias: this.index.alias })
    }
    // Der Tag eines Ereignisses neu aus dem Protokoll berechnen und ins Profil schreiben (verzögert)
    tagAktualisieren(t) {
        const tag = tagSchluessel(t)
        const w = this.tageBerechnen()[tag]
        this.profil.tage ??= {}
        if (w) this.profil.tage[tag] = w
        else delete this.profil.tage[tag]
        clearTimeout(this.profilTimer)
        this.profilTimer = setTimeout(() => this.profilSpeichernJetzt(), 1500)
    }
    async profilSpeichernJetzt() {
        clearTimeout(this.profilTimer)
        this.profilTimer = null
        await this.jsonSchreiben(PFAD.profil, this.profil).catch((f) => console.warn("Saat: Profil nicht gespeichert", f))
    }

    async bewerten(aufgabe, ergebnis, { ms = null, modus = null } = {}) {
        const e = this.eintrag(aufgabe.schluessel)
        if (!e) throw new Error("Diese Karte gibt es nicht mehr.")
        const deckId = aufgabe.deckId ?? e.deck.id
        const karte = (aufgabe.kartenId && this.karteIn(deckId, aufgabe.kartenId)) || e.karte
        const jetzt = this.jetzt()
        const vorher = this.zustand(e.schluessel)
        const teil = { k: e.schluessel, d: deckId, fp: kernAbdruck(karte), g: e.gebiet }
        if ("ok" in ergebnis) Object.assign(teil, { a: "auswahl", ok: !!ergebnis.ok })
        else Object.assign(teil, { a: "karte", b: ergebnis.b })
        if (ms != null) teil.ms = Math.round(ms)
        if (modus) teil.mo = modus
        if (vorher && vorher.faellig > jetzt) teil.vz = true
        const ev = ereignis(teil, jetzt)
        await this.anhaengen([ev])

        const neu = anwenden(vorher, ev, this.pFuer(e))
        if (ev.a === "karte" && vorher && neu.tag !== vorher.tag) {
            this.beobachtungen.push({ t: (ev.t - vorher.letzte) / TAG, s: vorher.s, y: ev.b >= 3 ? 1 : 0, g: e.gebiet, zeit: ev.t })
        }
        this.ereignisse.push(ev)
        this.zustaende.set(e.schluessel, neu)
        if (!this.verlauf.has(e.schluessel)) this.verlauf.set(e.schluessel, [])
        this.verlauf.get(e.schluessel).push(ev)

        this.tagAktualisieren(ev.t)
        if (anpassenFaellig(this.profil, this.beobachtungen.length, jetzt)) await this.profilAnpassen()
        else this.melden()
        this.senden()
        return { ereignis: ev, zustand: neu, vorher }
    }

    async aufheben(ereignisId) {
        const ev = ereignis({ a: "aufheben", ref: ereignisId }, this.jetzt())
        const ziel = this.ereignisse.find((e) => e.id === ereignisId)
        await this.anhaengen([ev])
        this.ereignisse.push(ev)
        this.neuBerechnen()
        if (ziel) this.tagAktualisieren(ziel.t)
        this.senden()
    }

    async zuruecksetzen(schluessel) {
        const ev = ereignis({ a: "zuruecksetzen", k: schluessel }, this.jetzt())
        await this.anhaengen([ev])
        this.ereignisse.push(ev)
        this.neuBerechnen()
        this.senden()
    }

    async anhaengen(liste) {
        const nachDatei = new Map()
        for (const ev of liste) {
            const d = `${PFAD.fortschritt}/${dateiFuer(ev.t)}`
            nachDatei.set(d, (nachDatei.get(d) || "") + zeile(ev))
        }
        await sperre(async () => { for (const [d, text] of nachDatei) await this.verz.anhaengen(d, text) })
    }

    // ---------- Konflikte ----------
    async konfliktEntscheiden(variantenSchluessel, entscheidung, ziel) {
        delete this.entscheidungen.aliase[variantenSchluessel]
        delete this.entscheidungen.getrennt[variantenSchluessel]
        if (entscheidung === "gleich") this.entscheidungen.aliase[variantenSchluessel] = ziel
        if (entscheidung === "getrennt") this.entscheidungen.getrennt[variantenSchluessel] = true
        await this.jsonSchreiben(PFAD.identitaeten, this.entscheidungen)
        this.neuBerechnen()
        this.senden()
    }

    // ---------- Profil ----------
    async profilAnpassen({ schritte = 1 } = {}) {
        const r = anpassen(this.profil, this.beobachtungen, this.jetzt(), { schritte })
        this.profil = r.profil
        await this.jsonSchreiben(PFAD.profil, this.profil)
        this.neuBerechnen()
        return r.bericht
    }
    async einstellungenSetzen(teil) {
        this.profil.einstellungen = { ...this.profil.einstellungen, ...teil }
        this.profil = profilLesen(this.profil).profil
        await this.jsonSchreiben(PFAD.profil, this.profil)
        this.neuBerechnen()
        this.senden()
    }
    async profilErsetzen(profil, { nurEinstellungen = false } = {}) {
        const neu = profilLesen(profil).profil
        if (nurEinstellungen) this.profil.einstellungen = neu.einstellungen
        else this.profil = { ...neu, id: neu.id, tage: tageZusammen({ ...this.profil.tage, ...neu.tage }, this.tageBerechnen()) }
        await this.jsonSchreiben(PFAD.profil, this.profil)
        this.neuBerechnen()
        this.senden()
    }
    profilDatei() {
        return { name: `saat-lernprofil-${tagSchluessel(this.jetzt())}.saatprofil`, blob: new Blob([JSON.stringify(this.profil, null, 2)], { type: "application/json" }) }
    }

    // ---------- Lerndateien ----------
    deckAktiv(id) { return this.dateiEinst[id]?.aktiv !== false }
    async deckAktivSetzen(id, aktiv) {
        this.dateiEinst[id] = { ...this.dateiEinst[id], aktiv }
        await this.jsonSchreiben(PFAD.dateien, this.dateiEinst)
        this.neuBerechnen()
        this.senden()
    }

    freierDateiname(titel, ausser = null) {
        const basis = idAusText(titel).slice(0, 40) || "lerndatei"
        const belegt = new Set([...this.decks.values()].filter((d) => d.deck.id !== ausser).map((d) => d.datei.toLowerCase()))
        let name = basis + ENDUNG, n = 2
        while (belegt.has(name.toLowerCase())) name = `${basis}-${n++}${ENDUNG}`
        return name
    }

    async deckSpeichern(deck, { sichern = true } = {}) {
        const alt = this.decks.get(deck.id)
        if (alt?.nurLesen) throw new Error("Diese Lerndatei stammt aus einer neueren Saat-Version und kann hier nicht verändert werden.")
        const datei = alt?.datei ?? this.freierDateiname(deck.titel, deck.id)
        deck.geaendert = new Date(this.jetzt()).toISOString()
        const text = deckSchreiben(deck)
        if (alt && sichern) await this.vorherSichern(`${PFAD.saatgut}/${datei}`, `saatgut/${datei}`)
        await this.verz.schreiben(`${PFAD.saatgut}/${datei}`, text)
        const neu = deckLesen(text, { dateiname: datei })
        this.decks.set(deck.id, { deck: neu.deck, datei, warnungen: neu.warnungen, nurLesen: false, ergaenzt: false })
        this.neuBerechnen()
        this.senden()
        return neu.deck
    }

    async deckNeu(teil = {}) {
        const d = { ...neuesDeck(teil), ...teil }
        d.erstellt = d.geaendert = new Date(this.jetzt()).toISOString()
        return this.deckSpeichern(d, { sichern: false })
    }

    async deckLoeschen(id) {
        const d = this.decks.get(id)
        if (!d) return
        const pfad = `${PFAD.saatgut}/${d.datei}`
        const inhalt = await this.verz.lesen(pfad)
        if (inhalt) await this.verz.schreiben(`${PFAD.papierkorb}/${tagSchluessel(this.jetzt())}-${d.datei}`, inhalt)
        await this.verz.loeschen(pfad)
        this.decks.delete(id)
        this.neuBerechnen()
        this.senden()
    }

    // Einmal am Tag die vorige Fassung einer Datei aufheben, bevor sie überschrieben wird
    async vorherSichern(pfad, ziel) {
        const ordner = `${PFAD.sicherung}/${tagSchluessel(this.jetzt())}`
        if (await this.verz.existiert(`${ordner}/${ziel}`)) return
        const inhalt = await this.verz.lesen(pfad)
        if (inhalt) await this.verz.schreiben(`${ordner}/${ziel}`, inhalt)
    }

    // ---------- Medien ----------
    async medienSpeichern(datei) {
        const daten = new Uint8Array(await datei.arrayBuffer())
        const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", daten))].slice(0, 6).map((b) => b.toString(16).padStart(2, "0")).join("")
        const name = (datei.name || "datei").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-").replace(/^-+/, "").slice(-60) || "datei"
        const pfad = `${PFAD.medien}/${hash}-${name}`
        if (!(await this.verz.existiert(pfad))) await this.verz.schreiben(pfad, new Blob([daten], { type: datei.type }))
        return pfad
    }
    async medienDatei(pfad) {
        if (!pfad?.startsWith("medien/") || pfad.includes("..")) return null
        if (!this.medienCache.has(pfad)) this.medienCache.set(pfad, await this.verz.lesen(pfad).catch(() => null))
        return this.medienCache.get(pfad)
    }
    async fehlendeMedien() {
        const vorhanden = new Set((await this.verz.liste(PFAD.medien)).map((e) => `${PFAD.medien}/${e.name}`))
        const out = new Map()
        for (const { deck } of this.decks.values()) for (const p of medienVerweise(deck)) {
            if (vorhanden.has(p)) continue
            if (!out.has(p)) out.set(p, [])
            out.get(p).push(deck.titel)
        }
        return [...out].map(([pfad, decks]) => ({ pfad, decks }))
    }

    // ---------- Export ----------
    async deckExport(id) {
        const d = this.decks.get(id)
        if (!d) throw new Error("Lerndatei nicht gefunden.")
        const text = deckSchreiben(d.deck)
        const medien = medienVerweise(d.deck)
        const basis = d.datei.replace(/\.(saat|json)$/i, "")
        if (!medien.length) return { name: basis + ENDUNG, blob: new Blob([text], { type: "application/json" }), fehlend: [] }
        const dateien = { [basis + ENDUNG]: text }
        const fehlend = []
        for (const p of medien) {
            const b = await this.medienDatei(p)
            if (b) dateien[p] = b
            else fehlend.push(p)
        }
        return { name: basis + PAKET_ENDUNG, blob: await zipBauen(dateien), fehlend }
    }

    async standExport() {
        const dateien = {
            "saat-stand.json": JSON.stringify({ format: "grove-saat-stand", version: 1, exportiert: new Date(this.jetzt()).toISOString(), speicher: this.kennung?.id, ereignisse: this.ereignisse.length }, null, 2),
            [PFAD.profil]: JSON.stringify(this.profil, null, 2),
            [PFAD.identitaeten]: JSON.stringify(this.entscheidungen, null, 2),
            [PFAD.dateien]: JSON.stringify(this.dateiEinst, null, 2),
        }
        for (const e of await this.verz.liste(PFAD.fortschritt)) {
            if (/^protokoll-.*\.jsonl$/.test(e.name)) dateien[`${PFAD.fortschritt}/${e.name}`] = await this.verz.lesen(`${PFAD.fortschritt}/${e.name}`)
        }
        return { name: `saat-lernstand-${tagSchluessel(this.jetzt())}.saatstand`, blob: await zipBauen(dateien) }
    }

    async sicherungExport() {
        return { name: `saat-speicher-${tagSchluessel(this.jetzt())}.zip`, blob: await verzeichnisZuZip(this.verz, { ohne: [PFAD.sicherung, PFAD.papierkorb] }) }
    }

    // ---------- Import ----------
    // Schritt 1: ansehen, was in der Datei steckt (nichts wird verändert)
    async importPruefen(datei) {
        const name = datei.name || "Datei"
        const klein = name.toLowerCase()
        if (/\.(saatpaket|saatstand|zip)$/.test(klein)) {
            const verz = await zipLesen(datei, name)
            const pfade = await alleDateien(verz)
            const istSpeicher = pfade.some((p) => p === PFAD.kennung || p === "saat-stand.json" || p.startsWith(PFAD.fortschritt + "/"))
            if (istSpeicher) return this.speicherPlan(verz, name)
            const deckPfad = pfade.find((p) => /\.(saat|json)$/i.test(p) && !p.includes("/")) ?? pfade.find((p) => /\.saat$/i.test(p))
            if (!deckPfad) throw new Error("In diesem Paket steckt keine Lerndatei.")
            const r = deckLesen(await verz.lesenText(deckPfad), { dateiname: deckPfad.split("/").pop() })
            const medien = new Map()
            for (const p of medienVerweise(r.deck)) { const b = await verz.lesen(p); if (b) medien.set(p, b) }
            return this.deckPlan(r, name, medien)
        }
        const text = await datei.text()
        if (/\.(csv|tsv|txt)$/.test(klein)) {
            const deck = tabelleZuDeck(text, { titel: name.replace(/\.[^.]+$/, "") })
            return this.deckPlan({ deck, warnungen: [], nurLesen: false }, name, new Map())
        }
        let roh
        try { roh = JSON.parse(text.replace(/^﻿/, "")) } catch { throw new FormatFehler("Die Datei ist weder eine Saat-Lerndatei noch ein Paket.") }
        if (roh?.format === PROFIL_FORMAT) {
            const r = profilLesen(roh)
            return { typ: "profil", name, profil: r.profil, warnungen: r.warnungen }
        }
        return this.deckPlan(deckLesen(roh, { dateiname: name }), name, new Map())
    }

    deckPlan(r, name, medien) {
        const vorhanden = this.decks.get(r.deck.id) ?? null
        let bekannt = 0, mitStand = 0
        for (const k of r.deck.karten) {
            if (this.index.eintraege.has(k.id)) bekannt++
            if (this.zustaende.has(k.id)) mitStand++
        }
        const fehlendeMedien = medienVerweise(r.deck).filter((p) => !medien.has(p))
        return { typ: "deck", name, deck: r.deck, warnungen: r.warnungen, nurLesen: r.nurLesen, vorhanden: vorhanden?.deck ?? null, bekannt, mitStand, medien, fehlendeMedien }
    }

    async speicherPlan(verz, name) {
        const fremd = []
        for (const e of await verz.liste(PFAD.fortschritt)) {
            if (/^protokoll-.*\.jsonl$/.test(e.name)) fremd.push(...protokollLesen(await verz.lesenText(`${PFAD.fortschritt}/${e.name}`)).ereignisse)
        }
        const bekannt = new Set(this.ereignisse.map((e) => e.id))
        const decks = []
        for (const e of await verz.liste(PFAD.saatgut)) {
            if (e.art !== "datei") continue
            try { const r = deckLesen(await verz.lesenText(`${PFAD.saatgut}/${e.name}`), { dateiname: e.name }); decks.push({ titel: r.deck.titel, id: r.deck.id, neu: !this.decks.has(r.deck.id) }) }
            catch { /* kaputte Dateien meldet zusammenfuehren */ }
        }
        const profilText = await verz.lesenText(PFAD.profil)
        const profil = profilText && istJson(profilText) ? profilLesen(JSON.parse(profilText)).profil : null
        return {
            typ: "speicher", name, verz,
            ereignisse: fremd.length, neueEreignisse: fremd.filter((e) => !bekannt.has(e.id)).length,
            decks, profil, eigeneBeobachtungen: this.beobachtungen.length,
        }
    }

    // Schritt 2: übernehmen
    // deck: modus "neu" | "ersetzen" | "kopie" · speicher: profil "behalten" | "uebernehmen" · profil: nurEinstellungen
    async importAusfuehren(plan, wahl = {}) {
        if (plan.typ === "profil") return this.profilErsetzen(plan.profil, { nurEinstellungen: !!wahl.nurEinstellungen })
        if (plan.typ === "speicher") return this.zusammenfuehren(plan.verz, { profil: wahl.profil ?? "behalten" })
        for (const [p, blob] of plan.medien) if (!(await this.verz.existiert(p))) await this.verz.schreiben(p, blob)
        let deck = structuredClone(plan.deck)
        if (plan.vorhanden && wahl.modus === "kopie") {
            deck.id = neueId("d")
            deck.titel = `${deck.titel} (Kopie)`
        } else if (plan.vorhanden && wahl.modus !== "ersetzen") {
            throw new Error("Diese Lerndatei ist schon vorhanden – bitte „Ersetzen“ oder „Als Kopie“ wählen.")
        }
        const alt = this.decks.get(deck.id)
        if (alt) {
            await this.vorherSichern(`${PFAD.saatgut}/${alt.datei}`, `saatgut/${alt.datei}`)
            const text = deckSchreiben({ ...deck, geaendert: deck.geaendert })
            await this.verz.schreiben(`${PFAD.saatgut}/${alt.datei}`, text)
            this.decks.set(deck.id, { deck: deckLesen(text).deck, datei: alt.datei, warnungen: [], nurLesen: false })
        } else {
            const datei = this.freierDateiname(deck.titel)
            const text = deckSchreiben(deck)
            await this.verz.schreiben(`${PFAD.saatgut}/${datei}`, text)
            this.decks.set(deck.id, { deck: deckLesen(text, { dateiname: datei }).deck, datei, warnungen: [], nurLesen: plan.nurLesen })
        }
        this.neuBerechnen()
        this.senden()
        return { deck }
    }

    // Einen anderen Lernspeicher (Ordner, Sicherung, Lernstand) hier hinein übernehmen – ohne Verluste
    async zusammenfuehren(quelle, { profil = "behalten" } = {}) {
        const bericht = { ereignisseNeu: 0, decksNeu: [], decksAktualisiert: [], decksBehalten: [], decksKaputt: [], medienNeu: 0, profil: "behalten" }
        const tag = tagSchluessel(this.jetzt())

        // 1. Lernprotokoll: nur neue Ereignisse anhängen
        const bekannt = new Set(this.ereignisse.map((e) => e.id))
        const neue = []
        for (const e of await quelle.liste(PFAD.fortschritt)) {
            if (!/^protokoll-.*\.jsonl$/.test(e.name)) continue
            for (const ev of protokollLesen(await quelle.lesenText(`${PFAD.fortschritt}/${e.name}`)).ereignisse) {
                if (!bekannt.has(ev.id)) { neue.push(ev); bekannt.add(ev.id) }
            }
        }
        if (neue.length) await this.anhaengen(neue)
        bericht.ereignisseNeu = neue.length

        // 2. Entscheidungen + Datei-Einstellungen (vorhandene gewinnen)
        const ent = await quelle.lesenText(PFAD.identitaeten)
        if (ent && istJson(ent)) {
            this.entscheidungen = entscheidungenVereinigen(this.entscheidungen, entscheidungenLesen(JSON.parse(ent)))
            await this.jsonSchreiben(PFAD.identitaeten, this.entscheidungen)
        }
        const de = await quelle.lesenText(PFAD.dateien)
        if (de && istJson(de)) {
            this.dateiEinst = { ...JSON.parse(de), ...this.dateiEinst }
            await this.jsonSchreiben(PFAD.dateien, this.dateiEinst)
        }

        // 3. Lerndateien: neue dazu, gleiche überspringen, unterschiedliche → neuere gewinnt, ältere in sicherung/
        for (const e of await quelle.liste(PFAD.saatgut)) {
            if (e.art !== "datei" || !/\.(saat|json)$/i.test(e.name)) continue
            const text = await quelle.lesenText(`${PFAD.saatgut}/${e.name}`)
            let r
            try { r = deckLesen(text, { dateiname: e.name }) } catch { bericht.decksKaputt.push(e.name); continue }
            const hier = this.decks.get(r.deck.id)
            if (!hier) {
                const datei = this.freierDateiname(r.deck.titel)
                await this.verz.schreiben(`${PFAD.saatgut}/${datei}`, text)
                this.decks.set(r.deck.id, { deck: r.deck, datei, warnungen: [], nurLesen: r.nurLesen })
                bericht.decksNeu.push(r.deck.titel)
                continue
            }
            if (deckSchreiben({ ...hier.deck, geaendert: "" }) === deckSchreiben({ ...r.deck, geaendert: "" })) continue
            if ((r.deck.geaendert || "") > (hier.deck.geaendert || "")) {
                await this.vorherSichern(`${PFAD.saatgut}/${hier.datei}`, `saatgut/${hier.datei}`)
                await this.verz.schreiben(`${PFAD.saatgut}/${hier.datei}`, text)
                bericht.decksAktualisiert.push(r.deck.titel)
            } else {
                await this.verz.schreiben(`${PFAD.sicherung}/${tag}/import/${e.name}`, text)
                bericht.decksBehalten.push(r.deck.titel)
            }
        }

        // 4. Medien: fehlende kopieren (Namen enthalten die Prüfsumme → keine Verwechslung)
        for (const e of await quelle.liste(PFAD.medien)) {
            if (e.art !== "datei") continue
            const p = `${PFAD.medien}/${e.name}`
            if (!(await this.verz.existiert(p))) { await this.verz.schreiben(p, await quelle.lesen(p)); bericht.medienNeu++ }
        }

        // 5. Profil
        const pt = await quelle.lesenText(PFAD.profil)
        if (pt && istJson(pt) && profil === "uebernehmen") {
            await this.vorherSichern(PFAD.profil, PFAD.profil)
            await this.jsonSchreiben(PFAD.profil, profilLesen(JSON.parse(pt)).profil)
            bericht.profil = "uebernommen"
        }
        await this.laden()
        // Mehr Daten → Profil darf nachziehen
        if (neue.length && anpassenFaellig(this.profil, this.beobachtungen.length, this.jetzt())) await this.profilAnpassen()
        this.senden()
        return bericht
    }

    // ---------- Sicherheit ----------
    async jsonLesen(pfad) {
        const t = await this.verz.lesenText(pfad)
        if (t != null && istJson(t)) return { wert: JSON.parse(t) }
        const bak = await this.verz.lesenText(pfad + ".bak")
        if (bak != null && istJson(bak)) {
            if (t != null) this.warnungen.push(`${pfad} war beschädigt – die letzte Sicherung wurde verwendet.`)
            return { wert: JSON.parse(bak), ausSicherung: true }
        }
        if (t != null) this.warnungen.push(`${pfad} ist beschädigt und konnte nicht gelesen werden.`)
        return { wert: null }
    }

    async jsonSchreiben(pfad, wert) {
        await sperre(async () => {
            const alt = await this.verz.lesenText(pfad)
            if (alt && istJson(alt)) await this.verz.schreiben(pfad + ".bak", alt)
            await this.verz.schreiben(pfad, JSON.stringify(wert, null, 2))
        })
    }

    async taeglichSichern() {
        const tag = tagSchluessel(this.jetzt())
        const ordner = `${PFAD.sicherung}/${tag}`
        if (!(await this.verz.existiert(`${ordner}/${PFAD.profil}`))) {
            for (const p of [PFAD.profil, PFAD.identitaeten, PFAD.dateien]) {
                const b = await this.verz.lesen(p)
                if (b) await this.verz.schreiben(`${ordner}/${p}`, b)
            }
            const monat = `${PFAD.fortschritt}/${dateiFuer(this.jetzt())}`
            const b = await this.verz.lesen(monat)
            if (b) await this.verz.schreiben(`${ordner}/${monat}`, b)
        }
        const tage = (await this.verz.liste(PFAD.sicherung)).filter((e) => e.art === "ordner" && /^\d{4}-\d\d-\d\d$/.test(e.name)).map((e) => e.name).sort()
        for (const alt of tage.slice(0, Math.max(0, tage.length - SICHERUNGEN_BEHALTEN))) await this.verz.loeschen(`${PFAD.sicherung}/${alt}`)
    }

    // Mehrere Tabs: der andere Tab lädt nach, wenn hier etwas gespeichert wurde
    kanalEinrichten() {
        if (!this.kanalAn || this.kanal || typeof BroadcastChannel === "undefined" || !this.kennung?.id) return
        this.kanal = new BroadcastChannel("grove-saat-" + this.kennung.id)
        this.kanal.onmessage = () => { this.laden().then(() => this.melden("von-aussen")).catch(() => {}) }
    }
    senden() { this.kanal?.postMessage({ art: "geaendert", t: Date.now() }) }
    schliessen() {
        if (this.profilTimer) this.profilSpeichernJetzt()
        this.kanal?.close(); this.kanal = null
    }

    // ---------- Kurse von Grove ----------
    kursDeck(kursId) {
        return [...this.decks.values()].find((d) => kursVon(d.deck)?.id === kursId) ?? null
    }
    // deck = Inhalt aus js/saat/kurse/<id>.js – landet als saatgut/kurs-<id>.saat im AKTUELLEN Speicher
    // medien: Map("medien/…" → Blob) – mitgelieferte Bilder; vorhandene Dateien bleiben unangetastet
    async kursInstallieren(kursDeck, medien = new Map()) {
        const kurs = kursVon(kursDeck)
        if (!kurs) throw new Error("Das ist kein Kurs.")
        const vorhanden = this.kursDeck(kurs.id)
        const datei = vorhanden?.datei ?? `${deckIdFuer(kurs.id)}${ENDUNG}`
        const deck = deckLesen(structuredClone(kursDeck), { dateiname: datei }).deck
        if (vorhanden) await this.vorherSichern(`${PFAD.saatgut}/${datei}`, `saatgut/${datei}`)
        for (const [p, blob] of medien) {
            if (!p.startsWith(`${PFAD.medien}/`) || p.includes("..") || (await this.verz.existiert(p))) continue
            await this.verz.schreiben(p, blob)
            this.medienCache.delete(p)
        }
        await this.verz.schreiben(`${PFAD.saatgut}/${datei}`, deckSchreiben(deck))
        if (vorhanden && vorhanden.deck.id !== deck.id) this.decks.delete(vorhanden.deck.id)
        this.decks.set(deck.id, { deck, datei, warnungen: [], nurLesen: false })
        this.neuBerechnen()
        this.senden()
        return deck
    }
    // Kurs entfernen: Datei weg UND der Lernstand seiner Karten wird aus dem Protokoll dieses Speichers
    // gelöscht – außer für Karten, die auch in einer anderen Lerndatei stehen.
    async kursEntfernen(kursId) {
        const d = this.kursDeck(kursId)
        if (!d) return { karten: 0, abfragen: 0 }
        const anderswo = new Set(), medienAnderswo = new Set()
        for (const x of this.decks.values()) {
            if (x === d) continue
            for (const k of x.deck.karten) { const s = this.index.schluessel(x.deck.id, k.id); if (s) anderswo.add(s) }
            for (const p of medienVerweise(x.deck)) medienAnderswo.add(p)
        }
        const weg = new Set(d.deck.karten.map((k) => this.index.schluessel(d.deck.id, k.id)).filter((s) => s && !anderswo.has(s)))
        const abfragen = await this.ereignisseEntfernen(weg)
        await this.verz.loeschen(`${PFAD.saatgut}/${d.datei}`)
        for (const p of new Set(medienVerweise(d.deck))) {
            if (medienAnderswo.has(p) || !p.startsWith(`${PFAD.medien}/kurs-`)) continue      // nur mitgelieferte Kursbilder
            await this.verz.loeschen(p).catch(() => {})
            this.medienCache.delete(p)
        }
        await this.laden()
        this.senden()
        return { karten: weg.size, abfragen }
    }
    // Ereignisse bestimmter Karten wirklich aus den Protokolldateien entfernen (vorher Sicherung)
    async ereignisseEntfernen(schluessel) {
        if (!schluessel.size) return 0
        const alias = this.index.alias
        let entfernt = 0
        await sperre(async () => {
            for (const e of await this.verz.liste(PFAD.fortschritt)) {
                if (e.art !== "datei" || !/^protokoll-.*\.jsonl$/.test(e.name)) continue
                const pfad = `${PFAD.fortschritt}/${e.name}`
                const zeilen = (await this.verz.lesenText(pfad)).split("\n")
                const bleiben = zeilen.filter((z) => {
                    if (!z.trim()) return false
                    try { const ev = JSON.parse(z); if (ev.k && schluessel.has(alias(ev.k))) { entfernt++; return false } } catch { /* kaputte Zeilen bleiben, wie sie sind */ }
                    return true
                })
                if (bleiben.length === zeilen.filter((z) => z.trim()).length) continue
                await this.vorherSichern(pfad, pfad)
                await this.verz.schreiben(pfad, bleiben.length ? bleiben.join("\n") + "\n" : "")
            }
        })
        return entfernt
    }

    // Für den Prüfbericht in den Einstellungen
    async pruefen() {
        return {
            kaputteDateien: this.kaputt,
            kaputteZeilen: this.kaputteZeilen,
            offeneKonflikte: this.index.konflikte.filter((k) => !k.geloest).length,
            fehlendeMedien: await this.fehlendeMedien(),
            dateiWarnungen: [...this.decks.values()].filter((d) => d.warnungen.length).map((d) => ({ titel: d.deck.titel, warnungen: d.warnungen })),
            warnungen: this.warnungen,
        }
    }
}

// Schreibzugriffe nacheinander – auch über mehrere Tabs (Web Locks), wenn der Browser es kann
async function sperre(fn) {
    if (typeof navigator !== "undefined" && navigator.locks?.request) return navigator.locks.request("grove-saat-schreiben", fn)
    return fn()
}
