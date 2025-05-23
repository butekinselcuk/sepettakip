import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { generateReportPDF } from '@/lib/reports/pdf-generator';
import { generateReportExcel } from '@/lib/reports/excel-generator';
import { generateReportCSV } from '@/lib/reports/csv-generator';

const generateReportSchema = z.object({
  title: z.string().min(1),
  dataSource: z.enum(['orders', 'couriers', 'businesses', 'customers', 'deliveries']),
  format: z.enum(['excel', 'pdf', 'csv']),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  columns: z.array(z.string()).min(1),
  filters: z.record(z.any()).optional(),
  options: z.object({
    includeTotals: z.boolean().optional(),
    includeCharts: z.boolean().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Admin yetkisi veya report:create yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    
    const hasPermission = user?.role?.permissions?.includes('reports:create') || 
                         user?.role?.name === 'admin';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Request body'yi doğrula
    const body = await req.json();
    const validatedData = generateReportSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { 
      title, 
      dataSource, 
      format, 
      dateRange, 
      columns, 
      filters, 
      options 
    } = validatedData.data;
    
    // Rapor oluştur
    const reportData = await fetchReportData(dataSource, dateRange, columns, filters);
    
    // Rapor dosyasını oluştur
    const reportFileName = `report-${Date.now()}.${format}`;
    const reportFilePath = path.join(process.cwd(), 'public', 'reports', reportFileName);
    
    // Klasörün varlığını kontrol et, yoksa oluştur
    const reportDirPath = path.join(process.cwd(), 'public', 'reports');
    if (!fs.existsSync(reportDirPath)) {
      fs.mkdirSync(reportDirPath, { recursive: true });
    }
    
    // Formata göre rapor dosyası oluştur
    let fileBuffer: Buffer;
    
    switch (format) {
      case 'excel':
        fileBuffer = await generateReportExcel(title, reportData, columns, options);
        break;
      case 'pdf':
        fileBuffer = await generateReportPDF(title, reportData, columns, options);
        break;
      case 'csv':
        fileBuffer = await generateReportCSV(reportData, columns);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
    
    // Dosyayı kaydet
    fs.writeFileSync(reportFilePath, fileBuffer);
    
    // Raporun kaydını veritabanına ekle
    const report = await prisma.report.create({
      data: {
        title,
        userId,
        filePath: `/reports/${reportFileName}`,
        format,
        dataSource,
        createdAt: new Date(),
        configuration: {
          columns,
          filters: filters || {},
          dateRange,
          options: options || {},
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report generated successfully',
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Veri kaynağına göre rapor verisini getir
async function fetchReportData(
  dataSource: string, 
  dateRange: { startDate: string; endDate: string }, 
  columns: string[],
  filters?: Record<string, any>
) {
  const { startDate, endDate } = dateRange;
  
  // Filtreleri Prisma sorgusuna dönüştür
  const prismaFilters: any = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate),
    },
  };
  
  // Ek filtreleri ekle
  if (filters) {
    // Minimum ve maksimum değer filtreleri için özel işlem
    if (filters.minTotal) {
      prismaFilters.total = { ...(prismaFilters.total || {}), gte: parseFloat(filters.minTotal) };
    }
    if (filters.maxTotal) {
      prismaFilters.total = { ...(prismaFilters.total || {}), lte: parseFloat(filters.maxTotal) };
    }
    
    // Durum filtresi
    if (filters.status) {
      prismaFilters.status = filters.status;
    }
    
    // Ödeme yöntemi filtresi
    if (filters.paymentMethod) {
      prismaFilters.paymentMethod = filters.paymentMethod;
    }
    
    // İşletme kategorisi filtresi
    if (filters.category) {
      prismaFilters.category = filters.category;
    }
    
    // Min/Max sipariş sayısı filtreleri
    if (filters.minOrderCount || filters.maxOrderCount) {
      // Bu tür filtreler için genellikle ayrı bir sorgu veya hesaplama gerekir
      // Basit bir implementasyon için şu an pass geçiyoruz
    }
  }
  
  // Veri kaynağına göre ilgili veriyi çek
  let data: any[] = [];
  
  switch (dataSource) {
    case 'orders':
      data = await prisma.order.findMany({
        where: prismaFilters,
        include: {
          user: { select: { name: true, email: true } },
          business: { select: { name: true } },
          courier: { select: { name: true } },
        },
      });
      break;
      
    case 'couriers':
      data = await prisma.courier.findMany({
        where: prismaFilters,
        include: {
          user: { select: { name: true, email: true } },
          deliveries: true,
        },
      });
      break;
      
    case 'businesses':
      data = await prisma.business.findMany({
        where: prismaFilters,
        include: {
          orders: true,
          user: { select: { name: true, email: true } },
        },
      });
      break;
      
    case 'customers':
      data = await prisma.user.findMany({
        where: {
          ...prismaFilters,
          role: { name: 'customer' },
        },
        include: {
          orders: true,
        },
      });
      break;
      
    case 'deliveries':
      data = await prisma.delivery.findMany({
        where: prismaFilters,
        include: {
          order: true,
          courier: { 
            include: { 
              user: { select: { name: true } } 
            } 
          },
        },
      });
      break;
      
    default:
      throw new Error(`Unsupported data source: ${dataSource}`);
  }
  
  // Veriyi düzenle ve sadece istenen sütunları içerecek şekilde dönüştür
  return formatReportData(data, dataSource, columns);
}

// Rapor verisini düzenle
function formatReportData(data: any[], dataSource: string, columns: string[]) {
  // Veriyi sütunlara göre formatlayarak düzenle
  return data.map(item => {
    const formattedItem: Record<string, any> = {};
    
    for (const column of columns) {
      switch (dataSource) {
        case 'orders':
          switch (column) {
            case 'id':
              formattedItem.id = item.id;
              break;
            case 'createdAt':
              formattedItem.createdAt = formatDate(item.createdAt);
              break;
            case 'status':
              formattedItem.status = item.status;
              break;
            case 'total':
              formattedItem.total = formatCurrency(item.total);
              break;
            case 'items':
              formattedItem.items = Array.isArray(item.items) ? item.items.length : 0;
              break;
            case 'customer':
              formattedItem.customer = item.user?.name || 'N/A';
              break;
            case 'business':
              formattedItem.business = item.business?.name || 'N/A';
              break;
            case 'courier':
              formattedItem.courier = item.courier?.name || 'N/A';
              break;
            case 'deliveryAddress':
              formattedItem.deliveryAddress = item.deliveryAddress || 'N/A';
              break;
            case 'deliveryTime':
              formattedItem.deliveryTime = item.deliveryTime 
                ? formatDuration(item.deliveryTime) 
                : 'N/A';
              break;
            case 'paymentMethod':
              formattedItem.paymentMethod = formatPaymentMethod(item.paymentMethod);
              break;
            default:
              formattedItem[column] = item[column] || 'N/A';
          }
          break;
          
        // Diğer veri kaynakları için benzer formatlama işlemleri
        case 'couriers':
          switch (column) {
            case 'id':
              formattedItem.id = item.id;
              break;
            case 'name':
              formattedItem.name = item.user?.name || 'N/A';
              break;
            case 'email':
              formattedItem.email = item.user?.email || 'N/A';
              break;
            case 'phone':
              formattedItem.phone = item.phone || 'N/A';
              break;
            case 'region':
              formattedItem.region = item.region || 'N/A';
              break;
            case 'deliveryCount':
              formattedItem.deliveryCount = item.deliveries?.length || 0;
              break;
            case 'avgDeliveryTime':
              // Ortalama teslimat süresini hesapla
              if (item.deliveries && item.deliveries.length > 0) {
                const totalTime = item.deliveries.reduce((sum: number, delivery: any) => {
                  if (delivery.startTime && delivery.endTime) {
                    const start = new Date(delivery.startTime).getTime();
                    const end = new Date(delivery.endTime).getTime();
                    return sum + (end - start);
                  }
                  return sum;
                }, 0);
                
                const avgTime = totalTime / item.deliveries.length;
                formattedItem.avgDeliveryTime = formatDuration(avgTime);
              } else {
                formattedItem.avgDeliveryTime = 'N/A';
              }
              break;
            case 'rating':
              formattedItem.rating = item.rating ? item.rating.toFixed(1) : 'N/A';
              break;
            case 'earnings':
              formattedItem.earnings = item.earnings ? formatCurrency(item.earnings) : 'N/A';
              break;
            case 'status':
              formattedItem.status = item.status || 'N/A';
              break;
            default:
              formattedItem[column] = item[column] || 'N/A';
          }
          break;
          
        // Diğer veri kaynakları için formatlama işlemleri...
        case 'businesses':
        case 'customers':
        case 'deliveries':
          // Bu kısımları veri yapısına göre tamamlayın
          formattedItem[column] = item[column] || 'N/A';
          break;
      }
    }
    
    return formattedItem;
  });
}

// Yardımcı formatlama fonksiyonları
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('tr-TR');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY' 
  }).format(amount);
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'CREDIT_CARD': 'Kredi Kartı',
    'CASH': 'Nakit',
    'BANK_TRANSFER': 'Havale',
  };
  
  return methods[method] || method;
} 