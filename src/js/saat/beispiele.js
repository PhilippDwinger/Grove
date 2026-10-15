// ==========================================================
// Saat · Beispiel-Saatgut (wird auf Wunsch beim ersten Start angelegt)
// Zwei Japanisch-Dateien teilen sich bewusst Karten (食べる, 飲む) – so sieht man,
// dass der Lernstand an der Karte hängt, nicht an der Datei.
// ==========================================================
const b = (typ, felder) => ({ typ, ...felder })
const satz = (text, lesung, uebersetzung) => [
    b("satz", { id: "satz", text, lesung, markierung: "", sprache: "ja" }),
    b("uebersetzung", { text: uebersetzung, bezug: "satz", sprache: "de", notiz: "" }),
]
const ja = (id, text, zusatz, antwort, hinten = [], mehr = {}) => ({
    id, vorne: { text, zusatz }, antwort, hinten: [b("aussprache", { lautschrift: "", text: "", audio: "", sprache: "ja" }), ...hinten], tags: [], ...mehr,
})

const jetzt = "2026-10-15T08:00:00.000Z"
const kopf = (id, titel, beschreibung, gebiet, vorne, hinten) => ({
    format: "grove-saat", version: 2, id, titel, beschreibung, autor: "Grove · Saat (Beispiel)", gebiet,
    sprachen: { vorne, hinten }, tags: ["beispiel"], erstellt: jetzt, geaendert: jetzt,
})

const TABERU = ja("jp-taberu", "食べる", "たべる · taberu", "essen", [
    ...satz("毎日ご飯を食べます。", "Mainichi gohan o tabemasu.", "Ich esse jeden Tag Reis."),
    b("merksatz", { text: "**Tabe**-ru: Am **Tab**lett wird gegessen." }),
    b("tabelle", { titel: "Formen", kopf: true, zeilen: [["Form", "Japanisch", "Bedeutung"], ["Wörterbuch", "食べる", "essen"], ["höflich", "食べます", "esse (höflich)"], ["verneint", "食べない", "nicht essen"], ["Vergangenheit", "食べた", "aß / habe gegessen"], ["te-Form", "食べて", "iss! / und …"]] }),
    b("verweis", { titel: "Passt dazu", karten: ["jp-nomu", "jp-gohan"] }),
], { tags: ["verb", "ru-verb"], verknuepft: [{ id: "jp-nomu", art: "verwandt" }] })

const NOMU = ja("jp-nomu", "飲む", "のむ · nomu", "trinken", [
    ...satz("水を飲みます。", "Mizu o nomimasu.", "Ich trinke Wasser."),
    b("tabelle", { titel: "Formen", kopf: true, zeilen: [["Form", "Japanisch"], ["höflich", "飲みます"], ["verneint", "飲まない"], ["Vergangenheit", "飲んだ"], ["te-Form", "飲んで"]] }),
    b("hinweis", { text: "Mit 飲む „trinkt“ man im Japanischen auch Medizin: 薬を飲む (kusuri o nomu).", verborgen: true }),
], { tags: ["verb", "u-verb"] })

