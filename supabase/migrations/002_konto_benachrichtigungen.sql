-- ==========================================================
-- Grove · Konto + Benachrichtigungen
-- Einmal komplett im Supabase SQL Editor ausführen. Kann mehrfach laufen.
-- ==========================================================

-- ---------- 1) Profile absichern ----------
-- Vorher durfte jede:r das eigene Profil KOMPLETT ändern – also auch den Username
-- oder "darf_senden". Jetzt nur noch Anzeigename und Avatar.
alter table public.profiles add column if not exists avatar_url text;

revoke update on public.profiles from authenticated, anon;
grant  update (display_name, avatar_url) on public.profiles to authenticated;


-- ---------- 2) Avatare (öffentlich lesbar, nur eigener Ordner beschreibbar) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatare', 'avatare', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

drop policy if exists "Avatar hochladen"  on storage.objects;
drop policy if exists "Avatar ersetzen"   on storage.objects;
drop policy if exists "Avatar löschen"    on storage.objects;
create policy "Avatar hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatare' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatar ersetzen" on storage.objects for update to authenticated
  using (bucket_id = 'avatare' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Avatar löschen" on storage.objects for delete to authenticated
  using (bucket_id = 'avatare' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------- 3) Konto löschen (löscht Profil, Mails, Benachrichtigungen mit) ----------
create or replace function public.grove_konto_loeschen()
returns void language plpgsql security definer set search_path = '' as $body$
begin
  if (select auth.uid()) is null then
    raise exception 'Nicht eingeloggt';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$body$;
revoke execute on function public.grove_konto_loeschen() from public, anon;
grant  execute on function public.grove_konto_loeschen() to authenticated;


-- ---------- 4) Benachrichtigungen ----------
create table if not exists public.benachrichtigungen (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  dienst       text not null default 'grove',   -- grove | mail | bridge | …
  titel        text not null,
  text         text not null default '',
  link         text,                            -- wohin ein Klick führt, z. B. /dienste/mail/#eingang
  gelesen      boolean not null default false,
  erstellt_am  timestamptz not null default now()
);
create index if not exists benachrichtigungen_nutzer on public.benachrichtigungen (user_id, erstellt_am desc);

alter table public.benachrichtigungen enable row level security;
drop policy if exists "Eigene Benachrichtigungen lesen"   on public.benachrichtigungen;
drop policy if exists "Eigene Benachrichtigungen ändern"  on public.benachrichtigungen;
drop policy if exists "Eigene Benachrichtigungen löschen" on public.benachrichtigungen;
create policy "Eigene Benachrichtigungen lesen"   on public.benachrichtigungen for select using ((select auth.uid()) = user_id);
create policy "Eigene Benachrichtigungen ändern"  on public.benachrichtigungen for update using ((select auth.uid()) = user_id)
                                                                                     with check ((select auth.uid()) = user_id);
create policy "Eigene Benachrichtigungen löschen" on public.benachrichtigungen for delete using ((select auth.uid()) = user_id);
revoke update on public.benachrichtigungen from authenticated, anon;
grant  update (gelesen) on public.benachrichtigungen to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.benachrichtigungen;
exception when duplicate_object then null; end $$;


-- ---------- 5) Neue Mail im Eingang → Benachrichtigung ----------
create or replace function public.grove_mail_benachrichtigen()
returns trigger language plpgsql security definer set search_path = '' as $body$
begin
  if new.ordner = 'eingang' then
    insert into public.benachrichtigungen (user_id, dienst, titel, text, link)
    values (new.user_id, 'mail',
            'Neue Mail von ' || coalesce(nullif(new.von_name, ''), new.von_adresse),
            coalesce(nullif(new.betreff, ''), '(kein Betreff)'),
            '/dienste/mail/#eingang');
  end if;
  return new;
end;
$body$;
revoke execute on function public.grove_mail_benachrichtigen() from public, anon, authenticated;

drop trigger if exists grove_mail_benachrichtigen on public.mails;
create trigger grove_mail_benachrichtigen
  after insert on public.mails
  for each row execute procedure public.grove_mail_benachrichtigen();


-- ---------- 6) Begrüßung für alle (einmal) ----------
insert into public.benachrichtigungen (user_id, dienst, titel, text, link)
select p.id, 'grove', 'Willkommen auf der Lichtung', 'Hier erscheint alles, was in Grove passiert – neue Mails, Meldungen von Bridge und mehr.', '/'
from public.profiles p
where not exists (select 1 from public.benachrichtigungen b where b.user_id = p.id);
