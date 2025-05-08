# SepetTakip Platform Genel Bakış

Bu doküman, SepetTakip platformunun genel yapısını, temel modüllerini ve teknik özelliklerini özetlemektedir.

## 🚀 Platform Tanıtımı

SepetTakip, teslimat ve kurye yönetimini kolaylaştıran, çok kullanıcılı bir web platformudur. İşletmelerin siparişlerini, teslimatlarını ve kurye operasyonlarını verimli şekilde yönetmelerine olanak tanır. Aynı zamanda müşterilere siparişlerini gerçek zamanlı olarak takip etme imkanı sunar.

### Hedef Kullanıcılar

Platform, dört farklı kullanıcı tipi için özelleştirilmiş deneyimler sunar:

1. **İşletmeler**: Siparişleri yönetme, kuryeleri atama ve teslimat operasyonlarını izleme
2. **Kuryeler**: Teslimatları alma, rota takibi ve teslimat durumunu güncelleme
3. **Müşteriler**: Siparişleri takip etme, kurye konumunu izleme ve bildirimler alma
4. **Yöneticiler**: Platformu denetleme, raporlama ve sistem ayarlarını yapılandırma

## 🏗️ Teknik Mimari

SepetTakip, modern web teknolojileri kullanılarak geliştirilmiş bir fullstack uygulamadır.

### Frontend

- **Framework**: Next.js 15 (React tabanlı)
- **UI Kütüphanesi**: Tailwind CSS
- **State Yönetimi**: React Hooks ve Context API
- **Harita İntegrasyonu**: Leaflet.js
- **Gerçek Zamanlı İletişim**: WebSockets

### Backend

- **Framework**: Next.js API Routes
- **Veritabanı**: PostgreSQL
- **ORM**: Prisma
- **Kimlik Doğrulama**: JWT (JSON Web Tokens)
- **Dosya Depolama**: Cloudinary

### Hosting

- **Web Hosting**: Vercel
- **Veritabanı Hosting**: Neon Postgres
- **CI/CD**: GitHub Actions

## 📦 Temel Modüller

### 1. Kimlik Doğrulama ve Yetkilendirme

JWT tabanlı kimlik doğrulama sistemi ile güvenli erişim kontrolü sağlanmaktadır. Rol bazlı yetkilendirme (ADMIN, BUSINESS, COURIER, CUSTOMER) ile kullanıcı tipine göre erişim hakları düzenlenmektedir.

[Detaylı bilgi için JWT Kimlik Doğrulama dokümantasyonunu inceleyebilirsiniz.](jwt-auth-implementation.md)

### 2. Teslimat Yönetimi

Siparişlerin oluşturulmasından teslim edilmesine kadar tüm süreçleri kapsayan teslimat yönetim sistemi. Kurye atama, rota optimizasyonu ve gerçek zamanlı teslimat takibi gibi özellikler içerir.

[Detaylı bilgi için Teslimat Yönetim Sistemi dokümantasyonunu inceleyebilirsiniz.](delivery-management-system.md)

### 3. Raporlama Sistemi

İşletmeler ve yöneticiler için çeşitli metrikler sağlayan kapsamlı raporlama modülü. Teslimat performansı, kurye verimi ve bölge bazlı analizler gibi raporlar oluşturabilir.

[Detaylı bilgi için Raporlama Sistemi dokümantasyonunu inceleyebilirsiniz.](reporting-system-implementation.md)

### 4. Bildirim Sistemi

Kullanıcıları sipariş durumu, teslimat güncellemeleri ve platform duyuruları hakkında bilgilendiren bildirim sistemi. E-posta, push ve uygulama içi bildirimler desteklenmektedir.

### 5. Kullanıcı Yönetimi

Kullanıcı kayıtları, profil yönetimi ve rol atamaları için kapsamlı bir kullanıcı yönetim sistemi.

## 🖥️ Kullanıcı Arayüzleri

Platform, her kullanıcı tipi için özelleştirilmiş dashboard ve arayüzler sunar:

### Admin Dashboard

- Platform istatistikleri ve metrikleri
- Kullanıcı yönetimi
- İşletme onayları
- Sistem ayarları
- Kapsamlı raporlama araçları

### İşletme Dashboard

- Sipariş yönetimi
- Kurye atama ve takibi
- Teslimat raporları
- Müşteri bilgileri
- Pazarlama araçları

### Kurye Mobil Arayüzü

- Aktif teslimatlar
- Rota navigasyonu
- Durum güncelleme
- Teslimat kanıtı yükleme

### Müşteri Sipariş Takip

- Sipariş durumu
- Gerçek zamanlı kurye takibi
- Teslimat geçmişi
- Bildirim tercihleri

[Detaylı bilgi için Kullanıcı Arayüzü Tasarım dokümantasyonunu inceleyebilirsiniz.](user-interface-design.md)

## 🔄 Veri Akışı

SepetTakip platformundaki temel veri akışı:

1. **Sipariş Oluşturma**: Müşteri sipariş verir
2. **Sipariş Onaylama**: İşletme siparişi onaylar ve hazırlar
3. **Teslimat Oluşturma**: İşletme teslimat oluşturur ve kurye atar
4. **Teslimat Süreci**: Kurye siparişi alır ve müşteriye teslim eder
5. **Teslimat Tamamlama**: Kurye teslimat kanıtı yükler ve teslimatı tamamlar
6. **Müşteri Onayı**: Müşteri teslimatı onaylar ve değerlendirir
7. **Raporlama**: Veriler analiz edilerek raporlar oluşturulur

## 📊 Veritabanı Şeması

Platform, ilişkisel veritabanı yapısı kullanarak aşağıdaki ana tablolara sahiptir:

- **User**: Tüm kullanıcı tipleri için temel kullanıcı bilgileri
- **Business**: İşletme profilleri ve ayarları
- **Courier**: Kurye profilleri ve durum bilgileri
- **Order**: Sipariş bilgileri ve durumları
- **Delivery**: Teslimat detayları ve takip bilgileri
- **Report**: Raporlama bilgileri
- **ScheduledReport**: Zamanlanmış raporlar için bilgiler
- **Region**: Teslimat bölgeleri ve sınırları
- **Notification**: Kullanıcı bildirimleri

## 🔒 Güvenlik Özellikleri

Platform güvenliği için uygulanan önlemler:

1. **JWT Kimlik Doğrulama**: Güvenli token tabanlı kimlik doğrulama
2. **Rol Bazlı Erişim Kontrolü**: Yetkilendirme sistemi
3. **API Rate Limiting**: DDoS saldırılarına karşı koruma
4. **Veri Şifreleme**: Hassas verilerin şifrelenmesi
5. **HTTPS Zorunluluğu**: Tüm iletişim şifreli bağlantı üzerinden
6. **Güvenli Şifre Politikaları**: Güçlü şifre gereksinimleri
7. **İşlem Logları**: Tüm kritik işlemlerin kayıt altına alınması

## 🚀 Performans Optimizasyonları

Platform performansını artırmak için uygulanan teknikler:

1. **Statik Sayfa Önbellekleme**: SSR ve ISR ile hızlı sayfa yüklemeleri
2. **Lazy Loading**: Bileşenlerin ve verilerin gerektiğinde yüklenmesi
3. **Görüntü Optimizasyonu**: Otomatik formatlama ve boyutlandırma
4. **API Route Önbellekleme**: Sık kullanılan API rotaları için önbellekleme
5. **Database Indexing**: Veritabanı sorgularının optimizasyonu
6. **CDN Kullanımı**: Statik varlıkların küresel dağıtımı

## 📱 Mobil Uyumluluk

Platform, responsive tasarım prensipleri ile geliştirilmiştir:

1. **Progressive Web App (PWA)**: Mobil cihazlarda uygulama benzeri deneyim
2. **Responsive UI**: Tüm ekran boyutlarına uyumlu arayüz
3. **Touch Optimizasyonu**: Dokunmatik arayüzler için optimize edilmiş etkileşimler
4. **Offline Support**: Bağlantı olmadığında temel işlevselliği sürdürme

## 📝 Eksik Kalan Özellikler ve Gelecek Planları

Platformun gelecek gelişim planları:

1. **Mobil Uygulamalar**: Native iOS ve Android uygulamaları
2. **Gelişmiş Analitik**: Daha kapsamlı veri analizi ve tahminleme
3. **Çoklu Dil Desteği**: Uluslararası kullanım için dil çevirileri
4. **Ödeme Entegrasyonları**: Daha fazla ödeme yöntemi desteği
5. **Yapay Zeka Entegrasyonu**: Teslimat optimizasyonu ve tahminleme
6. **Marketplace Özellikleri**: İşletmelerin ürün listeleyebileceği bir pazar yeri
7. **API Geliştirme**: Üçüncü taraf entegrasyonlar için kapsamlı API
8. **Gerçek Zamanlı Sohbet**: Kurye-müşteri iletişimi için sohbet sistemi

## 🔧 Kurulum ve Geliştirme

### Gereksinimler

- Node.js (v18+)
- PostgreSQL
- npm veya yarn

### Kurulum Adımları

1. Repoyu klonlayın: `git clone https://github.com/your-organization/sepettakip.git`
2. Bağımlılıkları yükleyin: `npm install`
3. Çevresel değişkenleri ayarlayın: `.env.example` dosyasını `.env` olarak kopyalayın
4. Veritabanını oluşturun: `npx prisma migrate dev`
5. Geliştirme sunucusunu başlatın: `npm run dev`

### Dağıtım (Deployment)

1. Vercel hesabı oluşturun
2. Repoyu Vercel'e bağlayın
3. Çevresel değişkenleri ayarlayın
4. Dağıtımı başlatın

## 📚 Ek Kaynaklar

- [JWT Kimlik Doğrulama Dokümanı](jwt-auth-implementation.md)
- [Teslimat Yönetim Sistemi Dokümanı](delivery-management-system.md)
- [Raporlama Sistemi Dokümanı](reporting-system-implementation.md)
- [Kullanıcı Arayüzü Tasarım Dokümanı](user-interface-design.md)

---

Bu doküman, SepetTakip platformuna genel bir bakış sağlamaktadır. Spesifik modüller ve özellikler hakkında daha detaylı bilgi için ilgili dokümantasyonları inceleyebilirsiniz. 