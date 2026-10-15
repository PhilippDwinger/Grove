// ==========================================================
// Saat · Startseite „Heute“: fällige Karten + Überblick
// ==========================================================
import { esc } from "../../kern/html.js"
import { S } from "../symbole.js"
import { sitzungsListe } from "../sitzung.js"
import { dauerText, TAG } from "../hilfen.js"
import { BEISPIELE } from "../beispiele.js"
import { deckSchreiben } from "../format.js"
import { verteilungHtml, ringHtml, leerHtml, BILD, datumKurz, prozent, meldung, fehlerMeldung, dateiWaehlen } from "./ui.js"
import { konflikteHtml, konflikteAktivieren } from "./konflikte.js"
import { streaks, kalender } from "../statistik.js"

export function zeigen(el, app) {
    const l = app.lager
    if (!l.decks.size) return leerZeigen(el, app)
    const f = l.faelligkeit()
    const h = l.heute()
    const v = l.verteilung()
    const jetzt = l.jetzt()
    const wdh = f.faellig.length
    const neu = f.neu.length
    const offen = wdh + neu
    const max = l.profil.einstellungen.maxProTag
    const tage = l.vorschauTage(7)
    const groesste = Math.max(1, ...tage.map((t) => t.anzahl))
    const fortschritt = h.abfragen + offen ? h.abfragen / (h.abfragen + offen) : 1
    const st = streaks(l.profil.tage || {}, jetzt)

    el.innerHTML = `
    <section class="sa-heute">
        ${hinweiseHtml(l)}
        ${konflikteHtml(l, { kurz: true })}
        <article class="sa-held${offen ? "" : " sa-held--fertig"}">
            <div class="sa-held__text">
                <p class="sa-ueber">Heute</p>
                ${offen ? `
                    <h1><span class="sa-zahl" data-zaehlen="${offen}">${offen}</span> ${offen === 1 ? "Karte wartet" : "Karten warten"}</h1>
                    <ul class="sa-chips">
                        ${wdh ? `<li>${wdh} zum Wiederholen</li>` : ""}
                        ${neu ? `<li>${neu} neu</li>` : ""}
                        ${f.ueberfaellig ? `<li class="sa-chip--warm">${f.ueberfaellig} überfällig</li>` : ""}
                        ${f.lernend ? `<li>${f.lernend} gerade in Arbeit</li>` : ""}
                    </ul>
                    <div class="sa-held__knoepfe">
                        <button class="g-knopf sa-knopf-gross" type="button" data-lernen>${S.spielen} Jetzt lernen</button>
                        <button class="g-knopf-leise" type="button" data-auswahl title="Auswahl, Schreiben, Zeichnen oder Gespräch mit Professor Uhu">${S.sprechblase} Andere Lernart …</button>
                    </div>
                    ${offen > max ? `<p class="sa-klein">Eine Sitzung umfasst höchstens ${max} Karten (einstellbar im Lernprofil).</p>` : ""}`
                : `
                    <h1>Alles erblüht.</h1>
                    <p class="sa-held__satz">${f.naechste ? `Die nächste Karte ist ${naechsteText(f.naechste, jetzt)} fällig.` : "Gerade ist nichts fällig."}
                    ${f.neuOffen ? ` ${f.neuOffen} neue Karten warten – für heute ist dein Tagesziel neuer Karten erreicht.` : ""}</p>
                    <div class="sa-held__knoepfe">
                        ${f.neuOffen ? `<button class="g-knopf-leise" type="button" data-mehrneu>${S.plus} 10 weitere neue lernen</button>` : ""}
                        <button class="g-knopf-leise" type="button" data-vorziehen>${S.zurueck} Nächste 10 vorziehen</button>
                    </div>`}
            </div>
            <div class="sa-held__ring">
                ${offen ? ringHtml(fortschritt, `${h.abfragen}`, "heute geübt") : `<div class="sa-held__bluete">${BILD.bluete}</div>`}
            </div>
        </article>

        <div class="sa-raster">
            <article class="sa-kachel sa-kachel--breit">
                <header><h2>Deine Karten</h2><a class="g-knopf-text" href="#karten">Alle ansehen ${S.weiter}</a></header>
                ${verteilungHtml(v)}
                <p class="sa-klein">${l.index.eintraege.size} Karten aus ${l.decks.size} ${l.decks.size === 1 ? "Lerndatei" : "Lerndateien"}. Die Stufen richten sich danach, wie sicher du eine Karte gerade wirklich abrufen kannst.</p>
            </article>
        </div>
        <div class="sa-raster sa-raster--zwei">
            <article class="sa-kachel">
                <header><h2>Nächste 7 Tage</h2></header>
                <div class="sa-vorschau" role="list">
                    ${tage.map((t, i) => `<div class="sa-vorschau__tag" role="listitem" title="${datumKurz(t.tag)}: ${t.anzahl} fällig">
                        <span class="sa-vorschau__zahl">${t.anzahl || ""}</span>
                        <i style="--h:${(t.anzahl / groesste) * 100}%"></i>
                        <span>${i === 0 ? "heute" : datumKurz(t.tag).slice(0, 2)}</span></div>`).join("")}
                </div>
            </article>
            <article class="sa-kachel sa-serie">
                <header><h2>Lernserie</h2></header>
                <div class="sa-serie__zahlen">
                    <div class="sa-serie__aktuell${st.aktuell ? "" : " ist-aus"}">${S.flamme}<b>${st.aktuell}</b><span>${st.aktuell === 1 ? "Tag" : "Tage"} aktuell</span></div>
                    <div><b>${st.laengste}</b><span>längste Serie</span></div>
                    <div><b>${h.abfragen}</b><span>heute geübt</span></div>
                </div>
                <p class="sa-klein">${st.heuteGelernt ? `Heute erledigt${h.abfragen ? ` – ${prozent(h.quote)} gewusst bzw. richtig` : ""}.` : st.aktuell ? "Lern heute noch eine Karte, damit die Serie weiterläuft." : "Eine Karte am Tag genügt für eine Serie."}</p>
            </article>
        </div>
        ${kalenderHtml(l)}
    </section>`

    const auswahl = () => sitzungsListe(f.faellig, f.neu, max).map((schluessel) => ({ schluessel }))
    el.querySelector("[data-lernen]")?.addEventListener("click", () => app.lernen({ modus: "karte", aufgaben: auswahl(), titel: "Fällige Karten" }))
    el.querySelector("[data-auswahl]")?.addEventListener("click", () => app.modusWaehlen(auswahl(), { titel: "Fällige Karten" }))
    el.querySelector("[data-vorziehen]")?.addEventListener("click", () => {
        const naechste = [...l.zustaende].filter(([k]) => l.eintrag(k)?.aktiv).sort((a, b) => a[1].faellig - b[1].faellig).slice(0, 10).map(([schluessel]) => ({ schluessel }))
        app.lernen({ modus: "karte", aufgaben: naechste, titel: "Vorgezogen" })
    })
    el.querySelector("[data-mehrneu]")?.addEventListener("click", () => {
        const neue = [...l.index.eintraege.values()].filter((e) => e.aktiv && !l.zustand(e.schluessel)).slice(0, 10).map((e) => ({ schluessel: e.schluessel }))
        app.lernen({ modus: "karte", aufgaben: neue, titel: "Neue Karten" })
    })
    konflikteAktivieren(el, app)
    kalenderAktivieren(el, l)
    zaehlen(el)
}

