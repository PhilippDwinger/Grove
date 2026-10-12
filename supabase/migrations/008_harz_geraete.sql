-- Grove: Geräte + Harz (Dateien)
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" drücken.
--
-- WICHTIG: Hier landet NIE der Inhalt einer Datei.
-- Die Dateien selbst bleiben auf dem Gerät, auf dem sie hochgeladen wurden
-- (im Browser-Speicher oder in einem Ordner). Supabase kennt nur den Steckbrief:
-- Name, Größe, Typ und auf welchem Gerät sie liegt – damit Suche (Strg+K)
-- und "Verbunden mit" auf allen Geräten funktionieren.

-- ---------- Geräte ----------
-- Jedes Gerät (Browser/App), auf dem du Grove nutzt, bekommt eine zufällige Kennung.
-- Harz zeigt damit "liegt auf deinem Laptop"; Bridge kann dieselbe Liste später nutzen.
create table if not exists public.geraete (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id               text not null,                 -- zufällige Kennung (im Browser gespeichert)
  name             text not null,                 -- z. B. "Laptop", frei änderbar
  art              text,                          -- z. B. "Windows-PC", "Android-Handy"
  erstellt_am      timestamptz not null default now(),
  zuletzt_gesehen  timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- Harz: Steckbriefe der Dateien ----------
create table if not exists public.harz_dateien (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,                    -- Anzeigename
  pfad          text not null,                    -- Name im lokalen Speicher des Geräts
  groesse       bigint not null default 0,        -- Bytes
  typ           text,                             -- MIME-Typ, z. B. image/png
  speicher      text not null default 'browser',  -- 'browser' | 'ordner' (später mehr)
  geraet_id     text not null,                    -- auf welchem Gerät die Datei liegt
  erstellt_am   timestamptz not null default now(),
  geaendert_am  timestamptz not null default now(),
  unique (user_id, geraet_id, speicher, pfad)
);

create index if not exists harz_dateien_user on public.harz_dateien (user_id, geaendert_am desc);

alter table public.geraete      enable row level security;
alter table public.harz_dateien enable row level security;

drop policy if exists "geraete eigen" on public.geraete;
drop policy if exists "harz eigen"    on public.harz_dateien;

create policy "geraete eigen" on public.geraete
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "harz eigen" on public.harz_dateien
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Wird eine Datei gelöscht: ihre Verbindungen ("Verbunden mit") gleich mit aufräumen.
create or replace function public.harz_verbindungen_aufraeumen() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.verbindungen
   where (von_typ = 'harz' and von_id = old.id::text)
      or (nach_typ = 'harz' and nach_id = old.id::text);
  return old;
end $$;

drop trigger if exists harz_verbindungen_aufraeumen on public.harz_dateien;
create trigger harz_verbindungen_aufraeumen after delete on public.harz_dateien
  for each row execute function public.harz_verbindungen_aufraeumen();

-- Rechte für eingeloggte Nutzer (siehe 004_rechte.sql) – ohne das: "permission denied".
grant select, insert, update, delete on public.geraete      to authenticated;
grant select, insert, update, delete on public.harz_dateien to authenticated;
grant all on public.geraete, public.harz_dateien to service_role;
