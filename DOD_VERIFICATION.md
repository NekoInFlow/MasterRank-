# MasterRank MVP DoD Verification

Дата проверки: 2026-05-05. Последнее обновление: финальный этап MVP (группы, UI наград, `vercel.json`, `MVP_RELEASE.md`).
Основание: `RPD.md` (раздел "Definition of Done")

## Статус по DoD

- [x] Leaderboard отображает учеников и корректно сортирует позиции (`score DESC`, при равенстве `name ASC`)
- [x] Изменения в баллах/бейджах отображаются на клиенте в реальном времени
- [x] Учитель может войти в админку
- [x] Учитель может добавить/удалить ученика
- [x] Учитель может изменить баллы (`+1`, `+5`, `-1`)
- [x] Учитель может назначить/снять бейдж
- [x] Неавторизованный пользователь не может изменять данные (RLS + ProtectedRoute)
- [x] Учитель может создать **учебную группу** и назначить ученика в группу (доп. к RPD)
- [x] Интерфейс стабильно работает на мобильных устройствах (mobile-first + базовая a11y)

## Реализация (ссылки)

### 1) Leaderboard + сортировка

- UI: [`src/pages/LeaderboardPage.tsx`](src/pages/LeaderboardPage.tsx)
- Карточки/Top-3: [`src/components/leaderboard/StudentCard.tsx`](src/components/leaderboard/StudentCard.tsx)
- API загрузки/сортировка: [`src/lib/leaderboardApi.ts`](src/lib/leaderboardApi.ts)
- Индекс сортировки в БД: [`supabase/migrations/20260505171400_init_masterrank_schema.sql`](supabase/migrations/20260505171400_init_masterrank_schema.sql)

### 2) Realtime

- Подписки на изменения: [`src/hooks/useLeaderboard.ts`](src/hooks/useLeaderboard.ts)
- Publication для таблиц: [`supabase/migrations/20260505205500_realtime_leaderboard_tables.sql`](supabase/migrations/20260505205500_realtime_leaderboard_tables.sql)

### 3) Auth + защищенные маршруты

- Логин учителя: [`src/pages/LoginPage.tsx`](src/pages/LoginPage.tsx)
- Защита `/admin`: [`src/components/admin/ProtectedRoute.tsx`](src/components/admin/ProtectedRoute.tsx)
- Проверка роли teacher: [`src/hooks/useTeacherAuth.ts`](src/hooks/useTeacherAuth.ts)
- RLS и функция `is_teacher()`: [`supabase/migrations/20260505203000_rls_teacher_policies.sql`](supabase/migrations/20260505203000_rls_teacher_policies.sql)

### 4) Админ-функции

- Админ-панель: [`src/pages/AdminPage.tsx`](src/pages/AdminPage.tsx)
- CRUD/API-операции: [`src/lib/adminApi.ts`](src/lib/adminApi.ts)
- Seed-данные: [`supabase/migrations/20260505204500_seed_badges_and_students.sql`](supabase/migrations/20260505204500_seed_badges_and_students.sql)

### 4a) Группы учеников (доп. к roadmap)

- Миграция: [`supabase/migrations/20260505230000_student_groups.sql`](supabase/migrations/20260505230000_student_groups.sql)
- Embed группы в лидерборд: [`src/lib/leaderboardApi.ts`](src/lib/leaderboardApi.ts)

### 5) Кастомные бейджи (доп.фича)

- Редактор бейджа (название, иконка, цвет): [`src/pages/AdminPage.tsx`](src/pages/AdminPage.tsx)
- Набор иконок: [`src/lib/badgeIcons.tsx`](src/lib/badgeIcons.tsx)
- Поле цвета обводки: [`supabase/migrations/20260505220000_badges_border_color.sql`](supabase/migrations/20260505220000_badges_border_color.sql)
- Цвета встроенных seed-бейджей: [`supabase/migrations/20260505221000_seed_badge_border_colors.sql`](supabase/migrations/20260505221000_seed_badge_border_colors.sql)

### 6) Мобильность и базовая доступность

- Глобальные a11y-улучшения (focus-visible, reduced-motion, skip-link): [`src/index.css`](src/index.css)
- Практическое применение skip-link/ARIA:
  - [`src/pages/LeaderboardPage.tsx`](src/pages/LeaderboardPage.tsx)
  - [`src/pages/LoginPage.tsx`](src/pages/LoginPage.tsx)
  - [`src/pages/AdminPage.tsx`](src/pages/AdminPage.tsx)

## Техническая проверка

- Build: `npm run build` — успешно
- Lint: `npm run lint` — успешно

## Ручной smoke-check (короткий)

1. Открыть `/` и убедиться, что список учеников отображается и сортируется.
2. Из админки поменять балл у ученика (`+1/+5/-1`) и убедиться, что `/` обновился без перезагрузки.
3. Войти как teacher на `/login`, перейти на `/admin`.
4. Добавить/удалить ученика на `/admin`.
5. Создать кастомный бейдж (иконка + цвет), назначить/снять его у ученика.
6. Проверить, что на `/` у бейджа применяется выбранный цвет обводки.
7. Открыть `/admin` в разлогиненном состоянии — должен быть редирект на `/login`.
8. Создать группу (например `БД.09.25.1`), назначить ученику; на `/` под именем отображается группа.
9. В блоке «Награды» у ученика открыть список и назначить/снять бейдж — изменения видны на `/`.

## Финальный этап (roadmap 15–17)

- Инструкция по деплою и приёмке: [`MVP_RELEASE.md`](MVP_RELEASE.md).
