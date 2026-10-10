-- Grove: Rinde (Passwörter)
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" drücken.
--
-- Wichtig: In dieser Datenbank landet NIE ein Passwort im Klartext.
-- Der Browser verschlüsselt jeden Eintrag mit einem Schlüssel aus deinem
-- Master-Passwort (AES-256-GCM), bevor er hochgeladen wird.
-- Supabase sieht nur unlesbaren Text.

-- Pro Nutzer eine Zeile: Salz und Prüfwert für das Master-Passwort.
-- Das Master-Passwort selbst wird nirgends gespeichert.
create table if not exists public.rinde_schluessel (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  salz         text not null,   -- Base64, zufällig
  iterationen  integer not null, -- PBKDF2-Runden
  pruefwert    text not null,   -- verschlüsselter Testwert: lässt sich nur mit dem richtigen Master-Passwort öffnen
  erstellt_am  timestamptz not null default now()
);

-- Die Einträge: alles (Name, Adresse, Benutzer, Passwort, Notiz) steckt verschlüsselt in "daten".
create table if not exists public.rinde_eintraege (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  daten        text not null,   -- Base64: 12 Byte IV + AES-GCM-Geheimtext
  erstellt_am  timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);

create index if not exists rinde_eintraege_user on public.rinde_eintraege (user_id);

alter table public.rinde_schluessel enable row level security;
alter table public.rinde_eintraege  enable row level security;

drop policy if exists "rinde schluessel eigen" on public.rinde_schluessel;
drop policy if exists "rinde eintraege eigen"  on public.rinde_eintraege;

create policy "rinde schluessel eigen" on public.rinde_schluessel
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "rinde eintraege eigen" on public.rinde_eintraege
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Rechte für eingeloggte Nutzer (siehe 004_rechte.sql) – ohne das: "permission denied".
grant select, insert, update, delete on public.rinde_schluessel to authenticated;
grant select, insert, update, delete on public.rinde_eintraege  to authenticated;
grant all on public.rinde_schluessel, public.rinde_eintraege to service_role;
