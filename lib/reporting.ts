import { prisma } from './prisma';

export type ReportType = 'ORDERS' | 'DELIVERIES' | 'REVENUE' | 'USERS';
export type ReportFormat = 'PDF' | 'CSV' | 'EXCEL';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ReportOptions {
  startDate: Date;
  endDate: Date;
  type: ReportType;
  format: ReportFormat;
  filters?: {
    region?: string;
    courierId?: string;
    businessId?: string;
    status?: string;
    userId?: string;
  };
  recipients?: string[];
  title?: string;
  description?: string;
}

export interface ReportData {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  createdAt: Date;
  completedAt?: Date;
  fileUrl?: string;
  options: ReportOptions;
  error?: string;
}

/**
 * Rapor oluşturma işlemini başlatır
 */
export async function createReport(options: ReportOptions): Promise<ReportData> {
  try {
    // Raporun temel bilgilerini veritabanına kaydet
    const report = await prisma.report.create({
      data: {
        title: options.title || `${options.type} Rapor`,
        description: options.description || '',
        type: options.type,
        format: options.format,
        status: 'PENDING',
        options: JSON.stringify(options),
        userId: options.filters?.userId || 'system',
      },
    });

    // Burada asenkron olarak rapor oluşturma işlemini başlatabilirsiniz
    // Örneğin bir kuyruk sistemi veya setTimeout ile
    setTimeout(() => processReport(report.id), 100);

    return {
      id: report.id,
      title: report.title,
      description: report.description || '',
      type: report.type as ReportType,
      format: report.format as ReportFormat,
      status: report.status as ReportStatus,
      createdAt: report.createdAt,
      options,
    };
  } catch (error) {
    console.error("Rapor oluşturma hatası:", error);
    throw error;
  }
}

/**
 * Rapor oluşturma işlemi
 */
async function processReport(reportId: string): Promise<void> {
  try {
    // Rapor durumunu güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'PROCESSING' },
    });

    // Rapor bilgilerini al
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Rapor bulunamadı');
    }

    const options = JSON.parse(report.options || '{}') as ReportOptions;

    // Rapor tipine göre veri toplama
    const data = await collectReportData(options);

    // Rapor formatına göre dönüştürme
    const reportUrl = await generateReportFile(data, options.format, report.id);

    // Başarılı ise rapor durumunu güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        fileUrl: reportUrl,
      },
    });

    // Alıcılar tanımlanmışsa raporu e-posta ile gönder
    if (options.recipients && options.recipients.length > 0) {
      await sendReportByEmail(reportId, options.recipients);
    }
  } catch (error) {
    // Hata durumunda rapor durumunu güncelle
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
    });
  }
}

/**
 * Rapor için verileri toplar
 */
async function collectReportData(options: ReportOptions): Promise<any> {
  const { startDate, endDate, filters, type } = options;

  let data: any = {
    period: {
      startDate,
      endDate,
    },
    generatedAt: new Date(),
  };

  try {
    // Rapor tipine göre farklı veriler topla
    switch (type) {
      case 'ORDERS':
        // Sipariş verileri
        data.orders = await prisma.delivery.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            ...(filters?.region ? { zone: { name: filters.region } } : {}),
            ...(filters?.courierId ? { courierId: filters.courierId } : {}),
            ...(filters?.status ? { status: filters.status } : {}),
          },
          include: {
            courier: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                }
              }
            },
            customer: true,
          },
        });

        // Sipariş istatistikleri
        data.stats = {
          totalOrders: data.orders.length,
          completedOrders: data.orders.filter((d: any) => d.status === 'COMPLETED').length,
          cancelledOrders: data.orders.filter((d: any) => d.status === 'FAILED').length,
          averageDeliveryTime: calculateAverageDeliveryTime(data.orders),
        };
        break;

      case 'DELIVERIES':
        // Teslimat verileri
        data.deliveries = await prisma.delivery.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            ...(filters?.region ? { zone: { name: filters.region } } : {}),
            ...(filters?.courierId ? { courierId: filters.courierId } : {}),
            ...(filters?.status ? { status: filters.status } : {}),
          },
          include: {
            courier: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  }
                }
              }
            },
            zone: true,
            logs: true,
          },
        });

        // Teslimat istatistikleri
        data.stats = {
          totalDeliveries: data.deliveries.length,
          onTimeDeliveries: data.deliveries.filter((d: any) => 
            d.actualArrival && d.estimatedArrival && 
            new Date(d.actualArrival) <= new Date(d.estimatedArrival)
          ).length,
          delayedDeliveries: data.deliveries.filter((d: any) => 
            d.actualArrival && d.estimatedArrival && 
            new Date(d.actualArrival) > new Date(d.estimatedArrival)
          ).length,
          averageDistance: data.deliveries.reduce((sum: number, d: any) => sum + (d.actualDistance || 0), 0) / data.deliveries.length,
        };
        break;

      case 'REVENUE':
        // Gelir verileri ve istatistikler
        // Bu kısım şirketin gelir modeline göre uyarlanmalıdır
        data.message = "Gelir raporu için model yapılandırması gerekiyor";
        break;

      case 'USERS':
        // Kullanıcı verileri
        data.users = await prisma.user.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        // Kullanıcı istatistikleri
        data.stats = {
          totalUsers: data.users.length,
          customerUsers: data.users.filter((u: any) => u.role === 'CUSTOMER').length,
          businessUsers: data.users.filter((u: any) => u.role === 'BUSINESS').length,
          courierUsers: data.users.filter((u: any) => u.role === 'COURIER').length,
          adminUsers: data.users.filter((u: any) => u.role === 'ADMIN').length,
        };
        break;

      default:
        throw new Error(`Desteklenmeyen rapor tipi: ${type}`);
    }

    return data;
  } catch (error) {
    console.error("Rapor verisi toplama hatası:", error);
    throw error;
  }
}

