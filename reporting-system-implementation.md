# Raporlama Sistemi Dokümantasyonu

Bu doküman, SepetTakip platformunda uygulanan raporlama sisteminin teknik detaylarını ve kullanım kılavuzunu içermektedir.

## 📊 Genel Bakış

Raporlama sistemi, işletme sahipleri ve yöneticilerin teslimat ve kurye performanslarını analiz etmelerini sağlayan kapsamlı bir modüldür. Sistem şu temel bileşenlerden oluşmaktadır:

- **Anlık Raporlar**: Talep üzerine oluşturulan tek seferlik raporlar
- **Zamanlanmış Raporlar**: Belirli aralıklarla otomatik olarak çalışan ve e-posta ile gönderilen raporlar
- **Rapor Geçmişi**: Önceden oluşturulmuş tüm raporların listesi ve indirme seçenekleri

## 🛠️ Teknik Mimari

### Veri Modelleri

#### Report Modeli
```prisma
model Report {
  id          String     @id @default(uuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  options     Json
  status      String     @default("PENDING") // PENDING, PROCESSING, COMPLETED, ERROR
  resultUrl   String?
  description String?
}
```

#### ScheduledReport Modeli
```prisma
model ScheduledReport {
  id          String     @id @default(uuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  options     Json
  isActive    Boolean    @default(true)
  frequency   String     // DAILY, WEEKLY, MONTHLY
  nextRun     DateTime
  lastRun     DateTime?
  description String?
}
```

### API Endpoint'leri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/reports` | GET | Tüm raporların listesini getirir |
| `/api/reports` | POST | Yeni bir rapor oluşturur |
| `/api/reports/:id` | GET | Belirli bir raporun detaylarını getirir |
| `/api/reports/:id` | DELETE | Belirli bir raporu siler |
| `/api/reports/scheduled` | GET | Zamanlanmış raporların listesini getirir |
| `/api/reports/scheduled` | POST | Yeni bir zamanlanmış rapor oluşturur |
| `/api/reports/scheduled/:id/status` | PATCH | Zamanlanmış raporun aktiflik durumunu değiştirir |
| `/api/reports/run-scheduled` | PATCH | Tüm aktif zamanlanmış raporları çalıştırır |

## 📘 Kullanım Kılavuzu

### Admin Paneli Raporlama Sayfası

Admin panelinde raporlama modülüne erişmek için:

1. Admin olarak giriş yapın
2. Sol menüden "Raporlar" seçeneğine tıklayın
3. İki sekme göreceksiniz:
   - **Raporlar**: Oluşturulan tüm raporların listesi
   - **Zamanlanmış Raporlar**: Periyodik olarak çalışan raporların listesi

### Rapor Türleri

Sistem şu rapor türlerini desteklemektedir:

1. **Teslimat Performans Raporu**: Belirli bir zaman dilimindeki teslimat performansı
2. **Kurye Performans Raporu**: Kuryelerin teslimat süreleri ve tamamlama oranları
3. **Bölge Analiz Raporu**: Bölgelere göre teslimat yoğunluğu ve performans metrikleri
4. **Müşteri Memnuniyet Raporu**: Müşteri geri bildirimlerine dayalı performans analizi

### Rapor Formatları

Raporlar aşağıdaki formatlarda indirilebilir:

- **PDF**: Görsel olarak zengin, baskı dostu format
- **Excel**: Detaylı analiz için veri tabloları
- **CSV**: Diğer sistemlerle entegrasyon için düz metin formatı

### Zamanlanmış Rapor Oluşturma

Periyodik olarak çalışacak bir rapor oluşturmak için:

1. "Zamanlanmış Raporlar" sekmesine geçin
2. "Yeni Zamanlanmış Rapor" butonuna tıklayın
3. Rapor türünü, formatını ve filtrelerini seçin
4. Rapor çalışma sıklığını belirleyin:
   - **Günlük**: Her gün belirli bir saatte
   - **Haftalık**: Her hafta belirli bir günde
   - **Aylık**: Her ay belirli bir günde
5. Rapor sonuçlarının gönderileceği e-posta adreslerini girin
6. "Oluştur" butonuna tıklayın

## 💻 Kodlama Detayları

### Rapor İşleme Süreci

```typescript
async function processReport(reportId: string) {
  // Rapor durumunu PROCESSING olarak güncelle
  await prisma.report.update({
    where: { id: reportId },
    data: { status: 'PROCESSING' }
  });
  
  try {
    // Rapor seçeneklerini al
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      throw new Error('Rapor bulunamadı');
    }
    
    // Rapor verilerini topla
    const options = report.options as ReportOptions;
    const data = await collectReportData(options);
    
    // Rapor dosyasını oluştur
    const fileUrl = await generateReportFile(data, options.format);
    
    // Raporu güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        resultUrl: fileUrl
      }
    });
    
    // Kullanıcıya bildirim gönder
    await sendReportNotification(report.userId, reportId);
    
  } catch (error) {
    console.error('Rapor işleme hatası:', error);
    
    // Hata durumunda raporu güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'ERROR'
      }
    });
  }
}
```

