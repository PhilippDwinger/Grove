-- ==========================================================
-- Grove · Myzel (verknüpfte Notizen) + Grove-weite Verknüpfungen
-- Einmal komplett im Supabase SQL Editor ausführen. Kann mehrfach laufen.
-- ==========================================================

-- ---------- 1) Notizen ----------
-- Hilfsfunktion: Tags als Text für die Suche (muss "immutable" sein, sonst lehnt Postgres die Suchspalte ab)
create or replace function public.grove_tags_text(tags text[]) returns text
language sql immutable parallel safe as $$ select coalesce(array_to_string(tags, ' '), '') $$;

create table if not exists public.notizen (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  titel        text not null default '',
  inhalt       text not null default '',        -- Markdown, [[Titel]] verknüpft andere Notizen
  tags         text[] not null default '{}',
  archiviert   boolean not null default false,
  erstellt_am  timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  -- Volltextsuche (deutsch: findet "Bäume" auch bei "Baum")
  suche        tsvector generated always as (
                 setweight(to_tsvector('german', coalesce(titel, '')), 'A') ||
                 setweight(to_tsvector('german', coalesce(inhalt, '')), 'B') ||
                 setweight(to_tsvector('simple', public.grove_tags_text(tags)), 'A')
               ) stored
);
create index if not exists notizen_nutzer on public.notizen (user_id, geaendert_am desc);
create index if not exists notizen_suche  on public.notizen using gin (suche);
-- Titel pro Person eindeutig (sonst wüsste [[Titel]] nicht, welche Notiz gemeint ist)
create unique index if not exists notizen_titel_eindeutig on public.notizen (user_id, lower(titel)) where titel <> '';

create or replace function public.grove_geaendert_am() returns trigger language plpgsql as $$
begin new.geaendert_am = now(); return new; end; $$;
drop trigger if exists notizen_geaendert_am on public.notizen;
create trigger notizen_geaendert_am before update on public.notizen
  for each row execute procedure public.grove_geaendert_am();

alter table public.notizen enable row level security;
drop policy if exists "Eigene Notizen" on public.notizen;
create policy "Eigene Notizen" on public.notizen for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);


-- ---------- 2) Verknüpfungen – für ALLE Dienste ----------
-- Eine Zeile = "dieses Ding zeigt auf jenes Ding".
-- Heute: Notiz → Notiz. Später z. B. Mail → Notiz, Bridge-Aufgabe → Notiz.
create table if not exists public.verknuepfungen (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  von_dienst  text not null,      -- 'myzel', 'mail', 'bridge', …
  von_id      uuid not null,
  nach_dienst text not null,
  nach_id     uuid not null,
  art         text not null default 'link',
  erstellt_am timestamptz not null default now(),
  unique (user_id, von_dienst, von_id, nach_dienst, nach_id, art)
);
create index if not exists verknuepfungen_von  on public.verknuepfungen (user_id, von_dienst, von_id);
create index if not exists verknuepfungen_nach on public.verknuepfungen (user_id, nach_dienst, nach_id);

alter table public.verknuepfungen enable row level security;
drop policy if exists "Eigene Verknüpfungen" on public.verknuepfungen;
create policy "Eigene Verknüpfungen" on public.verknuepfungen for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Wird etwas gelöscht, verschwinden auch seine Verknüpfungen
create or replace function public.grove_verknuepfungen_aufraeumen() returns trigger
language plpgsql security definer set search_path = '' as $body$
begin
  delete from public.verknuepfungen
  where (von_dienst = tg_argv[0] and von_id = old.id)
     or (nach_dienst = tg_argv[0] and nach_id = old.id);
  return old;
end;
$body$;
revoke execute on function public.grove_verknuepfungen_aufraeumen() from public, anon, authenticated;

drop trigger if exists notizen_verknuepfungen_weg on public.notizen;
create trigger notizen_verknuepfungen_weg after delete on public.notizen
  for each row execute procedure public.grove_verknuepfungen_aufraeumen('myzel');

drop trigger if exists mails_verknuepfungen_weg on public.mails;
create trigger mails_verknuepfungen_weg after delete on public.mails
  for each row execute procedure public.grove_verknuepfungen_aufraeumen('mail');


-- ---------- 3) Live-Sync zwischen Geräten ----------
do $$ begin
  alter publication supabase_realtime add table public.notizen;
exception when duplicate_object then null; end $$;


-- ---------- 4) Erste Notiz für alle (einmal) ----------
insert into public.notizen (user_id, titel, inhalt, tags)
select p.id, 'Willkommen im Myzel',
  'Das **Myzel** ist das Geflecht unter dem Waldboden, das alle Bäume verbindet.' || E'\n\n' ||
  'Genauso verbindest du hier deine Gedanken: Schreib zwei eckige Klammern, z. B. [[Erste Idee]], ' ||
  'und es entsteht eine Verknüpfung. Gibt es die Notiz noch nicht, ist der Link gestrichelt – ein Klick legt sie an.' || E'\n\n' ||
  '- Rechts siehst du, welche Notizen hierher zeigen (**Rückverweise**)' || E'\n' ||
  '- Oben kannst du ins **Netz** wechseln und siehst alle Verbindungen auf einen Blick' || E'\n' ||
  '- Tags helfen beim Sortieren, die Suche findet alles',
  array['grove']
from public.profiles p
where not exists (select 1 from public.notizen n where n.user_id = p.id);
