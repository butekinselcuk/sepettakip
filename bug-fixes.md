# SepetTakip Hata Düzeltme Listesi

## 1. Giriş ve Kimlik Doğrulama Sorunları

- [ ] **Login sayfası hataları**
   - [ ] Konsoldaki bağlantı hataları düzeltilmeli (`runtime.lastError: Could not establish connection`)
   - [ ] Başarılı giriş yapıldıktan sonra doğru sayfaya yönlendirme kontrolü
   - [ ] Token oluşturma ve saklanma kontrolü
   - [ ] Şifre doğrulama mekanizmasının kontrolü

- [ ] **Rol bazlı erişim sorunları**
   - [ ] Admin kullanıcı girişi kontrolü
   - [ ] İşletme kullanıcı girişi kontrolü
   - [ ] Kurye kullanıcı girişi kontrolü
   - [ ] Müşteri kullanıcı girişi kontrolü

- [ ] **Middleware kontrolü**
   - [ ] Token doğrulama mantığı kontrol edilmeli
   - [ ] Rol bazlı erişim kontrolü güncellenmeli
   - [ ] Korumalı rotaların doğru şekilde tanımlanması

## 2. API Endpoint Sorunları

- [ ] **Sipariş API Endpointleri**
   - [ ] `/api/orders` GET isteği ve sorgu parametreleri
   - [ ] `/api/orders` POST isteği ve veri doğrulama
   - [ ] `/api/orders/[id]` GET isteği ve ilişkili verileri alma
   - [ ] `/api/orders/[id]` PATCH isteği ve durum güncelleme
   - [ ] `/api/orders/[id]` DELETE isteği ve silme yetkilendirmesi

- [ ] **Kurye API Endpointleri**
   - [ ] `/api/couriers` GET isteği ve filtreleme
   - [ ] `/api/couriers` POST isteği ve kurye oluşturma
   - [ ] Kurye konum güncelleme endpointi (`updateCourierLocation`)
   - [ ] Kurye atama ve durum güncelleme endpointleri

- [ ] **Bildirim API Endpointleri**
   - [ ] Bildirim oluşturma ve yönetim API'leri
   - [ ] Bildirim tercihi API'leri

## 3. Veritabanı ve Prisma Sorunları

- [ ] **Veritabanı Bağlantısı**
   - [ ] PostgreSQL bağlantı dizesi kontrolü
   - [ ] Prisma istemci oluşturma kontrolü
   - [ ] Veritabanı pool yapılandırması

- [ ] **Şema İlişkileri**
   - [ ] Order-Customer ilişkisi düzeltilmeli
   - [ ] Order-Courier ilişkisi düzeltilmeli
   - [ ] Diğer ilişkili modellerin kontrolü

- [ ] **Veri Tipi Sorunları**
   - [ ] Status enum değerlerinin kontrolü
   - [ ] Tarih ve zaman tipi alanlarının kontrolü
   - [ ] JSON alanlarının düzgün çalışması

- [ ] **Seed Script**
   - [ ] Örnek veri oluşturma scriptinin güncellenmesi
   - [ ] Örnek verilerle test etme

## 4. Frontend/UI Sorunları

- [ ] **Dashboard Sayfası**
   - [ ] Filtreleme kontrollerinin düzeltilmesi
   - [ ] Tarih aralığı seçicilerinin çalışması
   - [ ] Metrik kartlarının veri gösterimi

- [ ] **Sipariş Yönetimi**
   - [ ] Sipariş listeleme ve filtreleme
   - [ ] Sipariş detay sayfası
   - [ ] Sipariş durum güncellemesi
   - [ ] Kurye atama işlevi

- [ ] **Kurye Yönetimi**
   - [ ] Kurye listeleme ve filtreleme
   - [ ] Kurye konum takibi
   - [ ] Kurye performans göstergeleri

- [ ] **Rapor ve Analitik Sayfaları**
   - [ ] Grafik ve tablo veri gösterimi
   - [ ] Raporlama araçlarının çalışması

## 5. Konsol Hataları

- [ ] **"Konum güncellemesi başarısız" hatası**
   - [ ] `app/courier/dashboard/page.tsx` dosyasında konum güncelleme fonksiyonu
   - [ ] Hata yakalama ve gösterme mekanizması