// ---------- Lernkalender ----------
// Jedes Kästchen ein Tag, Farbe = wie viel du gelernt hast (Stufen nach deinen eigenen Mengen).
// Maus drauf oder Tab-Fokus → kleine Tageskarte. Daten: Lerntage im Profil (statistik.js).
const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
const tagLang = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
function kalenderHtml(l) {
    const breite = document.querySelector(".sa-seite")?.clientWidth || innerWidth
    const wochen = breite > 1050 ? 52 : breite > 700 ? 34 : 18
    const { spalten } = kalender(l.profil.tage || {}, l.jetzt(), wochen)
    let letzterMonat = -1
    const monate = spalten.map((sp) => {
        const m = sp[0].datum.getMonth()
        const neu = m !== letzterMonat
        letzterMonat = m
        return `<span>${neu ? MONATE[m] : ""}</span>`
    }).join("")
    const gelernt = spalten.flat().filter((t) => t.werte).length
    return `<article class="sa-kachel sa-kachel--breit sa-kal">
        <header><h2>Lernkalender</h2><span class="sa-klein">${gelernt} ${gelernt === 1 ? "Lerntag" : "Lerntage"} in den letzten ${wochen === 52 ? "12 Monaten" : `${wochen} Wochen`}</span></header>
        <div class="sa-kal__rahmen">
            <div class="sa-kal__wochentage" aria-hidden="true"><i></i><span>Mo</span><span></span><span>Mi</span><span></span><span>Fr</span><span></span><span>So</span></div>
            <div class="sa-kal__scroll" data-kal-scroll>
                <div class="sa-kal__monate" aria-hidden="true" style="--wochen:${wochen}">${monate}</div>
                <div class="sa-kal__gitter" style="--wochen:${wochen}" role="grid" aria-label="Lernkalender">
                    ${spalten.map((sp) => sp.map((t) => t.zukunft ? `<span class="sa-kal__tag ist-zukunft"></span>`
                        : `<button type="button" class="sa-kal__tag" data-stufe="${t.stufe}" data-tag="${t.tag}" aria-label="${esc(tagLang.format(t.datum))}: ${t.werte ? `${t.werte[0]} Abfragen` : "nicht gelernt"}"></button>`).join("")).join("")}
                </div>
            </div>
        </div>
        <div class="sa-kal__fuss"><span class="sa-klein">weniger</span>${[0, 1, 2, 3, 4].map((x) => `<i class="sa-kal__tag" data-stufe="${x}"></i>`).join("")}<span class="sa-klein">mehr</span></div>
        <div class="sa-kal__info" data-kal-info role="tooltip" hidden></div>
    </article>`
}
function kalenderAktivieren(el, l) {
    const box = el.querySelector(".sa-kal")
    if (!box) return
    const info = box.querySelector("[data-kal-info]")
    const scroll = box.querySelector("[data-kal-scroll]")
    scroll.scrollLeft = scroll.scrollWidth
    const zeigen = (knopf) => {
        const tag = knopf.dataset.tag
        const w = l.profil.tage?.[tag]
        const [j, m, t] = tag.split("-").map(Number)
        info.innerHTML = `<strong>${esc(tagLang.format(new Date(j, m - 1, t)))}</strong>${w ? `
            <dl><dt>Abfragen</dt><dd>${w[0]}</dd><dt>Gewusst / richtig</dt><dd>${w[1]} (${Math.round((w[1] / w[0]) * 100)} %)</dd>
            <dt>Neue Karten</dt><dd>${w[2]}</dd><dt>Lernzeit</dt><dd>≈ ${Math.max(1, Math.round(w[3] / 60))} Min.</dd></dl>` : `<span>Nicht gelernt</span>`}`
        info.hidden = false
        const r = knopf.getBoundingClientRect(), b = box.getBoundingClientRect()
        const breite = info.offsetWidth
        info.style.left = `${Math.max(8, Math.min(b.width - breite - 8, r.left - b.left + r.width / 2 - breite / 2))}px`
        info.style.top = `${r.top - b.top - info.offsetHeight - 8}px`
    }
    const weg = () => { info.hidden = true }
    box.querySelectorAll("button[data-tag]").forEach((k) => {
        k.addEventListener("mouseenter", () => zeigen(k))
        k.addEventListener("focus", () => zeigen(k))
        k.addEventListener("click", () => zeigen(k))
        k.addEventListener("mouseleave", weg)
        k.addEventListener("blur", weg)
    })
}

