# MasterRank

**MasterRank** — веб-приложение для рейтинга учеников в реальном времени.  
Учитель управляет учениками, баллами и бейджами через защищённую админ-панель.  
Публичный лидерборд обновляется без перезагрузки страницы.

---

## Содержание

- [Обзор стека](#обзор-стека)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Настройка Supabase](#настройка-supabase)
- [Функциональность](#функциональность)
- [Архитектура и ключевые файлы](#архитектура-и-ключевые-файлы)
- [База данных](#база-данных)
- [Безопасность (RLS)](#безопасность-rls)
- [Realtime](#realtime)
- [Зависимости](#зависимости)
- [Команды](#команды)
- [Деплой (Vercel)](#деплой-vercel)
- [Финальный релиз MVP](#финальный-релиз-mvp)
- [Troubleshooting](#troubleshooting)

---

## Обзор стека

| Слой | Технология | Версия |
|------|-----------|--------|
| UI-фреймворк | React | ^19.2 |
| Язык | TypeScript | ~6.0 |
| Сборка | Vite | ^8.0 |
| Стили | Tailwind CSS v4 | ^4.2 |
| Анимации | Framer Motion | ^12.38 |
| Иконки | Lucide React | ^1.14 |
| Роутинг | React Router DOM | ^7.14 |
| BaaS / БД | Supabase (PostgreSQL) | ^2.105 |
| Auth | Supabase Auth (Email/Password) | — |
| Realtime | Supabase Realtime (PostgreSQL CDC) | — |
| Хостинг | Vercel | — |

---

## Структура проекта

```
masterrank/
├── src/
│   ├── App.tsx                        # Корневой компонент, роутинг, ToastProvider
│   ├── main.tsx                       # Точка входа React
│   ├── index.css                      # Глобальные стили, CSS-переменные, a11y
│   │
│   ├── pages/
│   │   ├── LeaderboardPage.tsx        # Публичный лидерборд (/)
│   │   ├── LoginPage.tsx              # Вход учителя (/login)
│   │   └── AdminPage.tsx              # Панель учителя (/admin)
│   │
│   ├── components/
│   │   ├── leaderboard/
│   │   │   └── StudentCard.tsx        # Карточка ученика с Top-3 стилями
│   │   ├── admin/
│   │   │   └── ProtectedRoute.tsx     # HOC: проверка роли teacher
│   │   └── ui/
│   │       └── ToastProvider.tsx      # Глобальные toast-уведомления
│   │
│   ├── hooks/
│   │   ├── useLeaderboard.ts          # Загрузка данных + Realtime-подписки
│   │   └── useTeacherAuth.ts          # Сессия + проверка роли is_teacher()
│   │
│   └── lib/
│       ├── supabase.ts                # Инициализация Supabase-клиента
│       ├── database.types.ts          # TypeScript-типы схемы БД
│       ├── types.ts                   # Доменные типы: Student, Badge, StudentBadge
│       ├── leaderboardApi.ts          # Запросы для лидерборда
│       ├── adminApi.ts                # CRUD-операции для учителя
│       └── badgeIcons.tsx             # Маппинг иконок Lucide + BADGE_ICON_OPTIONS
│
├── supabase/
│   └── migrations/
│       ├── 20260505171400_init_masterrank_schema.sql   # Схема таблиц + индексы
│       ├── 20260505203000_rls_teacher_policies.sql     # RLS-политики + is_teacher()
│       ├── 20260505204500_seed_badges_and_students.sql # Тестовые данные
│       ├── 20260505205500_realtime_leaderboard_tables.sql # Realtime publication
│       ├── 20260505220000_badges_border_color.sql      # Поле border_color
│       ├── 20260505221000_seed_badge_border_colors.sql # Цвета встроенных бейджей
│       └── 20260505230000_student_groups.sql           # Группы + group_id у students
│
├── .github/
│   └── workflows/
│       └── ci.yml                   # Lint + build на push/PR
│
├── public/
│   └── favicon.svg
│
├── .env                               # Локальные секреты (в .gitignore)
├── .env.example                       # Шаблон env-переменных
├── .gitignore
├── index.html                         # HTML-шаблон (lang="ru", Inter font)
├── package.json
├── tsconfig.json
├── tsconfig.app.json                  # Strict TypeScript для src/
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── RPD.md                             # Продуктовый документ
├── FULL_SITE_ROADMAP.md               # Дорожная карта разработки
├── DOD_VERIFICATION.md                # Чеклист Definition of Done
├── MVP_RELEASE.md                     # Финальный этап: Vercel, приёмка MVP
└── vercel.json                        # Сборка Vite + SPA fallback для /login, /admin
```

---

## Быстрый старт

### Требования

- **Node.js** ≥ 18
- **npm** ≥ 9
- Аккаунт [Supabase](https://supabase.com) (бесплатный tier достаточен)

### Запуск для учителя в 1 клик (Windows, VPN MVP)

В корне проекта есть батники:

- `start-teacher.bat` — поднимает локальный прокси (`cloudflare/supabase-proxy`) и фронт.
- `stop-teacher.bat` — останавливает оба окна.

Перед первым запуском открой `start-teacher.bat` и подставь реальный `SUPABASE_ORIGIN`, например:

```bat
set "SUPABASE_ORIGIN=https://abcdefgh.supabase.co"
```

После этого учителю достаточно запускать `start-teacher.bat`.

### Установка

```bash
# 1. Клонировать репозиторий
git clone <REPO_URL>
cd masterrank

# 2. Установить зависимости
npm install

# 3. Создать .env из шаблона
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# 4. Заполнить .env (см. раздел "Переменные окружения")

# 5. Применить миграции в Supabase (см. раздел "Настройка Supabase")

# 6. Запустить dev-сервер
npm run dev
```

Приложение доступно по адресу `http://localhost:5173/`

---

## Переменные окружения

Файл `.env` (никогда не коммитить в git):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Оба значения берутся из:  
**Supabase Dashboard → Project Settings → API**

| Переменная | Описание | Пример |
|-----------|---------|-------|
| `VITE_SUPABASE_URL` | URL проекта Supabase | `https://vsrk...supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Публичный `anon` ключ | `sb_publishable_...` |

> `VITE_*` — обязательный префикс для Vite. Переменные без него в браузере недоступны.

**Прокси к Supabase (рекомендуется для РФ через Vercel):**
в проекте есть серверный endpoint `api/supabase.js`, который проксирует `rest/auth/storage` в ваш `*.supabase.co`.
Для фронта укажи `VITE_SUPABASE_URL=https://<ваш-домен>/api/supabase`, а в переменных Vercel задай:
- `SUPABASE_ORIGIN=https://<project-ref>.supabase.co`
- `SUPABASE_ANON_KEY=sb_publishable_...`
В режиме прокси live-Realtime в браузере недоступен; приложение автоматически использует HTTP-опрос.

---

## Настройка Supabase

Все шаги выполнять в **Supabase Dashboard → SQL Editor**.

### Шаг 1. Применить миграции (по порядку)

Выполни каждый файл последовательно (имя файла = порядок):

```
supabase/migrations/20260505171400_init_masterrank_schema.sql
supabase/migrations/20260505203000_rls_teacher_policies.sql
supabase/migrations/20260505220000_badges_border_color.sql
supabase/migrations/20260505204500_seed_badges_and_students.sql
supabase/migrations/20260505205500_realtime_leaderboard_tables.sql
supabase/migrations/20260505221000_seed_badge_border_colors.sql
supabase/migrations/20260505230000_student_groups.sql
```

### Шаг 2. Создать учителя

**Authentication → Providers → Email:**
- `Enable Email Provider` = **ON**
- `Confirm Email` = **OFF** (или отключи подтверждение email)
- `Enable Signups` = **OFF** (запрет самостоятельной регистрации)

**Authentication → Users → Add user:**
- Заполни email и password
- Нажми `Auto Confirm User`
- Скопируй выданный **User UID**

### Шаг 3. Привязать учителя к роли

В SQL Editor (подставь свой UID):

```sql
insert into public.app_teacher (id, user_id)
values (1, 'ВАШ-UUID-УЧИТЕЛЯ'::uuid)
on conflict (id) do update
  set user_id = excluded.user_id;
```

### Шаг 4. Проверить результат

```sql
-- teacher привязан
select * from public.app_teacher;

-- publication для Realtime
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;
-- ожидается: badges, student_badges, students
```

---

## Функциональность

### Публичный лидерборд (`/`)

- Список учеников, отсортированный по убыванию баллов; при равенстве баллов — по имени (A-Z).
- **Top-3**: карточки с отдельными стилями: золото, серебро, бронза (рамка, свечение, бейдж с номером места).
- Каждая карточка: имя, баллы, набор бейджей с иконками и цветной обводкой.
- Индикаторы смены позиции: `↑ N` (зелёный) / `↓ N` (красный) при realtime-обновлении.
- Анимация перестановки карточек (Framer Motion `layout`).
- Кнопка «Учитель» → `/login`.
- Состояния: загрузка (спиннер), пустой список, ошибка.

### Вход учителя (`/login`)

- Форма email/password.
- Проверка роли через `rpc('is_teacher')` после входа.
- При несовпадении роли — автоматический `signOut` + ошибка.
- Если сессия уже есть → редирект на `/admin`.

### Панель учителя (`/admin`)

> Доступна только аутентифицированному teacher-аккаунту. При попытке открыть без авторизации — редирект на `/login`.

**Управление учениками:**
- Добавить ученика (имя → поле ввода + кнопка).
- Опционально сразу назначить **учебную группу** (например `БД.09.25.1`) при добавлении.
- Быстро изменить баллы: `-1`, `+1`, `+5` для каждого ученика.
- Удалить ученика (с подтверждением).
- Балл не может стать отрицательным (защита на фронте и `CHECK` в БД).

**Группы:**
- Создание группы (уникальное имя) и выбор группы у каждого ученика (выпадающий список).
- На публичном лидерборде под именем отображается название группы (если задано).

**Управление бейджами:**
- Компактный блок **«Награды»** (раскрывающийся список): полное название бейджа, назначить/снять.
- Конструктор кастомного бейджа: название, иконка (из 11 вариантов), цвет обводки (color picker).
- Список бейджей на панели обновляется в realtime.

**UX:**
- Глобальные toast-уведомления (success / error / info) для всех операций.
- `disabled` состояние кнопок во время выполнения операции.
- Кнопка «Выйти» → `signOut` + редирект.

---

## Архитектура и ключевые файлы

### Роутинг

```
/           → LeaderboardPage    (публичная)
/login      → LoginPage          (публичная, редирект если уже teacher)
/admin      → AdminPage          (защищена ProtectedRoute)
/*          → redirect → /
```

`ProtectedRoute` проверяет сессию через `useTeacherAuth` и вызывает `rpc('is_teacher')`. Пока идёт проверка — показывает spinner.

### Слой данных

| Файл | Ответственность |
|------|----------------|
| [`src/lib/supabase.ts`](src/lib/supabase.ts) | Создаёт типизированный Supabase-клиент с валидацией env |
| [`src/lib/database.types.ts`](src/lib/database.types.ts) | TypeScript-типы всех таблиц и RPC-функций |
| [`src/lib/types.ts`](src/lib/types.ts) | Доменные типы: `Student`, `Badge`, `StudentGroup`, … |
| [`src/lib/leaderboardApi.ts`](src/lib/leaderboardApi.ts) | Лидерборд: студенты (с группой) + связка бейджей, сортировка RPD |
| [`src/lib/adminApi.ts`](src/lib/adminApi.ts) | Студенты, баллы, бейджи, группы, назначения |
| [`src/lib/badgeIcons.tsx`](src/lib/badgeIcons.tsx) | MAP иконок Lucide по имени + `BADGE_ICON_OPTIONS` |

### Хуки

| Хук | Файл | Что делает |
|-----|------|-----------|
| `useLeaderboard` | [`src/hooks/useLeaderboard.ts`](src/hooks/useLeaderboard.ts) | Загрузка + Realtime (`students`, `badges`, `student_badges`; при смене группы — через `students`) с debounce 150 ms |
| `useTeacherAuth` | [`src/hooks/useTeacherAuth.ts`](src/hooks/useTeacherAuth.ts) | Сессия + `rpc('is_teacher')` + `onAuthStateChange` |

### UI-система

| Компонент | Файл | Назначение |
|-----------|------|-----------|
| `ToastProvider` | [`src/components/ui/ToastProvider.tsx`](src/components/ui/ToastProvider.tsx) | Context + анимированные toast-уведомления (до 4 одновременно, автоудаление 3.2s) |
| `StudentCard` | [`src/components/leaderboard/StudentCard.tsx`](src/components/leaderboard/StudentCard.tsx) | Карточка с Framer Motion layout, Top-3 стилями, бейджами, индикаторами ↑↓ |
| `ProtectedRoute` | [`src/components/admin/ProtectedRoute.tsx`](src/components/admin/ProtectedRoute.tsx) | Защита маршрутов по роли teacher |

---

## База данных

### Схема

```sql
-- Ученики
public.student_groups
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name       text UNIQUE NOT NULL  -- например БД.09.25.1
  created_at timestamptz NOT NULL DEFAULT now()

public.students
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name        text NOT NULL CHECK (char_length(trim(name)) > 0)
  score       int  NOT NULL DEFAULT 0 CHECK (score >= 0)
  group_id    uuid NULL REFERENCES student_groups(id) ON DELETE SET NULL
  created_at  timestamptz NOT NULL DEFAULT now()

-- Справочник бейджей
public.badges
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
  code         text UNIQUE NOT NULL CHECK (char_length(trim(code)) > 0)
  title        text NOT NULL CHECK (char_length(trim(title)) > 0)
  icon         text NOT NULL  -- Имя экспорта Lucide, напр. 'Trophy'
  border_color text NOT NULL DEFAULT '#6d28d9'  -- CSS-цвет обводки чипа
  created_at   timestamptz NOT NULL DEFAULT now()

-- Связь ученик ↔ бейдж (many-to-many)
public.student_badges
  student_id  uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE
  badge_id    uuid NOT NULL REFERENCES badges(id)   ON DELETE CASCADE
  assigned_at timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (student_id, badge_id)

-- Singleton: UUID учителя (заполняется вручную через SQL Editor)
public.app_teacher
  id       smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1)
  user_id  uuid NOT NULL UNIQUE
```

### Индексы

| Индекс | Таблица | Назначение |
|--------|---------|-----------|
| `idx_students_group_id` | `students (group_id)` | Выборка группы у ученика |
| `idx_student_badges_student_id` | `student_badges (student_id)` | JOIN по ученику |
| `idx_student_badges_badge_id` | `student_badges (badge_id)` | JOIN по бейджу |

### RPC-функции

```sql
-- Возвращает true, если auth.uid() совпадает с app_teacher.user_id
public.is_teacher() → boolean
-- SECURITY DEFINER, доступна для anon и authenticated
```

### Встроенные бейджи (seed)

| code | Название | Иконка | Цвет обводки |
|------|---------|--------|-------------|
| `top-week` | Звезда недели | Trophy | `#f59e0b` |
| `discipline` | За дисциплину | Medal | `#0ea5e9` |
| `helpful` | Помощник класса | Star | `#a855f7` |
| `streak` | Серия успехов | Flame | `#ef4444` |
| `reader` | Читатель | BookOpen | `#22c55e` |

---

## Безопасность (RLS)

Row Level Security включён на всех пользовательских таблицах.

| Таблица | SELECT | INSERT / UPDATE / DELETE |
|---------|--------|--------------------------|
| `students` | все (`anon`, `authenticated`) | только teacher (`is_teacher() = true`) |
| `badges` | все | только teacher |
| `student_badges` | все | только teacher |
| `student_groups` | все | только teacher |
| `app_teacher` | **никто** (нет политик) | **никто** — только service role через Dashboard |

**Публичная регистрация отключена** в Supabase Auth: только учитель, созданный вручную, может войти.

Функция `is_teacher()` использует `SECURITY DEFINER`, что позволяет ей читать `app_teacher` от имени владельца, не открывая таблицу для клиентов.

---

## Realtime

Таблицы `students`, `badges`, `student_badges` добавлены в publication `supabase_realtime`. Дополнительно в publication может участвовать **`student_groups`** (миграция групп) — для синхронизации справочника групп на панели учителя.

Хук `useLeaderboard` открывает WebSocket-канал `masterrank-leaderboard` и подписывается на `postgres_changes` (event `*`) по **`students`**, **`badges`** и **`student_badges`**. Изменение **`group_id`** у ученика приходит как событие по таблице `students`, после чего снова вызывается `fetchLeaderboard` с **debounce 150 ms**.

```
Supabase → CDC (WAL) → postgres_changes → useLeaderboard → fetchLeaderboard → setState
```

---

## Зависимости

### Runtime

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `react` | ^19.2.5 | UI-фреймворк |
| `react-dom` | ^19.2.5 | Рендеринг в DOM |
| `react-router-dom` | ^7.14.2 | Клиентский роутинг (SPA) |
| `@supabase/supabase-js` | ^2.105.3 | Клиент PostgreSQL, Auth, Realtime |
| `tailwindcss` | ^4.2.4 | Утилитарные CSS-классы (v4, без config-файла) |
| `@tailwindcss/vite` | ^4.2.4 | Интеграция Tailwind с Vite |
| `framer-motion` | ^12.38.0 | Декларативные анимации (`layout`, `AnimatePresence`) |
| `lucide-react` | ^1.14.0 | SVG-иконки (PascalCase имена, tree-shaking) |

### Dev-only

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| `vite` | ^8.0.10 | Сборщик и dev-сервер |
| `@vitejs/plugin-react` | ^6.0.1 | Поддержка JSX/React Fast Refresh |
| `typescript` | ~6.0.2 | Компилятор TypeScript |
| `eslint` | ^10.2.1 | Статический анализ кода |
| `typescript-eslint` | ^8.58.2 | TypeScript-правила ESLint |
| `eslint-plugin-react-hooks` | ^7.1.1 | Правила для React хуков |
| `eslint-plugin-react-refresh` | ^0.5.2 | Совместимость с Fast Refresh |
| `globals` | ^17.5.0 | Глобальные переменные для ESLint |
| `@types/react` | ^19.2.14 | TypeScript-типы React |
| `@types/react-dom` | ^19.2.3 | TypeScript-типы ReactDOM |
| `@types/node` | ^24.12.2 | TypeScript-типы Node.js |

---

## Команды

```bash
# Запустить dev-сервер с HMR
npm run dev

# Проверить типы + собрать production bundle
npm run build

# Просмотреть production build локально
npm run preview

# Запустить линтер
npm run lint
```

### Полезные команды Supabase (при использовании CLI)

```bash
# Привязать локальный проект к Supabase
npx supabase link --project-ref YOUR_PROJECT_REF

# Применить все миграции к remote БД
npx supabase db push

# Сгенерировать актуальные TypeScript-типы из схемы БД
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

### Полезные SQL-сниппеты (Supabase SQL Editor)

```sql
-- Проверить teacher
select * from public.app_teacher;

-- Проверить publication Realtime
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by tablename;

-- Обновить teacher UID
insert into public.app_teacher (id, user_id)
values (1, 'NEW-UUID'::uuid)
on conflict (id) do update set user_id = excluded.user_id;

-- Тест Realtime: изменить балл у лидера
update public.students
set score = score + 1
where id = (select id from public.students order by score desc, name asc limit 1)
returning name, score;

-- Сброс данных (сохраняет бейджи и teacher)
truncate public.student_badges, public.students restart identity cascade;
```

---

## Деплой (Vercel)

1. Запушить репозиторий на **GitHub**.
2. В [Vercel Dashboard](https://vercel.com) → **Add New Project** → выбрать репозиторий.
3. Vercel автоматически определит Vite. Настройки по умолчанию подходят.
4. В **Settings → Environment Variables** добавить:
   - `VITE_SUPABASE_URL` = `https://<ваш-домен>/api/supabase`
   - `VITE_SUPABASE_ANON_KEY` = ваш `anon/public` ключ
   - `SUPABASE_ORIGIN` = `https://<project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY` = тот же `sb_publishable_...` (серверный fallback для прокси)
5. Нажать **Deploy**.

После этого каждый push в ветку `main` запускает автоматический деплой.

В репозитории лежит [`vercel.json`](vercel.json): **Vite**, `outputDirectory: dist` и **rewrite на `index.html`**, чтобы при обновлении страницы прямые URL (`/login`, `/admin`) не отдавали 404.

**Полный пошаговый чеклист (GitHub, env, приёмка MVP):** см. [`MVP_RELEASE.md`](MVP_RELEASE.md).

---

## Финальный релиз MVP

Закрывает пункты roadmap **15–17**:

1. **Документация** — этот `README`, `DOD_VERIFICATION.md`, `RPD.md`.
2. **CI** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (`lint` + `build` на push и PR в `main` / `master`).
3. **Приёмка и фиксация готовности** — чеклист, подпись, ограничения MVP: **[`MVP_RELEASE.md`](MVP_RELEASE.md)**.

---

## Troubleshooting

### Страница пустая / ошибка `VITE_SUPABASE_URL is not set`

Убедись, что файл `.env` создан и заполнен. Перезапусти `npm run dev` после изменения `.env`.

### Вход не работает / «Неверный email или пароль»

1. `Authentication → Providers → Email` — `Enable Email Provider` должен быть **ON**.
2. Проверь, что пользователь подтверждён: `select email_confirmed_at from auth.users where email = '...'`.
3. Сбрось пароль через Dashboard: `Authentication → Users → ...`.

### Вход работает, но редиректа на `/admin` нет / «не имеет роли учителя»

UUID в `app_teacher` не совпадает с UUID пользователя в `auth.users`:
```sql
select id, email from auth.users where email = 'your@email.com';
-- убедись, что этот id записан в app_teacher
select * from public.app_teacher;
```

### Realtime не работает (изменения не приходят)

Проверь publication:
```sql
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public';
```
Если таблиц нет — применить миграцию `20260505205500_realtime_leaderboard_tables.sql`.

### Ошибка `Failed to fetch (api.supabase.com)` в SQL Editor

Проблема с сетью или сессией Supabase Dashboard:
- Обнови страницу `Ctrl+F5`.
- Отключи VPN или AdBlock.
- Выполни `select 1;` для проверки соединения.

### Бейджи не отображаются на карточках

Убедись, что миграция `20260505220000_badges_border_color.sql` применена — поле `border_color` появляется только после неё.

### Ошибки на `/admin` после входа: «группы», `student_groups` или `group_id`

Примени миграцию [`20260505230000_student_groups.sql`](supabase/migrations/20260505230000_student_groups.sql) в Supabase SQL Editor.

### TypeScript-ошибки после `supabase gen types`

После регенерации `src/lib/database.types.ts` убедись, что поле `border_color` присутствует в `badges.Row`. Если нет — добавь вручную или перегенерируй типы повторно.
