@echo off
setlocal

REM One-click launcher for teacher mode:
REM 1) Starts local Cloudflare Worker proxy
REM 2) Starts Vite dev server with proxy URL injected

set "ROOT_DIR=%~dp0"
set "PROXY_DIR=%ROOT_DIR%cloudflare\supabase-proxy"

REM TODO: Replace with your real Supabase project URL (without trailing slash).
set "SUPABASE_ORIGIN=https://vsrkdbrbeeziyqsnnidg.supabase.co

REM Local proxy URL where wrangler dev serves the Worker.
set "LOCAL_PROXY_URL=http://127.0.0.1:8787"

if /I "%SUPABASE_ORIGIN%"=="https://your-project-id.supabase.co" (
  echo [ERROR] Set SUPABASE_ORIGIN inside start-teacher.bat first.
  echo Example: https://abcdefgh.supabase.co
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH. Install Node.js 18+.
  pause
  exit /b 1
)

where npx >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npx was not found in PATH. Install Node.js 18+.
  pause
  exit /b 1
)

if not exist "%PROXY_DIR%\wrangler.toml" (
  echo [ERROR] Proxy folder not found: "%PROXY_DIR%"
  pause
  exit /b 1
)

echo Starting local Supabase proxy...
start "MasterRank Proxy" cmd /k "cd /d "%PROXY_DIR%" && npx wrangler dev --config wrangler.toml --var SUPABASE_ORIGIN:%SUPABASE_ORIGIN% --var ALLOWED_ORIGIN:http://localhost:5173"

REM Small delay so proxy starts first.
timeout /t 2 /nobreak >nul

echo Starting frontend with proxy URL...
start "MasterRank App" cmd /k "cd /d "%ROOT_DIR%" && set VITE_SUPABASE_URL=%LOCAL_PROXY_URL% && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo Done. Open http://localhost:5173
echo To stop both windows, run stop-teacher.bat

endlocal