function naechsteText(t, jetzt) {
    const d = t - jetzt
    if (d < TAG && new Date(t).getDate() === new Date(jetzt).getDate()) return `in ${dauerText(d)}`
    return d < 2 * TAG ? "morgen" : `in ${dauerText(d)}`
}

function hinweiseHtml(l) {
    const h = [...l.warnungen]
    if (l.kaputt.length) h.push(`${l.kaputt.length} Lerndatei(en) konnten nicht gelesen werden – Details unter „Saatgut“.`)
    if (!h.length) return ""
    return `<div class="sa-hinweise">${h.map((t) => `<p class="sa-hinweis">${S.info}<span>${esc(t)}</span></p>`).join("")}</div>`
}

// Zahl zählt kurz hoch (U07) – respektiert „Bewegung aus“
function zaehlen(el) {
    const z = el.querySelector("[data-zaehlen]")
    if (!z || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.bewegung === "aus") return
    const ziel = +z.dataset.zaehlen
    if (ziel < 4) return
    const start = performance.now()
    const schritt = (t) => {
        const p = Math.min(1, (t - start) / 600)
        z.textContent = Math.round(ziel * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(schritt)
    }
    requestAnimationFrame(schritt)
}

function leerZeigen(el, app) {
    el.innerHTML = `<section class="sa-heute">
        ${hinweiseHtml(app.lager)}
        ${leerHtml({
            bild: BILD.beet, titel: "Noch kein Saatgut",
            text: "Lerndateien sind dein Saatgut: Karten mit Begriff, Antwort und allem, was beim Merken hilft. Leg eine an, hol dir eine Datei – oder schau dir zuerst die Beispiele an.",
            knoepfe: `<button class="g-knopf" type="button" data-beispiele>${S.plus} Beispiele anlegen</button>
                <button class="g-knopf-leise" type="button" data-neu>${S.stift} Eigene Lerndatei</button>
                <button class="g-knopf-leise" type="button" data-import>${S.holen} Datei öffnen</button>`,
        })}
    </section>`
    el.querySelector("[data-beispiele]").addEventListener("click", async () => {
        try {
            for (const { datei, deck } of BEISPIELE) await app.lager.verz.schreiben(`saatgut/${datei}`, deckSchreiben(deck))
            await app.lager.laden()
            meldung("Drei Beispiel-Lerndateien angelegt")
            app.gehe("heute")
        } catch (f) { fehlerMeldung(f) }
    })
    el.querySelector("[data-neu]").addEventListener("click", async () => {
        const d = await app.lager.deckNeu({ titel: "Meine erste Lerndatei" })
        app.gehe(`editor/${encodeURIComponent(d.id)}`)
    })
    el.querySelector("[data-import]").addEventListener("click", async () => {
        const dateien = await dateiWaehlen({ accept: ".saat,.saatpaket,.saatstand,.saatprofil,.json,.zip,.csv,.tsv,.txt", mehrere: true })
        if (dateien.length) app.importieren(dateien)
    })
}