/**
 * Ortalama teslimat süresini hesaplar (dakika cinsinden)
 */
function calculateAverageDeliveryTime(deliveries: any[]): number {
  const completedDeliveries = deliveries.filter(
    d => d.status === 'COMPLETED' && d.deliveredAt && d.pickedUpAt
  );

  if (completedDeliveries.length === 0) return 0;

  const totalMinutes = completedDeliveries.reduce((sum, d) => {
    const diffMs = new Date(d.deliveredAt).getTime() - new Date(d.pickedUpAt).getTime();
    return sum + diffMs / (1000 * 60); // ms'den dakikaya dönüştür
  }, 0);

  return Math.round(totalMinutes / completedDeliveries.length);
}

/**
 * Belirtilen formatta rapor dosyası oluşturur
 */
async function generateReportFile(data: any, format: ReportFormat, reportId: string): Promise<string> {
  // Bu fonksiyon seçilen formata göre rapor dosyası oluşturur ve URL döndürür
  // Gerçekte burada HTML template'leri, PDF oluşturma kütüphaneleri veya 
  // Excel dosyası oluşturma işlemleri yapılabilir

  // Örnek için sadece URL döndürüyoruz
  // Gerçek uygulamada dosyayı oluşturup bir CDN'e yükleyip URL döndürebilirsiniz
  
  switch (format) {
    case 'PDF':
      return `/api/reports/${reportId}/download?format=pdf`;
    case 'CSV':
      return `/api/reports/${reportId}/download?format=csv`;
    case 'EXCEL':
      return `/api/reports/${reportId}/download?format=xlsx`;
    default:
      throw new Error(`Desteklenmeyen rapor formatı: ${format}`);
  }
}

/**
 * Oluşturulan raporu e-posta ile gönderir
 */
async function sendReportByEmail(reportId: string, recipients: string[]): Promise<void> {
  // E-posta gönderme işlemi burada yapılır
  // Örneğin nodemailer gibi bir kütüphane kullanılabilir
  
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report || !report.fileUrl) {
    throw new Error('Rapor bulunamadı veya henüz oluşturulmadı');
  }

  // Burada e-posta gönderme işlemi yapılacak
  console.log(`Rapor e-posta ile gönderilecek: ${report.fileUrl}`);
  console.log(`Alıcılar: ${recipients.join(', ')}`);
}

/**
 * Sistemdeki tüm planlanmış raporları çalıştırır
 * Bu fonksiyon bir cron job tarafından periyodik olarak çağrılabilir
 */
export async function runScheduledReports(): Promise<void> {
  const scheduledReports = await prisma.scheduledReport.findMany({
    where: {
      nextRunAt: {
        lte: new Date(), // Şu andan önce çalışması gereken raporlar
      },
      isActive: true,
    },
  });

  for (const scheduledReport of scheduledReports) {
    try {
      const options = JSON.parse(scheduledReport.options) as ReportOptions;
      
      // Rapor tarih aralığını hesapla
      const dateRange = calculateReportDateRange(scheduledReport.frequency);
      
      // Rapor seçeneklerini güncelle
      options.startDate = dateRange.startDate;
      options.endDate = dateRange.endDate;
      options.title = `${scheduledReport.title} (${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()})`;
      
      // Raporu oluştur
      await createReport(options);
      
      // Bir sonraki çalıştırma zamanını hesapla
      const nextRunAt = calculateNextRunTime(scheduledReport.frequency);
      
      // Planlanmış raporu güncelle
      await prisma.scheduledReport.update({
        where: { id: scheduledReport.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt,
        },
      });
    } catch (error) {
      console.error(`Planlanmış rapor hatası (ID: ${scheduledReport.id}):`, error);
    }
  }
}

/**
 * Rapor sıklığına göre başlangıç ve bitiş tarihlerini hesaplar
 */
function calculateReportDateRange(frequency: string): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (frequency) {
    case 'DAILY':
      // Son 24 saat
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'WEEKLY':
      // Son 7 gün
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'MONTHLY':
      // Son 30 gün
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      // Varsayılan olarak son 7 gün
      startDate.setDate(startDate.getDate() - 7);
  }
  
  return { startDate, endDate };
}

/**
 * Rapor sıklığına göre bir sonraki çalıştırma zamanını hesaplar
 */
function calculateNextRunTime(frequency: string): Date {
  const now = new Date();
  const nextRun = new Date();
  
  switch (frequency) {
    case 'DAILY':
      // Bir sonraki gün, sabah 8:00
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(8, 0, 0, 0);
      break;
    case 'WEEKLY':
      // Bir sonraki hafta, Pazartesi sabah 8:00
      const daysUntilNextMonday = 7 - now.getDay() + 1; // 1 = Pazartesi
      nextRun.setDate(nextRun.getDate() + daysUntilNextMonday);
      nextRun.setHours(8, 0, 0, 0);
      break;
    case 'MONTHLY':
      // Bir sonraki ayın ilk günü, sabah 8:00
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(8, 0, 0, 0);
      break;
    default:
      // Varsayılan olarak bir sonraki gün
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(8, 0, 0, 0);
  }
  
  return nextRun;
} 