### Zamanlanmış Rapor Çalıştırma

```typescript
export async function runScheduledReports() {
  // Çalıştırılması gereken zamanlanmış raporları bul
  const now = new Date();
  const reportsToRun = await prisma.scheduledReport.findMany({
    where: {
      isActive: true,
      nextRun: {
        lte: now
      }
    }
  });
  
  for (const scheduledReport of reportsToRun) {
    // Her rapor için yeni bir rapor kaydı oluştur
    const report = await prisma.report.create({
      data: {
        userId: scheduledReport.userId,
        options: scheduledReport.options,
        status: 'PENDING',
        description: `Scheduled: ${scheduledReport.description}`
      }
    });
    
    // Rapor işleme sürecini başlat
    processReport(report.id);
    
    // Bir sonraki çalışma zamanını hesapla
    const nextRun = calculateNextRun(scheduledReport.frequency, now);
    
    // Zamanlanmış raporu güncelle
    await prisma.scheduledReport.update({
      where: { id: scheduledReport.id },
      data: {
        lastRun: now,
        nextRun
      }
    });
  }
  
  return reportsToRun.length;
}
```

## 🚀 UI Bileşenleri

### Admin Raporlar Sayfası

Admin raporlama sayfası, iki sekme (tab) halinde düzenlenmiştir:

1. **Raporlar Sekmesi**: Tüm raporların listesi ve yeni rapor oluşturma arayüzü
2. **Zamanlanmış Raporlar Sekmesi**: Periyodik raporların listesi ve yönetimi

```tsx
function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Raporları ve zamanlanmış raporları yükle
  useEffect(() => {
    fetchReports();
    fetchScheduledReports();
  }, []);
  
  // Sekme değişimi
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Raporlama Paneli</h1>
      
      {/* Sekmeler */}
      <div className="flex border-b mb-4">
        <button 
          className={`px-4 py-2 ${activeTab === 'reports' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => handleTabChange('reports')}
        >
          Raporlar
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'scheduled' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => handleTabChange('scheduled')}
        >
          Zamanlanmış Raporlar
        </button>
      </div>
      
      {/* Aktif sekmeye göre içerik */}
      {activeTab === 'reports' ? (
        <ReportsTab reports={reports} onRefresh={fetchReports} />
      ) : (
        <ScheduledReportsTab 
          scheduledReports={scheduledReports} 
          onRefresh={fetchScheduledReports} 
          onToggleStatus={toggleScheduledReportStatus}
        />
      )}
    </div>
  );
}
```

## 📝 Eksik Kalan Özellikler ve İyileştirmeler

1. **Rapor Şablonları**: Kullanıcının kendi rapor şablonlarını oluşturup kaydedebilmesi
2. **Gelişmiş Veri Görselleştirme**: Grafikler ve görseller içeren daha detaylı rapor formatları
3. **E-posta Entegrasyonu**: Rapor sonuçlarının e-posta ile otomatik gönderimi
4. **Gerçek Zamanlı Önizleme**: Rapor oluşturulmadan önce ön izleme yapılabilmesi
5. **Arşivleme ve Otomatik Temizleme**: Eski raporların otomatik arşivlenmesi
6. **API Entegrasyonu**: Harici sistemlerin rapor oluşturması için API desteği
7. **Çoklu Dil Desteği**: Raporların farklı dillerde oluşturulabilmesi
8. **Dashboard Widget'ları**: Ana panelde gösterilebilecek rapor widget'ları
9. **Cron Job Kurulumu**: Zamanlanmış raporların otomatik çalışması için düzgün bir cron job mekanizması

## 🔗 Entegrasyon Noktaları

Raporlama sistemi aşağıdaki modüllerle entegre çalışmaktadır:

1. **Kullanıcı Yönetimi**: Rol bazlı erişim kontrolü
2. **Teslimat Modülü**: Teslimat verilerinin raporlanması
3. **Kurye Yönetimi**: Kurye performans metrikleri
4. **Müşteri Geri Bildirimleri**: Müşteri memnuniyet verileri

---

Bu dokümantasyon, raporlama sisteminin mevcut durumunu ve gelecek planlarını özetlemektedir. Ek sorularınız veya önerileriniz için lütfen geliştirici ekibiyle iletişime geçin. 