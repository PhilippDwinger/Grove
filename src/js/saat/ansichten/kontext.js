// Saat · Darstellungs-Kontext für eine Karte (welche Sprachen, wie Verweise aufgelöst werden …)
export function ctxFuer(app, deck) {
    const l = app.lager
    return {
        lager: l,
        sprachen: deck?.sprachen || {},
        vorlesen: l.profil.einstellungen.vorlesen,
        karteVon: (id) => {
            const e = l.eintrag(id) ?? [...l.index.eintraege.values()].find((x) => x.id === id)
            if (!e) return null
            const t = (e.karte.vorne?.text || "").trim()
            return t ? { vorne: t, antwort: e.karte.antwort || "" } : { vorne: e.karte.antwort || "", antwort: (e.karte.alternativen || [])[0] || "" }
        },
        oeffnen: (id) => app.karteAnsehen(l.eintrag(id) ? id : [...l.index.eintraege.values()].find((x) => x.id === id)?.schluessel ?? id),
    }
}

// Karte, Datei und Index-Eintrag zu einer Aufgabe { schluessel, deckId?, kartenId? }
export function aufgabeAufloesen(lager, a) {
    const eintrag = lager.eintrag(a.schluessel)
    if (!eintrag) return null
    const deckId = a.deckId ?? eintrag.deck.id
    const karte = (a.kartenId && lager.karteIn(deckId, a.kartenId)) || eintrag.karte
    const deck = lager.decks.get(deckId)?.deck ?? eintrag.deck
    return { eintrag, karte, deck }
}
