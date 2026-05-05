-- MasterRank: Row Level Security (FULL_SITE_ROADMAP.md пункт 4, RPD п. 7)
-- Публичное чтение students / badges / student_badges; INSERT/UPDATE/DELETE только учитель.
--
-- ВАЖНО (Supabase Dashboard, вручную):
-- 1) Authentication → Providers → Email: отключить "Sign ups" (Enable email signups = OFF).
-- 2) Authentication → Users → Add user — создать учителя (email + password).
-- 3) Скопировать UUID пользователя и выполнить в SQL Editor:
--
--    insert into public.app_teacher (id, user_id)
--    values (1, '<UUID-УЧИТЕЛЯ>'::uuid)
--    on conflict (id) do update set user_id = excluded.user_id;
--
-- Без строки в app_teacher функция is_teacher() всегда false — записи с клиента будут запрещены.

-- ---------------------------------------------------------------------------
-- Кто считается учителем: один UUID, хранится в служебной таблице (не в коде репозитория).
-- Прямой SELECT/INSERT в app_teacher с клиента заблокирован (RLS без политик для anon/auth).
-- ---------------------------------------------------------------------------

create table if not exists public.app_teacher (
  id smallint primary key default 1 check (id = 1),
  user_id uuid not null unique
);

comment on table public.app_teacher is
  'Singleton: user_id учителя из auth.users. Заполнение только через SQL Editor / service role.';

alter table public.app_teacher enable row level security;

-- Проверка «текущий пользователь = учитель» (SECURITY DEFINER читает app_teacher от имени владельца).
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select t.user_id = auth.uid()
      from public.app_teacher t
      where t.id = 1
      limit 1
    ),
    false
  );
$$;

comment on function public.is_teacher() is
  'true если auth.uid() совпадает с app_teacher.user_id; используется в RLS.';

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------

alter table public.students enable row level security;

drop policy if exists "students_select_public" on public.students;
drop policy if exists "students_insert_teacher" on public.students;
drop policy if exists "students_update_teacher" on public.students;
drop policy if exists "students_delete_teacher" on public.students;

create policy "students_select_public"
  on public.students
  for select
  to public
  using (true);

create policy "students_insert_teacher"
  on public.students
  for insert
  to authenticated
  with check (public.is_teacher());

create policy "students_update_teacher"
  on public.students
  for update
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "students_delete_teacher"
  on public.students
  for delete
  to authenticated
  using (public.is_teacher());

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------

alter table public.badges enable row level security;

drop policy if exists "badges_select_public" on public.badges;
drop policy if exists "badges_insert_teacher" on public.badges;
drop policy if exists "badges_update_teacher" on public.badges;
drop policy if exists "badges_delete_teacher" on public.badges;

create policy "badges_select_public"
  on public.badges
  for select
  to public
  using (true);

create policy "badges_insert_teacher"
  on public.badges
  for insert
  to authenticated
  with check (public.is_teacher());

create policy "badges_update_teacher"
  on public.badges
  for update
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "badges_delete_teacher"
  on public.badges
  for delete
  to authenticated
  using (public.is_teacher());

-- ---------------------------------------------------------------------------
-- student_badges
-- ---------------------------------------------------------------------------

alter table public.student_badges enable row level security;

drop policy if exists "student_badges_select_public" on public.student_badges;
drop policy if exists "student_badges_insert_teacher" on public.student_badges;
drop policy if exists "student_badges_update_teacher" on public.student_badges;
drop policy if exists "student_badges_delete_teacher" on public.student_badges;

create policy "student_badges_select_public"
  on public.student_badges
  for select
  to public
  using (true);

create policy "student_badges_insert_teacher"
  on public.student_badges
  for insert
  to authenticated
  with check (public.is_teacher());

create policy "student_badges_update_teacher"
  on public.student_badges
  for update
  to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "student_badges_delete_teacher"
  on public.student_badges
  for delete
  to authenticated
  using (public.is_teacher());
