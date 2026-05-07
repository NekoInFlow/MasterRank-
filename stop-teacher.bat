@echo off
setlocal

echo Stopping MasterRank teacher mode windows...

taskkill /FI "WINDOWTITLE eq MasterRank Proxy" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq MasterRank App" /T /F >nul 2>nul

echo Done.

endlocal
