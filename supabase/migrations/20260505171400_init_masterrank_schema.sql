-- MasterRank initial database schema
-- Source: RPD.md раздел 6 + FULL_SITE_ROADMAP.md пункт 3
--
-- Применение: Supabase Dashboard → SQL → вставить и выполнить,
-- либо локально: npx supabase db push (при связанном проекте CLI).

create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(trim(name)) > 0),
  score int not null default 0
    check (score >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null
    check (char_length(trim(code)) > 0),
  title text not null
    check (char_length(trim(title)) > 0),
  icon text not null
    check (char_length(trim(icon)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.student_badges (
  student_id uuid not null references public.students(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);

-- Лидерборд: сортировка score DESC, при равенстве name ASC (RPD п. 5)
create index if not exists idx_students_leaderboard_sort
  on public.students (score desc, name asc);

create index if not exists idx_student_badges_student_id on public.student_badges (student_id);
create index if not exists idx_student_badges_badge_id on public.student_badges (badge_id);

comment on table public.students is 'Ученики: имя, балл, дата создания';
comment on column public.students.score is 'Балл >= 0, бизнес-правило RPD';

comment on table public.badges is 'Справочник бейджей (код, заголовок, имя иконки Lucide)';
comment on column public.badges.icon is 'Каноническое имя иконки Lucide, напр. star или trophy';

comment on table public.student_badges is 'Связь ученик ↔ бейдж (многие ко многим)';
