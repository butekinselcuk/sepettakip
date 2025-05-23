import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { format } from 'date-fns';

// Export isteği için şema
const exportRequestSchema = z.object({
  dataSource: z.enum(['orders', 'deliveries', 'businesses', 'customers', 'payments', 'couriers']),
  format: z.enum(['excel', 'pdf', 'csv']),
  dateRange: z.object({
    startDate: z.string().transform(val => new Date(val)),
    endDate: z.string().transform(val => new Date(val)),
  }).optional(),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  includeTotals: z.boolean().optional(),
  includeCharts: z.boolean().optional(),
});

type ExportRequest = z.infer<typeof exportRequestSchema>;

/**
 * POST /api/admin/reports/export - Veri dışa aktarma
 */
export async function POST(req: NextRequest) {
  try {
    // Yetkilendirme
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    // Veri export yetkisi
    const hasAccess = await hasPermission('reports:export');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Request gövdesi
    const body = await req.json();
    
    // Şema validasyonu
    const validationResult = exportRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Geçersiz istek formatı',
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const exportReq = validationResult.data;
    
    // Export işlemi için veri çekme
    const data = await fetchDataForExport(exportReq);
    
    // Rapor metadata
    const reportMeta = {
      title: exportReq.title || `${capitalizeFirstLetter(exportReq.dataSource)} Raporu`,
      description: exportReq.description || `${format(new Date(), 'dd/MM/yyyy HH:mm')} tarihinde oluşturuldu`,
      createdBy: session.user.name,
      createdAt: new Date(),
      format: exportReq.format,
      filters: exportReq.filters || {},
    };
    
    // Rapor kaydı oluştur
    const report = await prisma.report.create({
      data: {
        name: reportMeta.title,
        type: mapDataSourceToReportType(exportReq.dataSource),
        format: mapFormatToReportFormat(exportReq.format),
        userId: session.user.id,
        parameters: exportReq.filters || {},
        data: data,
      }
    });
    
    // Rapor ID'si ile ilişkilendirilen bir dosya yolu oluştur
    const filePath = `/reports/${report.id}/${report.id}.${getFileExtension(exportReq.format)}`;
    
    // Rapor URL'sini güncelle
    await prisma.report.update({
      where: { id: report.id },
      data: { url: filePath }
    });
    
    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      message: 'Rapor başarıyla oluşturuldu',
      report: {
        id: report.id,
        title: reportMeta.title,
        description: reportMeta.description,
        format: exportReq.format,
        downloadUrl: filePath,
        createdAt: reportMeta.createdAt,
      }
    });
    
  } catch (error) {
    console.error('Rapor export hatası:', error);
    return NextResponse.json({ error: 'Rapor oluşturulurken bir hata oluştu' }, { status: 500 });
  }
}

/**
 * Export için veri çeker
 */
async function fetchDataForExport(exportReq: ExportRequest) {
  const { dataSource, dateRange, filters, columns } = exportReq;
  
  // Tarih filtresi
  const dateFilter = dateRange ? {
    createdAt: {
      gte: dateRange.startDate,
      lte: dateRange.endDate
    }
  } : {};
  
  // Genel filtre
  const where = {
    ...dateFilter,
    ...(filters || {})
  };
  
  // Hangi sütunları dahil edeceğimizi belirle
  const select = columns ? 
    columns.reduce((acc, col) => ({ ...acc, [col]: true }), {}) : 
    undefined;
  
  // Veri kaynağına göre sorgu çalıştır
  switch(dataSource) {
    case 'orders':
      return await prisma.order.findMany({
        where,
        select,
        include: !select ? {
          customer: {
            select: {
              user: { select: { name: true, email: true } },
              phone: true,
              address: true
            }
          },
          business: {
            select: {
              name: true,
              address: true,
              phone: true
            }
          },
          courier: {
            select: {
              user: { select: { name: true, email: true } },
              phone: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    case 'deliveries':
      return await prisma.delivery.findMany({
        where,
        select,
        include: !select ? {
          courier: {
            select: {
              user: { select: { name: true, email: true } },
              phone: true
            }
          },
          customer: {
            select: {
              user: { select: { name: true, email: true } },
              phone: true,
              address: true
            }
          },
          order: {
            select: {
              status: true,
              totalPrice: true,
              createdAt: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    case 'businesses':
      return await prisma.business.findMany({
        where,
        select,
        include: !select ? {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    case 'customers':
      return await prisma.customer.findMany({
        where,
        select,
        include: !select ? {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          },
          orders: {
            select: {
              status: true,
              totalPrice: true,
              createdAt: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    case 'payments':
      return await prisma.payment.findMany({
        where,
        select,
        include: !select ? {
          order: {
            select: {
              status: true,
              customerId: true,
              businessId: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    case 'couriers':
      return await prisma.courier.findMany({
        where,
        select,
        include: !select ? {
          user: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          },
          deliveries: {
            select: {
              status: true,
              createdAt: true
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
    default:
      throw new Error(`Desteklenmeyen veri kaynağı: ${dataSource}`);
  }
}

/**
 * DataSource'dan ReportType enum'a dönüşüm
 */
function mapDataSourceToReportType(dataSource: string): 'DAILY_PERFORMANCE' | 'WEEKLY_SUMMARY' | 'MONTHLY_ANALYTICS' | 'CUSTOM' | 'COURIER_PERFORMANCE' | 'BUSINESS_PERFORMANCE' {
  switch(dataSource) {
    case 'orders': return 'DAILY_PERFORMANCE';
    case 'couriers': return 'COURIER_PERFORMANCE';
    case 'businesses': return 'BUSINESS_PERFORMANCE';
    default: return 'CUSTOM';
  }
}

/**
 * Format'tan ReportFormat enum'a dönüşüm
 */
function mapFormatToReportFormat(format: string): 'PDF' | 'CSV' | 'EXCEL' | 'HTML' {
  switch(format) {
    case 'pdf': return 'PDF';
    case 'csv': return 'CSV';
    case 'excel': return 'EXCEL';
    default: return 'HTML';
  }
}

/**
 * Format'tan dosya uzantısı dönüşümü
 */
function getFileExtension(format: string): string {
  switch(format) {
    case 'pdf': return 'pdf';
    case 'csv': return 'csv';
    case 'excel': return 'xlsx';
    default: return 'html';
  }
}

/**
 * İlk harfi büyüt
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 