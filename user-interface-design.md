# Kullanıcı Arayüzü Tasarım Dokümantasyonu

Bu doküman, SepetTakip platformunun kullanıcı arayüzü tasarım prensiplerini ve uygulanmış arayüz bileşenlerini detaylandırmaktadır.

## 🎨 Tasarım Felsefesi

SepetTakip platformunun kullanıcı arayüzü, aşağıdaki temel prensiplere dayanmaktadır:

1. **Kullanıcı Dostu**: Sezgisel, kolay öğrenilebilir ve kullanılabilir arayüzler
2. **Responsive Tasarım**: Mobil, tablet ve masaüstü cihazlarda optimum görünüm
3. **Tutarlılık**: Tüm platformda tutarlı tasarım dili ve bileşenler
4. **Erişilebilirlik**: Farklı kullanıcı ihtiyaçlarına uygun arayüzler
5. **Performans Odaklı**: Hızlı yüklenme süreleri ve akıcı kullanıcı deneyimi

## 🎯 Hedef Kullanıcılar

Platform, dört farklı kullanıcı tipi için özelleştirilmiş arayüzler sunmaktadır:

1. **Admin**: Platform yöneticileri için kapsamlı kontrol panelleri
2. **İşletme**: İşletme sahipleri için siparişleri ve kuryeleri yönetme arayüzleri
3. **Kurye**: Kuryeler için teslimat ve rota yönetimi için mobil uyumlu arayüzler
4. **Müşteri**: Son kullanıcılar için sipariş takibi ve bildirim arayüzleri

## 🔍 UI Bileşenleri

### Kimlik Doğrulama Sayfaları

#### Giriş Sayfası

Kullanıcı girişi sayfası, iki bölümden oluşmaktadır:

1. **Sol Panel**: Tanıtım içeriği ve platformun öne çıkan özellikleri
2. **Sağ Panel**: Giriş formu ve kullanıcı tipi seçimi

```tsx
<div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 to-indigo-100">
  {/* Sol taraf - Tanıtım Bölümü */}
  <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-10">
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">SepetTakip Platformu</h1>
      <p className="text-lg mb-8">Sipariş ve kurye yönetimi için tüm ihtiyaçlarınız tek yerde.</p>
      
      <div className="space-y-6">
        {/* Özellik kartları */}
      </div>
    </div>
  </div>
  
  {/* Sağ taraf - Giriş Formu */}
  <div className="w-full md:w-1/2 flex items-center justify-center p-6">
    <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Giriş Yap</h1>
        <p className="text-gray-600 mt-2">Hesabınıza giriş yaparak devam edin</p>
      </div>
      
      {/* Giriş formu */}
    </div>
  </div>
</div>
```

#### Kayıt Sayfası

Kayıt sayfası, giriş sayfasına benzer bir yapıda tasarlanmıştır:

1. **Sol Panel**: Platform tanıtımı ve faydalar
2. **Sağ Panel**: Kayıt formu ve kullanıcı tipi seçimi

Özel özellikler:
- Şifre gücü göstergesi
- Form validasyonu
- Kullanıcı tipi seçimi (Müşteri, İşletme, Kurye)

### Dashboard Tasarımları

Her kullanıcı tipi için özelleştirilmiş dashboard tasarımları:

#### Admin Dashboard

```tsx
<div className="min-h-screen bg-gray-100">
  {/* Üst Menü */}
  <header className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex">
          <div className="flex-shrink-0 flex items-center">
            <img className="h-8 w-auto" src="/logo.svg" alt="SepetTakip" />
          </div>
          <nav className="ml-6 flex space-x-8">
            {/* Ana menü öğeleri */}
          </nav>
        </div>
        <div className="flex items-center">
          {/* Kullanıcı menüsü */}
        </div>
      </div>
    </div>
  </header>

  {/* Ana İçerik */}
  <main>
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Dashboard kartları */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* İstatistik kartları */}
      </div>
      
      {/* Raporlar ve teslimatlar */}
    </div>
  </main>
</div>
```

#### İşletme Dashboard

İşletme dashboard'u, sipariş yönetimi ve kurye performans takibi için optimize edilmiştir:

- Aktif siparişler tablosu
- Kurye durum haritası
- Günlük/haftalık teslimat istatistikleri
- Hızlı rapor oluşturma bölümü

#### Kurye Dashboard

Kurye dashboard'u, mobil uyumlu ve kolay erişilebilir şekilde tasarlanmıştır:

- Güncel teslimat listesi
- Navigasyon desteği
- Teslimat güncelleme formları
- Performans istatistikleri

### Raporlama Arayüzleri

#### Rapor Listeleme Ekranı

