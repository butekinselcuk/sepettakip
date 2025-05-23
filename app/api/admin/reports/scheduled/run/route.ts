import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { addDays, addWeeks, addMonths } from 'date-fns';
import ExcelJS from 'exceljs';
import { generateReportExcel } from '@/lib/reports/excel-generator';
import { generateReportPDF } from '@/lib/reports/pdf-generator';
import { generateReportCSV } from '@/lib/reports/csv-generator';
import { sendEmail } from '@/lib/email/send-email';
import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { ReportFormat, ReportType } from '@prisma/client';

// Özel scheduled report tipi - Prisma'nın ürettiği tiplerle çakışmaları önlemek için
interface ScheduledReportWithNextRunAt {
  id: string;
  reportName: string;
  type: ReportType;
  format: ReportFormat;
  parameters: any;
  recipients: string[];
  enabled: boolean;
  nextRunAt?: Date | string | null;
  user?: {
    email?: string;
    name?: string;
  }
}

// Rapor parametreleri için tip tanımı
interface ReportParameters {
  frequency: 'daily' | 'weekly' | 'monthly';
  dateRange: { startDate: string; endDate: string };
  columns: string[];
  filters?: Record<string, any>;
  options?: { includeTotals?: boolean; includeCharts?: boolean };
}

