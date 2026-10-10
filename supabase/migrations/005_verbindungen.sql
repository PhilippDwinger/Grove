-- Grove: Verbindungen zwischen Objekten aller Dienste
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und "Run" drücken.
--
-- Jede Zeile verbindet zwei Dinge, egal aus welchem Dienst:
--   von_typ/von_id  ->  nach_typ/nach_id
-- typ ist der Dienst-Kürzel (z. B. 'myzel', 'echo', 'rinde', später 'bridge-geraet'),
-- id ist die ID des Objekts in seiner eigenen Tabelle (als Text gespeichert).
-- Verbindungen sind ungerichtet: A–B ist dasselbe wie B–A.

create table if not exists public.verbindungen (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  von_typ      text not null,
  von_id       text not null,
  nach_typ     text not null,
  nach_id      text not null,
  notiz        text,
  erstellt_am  timestamptz not null default now(),
  constraint verbindung_nicht_mit_sich_selbst
    check (not (von_typ = nach_typ and von_id = nach_id))
);

-- Dasselbe Paar darf pro Nutzer nur einmal existieren, egal in welcher Richtung.
create unique index if not exists verbindungen_paar_eindeutig
  on public.verbindungen (
    user_id,
    least(von_typ || ':' || von_id, nach_typ || ':' || nach_id),
    greatest(von_typ || ':' || von_id, nach_typ || ':' || nach_id)
  );

create index if not exists verbindungen_von  on public.verbindungen (user_id, von_typ, von_id);
create index if not exists verbindungen_nach on public.verbindungen (user_id, nach_typ, nach_id);

-- Row Level Security: jeder sieht und ändert nur seine eigenen Verbindungen.
alter table public.verbindungen enable row level security;

drop policy if exists "verbindungen lesen"   on public.verbindungen;
drop policy if exists "verbindungen anlegen" on public.verbindungen;
drop policy if exists "verbindungen aendern" on public.verbindungen;
drop policy if exists "verbindungen loeschen" on public.verbindungen;

create policy "verbindungen lesen" on public.verbindungen
  for select using (user_id = (select auth.uid()));
create policy "verbindungen anlegen" on public.verbindungen
  for insert with check (user_id = (select auth.uid()));
create policy "verbindungen aendern" on public.verbindungen
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "verbindungen loeschen" on public.verbindungen
  for delete using (user_id = (select auth.uid()));

-- Rechte für eingeloggte Nutzer (siehe 004_rechte.sql) – ohne das: "permission denied".
grant select, insert, update, delete on public.verbindungen to authenticated;
grant all on public.verbindungen to service_role;