- [ ] **Bağlantı sorunları**
   - [ ] API çağrılarındaki timeout ve bağlantı hataları
   - [ ] WebSocket bağlantı sorunları (eğer kullanılıyorsa)

- [ ] **404 ve 500 hataları**
   - [ ] Eksik endpoint veya sayfa yönlendirmeleri
   - [ ] Sunucu taraflı hatalar ve loglama

## 6. Roller İçin Erişilebilirlik Kontrolü

- [ ] **Admin Rolü**
   - [ ] Dashboard erişimi (/dashboard)
   - [ ] Kullanıcı yönetimi sayfası (/admin/users)
   - [ ] Kurye yönetimi sayfası (/admin/couriers)
   - [ ] Sipariş yönetimi sayfası (/admin/orders)
   - [ ] Raporlar sayfası (/admin/reports)

- [ ] **İşletme Rolü**
   - [ ] İşletme dashboard erişimi (/business/dashboard)
   - [ ] Sipariş yönetimi (/business/orders)
   - [ ] Kendi raporları (/business/reports)

- [ ] **Kurye Rolü**
   - [ ] Kurye dashboard erişimi (/courier/dashboard)
   - [ ] Aktif teslimatlar (/courier/deliveries)
   - [ ] Konum güncelleme özelliği

- [ ] **Müşteri Rolü**
   - [ ] Sipariş takibi (/customer/orders)
   - [ ] Profil yönetimi (/customer/profile)

## 7. Mobil Uyumluluk ve Responsive Tasarım

- [ ] **Responsive kontroller**
   - [ ] Mobil cihazlarda dashboard görünümü
   - [ ] Tablet cihazlarda kullanılabilirlik
   - [ ] Farklı ekran boyutlarında menü davranışı

## 8. Performans İyileştirmeleri

- [ ] **Sayfa yükleme süreleri**
   - [ ] Dashboard yükleme performansı
   - [ ] API yanıt süreleri
   - [ ] Veri önbelleğe alma stratejileri

- [ ] **Veritabanı sorgularının optimizasyonu**
   - [ ] N+1 sorgu problemlerinin çözülmesi
   - [ ] İndekslerin kontrolü ve optimizasyonu

## 9. Kullanılabilirlik İyileştirmeleri

- [ ] **Hata mesajları**
   - [ ] Kullanıcı dostu hata mesajları
   - [ ] İşlem başarı bildirimleri
   - [ ] Yönlendirme ve bilgi mesajları

- [ ] **Form validasyonları**
   - [ ] Giriş formu validasyonu
   - [ ] Sipariş formu validasyonu
   - [ ] Kurye atama formu validasyonu

## 10. Veritabanından Gerçek Veri Gösterme

- [ ] **Mock veri yerine gerçek veri kontrolü**
   - [ ] Dashboard metriklerinin gerçek veriden hesaplanması
   - [ ] Sipariş listesinin veritabanından çekilmesi
   - [ ] Kurye performans verilerinin gerçek zamanlı hesaplanması
   - [ ] Raporların gerçek verilerden oluşturulması

## Adım Adım Çözüm Yaklaşımı

1. **Veritabanı ve API katmanı sorunlarını öncelikli çöz**
   - Şema ilişkilerini düzelt
   - API endpoint'lerini test et ve hataları gider
   - Veri tipi sorunlarını gider

2. **Kimlik doğrulama ve yetkilendirme sorunlarını çöz**
   - Middleware ve token kontrollerini düzelt
   - Rol bazlı erişim kontrolünü güncelle

3. **Frontend ve UI sorunlarını çöz**
   - Sayfa yapısı ve komponentleri düzelt
   - Veri akışını kontrol et
   - Eksik sayfaları tamamla

4. **Konsol hatalarını gider**
   - JavaScript hatalarını düzelt
   - API çağrı hatalarını çöz

5. **Performans ve kullanılabilirlik iyileştirmeleri yap**
   - Sayfa yükleme sürelerini optimize et
   - Kullanıcı deneyimini iyileştir

## Öncelikli Çözülecek Sorunlar

1. Veritabanı bağlantısı ve şema ilişkileri
2. Kimlik doğrulama ve yetkilendirme
3. Kurye konum güncelleme hatası
4. API endpoint sorunları
5. Dashboard veri gösterimi 