# SepetTakip - Sipariş ve Kurye Yönetim Platformu

SepetTakip, e-ticaret ve yemek teslimatı platformları için geliştirilmiş kapsamlı bir sipariş ve kurye yönetim sistemidir. Next.js, Prisma ORM ve modern web teknolojileri kullanılarak geliştirilmiştir.

## Özellikler

### Kurye Yönetimi
- ✅ Konum Takibi & Harita Entegrasyonu
  - Google Maps/Leaflet entegrasyonu
  - WebSocket ile canlı konum takibi
  - Kurye rotası optimizasyonu
  - Teslimat bölgesi sınırlamaları

- ✅ Kurye Performans Metrikleri
  - Teslimat süreleri analizi
  - Müşteri memnuniyet puanları
  - Günlük/haftalık/aylık teslimat istatistikleri
  - Performans bazlı prim sistemi

- ✅ Kurye Atama Algoritması
  - Akıllı sipariş eşleştirme
  - Mesafe ve süre optimizasyonu
  - Kurye yoğunluk dengesi
  - Öncelikli siparişler için özel atama

### Sipariş Yönetimi
- ✅ Sipariş oluşturma ve takip
- ✅ Sipariş durumu güncelleme
- ✅ Sipariş geçmişi
- ✅ Sipariş filtreleme ve arama
- ✅ Otomatik kurye atama algoritması

### Teslimat Bölgesi Yönetimi
- ✅ Bölge oluşturma ve düzenleme
- ✅ Bölge-kurye eşleştirme
- ✅ Bölge içi/dışı kontrol
- ✅ Bölge istatistikleri
- ✅ Alternatif bölge önerileri

### Bildirim Sistemi
- ✅ Push, E-posta ve SMS bildirimleri
- ✅ Bildirim tercihleri ve şablonları
- ✅ Bildirim geçmişi

### Raporlama ve Analitik
- ✅ Performans metrikleri ve teslimat istatistikleri
- ✅ Gelişmiş filtreleme seçenekleri
- ✅ Zenginleştirilmiş veri görselleştirme
- ✅ Otomatik rapor oluşturma ve gönderimi

### Kullanıcı Rolleri
- ✅ Süper Admin
- ✅ Müşteri (İşletme)
- ✅ Kurye
- ✅ Alıcı

### Entegrasyonlar
- ✅ Yemeksepeti API
- ✅ Getir API
- ✅ Trendyol API
- ✅ Migros API

## Başlarken

### Kurulum

```bash
# Projeyi klonlayın
git clone https://github.com/kullaniciadi/sepettakip.git
cd sepettakip

# Bağımlılıkları yükleyin
npm install

# Veritabanını hazırlayın
npx prisma migrate dev

# Geliştirme sunucusunu başlatın
npm run dev
```

### Docker ile Kurulum ve Çalıştırma

SepetTakip, Docker kullanımı için optimize edilmiştir. Aşağıdaki adımları izleyerek uygulamayı Docker konteynerlerinde çalıştırabilirsiniz:

#### 1. Geliştirme Ortamında Çalıştırma

```bash
# Geliştirme ortamı için Docker Compose kullanarak çalıştırma
cp .docker.env .env
docker-compose up -d --profile dev

# Güncellemeler için servisi yeniden başlatma
docker-compose restart app-dev
```

#### 2. Üretim Ortamında Çalıştırma

```bash
# Üretim ortamı için Docker Compose kullanarak çalıştırma
docker-compose up -d --profile prod

# Container loglarını izleme
docker-compose logs -f
```

#### 3. Docker İçindeki Database Migrasyonları

```bash
# Container içinde Prisma migrasyonlarını çalıştırma
docker-compose exec app-dev npx prisma migrate dev

# Veritabanı seed verilerini yükleme
docker-compose exec app-dev npx prisma db seed
```

#### 4. Health Check Kontrolü

```bash
# Uygulamanın sağlık durumunu kontrol etme
curl http://localhost:3000/api/health
```

### Ortam Değişkenleri

Projenin çalışması için gerekli olan ortam değişkenlerini `.env` dosyasında tanımlayın:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sepettakip"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXT_PUBLIC_MAPS_API_KEY="your-google-maps-api-key"
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
```

## Teknoloji Yığını

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Veritabanı**: PostgreSQL
- **Kimlik Doğrulama**: NextAuth.js
- **Harita Entegrasyonu**: Leaflet/Google Maps
- **Gerçek Zamanlı İletişim**: WebSockets
- **UI Bileşenleri**: Shadcn UI
- **İkon Paketi**: Lucide Icons
- **Containerization**: Docker, Docker Compose

## Proje Yapısı

### Kök Dizin
- `/app` - Next.js uygulama yönlendiricisi
- `/components` - React bileşenleri
- `/hooks` - Özel React hooks
- `/lib` - Yardımcı fonksiyonlar ve kütüphaneler
- `/services` - Harici API entegrasyonları
- `/store` - Durum yönetimi (Zustand)
- `/styles` - Global stil dosyaları
- `/types` - TypeScript tipler
- `/utils` - Yardımcı fonksiyonlar
- `/public` - Statik dosyalar

## Kullanıcı Rolleri ve Sayfalar

### Süper Admin
- **Genel Dashboard**
- **Kullanıcı Yönetimi**
- **Sistem Ayarları**
- **Raporlar**

### Müşteri (İşletme)
- **İşletme Dashboard**
- **Sipariş Yönetimi**
- **Kurye Atama**
- **Faturalar ve Ödemeler**

### Kurye
- **Kurye Dashboard**
- **Teslimat Yönetimi**
- **Konum ve Navigasyon**
- **Kazanç ve Ödemeler**

### Alıcı
- **Sipariş Takibi**
- **Profil ve Adres Yönetimi**
- **Değerlendirme ve Geribildirim**

## Katkıda Bulunma

1. Projeyi forklayın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inize push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## İletişim

Proje Yöneticisi - [@twitter_handle](https://twitter.com/twitter_handle) - email@example.com

Proje Linki: [https://github.com/kullaniciadi/sepettakip](https://github.com/kullaniciadi/sepettakip)
