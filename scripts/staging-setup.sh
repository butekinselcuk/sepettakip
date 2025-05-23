#!/bin/bash

# SepetTakip Staging Ortam Kurulum Scripti
# Bu script, staging ortamının kurulumu için gerekli adımları gerçekleştirir

set -e # Hata durumunda scripti durdur

# Renkli çıktı için fonksiyonlar
function info() {
  echo -e "\033[0;34m[INFO] $1\033[0m"
}

function success() {
  echo -e "\033[0;32m[SUCCESS] $1\033[0m"
}

function warning() {
  echo -e "\033[0;33m[WARNING] $1\033[0m"
}

function error() {
  echo -e "\033[0;31m[ERROR] $1\033[0m"
  exit 1
}

# Script başlangıç bilgisi
info "SepetTakip Staging ortamı kurulumu başlatılıyor..."
info "Çalışma dizini: $(pwd)"

# Docker ve Docker Compose kontrolü
if ! command -v docker &> /dev/null; then
  error "Docker yüklü değil. Lütfen Docker'ı yükleyin ve tekrar deneyin."
fi

if ! command -v docker-compose &> /dev/null; then
  error "Docker Compose yüklü değil. Lütfen Docker Compose'u yükleyin ve tekrar deneyin."
fi

success "Docker ve Docker Compose kontrolü başarılı"

# Çevre değişkenlerini kontrol et
if [ ! -f "staging.env" ]; then
  warning "staging.env dosyası bulunamadı. Örnek dosyadan kopyalanıyor..."
  cp staging.env.example staging.env
  warning "Lütfen staging.env dosyasını düzenleyerek gerçek değerleri ekleyin."
fi

info "staging.env dosyası staging ortamı için kullanılacak"

# Gerekli dizinleri oluştur
mkdir -p ./logs/staging
mkdir -p ./data/staging
success "Gerekli dizinler oluşturuldu"

# Eski container'ları temizle (eğer varsa)
info "Varolan container'lar temizleniyor..."
docker-compose -f docker-compose.yml --env-file staging.env down -v 2>/dev/null || true

# Staging ortamı için container'ları başlat
info "Staging container'ları başlatılıyor..."
docker-compose -f docker-compose.yml --env-file staging.env up -d --build --profile staging

# Veritabanı migrasyonlarını çalıştır
info "Veritabanı migrasyonları çalıştırılıyor..."
docker-compose -f docker-compose.yml --env-file staging.env exec app-staging npx prisma migrate deploy

# Test verilerini yükle (isteğe bağlı)
if [ "$1" == "--with-seed" ]; then
  info "Test verileri yükleniyor..."
  docker-compose -f docker-compose.yml --env-file staging.env exec app-staging node prisma/seed.js
fi

# Sağlık kontrolü
info "Uygulama sağlık kontrolü yapılıyor..."
sleep 10 # Uygulamanın başlaması için biraz bekle

if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
  success "Sağlık kontrolü başarılı!"
else
  warning "Sağlık kontrolü başarısız. Logları kontrol edin."
  docker-compose -f docker-compose.yml --env-file staging.env logs app-staging
fi

success "SepetTakip Staging ortamı kurulumu tamamlandı!"
info "Staging ortamına http://localhost:3001 adresinden erişebilirsiniz." 