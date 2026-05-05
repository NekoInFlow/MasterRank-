-- MasterRank: расширение бейджей кастомным цветом обводки (roadmap п. 11 + feature request).
-- Используется в UI для чипов бейджей (border color).

alter table public.badges
  add column if not exists border_color text not null default '#6d28d9';

alter table public.badges
  drop constraint if exists badges_border_color_nonempty;

alter table public.badges
  add constraint badges_border_color_nonempty
  check (char_length(trim(border_color)) > 0);

comment on column public.badges.border_color is
  'Цвет обводки чипа бейджа (hex/rgb/css color), напр. #6d28d9';
