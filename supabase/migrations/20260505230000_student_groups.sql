-- MasterRank: учебные группы (напр. БД.09.25.1) и привязка учеников.
-- Публичное чтение групп; изменения только через teacher (is_teacher).

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  constraint student_groups_name_unique unique (name)
);

comment on table public.student_groups is 'Учебные группы; имя уникально для удобства выбора на панели учителя';

alter table public.students
  add column if not exists group_id uuid references public.student_groups (id) on delete set null;

create index if not exists idx_students_group_id on public.students (group_id);

-- RLS
alter table public.student_groups enable row level security;

drop policy if exists "student_groups_select_public" on public.student_groups;
drop policy if exists "student_groups_insert_teacher" on public.student_groups;
drop policy if exists "student_groups_update_teacher" on public.student_groups;
drop policy if exists "student_groups_delete_teacher" on public.student_groups;

create policy "student_groups_select_public"
  on public.student_groups
  for select
  to public
  using (true);

create policy "student_groups_insert_teacher"
  on public.student_groups
  for insert
  to authenticated
  with check (public.is_teacher());

create policy "student_groups_update_teacher"
  on public.student_groups
  for update
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "student_groups_delete_teacher"
  on public.student_groups
  for delete
  to authenticated
  using (public.is_teacher());

-- Realtime (опционально — для мгновенного обновления списка групп на /admin)
do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'student_groups'
    ) then
      execute 'alter publication supabase_realtime add table public.student_groups';
    end if;
  end if;
end;
$migration$;
