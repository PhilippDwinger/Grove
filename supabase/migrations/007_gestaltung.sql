-- ==========================================================
-- Grove · Laub (Gestaltung)
-- Speichert pro Person, wie Grove aussieht: Farben, Schriften,
-- Zeichen, Bilder, Animationen – und die eigenen Presets.
-- Einmal im Supabase SQL Editor ausführen. Kann mehrfach laufen.
--
-- Ohne diese Tabelle funktioniert Laub trotzdem – dann wird nur
-- im Browser gespeichert (nicht auf anderen Geräten).
-- ==========================================================

create table if not exists public.gestaltung (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  einstellungen jsonb not null default '{}'::jsonb,   -- nur die Änderungen gegenüber dem Standard
  presets       jsonb not null default '[]'::jsonb,   -- eigene Presets
  geaendert_am  timestamptz not null default now()
);

alter table public.gestaltung enable row level security;

drop policy if exists "Eigene Gestaltung" on public.gestaltung;
create policy "Eigene Gestaltung" on public.gestaltung for all
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
