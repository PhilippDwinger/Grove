-- ==========================================================
-- Grove Mail · Datenbank
-- Einmal komplett im Supabase SQL Editor ausführen (New query → einfügen → Run).
-- Kann gefahrlos mehrfach ausgeführt werden.
-- ==========================================================

-- ---------- 1) Profile: Usernamen eindeutig (ohne Groß/Klein) + Sende-Freischaltung ----------
alter table public.profiles add column if not exists darf_senden boolean not null default false;
create unique index if not exists profiles_username_lower on public.profiles (lower(username));


-- ---------- 2) Tabelle für alle Mails ----------
create table if not exists public.mails (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,  -- wem das Postfach gehört
  ordner       text not null default 'eingang'
               check (ordner in ('eingang', 'gesendet', 'entwuerfe', 'archiv', 'papierkorb')),
  von_name     text,
  von_adresse  text not null,
  an           text[] not null default '{}',
  cc           text[] not null default '{}',
  betreff      text not null default '',
  vorschau     text not null default '',      -- die ersten ~160 Zeichen für die Liste
  text         text,                          -- Klartext-Version
  html         text,                          -- HTML-Version (wird im Browser gereinigt)
  roh_pfad     text,                          -- Original-Mail (.eml) im Storage
  anhaenge     jsonb not null default '[]',   -- [{ name, typ, groesse }]
  message_id   text,
  in_reply_to  text,
  gelesen      boolean not null default false,
  markiert     boolean not null default false,
  datum        timestamptz not null default now(),
  erstellt_am  timestamptz not null default now()
);
create index if not exists mails_postfach on public.mails (user_id, ordner, datum desc);


-- ---------- 3) Sicherheit (RLS): jeder sieht nur sein eigenes Postfach ----------
alter table public.mails enable row level security;

drop policy if exists "Eigene Mails lesen"   on public.mails;
drop policy if exists "Eigene Mails ändern"  on public.mails;
drop policy if exists "Eigene Mails löschen" on public.mails;

create policy "Eigene Mails lesen"   on public.mails for select using ((select auth.uid()) = user_id);
create policy "Eigene Mails ändern"  on public.mails for update using ((select auth.uid()) = user_id)
                                                             with check ((select auth.uid()) = user_id);
create policy "Eigene Mails löschen" on public.mails for delete using ((select auth.uid()) = user_id);
-- Einfügen darf nur der Server (Empfangs-Worker / Sende-Funktion mit Secret Key).

-- Der Browser darf nur Ordner, Gelesen und Markiert ändern – nicht Absender, Text usw.
revoke update on public.mails from authenticated;
grant  update (ordner, gelesen, markiert) on public.mails to authenticated;


-- ---------- 4) Live-Updates: neue Mails erscheinen sofort ----------
do $$ begin
  alter publication supabase_realtime add table public.mails;
exception when duplicate_object then null; end $$;


-- ---------- 5) Speicher für Original-Mails und Anhänge ----------
insert into storage.buckets (id, name, public) values ('mail', 'mail', false)
on conflict (id) do nothing;

drop policy if exists "Eigene Mail-Dateien lesen" on storage.objects;
create policy "Eigene Mail-Dateien lesen" on storage.objects for select
  using (bucket_id = 'mail' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------- 6) Adresse → Nutzer finden (nur für den Server) ----------
create or replace function public.grove_mail_finde_nutzer(name text)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles where lower(username) = lower(name) limit 1;
$$;
revoke execute on function public.grove_mail_finde_nutzer(text) from public, anon, authenticated;
grant  execute on function public.grove_mail_finde_nutzer(text) to service_role;


-- ---------- 7) Willkommens-Mail für jedes Postfach ----------
create or replace function public.grove_mail_willkommen(uid uuid)
returns void language plpgsql security definer set search_path = '' as $body$
declare
  adresse text;
begin
  select coalesce(lower(username), 'du') || '@groveme.eu.org' into adresse from public.profiles where id = uid;
  insert into public.mails (user_id, von_name, von_adresse, an, betreff, vorschau, text)
  values (
    uid, 'Grove', 'hallo@groveme.eu.org', array[adresse],
    'Willkommen bei Grove Mail',
    'Schön, dass du da bist. Deine Adresse lautet ' || adresse || ' …',
    'Hallo!' || E'\n\n' ||
    'Willkommen bei Grove Mail – deinem Postfach in Grove.' || E'\n\n' ||
    'Deine Adresse lautet ' || adresse || '. Sobald die Domain freigeschaltet ist, kommen hier echte Mails an. '
      || 'Neue Nachrichten erscheinen sofort, ohne dass du neu laden musst.' || E'\n\n' ||
    'Links findest du deine Ordner, in der Mitte die Nachrichten, rechts liest du sie. '
      || 'Archivieren, löschen und als ungelesen markieren klappt schon – Schreiben kommt als Nächstes.' || E'\n\n' ||
    'Bis gleich auf der Lichtung,' || E'\n' || 'Grove'
  );
end;
$body$;
revoke execute on function public.grove_mail_willkommen(uuid) from public, anon, authenticated;

-- für alle, die schon ein Konto haben (nur einmal)
select public.grove_mail_willkommen(p.id)
from public.profiles p
where not exists (select 1 from public.mails m where m.user_id = p.id);

-- für alle neuen Konten automatisch
create or replace function public.grove_mail_neues_profil()
returns trigger language plpgsql security definer set search_path = '' as $body$
begin
  perform public.grove_mail_willkommen(new.id);
  return new;
end;
$body$;

drop trigger if exists grove_mail_willkommen on public.profiles;
create trigger grove_mail_willkommen
  after insert on public.profiles
  for each row execute procedure public.grove_mail_neues_profil();
