-- ==========================================================
-- Grove · 004_rechte.sql
-- Neuere Supabase-Projekte geben neuen Tabellen nicht mehr
-- automatisch Rechte für eingeloggte Nutzer. Ohne diese Zeilen
-- kommt "permission denied for table ...".
-- Wer welche ZEILE sehen darf, regelt weiter RLS (nur eigene).
-- Mehrfach ausführen schadet nicht.
-- ==========================================================

-- Profile: lesen (ändern nur display_name/avatar_url, siehe 002)
grant select on public.profiles to authenticated;

-- Grove Mail: lesen, löschen (ändern nur ordner/gelesen/markiert, siehe 001)
grant select, delete on public.mails to authenticated;

-- Glocke: lesen, löschen (ändern nur gelesen, siehe 002)
grant select, delete on public.benachrichtigungen to authenticated;

-- Myzel: alles mit den eigenen Notizen und Verknüpfungen
grant select, insert, update, delete on public.notizen        to authenticated;
grant select, insert, update, delete on public.verknuepfungen to authenticated;

-- Der Mail-Worker (service_role) schreibt eingehende Mails
grant all on public.profiles, public.mails, public.benachrichtigungen,
             public.notizen, public.verknuepfungen to service_role;

grant usage on all sequences in schema public to authenticated, service_role;
