-- Включить Realtime для таблиц лидерборда (FULL_SITE_ROADMAP.md п. 7, RPD п. 4.1).
-- После применения в Dashboard видно включение таблиц; без publication событий не будет.
--
-- На managed Supabase публикация `supabase_realtime` уже есть. Если проекта свой Postgres —
-- блок можно пропустить или создать публикацию вручную.

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'students'
    ) then
      execute 'alter publication supabase_realtime add table public.students';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'student_badges'
    ) then
      execute 'alter publication supabase_realtime add table public.student_badges';
    end if;
  end if;
end;
$migration$;
