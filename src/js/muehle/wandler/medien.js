// ==========================================================
// Mühle · Audio & Video (über ffmpeg.wasm – ffmpeg, das im Browser läuft)
// Das Werkzeug ist groß (~31 MB) und lädt nur beim ersten Mal; danach
// liegt es im Zwischenspeicher der App. Video umwandeln braucht Geduld –
// alles passiert auf deinem Gerät, nichts geht ins Netz.
// ==========================================================
import { istTyp, stamm, endung } from "../hilfen.js"

const VIDEO = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".3gp", ".wmv", ".flv", ".mpg", ".mpeg"]
const AUDIO = [".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac", ".flac", ".opus", ".wma", ".aiff", ".aif"]
const istVideo = (d) => istTyp(d, "video/", VIDEO)

let ffmpeg = null
async function werkzeug(fortschritt) {
    if (ffmpeg) return ffmpeg
    fortschritt?.(0, "Lade das Video-Werkzeug (beim ersten Mal ca. 31 MB) …")
    const { FFmpeg } = await import("@ffmpeg/ffmpeg")
    const { default: coreURL } = await import("@ffmpeg/core?url")
    const { default: wasmURL } = await import("@ffmpeg/core/wasm?url")
    const f = new FFmpeg()
    await f.load({ coreURL, wasmURL })
    ffmpeg = f
    return f
}

const ZEIT = [
    { id: "start", name: "Ab Sekunde", art: "zahl", standard: 0, min: 0, max: 36000, schritt: 0.5, einheit: "s", hilfe: "0 = von Anfang an" },
    { id: "ende", name: "Bis Sekunde", art: "zahl", standard: 0, min: 0, max: 36000, schritt: 0.5, einheit: "s", hilfe: "0 = bis zum Schluss" },
]
const BITRATE = { id: "bitrate", name: "Qualität", art: "wahl", standard: "192", werte: [["320", "sehr gut (320 kbit/s)"], ["192", "gut (192 kbit/s)"], ["128", "normal (128 kbit/s)"], ["96", "klein (96 kbit/s)"]] }
const MONO = { id: "mono", name: "Mono (ein Kanal)", art: "schalter", standard: false }
const AUFLOESUNG = { id: "hoehe", name: "Auflösung", art: "wahl", standard: "0", werte: [["0", "wie das Original"], ["1080", "1080p"], ["720", "720p"], ["480", "480p"], ["360", "360p"]] }
const QUALI = { id: "quali", name: "Qualität", art: "wahl", standard: "mittel", werte: [["hoch", "hoch (große Datei)"], ["mittel", "mittel"], ["klein", "klein (kleine Datei)"]] }
const TON = { id: "ton", name: "Ton behalten", art: "schalter", standard: true }

const AUDIO_ZIELE = [
    { id: "mp3", name: "MP3", endung: ".mp3", text: "Musik, läuft überall", optionen: [BITRATE, MONO, ...ZEIT] },
    { id: "m4a", name: "M4A (AAC)", endung: ".m4a", text: "klein & gut, Apple-freundlich", optionen: [BITRATE, MONO, ...ZEIT] },
    { id: "ogg", name: "OGG", endung: ".ogg", text: "offenes Format", optionen: [MONO, ...ZEIT] },
    { id: "wav", name: "WAV", endung: ".wav", text: "unkomprimiert, sehr groß", optionen: [MONO, ...ZEIT] },
    { id: "flac", name: "FLAC", endung: ".flac", text: "verlustfrei, kleiner als WAV", optionen: [MONO, ...ZEIT] },
]

