@echo off
echo ===== SepetTakip Otomatik Test Izleme Sistemi =====
echo.

powershell -ExecutionPolicy Bypass -File .\run-tests-no-docker.ps1 -WatchMode

echo.
echo Izleme modu sonlandirildi.
echo.

pause 