export const BEISPIELE = [
    {
        datei: "japanisch-essen-und-trinken.saat",
        deck: {
            ...kopf("d-bsp-jp-essen", "Japanisch · Essen & Trinken", "Erste Wörter rund ums Essen – mit Beispielsätzen, Formen und Merkhilfen.", "Japanisch", "ja", "de"),
            karten: [
                TABERU, NOMU,
                ja("jp-gohan", "ご飯", "ごはん · gohan", "Reis; Mahlzeit", [
                    b("text", { text: "Wörtlich *gekochter Reis* – steht aber auch ganz allgemein für eine **Mahlzeit**." }),
                    b("beispiele", { titel: "Mahlzeiten", eintraege: [{ text: "朝ご飯 · asagohan", zusatz: "Frühstück" }, { text: "昼ご飯 · hirugohan", zusatz: "Mittagessen" }, { text: "晩ご飯 · bangohan", zusatz: "Abendessen" }] }),
                ], { alternativen: ["Reis", "Mahlzeit"], tags: ["nomen"] }),
                ja("jp-mizu", "水", "みず · mizu", "Wasser", satz("水をください。", "Mizu o kudasai.", "Wasser, bitte."), { tags: ["nomen"] }),
                ja("jp-ocha", "お茶", "おちゃ · ocha", "grüner Tee", [
                    b("text", { text: "お (o) ist eine höfliche Vorsilbe. Ohne weitere Angabe ist meist grüner Tee gemeint." }),
                ], { alternativen: ["Tee"], tags: ["nomen"] }),
                ja("jp-sakana", "魚", "さかな · sakana", "Fisch", [], { tags: ["nomen"] }),
                ja("jp-niku", "肉", "にく · niku", "Fleisch", [], { tags: ["nomen"] }),
                ja("jp-yasai", "野菜", "やさい · yasai", "Gemüse", [], { tags: ["nomen"] }),
                ja("jp-oishii", "おいしい", "oishii", "lecker", satz("このラーメンはおいしいです。", "Kono rāmen wa oishii desu.", "Diese Ramen sind lecker."), { tags: ["adjektiv"], alternativen: ["köstlich"] }),
                ja("jp-itadakimasu", "いただきます", "itadakimasu", "Guten Appetit (vor dem Essen)", [
                    b("hinweis", { text: "Nach dem Essen sagt man ごちそうさまでした (gochisōsama deshita) – „Danke für das Essen“.", verborgen: true }),
                ], { tags: ["ausdruck"], ablenker: ["Danke für das Essen", "Prost!"] }),
            ],
        },
    },
    {
        datei: "japanisch-erste-verben.saat",
        deck: {
            ...kopf("d-bsp-jp-verben", "Japanisch · Erste Verben", "Zehn Alltagsverben. 食べる und 飲む kennst du schon aus „Essen & Trinken“ – dein Lernstand gilt hier mit.", "Japanisch", "ja", "de"),
            karten: [
                { ...TABERU, hinten: [...TABERU.hinten.slice(0, 3), b("lueckentext", { text: "毎日ご飯を{{食べ}}ます。", hinweis: "höfliche Form von „essen“" })] },
                NOMU,
                ja("jp-iku", "行く", "いく · iku", "gehen", satz("学校に行きます。", "Gakkō ni ikimasu.", "Ich gehe zur Schule."), { tags: ["verb", "u-verb"] }),
                ja("jp-kuru", "来る", "くる · kuru", "kommen", [b("hinweis", { text: "Unregelmäßig: 来ます (kimasu), 来ない (konai).", verborgen: true })], { tags: ["verb", "unregelmäßig"] }),
                ja("jp-miru", "見る", "みる · miru", "sehen", satz("映画を見ます。", "Eiga o mimasu.", "Ich sehe einen Film."), { tags: ["verb", "ru-verb"] }),
                ja("jp-kiku", "聞く", "きく · kiku", "hören", [b("text", { text: "Heißt auch **fragen**: 道を聞く – nach dem Weg fragen." })], { alternativen: ["fragen"], tags: ["verb", "u-verb"] }),
                ja("jp-yomu", "読む", "よむ · yomu", "lesen", satz("本を読みます。", "Hon o yomimasu.", "Ich lese ein Buch."), { tags: ["verb", "u-verb"] }),
                ja("jp-kaku", "書く", "かく · kaku", "schreiben", [], { tags: ["verb", "u-verb"] }),
                ja("jp-hanasu", "話す", "はなす · hanasu", "sprechen", satz("日本語を話します。", "Nihongo o hanashimasu.", "Ich spreche Japanisch."), { tags: ["verb", "u-verb"] }),
                ja("jp-suru", "する", "suru", "machen", [b("text", { text: "Das Allzweck-Verb: 勉強する (benkyō suru) = lernen, wörtlich „Lernen machen“." })], { alternativen: ["tun"], tags: ["verb", "unregelmäßig"] }),
            ],
        },
    },
    {
        datei: "wie-saat-lernt.saat",
        deck: {
            ...kopf("d-bsp-lernen", "Wie Saat lernt", "Sechs Begriffe rund ums Lernen – und gleichzeitig eine Vorführung der Inhaltsblöcke.", "Lernen", "de", "de"),
            karten: [
                { id: "lernen-abruf", vorne: { text: "Abrufübung", zusatz: "Retrieval Practice" }, antwort: "Aktiv erinnern statt erneut lesen", tags: ["methode"],
                    ablenker: ["Alles mehrmals durchlesen", "Wichtiges farbig markieren"],
                    hinten: [
                        b("text", { text: "Wer eine Antwort **selbst aus dem Gedächtnis holt**, festigt sie stärker als durch erneutes Lesen. Genau darum deckst du in Saat erst auf, nachdem du nachgedacht hast." }),
                        b("auswahl", { frage: "Was stärkt das Gedächtnis mehr?", optionen: [{ text: "Karte umdrehen, bevor man nachdenkt", richtig: false }, { text: "Erst versuchen, dann aufdecken", richtig: true }], erklaerung: "Der Versuch selbst ist das Training – auch wenn er misslingt." }),
                    ] },
                { id: "lernen-abstand", vorne: { text: "Verteiltes Lernen", zusatz: "Spacing" }, antwort: "Wiederholen mit wachsenden Abständen", tags: ["methode"],
                    hinten: [
                        b("text", { text: "Statt alles an einem Abend zu pauken, wiederholst du kurz bevor du es vergessen würdest. Jede erfolgreiche Wiederholung macht die Erinnerung stabiler – der nächste Abstand wird länger." }),
                        b("tabelle", { titel: "So könnte es aussehen", kopf: true, zeilen: [["Abfrage", "nächster Abstand"], ["1. (gewusst)", "3 Tage"], ["2.", "≈ 10 Tage"], ["3.", "≈ 1 Monat"], ["4.", "≈ 3 Monate"]] }),
                        b("verweis", { titel: "Siehe auch", karten: ["lernen-stabilitaet", "lernen-kurve"] }),
                    ] },
                { id: "lernen-kurve", vorne: { text: "Vergessenskurve" }, antwort: "Erst schnelles, dann langsameres Vergessen", tags: ["begriff"],
                    hinten: [
                        b("geschichte", { titel: "Ebbinghaus und die sinnlosen Silben", text: "1885 lernte Hermann Ebbinghaus Listen sinnloser Silben wie „DAX“ oder „BOK“ und prüfte, wie viel er nach Minuten, Stunden und Tagen noch wusste. Das Ergebnis: Der größte Teil geht in den ersten Stunden verloren, danach flacht die Kurve ab. Wiederholung setzt die Kurve neu an – und flacher." }),
                        b("merksatz", { text: "Vergessen ist steil am Anfang – also früh wiederholen, dann immer seltener." }),
                    ] },
                { id: "lernen-stabilitaet", vorne: { text: "Stabilität", zusatz: "in Saat" }, antwort: "Tage, bis die Erinnerung auf 90 % fällt", tags: ["begriff"],
                    hinten: [
                        b("text", { text: "Saat schätzt für jede Karte, wie wahrscheinlich du sie gerade noch weißt. Die **Stabilität** sagt, nach wie vielen Tagen diese Wahrscheinlichkeit auf 90 % gesunken ist. Dein **Lernprofil** passt das an dein Gedächtnis an." }),
                        b("eintippen", { frage: "Auf wie viel Prozent ist die Ziel-Quote standardmäßig eingestellt? (nur die Zahl)", erwartet: "90" }),
                    ] },
                { id: "lernen-bekannt", vorne: { text: "„Kam mir bekannt vor“" }, antwort: "Nicht gewusst – aber milder bewertet", tags: ["saat"],
                    hinten: [
                        b("text", { text: "Wenn du die Antwort nicht selbst wusstest, sie aber beim Aufdecken wiedererkennst, ist eine Spur da. Die Karte kommt bald wieder dran, verliert aber weniger Stabilität als bei „Nicht gewusst“." }),
                        b("hinweis", { text: "Ehrlich bewerten lohnt sich: Saat lernt aus deinen Bewertungen, wie dein Gedächtnis funktioniert.", verborgen: true }),
                    ] },
                { id: "lernen-mischen", vorne: { text: "Verschachteltes Üben", zusatz: "Interleaving" }, antwort: "Themen abwechselnd statt am Stück üben", tags: ["methode"],
                    hinten: [
                        b("lueckentext", { text: "Beim verschachtelten Üben wechselt man {{abwechselnd}} zwischen Themen – das fühlt sich {{schwerer}} an, wirkt aber länger.", hinweis: "zwei Wörter" }),
                    ] },
            ],
        },
    },
]
