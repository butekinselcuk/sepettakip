# SepetTakip - Sipariş ve Kurye Yönetim Platformu

SepetTakip, e-ticaret ve yemek teslimatı platformları için geliştirilmiş kapsamlı bir sipariş ve kurye yönetim sistemidir. Next.js, Prisma ORM ve modern web teknolojileri kullanılarak geliştirilmiştir.
SepetTakip, e-ticaret ve yemeksepeti platformları için geliştirilmiş kapsamlı bir sipariş ve kurye yönetim sistemidir. Next.js, Prisma ORM ve modern web teknolojileri kullanılarak geliştirilmiştir.

## Özellikler

### Kurye Yönetimi
- ✅ Konum Takibi & Harita Entegrasyonu
  - Google Maps/Leaflet entegrasyonu
  - WebSocket ile canlı konum takibi
  - WebSocket ile live konum takibi
  - Kurye rotası optimizasyonu
  - Teslimat bölgesi sınırlamaları

- ✅ Kurye Performans Metrikleri
  - Teslimat süreleri analizi
  - Müşteri memnuniyet puanları
  - Günlük/haftalık/aylık teslimat istatistikleri

  - Performans bazlı prim sistem

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
git clone https://github.com/butekinselcuk/sepettakip.git
cd sepettakip

# Bağımlılıkları yükleyin
npm install

# Veritabanını hazırlayın
npx prisma migrate dev

# Geliştirme sunucusunu başlatın
npm run dev
```



































































































































































