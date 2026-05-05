-- Обновление цветов обводки для встроенных seed-бейджей.
-- Безопасно для повторного запуска.

update public.badges
set border_color = case code
  when 'top-week' then '#f59e0b'
  when 'discipline' then '#0ea5e9'
  when 'helpful' then '#a855f7'
  when 'streak' then '#ef4444'
  when 'reader' then '#22c55e'
  else border_color
end
where code in ('top-week', 'discipline', 'helpful', 'streak', 'reader');
