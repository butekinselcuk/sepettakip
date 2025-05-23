@echo off
echo ===== SepetTakip Otomatik Test Sistemi =====
echo.

powershell -ExecutionPolicy Bypass -File .\run-tests-no-docker.ps1

echo.
echo Testler tamamlandi! Raporlar guncellendi.
echo.

pause 