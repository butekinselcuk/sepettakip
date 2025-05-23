import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addDays, addWeeks, addMonths, format, parseISO } from 'date-fns';

// Zamanlanmış rapor şeması
const scheduledReportSchema = z.object({
  name: z.string().min(3, 'Rapor adı en az 3 karakter olmalıdır'),
  type: z.enum(['DAILY_PERFORMANCE', 'WEEKLY_SUMMARY', 'MONTHLY_ANALYTICS', 'CUSTOM', 'COURIER_PERFORMANCE', 'BUSINESS_PERFORMANCE']),
  format: z.enum(['PDF', 'CSV', 'EXCEL', 'HTML']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0: Pazar, 6: Cumartesi
  dayOfMonth: z.number().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Saat formatı HH:MM olmalıdır'),
  recipients: z.array(z.string().email('Geçerli e-posta adresi girilmelidir')),
  parameters: z.record(z.any()).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ScheduledReportInput = z.infer<typeof scheduledReportSchema>;

// Zamanlanmış rapor oluşturma şeması
const createScheduledReportSchema = z.object({
  title: z.string().min(1),
  reportId: z.string().optional(),
  dataSource: z.enum(['orders', 'couriers', 'businesses', 'customers', 'deliveries']).optional(),
  format: z.enum(['excel', 'pdf', 'csv']).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  recipients: z.array(z.string().email()).optional(),
  nextRunAt: z.string().datetime(),
  configuration: z.record(z.any()).optional(),
  isEnabled: z.boolean().default(true),
});

// Zamanlanmış rapor güncelleme şeması
const updateScheduledReportSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recipients: z.array(z.string().email()).optional(),
  nextRunAt: z.string().datetime().optional(),
  configuration: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * GET /api/admin/reports/scheduled - Zamanlanmış raporları getir
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Admin yetkisi veya report:view yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    
    const hasPermission = user?.role?.permissions?.includes('reports:view') || 
                         user?.role?.name === 'admin';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // URL parametrelerini al
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Toplam rapor sayısını al
    const totalCount = await prisma.scheduledReport.count({
      // Admin değilse sadece kendi raporlarını görebilir
      where: user?.role?.name !== 'admin' ? { userId } : undefined,
    });
    
    // Raporları al
    const reports = await prisma.scheduledReport.findMany({
      // Admin değilse sadece kendi raporlarını görebilir
      where: user?.role?.name !== 'admin' ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    
    return NextResponse.json({
      data: reports,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
    
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch scheduled reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/reports/scheduled - Yeni zamanlanmış rapor oluştur
 */
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
    const validatedData = createScheduledReportSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { 
      title, 
      reportId, 
      dataSource, 
      format, 
      frequency, 
      recipients, 
      nextRunAt, 
      configuration, 
      isEnabled 
    } = validatedData.data;
    
    // ReportId varsa rapor bilgilerini getir
    let reportData = {};
    
    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });
      
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      
      reportData = {
        reportId,
        dataSource: report.dataSource,
        format: report.format,
        configuration: report.configuration,
      };
    } else {
      // ReportId yoksa, dataSource ve format zorunlu
      if (!dataSource || !format) {
        return NextResponse.json({ 
          error: 'Either reportId or dataSource and format must be provided' 
        }, { status: 400 });
      }
      
      reportData = {
        dataSource,
        format,
        configuration: configuration || {},
      };
    }
    
    // Zamanlanmış raporu oluştur
    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        title,
        userId,
        frequency,
        recipients: recipients || [],
        nextRunAt: new Date(nextRunAt),
        lastRunAt: null,
        isEnabled,
        ...reportData,
      },
    });
    
    return NextResponse.json({
      success: true,
      scheduledReport,
      message: 'Scheduled report created successfully',
    });
    
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json({ 
      error: 'Failed to create scheduled report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Admin yetkisi veya report:update yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    
    const hasPermission = user?.role?.permissions?.includes('reports:update') || 
                         user?.role?.name === 'admin';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Request body'yi doğrula
    const body = await req.json();
    const validatedData = updateScheduledReportSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: validatedData.error.format() 
      }, { status: 400 });
    }
    
    const { id, ...updateData } = validatedData.data;
    
    // Zamanlanmış raporu bul
    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }
    
    // Admin değilse, sadece kendi raporlarını güncelleyebilir
    if (user?.role?.name !== 'admin' && scheduledReport.userId !== userId) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this report' 
      }, { status: 403 });
    }
    
    // Zamanlanmış raporu güncelle
    const updatedScheduledReport = await prisma.scheduledReport.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({
      success: true,
      scheduledReport: updatedScheduledReport,
      message: 'Scheduled report updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json({ 
      error: 'Failed to update scheduled report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Yetki kontrolü
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Admin yetkisi veya report:delete yetkisi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    
    const hasPermission = user?.role?.permissions?.includes('reports:delete') || 
                         user?.role?.name === 'admin';
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // URL parametrelerini al
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }
    
    // Zamanlanmış raporu bul
    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 });
    }
    
    // Admin değilse, sadece kendi raporlarını silebilir
    if (user?.role?.name !== 'admin' && scheduledReport.userId !== userId) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this report' 
      }, { status: 403 });
    }
    
    // Zamanlanmış raporu sil
    await prisma.scheduledReport.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
    
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json({ 
      error: 'Failed to delete scheduled report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Bir sonraki çalışma zamanını hesaplar
 */
function calculateNextRunTime(
  frequency: string,
  timeOfDay: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  // Mevcut tarih
  const now = new Date();
  
  // Belirtilen zamanı al (HH:MM formatında)
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  
  // Temel tarih oluştur
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);
  
  // Eğer belirtilen zaman bugün geçmişse, bir sonraki periyoda atla
  if (nextRun.getTime() <= now.getTime()) {
    nextRun = addDays(nextRun, 1); // En az bir gün ekle
  }
  
  // Frekansa göre tarihi ayarla
  switch (frequency) {
    case 'DAILY':
      // Zaten günlük olarak ayarlandı
      break;
      
    case 'WEEKLY':
      // Haftanın belirtilen gününe ayarla
      if (dayOfWeek !== undefined) {
        const currentDayOfWeek = nextRun.getDay();
        let daysToAdd = dayOfWeek - currentDayOfWeek;
        
        if (daysToAdd < 0) {
          // Eğer belirtilen gün bu haftada geçmişse, sonraki haftaya
          daysToAdd += 7;
        }
        
        nextRun = addDays(nextRun, daysToAdd);
      }
      break;
      
    case 'MONTHLY':
      // Ayın belirtilen gününe ayarla
      if (dayOfMonth !== undefined) {
        // Ayın gününü ayarla
        const targetMonth = nextRun.getMonth();
        const targetYear = nextRun.getFullYear();
        
        // Yeni tarih oluştur (belirtilen günde)
        nextRun = new Date(targetYear, targetMonth, dayOfMonth, hours, minutes, 0, 0);
        
        // Eğer bu ay için belirtilen gün geçmişse, bir sonraki aya geç
        if (nextRun.getTime() <= now.getTime()) {
          nextRun = new Date(targetYear, targetMonth + 1, dayOfMonth, hours, minutes, 0, 0);
        }
      }
      break;
  }
  
  return nextRun;
} 