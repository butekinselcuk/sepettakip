@echo off
echo ===== SepetTakip Otomatik Test Sistemi =====
echo.

REM Check if Docker is installed
docker --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker kurulu degil veya calismiyor.
    echo Docker Desktop'i kurun ve calismaya basladigindan emin olun.
    pause
    exit /b 1
)

echo Docker bulundu, testler baslatiliyor...
echo.

REM Clean up existing containers
echo Mevcut konteynerler temizleniyor...
docker-compose down -v

REM Build and start production environment
echo Uretim ortami baslatiliyor...
docker-compose --profile prod up -d

REM Wait for app to start
echo Uygulama baslatiliyor, lutfen bekleyin...
timeout /t 10 /nobreak > nul

REM Run tests
echo Sayfa testleri baslatiliyor...
docker-compose --profile test up --abort-on-container-exit

REM Copy test results
echo Test sonuclari kopyalaniyor...
docker cp sepettakip-test-pages:/app/playwright-report ./
docker cp sepettakip-test-pages:/app/test-results ./

REM Update reports
echo Raporlar guncelleniyor...
docker exec sepettakip-test-pages node /app/scripts/update-test-reports.js

REM Clean up
echo Temizlik yapiliyor...
docker-compose down -v

echo.
echo Testler tamamlandi! Sonuclar playwright-report klasorunde goruntulenebilir.
echo.

pause 