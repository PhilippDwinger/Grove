# Grove Mail – Einrichtung

Grove Mail läuft komplett kostenlos:

| Teil | Dienst | Kosten |
|---|---|---|
| Domain `groveme.eu.org` | eu.org | gratis |
| DNS + Mail-Empfang | Cloudflare (Email Routing + Worker) | gratis |
| Speicher (Mails, Anhänge) | Supabase | gratis (500 MB Datenbank, 1 GB Dateien) |
| Mail-Versand | Resend | gratis (100 Mails/Tag) – kommt in Schritt 3 |

```
Mail an paddy@groveme.eu.org
   → Cloudflare Email Routing
   → Worker "grove-mail-empfang"  (mail-worker/)
   → Supabase: Datei "mail/<user>/<id>.eml" + Zeile in Tabelle "mails"
   → Grove Mail zeigt sie sofort an (Realtime)
```

---

## Schritt 1 – Datenbank (jetzt schon möglich)

1. Supabase → **SQL Editor** → **New query**
2. Inhalt von `supabase/migrations/001_grove_mail.sql` einfügen → **Run**
3. Prüfen: **Table Editor → mails** → jede:r hat eine Willkommens-Mail.

Danach im Projekt einmal `npm install` (neue Pakete: `dompurify`, `postal-mime`) und `npm run dev`.
Grove Mail zeigt jetzt dein echtes Postfach.

---

## Schritt 2 – Empfang einschalten (sobald eu.org die Domain angenommen hat)

Cloudflare zeigt `groveme.eu.org` dann als **Active**.

### 2.1 Secret Key aus Supabase holen
Supabase → **Project Settings → API Keys** → **Secret key** (`sb_secret_…`) kopieren.
Der Schlüssel darf **nirgends** ins Repo oder in den Browser – nur in den Worker (nächster Schritt).

### 2.2 Worker hochladen (Terminal in VS Code)
```
cd mail-worker
npm install
npx wrangler login
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler deploy
```
- `wrangler login` öffnet den Browser → mit deinem Cloudflare-Konto bestätigen.
- Bei `secret put` fragt das Terminal nach dem Wert → Secret Key einfügen, Enter.

### 2.3 Email Routing einschalten
Cloudflare → `groveme.eu.org` → **Email** → **Email Routing**
1. **Enable Email Routing** → die vorgeschlagenen DNS-Einträge (MX + TXT) mit **Add records** übernehmen
2. Reiter **Routing rules** → **Catch-all address** → **Edit**
   - Action: **Send to a Worker**
   - Destination: **grove-mail-empfang**
   - **Save** und Catch-all auf **Enabled** stellen

### 2.4 In Grove umschalten
In `src/js/mail/konfig.js`: `DOMAIN_AKTIV = true` – dann verschwindet der Hinweis-Balken.

### 2.5 Testen
Von einer anderen Adresse eine Mail an `<dein-username>@groveme.eu.org` schicken.
Sie erscheint nach wenigen Sekunden in Grove Mail – ohne Neuladen.

Live zuschauen, was der Worker macht: `cd mail-worker` → `npx wrangler tail`

---

## Häufige Probleme

| Problem | Ursache |
|---|---|
| Absender bekommt „Diese Adresse gibt es nicht“ | Username existiert nicht (Groß/Klein egal) |
| Worker-Log: `401` / `Invalid API key` | Secret Key falsch gesetzt → `npx wrangler secret put SUPABASE_SECRET_KEY` wiederholen. Klappt es mit dem neuen `sb_secret_…`-Key nicht, den alten **service_role**-Key (Legacy API Keys) nehmen – der Worker kann beide. |
| Worker-Log: `relation "mails" does not exist` | Schritt 1 (SQL) fehlt |
| Mail kommt nicht an, Worker-Log leer | Catch-all-Regel nicht aktiv oder MX-Einträge fehlen |

---

## Dateien

- `supabase/migrations/001_grove_mail.sql` – Tabelle `mails`, Sicherheitsregeln, Speicher, Willkommens-Mail
- `mail-worker/` – Cloudflare Worker für den Empfang
- `src/js/mail/` – `konfig.js` (Domain), `daten.js` (Supabase), `darstellung.js` (sichere Anzeige)
- `src/js/seiten/mail.js` – die Seite
- `src/dienste/mail/index.html`, `src/css/dienste/mail.css`
