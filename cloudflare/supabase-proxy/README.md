# Прокси Supabase (Cloudflare Worker)

Нужен, если с сети пользователей **не открывается** прямой адрес `*.supabase.co`, а **страница на Cloudflare Pages** грузится.

## Что делает Worker

- Принимает запросы на своём адресе вида  
  `https://<worker>.workers.dev/rest/v1/...`, `https://…/auth/v1/…`
- Проксирует их на ваш реальный `https://<ref>.supabase.co/...`
- Добавляет заголовки **CORS**, чтобы браузер на Pages мог звать свой домен Worker’а вместо Supabase.

**Realtime (WebSocket) не проксируется.** В приложении при URL не на `*.supabase.co` включён **опрос списка раз в несколько секунд** вместо live-канала.

## Развертывание

1. Установите [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) или используйте `npx wrangler`.

2. В каталоге `cloudflare/supabase-proxy`:

   ```bash
   npx wrangler login
   npx wrangler deploy --config wrangler.toml
   ```

   **Важно:** в корне этого репозитория может лежать `wrangler.jsonc` (деплой Vite в Worker со статикой из `dist`). Без `--config wrangler.toml` Wrangler может подхватить тот файл, начнёт заливать весь `dist` и выдаёт `fetch failed`/долгий upload. Прокси деплоится только с явным конфигом.

3. Задайте **секрет** с точным URL проекта (без `/` на конце):

   ```bash
   npx wrangler secret put SUPABASE_ORIGIN
   ```

   Введите значение, например: `https://abcdefghijklmnop.supabase.co`  
   (из Supabase Dashboard → Settings → API → Project URL.)

4. (Рекомендуется для продакшена) Задайте разрешённый Origin фронта в `wrangler.toml` → секция `[vars]`:

   ```toml
   [vars]
   ALLOWED_ORIGIN = "https://ваш-проект.pages.dev"
   ```

   Либо оставьте пустым: тогда в `Access-Control-Allow-Origin` подставляется `Origin` из запроса (удобно для тестов).

5. Скопируйте URL Worker’а после деплоя (например `https://masterrank-supabase-proxy.<user>.workers.dev`).

## Переменные фронта (Pages / локально)

В **`.env`** и в настройках **Cloudflare Pages → Environment variables**:

- `VITE_SUPABASE_URL` = **URL Worker’а** (без слэша в конце), **не** `*.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = тот же **anon / public** ключ, что и раньше (из Supabase API)

Пересоберите фронт (`npm run build` / новый деплой Pages).

## Проверка

```bash
curl -sI "https://<WORKER_URL>/rest/v1/students?select=id&limit=1" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Ожидается ответ `200` или `401/403` от PostgREST, но не `500` от самого Worker про незаданный `SUPABASE_ORIGIN`.
