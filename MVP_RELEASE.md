# MasterRank — финальный этап релиза MVP

Документ закрывает пункты **15–17** из [`FULL_SITE_ROADMAP.md`](FULL_SITE_ROADMAP.md): актуальная документация, выкладка на Vercel и фиксация готовности MVP.

---

## Пункт 15 — Документация (в репозитории)

| Что | Где |
|-----|-----|
| Запуск, env, Supabase, схема, команды | [`README.md`](README.md) |
| Проверка по Definition of Done | [`DOD_VERIFICATION.md`](DOD_VERIFICATION.md) |
| Продуктовые требования | [`RPD.md`](RPD.md) |

**Важно:** в `README.md` перечислены все SQL-миграции — их нужно выполнить в Supabase в указанном порядке (включая `20260505230000_student_groups.sql` для групп учеников).

---

## Пункт 16 — GitHub → Vercel и автодеплой из `main`

Выполняется **владельцем репозитория** (один раз).

### A. Репозиторий на GitHub

1. Создай новый репозиторий на [GitHub](https://github.com/new) (например `masterrank`).
2. Локально в папке проекта (если ещё не инициализирован git):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: MasterRank MVP"
   git branch -M main
   git remote add origin https://github.com/<USER>/<REPO>.git
   git push -u origin main
   ```

3. Убедись, что в репозиторий **не попали** файлы `.env` (они в [`.gitignore`](.gitignore)).

### B. Проект в Vercel

1. Войди на [vercel.com](https://vercel.com) → **Add New** → **Project** → импорт репозитория с GitHub.
2. **Framework Preset:** Vite (подхватится из [`vercel.json`](vercel.json)).
3. **Root Directory:** корень монорепо (по умолчанию `.`).
4. **Build Command:** `npm run build`, **Output:** `dist` (уже заданы в `vercel.json`).

### C. Переменные окружения в Vercel

В **Project → Settings → Environment Variables** добавь для **Production** (и при желании Preview):

| Имя | Значение |
|-----|---------|
| `VITE_SUPABASE_URL` | URL проекта из Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `anon` / public key из того же экрана |

Сохрани и сделай **Redeploy** последнего деплоя (или новый push в `main`).

### D. CI на GitHub (уже в репозитории)

Файл [`.github/workflows/ci.yml`](.github/workflows/ci.yml) запускает `npm run lint` и `npm run build` при push и PR в `main`/`master`. Это дополняет, но не заменяет проверку на Vercel.

### E. Обязательные проверки после деплоя

Открой **Production URL** Vercel:

1. Открывается `/` — лидерборд загружается без ошибок.
2. Прямая ссылка `/login` и `/admin` (после авторизации учителя) **не дают 404** при обновлении страницы — см. SPA-перезапись в [`vercel.json`](vercel.json).

---

## Пункт 17 — Финальная приёмка MVP

### Чеклист готовности

- [ ] Все миграции из `supabase/migrations/` применены к **production** Supabase.
- [ ] В `app_teacher` записан UUID реального учителя; вход `/login` → `/admin` работает на **production** URL.
- [ ] Realtime: изменение балла в админке видно на `/` без перезагрузки.
- [ ] Группы: создание группы, назначение ученика, отображение группы на карточке лидерборда.
- [ ] Бейджи: конструктор, назначение из выпадающего блока «Награды».
- [ ] `npm run build` и `npm run lint` проходят локально (как в [`DOD_VERIFICATION.md`](DOD_VERIFICATION.md)).

### Фиксация статуса

После прохождения чеклиста можно считать **MVP MasterRank принятым**. Дата приёмки: _______________

Заказчик / руководитель проекта: _______________

---

## Известные ограничения MVP

- Один учитель на проект (таблица `app_teacher`, одна строка).
- Нет публичной саморегистрации — учётные записи создаются в Supabase Dashboard.
- Секреты только в env; service role key в клиент не передаётся.

При расширении продукта имеет смысл обновить `RPD.md` и добавить новую миграцию/версию, не ломая существующий RLS.