export default {
    id: "medien",
    name: "Audio & Video",
    passt: (d) => istVideo(d) || istTyp(d, "audio/", AUDIO),
    async analysieren(datei) { return { video: istVideo(datei) } },
    ziele: (info) => info?.video ? [
        { id: "mp4", name: "MP4", endung: ".mp4", text: "Video, läuft überall", optionen: [AUFLOESUNG, QUALI, TON, ...ZEIT] },
        { id: "webm", name: "WebM", endung: ".webm", text: "Video fürs Web", optionen: [AUFLOESUNG, QUALI, TON, ...ZEIT] },
        { id: "gif", name: "GIF", endung: ".gif", text: "kurze Animation ohne Ton", optionen: [
            { id: "breite", name: "Breite", art: "wahl", standard: "480", werte: [["320", "320 px"], ["480", "480 px"], ["640", "640 px"]] },
            { id: "fps", name: "Bilder pro Sekunde", art: "wahl", standard: "12", werte: [["8", "8"], ["12", "12"], ["20", "20"]] }, ...ZEIT] },
        ...AUDIO_ZIELE.map((z) => ({ ...z, name: `${z.name} (nur Ton)` })),
    ] : AUDIO_ZIELE,

    async umwandeln(datei, ziel, o, { fortschritt }) {
        const f = await werkzeug(fortschritt)
        const ein = "eingang" + (endung(datei.name) || ".bin")
        const aus = "ausgang" + ziel.endung
        fortschritt?.(0.02, "Lese Datei …")
        await f.writeFile(ein, new Uint8Array(await datei.arrayBuffer()))

        const zeit = []
        if (+o.start > 0) zeit.push("-ss", String(o.start))
        const dauer = +o.ende > 0 ? +o.ende - (+o.start || 0) : 0
        const nach = dauer > 0 ? ["-t", String(dauer)] : []
        const kbit = `${o.bitrate || 192}k`
        const mono = o.mono ? ["-ac", "1"] : []
        const skal = +o.hoehe ? ["-vf", `scale=-2:${o.hoehe}`] : []
        const crf = { hoch: 20, mittel: 26, klein: 32 }[o.quali] || 26

        const befehle = {
            mp4: ["-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf), "-pix_fmt", "yuv420p", ...skal,
                ...(o.ton ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]), "-movflags", "+faststart"],
            webm: ["-c:v", "libvpx", "-crf", String(Math.min(63, crf - 6)), "-b:v", "2M", "-deadline", "realtime", "-cpu-used", "8", ...skal,
                ...(o.ton ? ["-c:a", "libvorbis", "-q:a", "4"] : ["-an"])],
            gif: ["-vf", `fps=${o.fps || 12},scale=${o.breite || 480}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer`, "-loop", "0", "-an"],
            mp3: ["-vn", "-c:a", "libmp3lame", "-b:a", kbit, ...mono],
            m4a: ["-vn", "-c:a", "aac", "-b:a", kbit, ...mono],
            ogg: ["-vn", "-c:a", "libvorbis", "-q:a", "5", ...mono],
            wav: ["-vn", "-c:a", "pcm_s16le", ...mono],
            flac: ["-vn", "-c:a", "flac", ...mono],
        }

        const melder = ({ progress }) => fortschritt?.(Math.max(0.03, Math.min(0.99, progress)), "Wandle um …")
        let letzteZeilen = []
        const protokoll = ({ message }) => { letzteZeilen = [...letzteZeilen.slice(-6), message] }
        f.on("progress", melder)
        f.on("log", protokoll)
        try {
            const code = await f.exec([...zeit, "-i", ein, ...nach, ...befehle[ziel.id], "-y", aus])
            if (code !== 0) throw new Error("ffmpeg konnte die Datei nicht umwandeln. " + (letzteZeilen.filter((z) => /error|invalid|unknown/i.test(z)).pop() || ""))
            const daten = await f.readFile(aus)
            const mime = { mp4: "video/mp4", webm: "video/webm", gif: "image/gif", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", wav: "audio/wav", flac: "audio/flac" }[ziel.id]
            return [{ name: stamm(datei.name) + ziel.endung, blob: new Blob([daten], { type: mime }) }]
        } finally {
            f.off("progress", melder)
            f.off("log", protokoll)
            await f.deleteFile(ein).catch(() => {})
            await f.deleteFile(aus).catch(() => {})
        }
    },
}
