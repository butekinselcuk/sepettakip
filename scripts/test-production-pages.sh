#!/bin/bash
# SepetTakip - Üretim ortamında tüm sayfaları test etme scripti

# Renk tanımlamaları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SepetTakip Üretim Ortamı Test Süreci ===${NC}"
echo -e "${YELLOW}Bu script Docker ortamında tüm sayfaları production modda test eder${NC}"
echo "Başlatılıyor..."

# Klasör yolunu kaydet ve kontrol et
TEST_RESULTS_DIR="./test-results"
mkdir -p $TEST_RESULTS_DIR

# Mevcut Docker konteynerlerini kaldır
echo -e "${YELLOW}Mevcut konteynerler temizleniyor...${NC}"
docker-compose down -v
echo -e "${GREEN}Temizleme tamamlandı${NC}"

# Docker imajlarını yeniden oluştur
echo -e "${YELLOW}Docker imajları oluşturuluyor...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}Docker imajları oluşturuldu${NC}"

# Production ve test konteynerlerini başlat
echo -e "${YELLOW}Production ortamı başlatılıyor...${NC}"
docker-compose --profile prod up -d
sleep 10
echo -e "${GREEN}Production ortamı hazır${NC}"

# Composer başarısız olabilir, o durumda manual komutlarla başlatalım
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker Compose başlatılamadı, manuel olarak deneniyor...${NC}"
    docker run -d --name sepettakip-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sepettakip -p 5432:5432 postgres:15-alpine
    sleep 5
    docker run -d --name sepettakip-app-prod --link sepettakip-postgres -p 3000:3000 -e DATABASE_URL=postgresql://postgres:postgres@sepettakip-postgres:5432/sepettakip -e NODE_ENV=production -e NEXTAUTH_SECRET=test_secret -e NEXTAUTH_URL=http://localhost:3000 $(docker build -q --target production .)
    sleep 10
fi

# Production ortamını kontrol et
echo -e "${YELLOW}Production ortamı kontrol ediliyor...${NC}"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)

if [ "$STATUS_CODE" -ne 200 ]; then
    echo -e "${RED}Üretim ortamı başlatılamadı. Durum kodu: $STATUS_CODE${NC}"
    docker-compose logs app-prod
    exit 1
fi

echo -e "${GREEN}Production ortamı çalışıyor (HTTP $STATUS_CODE)${NC}"

# Tüm sayfaları test et
echo -e "${YELLOW}Playwright ile tüm sayfalar test ediliyor...${NC}"
docker-compose --profile test up --abort-on-container-exit

# Test sonuçlarını konteynerden kopyala
echo -e "${YELLOW}Test sonuçları dışa aktarılıyor...${NC}"
docker cp sepettakip-test-pages:/app/playwright-report ./
docker cp sepettakip-test-pages:/app/test-results ./

# Test raporlarını güncelle
echo -e "${YELLOW}page-test-report.md ve lint-issues-report.md dosyaları güncelleniyor...${NC}"
docker exec sepettakip-test-pages node /app/scripts/update-test-reports.js

# Test sonrası temizlik
echo -e "${YELLOW}Konteynerler kapatılıyor...${NC}"
docker-compose down -v
echo -e "${GREEN}Temizleme tamamlandı${NC}"

echo -e "${BLUE}=== Test süreci tamamlandı ===${NC}"
echo -e "${GREEN}Test sonuçları ve raporlar 'test-results' ve 'playwright-report' klasörlerinde${NC}"
echo -e "${GREEN}page-test-report.md ve lint-issues-report.md dosyaları güncellenmiştir${NC}" 