/**
 * POST /api/admin/reports/scheduled/run - Zamanlanmış raporları çalıştır
 * Bu endpoint, zamanlanmış raporları çalıştırmak için kullanılır.
 * Cron job tarafından periyodik olarak çağrılır.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const hasValidApiKey = validateApiKey(req);
    
    // Yetki kontrolü - sadece admin veya sistem API anahtarı kabul edilir
    if (!hasValidApiKey) {
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const userId = session.user.id;
      
      // Admin yetkisi kontrolü
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }
    
    // Çalıştırılması gereken zamanlanmış raporları al
    const now = new Date();
    
    // Tüm aktif raporları al
    const scheduledReports = await prisma.scheduledReport.findMany({
      where: {
        enabled: true,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    
    // Şu an çalıştırılması gereken raporları manuel olarak filtrele
    // ScheduledReportWithNextRunAt ile casting yapıyoruz
    const reportsToRun = scheduledReports
      .map(report => report as unknown as ScheduledReportWithNextRunAt)
      .filter(report => {
        if (!report.nextRunAt) return false;
        const nextRun = new Date(report.nextRunAt);
        return nextRun <= now;
      });
    
    if (reportsToRun.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled reports to run',
        reportsRun: 0,
      });
    }
    
    // Her rapor için işlem yap
    const results = await Promise.all(
      reportsToRun.map(async (report) => {
        try {
          // Raporu oluştur
          const { filePath, fileName } = await createReport(report);
          
          // E-posta gönder
          if (report.recipients && report.recipients.length > 0) {
            await sendReportEmail(report, filePath, fileName);
          }
          
          // Parametreleri parse et
          const reportParams = report.parameters as unknown as ReportParameters;
          
          // Bir sonraki çalışma zamanını hesapla
          const nextRunAt = calculateNextRunTime(reportParams.frequency, now);
          
          // Rapor durumunu güncelle
          // Güvenli bir şekilde any tipine dönüştürerek nextRunAt alanını güncelliyoruz
          await prisma.scheduledReport.update({
            where: { id: report.id },
            data: {
              // @ts-ignore - Prisma modelinde nextRunAt eksik olsa da veritabanında mevcut
              nextRunAt: nextRunAt,
            } as any,
          });
          
          // Başarılı işlemi log dosyasına yaz
          if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
            fs.mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
          }
          
          fs.appendFileSync(
            path.join(process.cwd(), 'logs', 'report-runs.log'),
            `${new Date().toISOString()} - Rapor çalıştırıldı: ${report.reportName} (${report.id})\n`
          );
          
          return {
            reportId: report.id,
            status: 'SUCCESS',
            message: 'Report generated and sent successfully',
          };
        } catch (error) {
          logger.error(`Error running scheduled report ${report.id}`, error as Error, {
            module: 'scheduledReports',
            context: {
              reportId: report.id,
              reportName: report.reportName
            }
          });
          
          // Hata işlemini log dosyasına yaz
          if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
            fs.mkdirSync(path.join(process.cwd(), 'logs'), { recursive: true });
          }
          
          fs.appendFileSync(
            path.join(process.cwd(), 'logs', 'report-runs.log'),
            `${new Date().toISOString()} - Rapor çalıştırma hatası: ${report.reportName} (${report.id}) - ${error instanceof Error ? error.message : 'Unknown error'}\n`
          );
          
          return {
            reportId: report.id,
            status: 'ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );
    
    // Başarılı ve başarısız rapor sayılarını hesapla
    const successCount = results.filter(r => r.status === 'SUCCESS').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    
    return NextResponse.json({
      success: true,
      message: `${reportsToRun.length} scheduled reports processed`,
      reportsRun: reportsToRun.length,
      successCount,
      errorCount,
      results,
    });
    
  } catch (error) {
    logger.error('Error running scheduled reports', error as Error, {
      module: 'scheduledReports'
    });
    
    return NextResponse.json({ 
      error: 'Failed to run scheduled reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Rapor dosyası oluştur
async function createReport(report: any) {
  const { 
    id, 
    reportName: title, 
    type: dataSource, 
    format, 
    parameters 
  } = report;
  
  // Tip değişimi ve güvenlik kontrolü
  const reportParams = parameters as unknown as ReportParameters;
  
  // Rapor verilerini getir
  const reportData = await fetchReportData(
    dataSource.toString().toLowerCase(), 
    reportParams.dateRange,
    reportParams.columns,
    reportParams.filters
  );
  
  // Rapor dosyasını oluştur
  const formatStr = format.toString().toLowerCase();
  const fileName = `${sanitizeFileName(title)}-${Date.now()}.${getFileExtension(formatStr)}`;
  const reportDirPath = path.join(process.cwd(), 'public', 'reports');
  
  // Klasörün varlığını kontrol et, yoksa oluştur
  if (!fs.existsSync(reportDirPath)) {
    fs.mkdirSync(reportDirPath, { recursive: true });
  }
  
  const filePath = path.join(reportDirPath, fileName);
  
  // Formata göre rapor dosyası oluştur
  let fileBuffer: Buffer;
  
  switch (formatStr) {
    case 'excel':
      fileBuffer = await generateReportExcel(
        title, 
        reportData, 
        reportParams.columns, 
        reportParams.options
      );
      break;
    case 'pdf':
      fileBuffer = await generateReportPDF(
        title, 
        reportData, 
        reportParams.columns, 
        reportParams.options
      );
      break;
    case 'csv':
      fileBuffer = await generateReportCSV(
        reportData, 
        reportParams.columns
      );
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  // Dosyayı kaydet
  fs.writeFileSync(filePath, fileBuffer);
  
  return { filePath, fileName };
}

// Veri kaynağına göre rapor verisini getir
async function fetchReportData(
  dataSource: string, 
  dateRange: { startDate: string; endDate: string }, 
  columns: string[],
  filters?: Record<string, any>
) {
  // Şu anki rapor oluşturma için, tarihleri güncelle
  // Örneğin, "last30days" içindeki bağıl tarihleri mutlak tarihlerle değiştir
  const { startDate, endDate } = dateRange;
  
  let data: any[] = [];
  
  // Veritabanı modellerine göre veri çekme
  // Her veri kaynağı için özel sorgu oluşturuyoruz
  switch (dataSource) {
    case 'orders':
      data = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          ...(filters || {}),
        },
      });
      break;
    case 'deliveries':
      data = await prisma.delivery.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          ...(filters || {}),
        },
      });
      break;
    case 'couriers':
      data = await prisma.courier.findMany({
        where: {
          ...(filters || {}),
        },
        include: {
          user: true,
          deliveries: {
            where: {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            },
          },
        },
      });
      break;
    // Diğer veri kaynakları...
    default:
      throw new Error(`Unsupported data source: ${dataSource}`);
  }
  
  // Veriyi formatlayarak dön
  return formatReportData(data, dataSource, columns);
}

// Rapor verisini düzenle
function formatReportData(data: any[], dataSource: string, columns: string[]) {
  // Basit bir örnek formatlaması
  return data.map(item => {
    const result: Record<string, any> = {};
    for (const column of columns) {
      result[column] = item[column] || 'N/A';
    }
    return result;
  });
}

// E-posta gönder
async function sendReportEmail(report: any, filePath: string, fileName: string) {
  const { reportName: title, recipients, user } = report;
  
  // E-posta alıcıları
  const toEmails = [...recipients];
  if (user?.email && !toEmails.includes(user.email)) {
    toEmails.push(user.email);
  }
  
  if (toEmails.length === 0) {
    throw new Error('No recipients found for report email');
  }
  
  // E-posta içeriği
  const emailHtml = `
    <h1>Zamanlanmış Rapor: ${title}</h1>
    <p>Merhaba,</p>
    <p>İstediğiniz zamanlanmış rapor oluşturuldu ve ektedir.</p>
    <p>İyi çalışmalar,<br/>SepetTakip Sistem</p>
  `;
  
  // E-posta gönder
  await sendEmail({
    to: toEmails,
    subject: `Zamanlanmış Rapor: ${title}`,
    html: emailHtml,
    attachments: [
      {
        filename: fileName,
        path: filePath,
      },
    ],
  });
}

// Bir sonraki çalışma zamanını hesapla
function calculateNextRunTime(frequency: 'daily' | 'weekly' | 'monthly', from: Date = new Date()): Date {
  switch (frequency) {
    case 'daily':
      return addDays(from, 1);
    case 'weekly':
      return addWeeks(from, 1);
    case 'monthly':
      return addMonths(from, 1);
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
}

// Dosya adını sanitize et
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9_\-]/gi, '_') // Güvensiz karakterleri _ ile değiştir
    .replace(/__+/g, '_') // Birden fazla _ karakterini tek _ ile değiştir
    .toLowerCase(); // Küçük harfe çevir
}

// Dosya uzantısını belirle
function getFileExtension(format: string): string {
  switch (format) {
    case 'excel':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    case 'csv':
      return 'csv';
    default:
      return format;
  }
}

// API anahtarını doğrula
function validateApiKey(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  // API_KEY .env dosyasından alınabilir veya güvenli bir yerden sağlanabilir
  const validApiKey = process.env.REPORTS_API_KEY;
  
  return apiKey === validApiKey;
} 