```tsx
<div className="bg-white shadow-md rounded-lg overflow-hidden">
  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
    <h3 className="text-lg leading-6 font-medium text-gray-900">Raporlar</h3>
    <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
      Yeni Rapor
    </button>
  </div>
  
  <div className="border-t border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {/* Tablo başlıkları */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {/* Rapor satırları */}
      </tbody>
    </table>
  </div>
  
  {/* Sayfalama */}
  <nav className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
    {/* Sayfalama kontrolleri */}
  </nav>
</div>
```

#### Rapor Oluşturma Formu

Rapor oluşturma formu, kullanıcı dostu ve kapsamlı bir arayüz sunar:

- Rapor türü seçimi
- Tarih aralığı filtreleme
- Bölge/kurye/müşteri bazlı filtreleme seçenekleri
- Format seçenekleri (PDF, Excel, CSV)
- Zamanlanmış rapor ayarları

### Bildirim Sistemi

Kullanıcılar için özelleştirilmiş bildirim bileşenleri:

```tsx
<div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end">
  <div className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto">
    <div className="rounded-lg shadow-xs overflow-hidden">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {/* Bildirim ikonu */}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              Bildirim Başlığı
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Bildirim içeriği burada görüntülenir.
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            {/* Kapat butonu */}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 📱 Mobil Uyumluluk

Platform, tamamen responsive tasarım prensiplerine göre geliştirilmiştir:

### Mobil Menü

```tsx
<div className="md:hidden">
  <button className="mobile-menu-button">
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
  
  <div className="mobile-menu hidden">
    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</a>
    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Teslimatlar</a>
    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Raporlar</a>
    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Ayarlar</a>
  </div>
</div>
```

### Responsive Tablo

Mobil cihazlarda tabloların görüntülenmesi için özel tasarım:

```tsx
<div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        {/* Tablo içeriği */}
      </table>
    </div>
  </div>
</div>
```

## 🎭 UI Bileşen Kütüphanesi

Projede kullanılan başlıca UI bileşenleri:

### Butonlar

```tsx
// Primary Button
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
  Primary Button
</button>

// Secondary Button
<button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200">
  Secondary Button
</button>

// Outline Button
<button className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition duration-200">
  Outline Button
</button>
```

### Form Elemanları

```tsx
// Text Input
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input
    type="email"
    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="örnek@email.com"
  />
</div>

// Select Input
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Rapor Türü</label>
  <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
    <option>Teslimat Raporu</option>
    <option>Kurye Performans Raporu</option>
    <option>Bölge Analiz Raporu</option>
  </select>
</div>
```

### Kartlar

```tsx
// Basit Kart
<div className="bg-white shadow-md rounded-lg overflow-hidden">
  <div className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Kart Başlığı</h3>
    <p className="text-gray-600">
      Kart içeriği buraya gelecek. Bu bir örnek açıklamadır.
    </p>
  </div>
</div>

// İstatistik Kartı
<div className="bg-white shadow-md rounded-lg overflow-hidden">
  <div className="px-4 py-5 sm:p-6">
    <dt className="text-sm font-medium text-gray-500 truncate">
      Toplam Teslimat
    </dt>
    <dd className="mt-1 text-3xl font-semibold text-gray-900">
      2,651
    </dd>
  </div>
  <div className="bg-gray-50 px-4 py-3">
    <div className="text-sm">
      <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
        Detayları Görüntüle
      </a>
    </div>
  </div>
</div>
```

## 📝 Eksik Kalan Özellikler ve İyileştirmeler

1. **Dark Mode Desteği**: Karanlık tema seçeneği eklenebilir
2. **Tema Özelleştirme**: Kullanıcıların tercihlerine göre tema ayarları
3. **Animasyon İyileştirmeleri**: Sayfa geçişleri ve bileşen animasyonları
4. **İleri Seviye Grafik Bileşenleri**: Daha kapsamlı veri görselleştirme
5. **Drag & Drop Arayüzler**: Sürükle bırak ile sipariş düzenleme özellikleri
6. **Offline Modu**: İnternet bağlantısı olmadan da çalışabilme
7. **Klavye Kısayolları**: İleri seviye kullanıcılar için klavye kısayolları
8. **Erişilebilirlik İyileştirmeleri**: WCAG standartlarına tam uyumluluk

## 🔄 Tasarım Sisteminin Geliştirilmesi

Gelecekte tasarım sisteminin geliştirilmesi için yapılacaklar:

1. **Storybook Entegrasyonu**: Tüm UI bileşenlerinin dokümantasyonu
2. **Tasarım Belgeleri**: Stil kılavuzu ve tasarım prensipleri
3. **Komponent Kütüphanesi**: Tekrar kullanılabilir bileşenlerin standartlaştırılması
4. **UX Testleri**: Kullanıcı deneyimi testleri ve iyileştirmeler

---

Bu dokümantasyon, SepetTakip platformunun kullanıcı arayüzü tasarım prensiplerini ve bileşenlerini özetlemektedir. Tasarım sistemimiz, kullanıcı deneyimini en üst düzeye çıkarmak için sürekli geliştirilmektedir. 