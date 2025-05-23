import { NextResponse } from 'next/server';
import { createReport, ReportOptions, runScheduledReports } from '@/lib/reporting';
import { verifyJWT, getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';

// Standart API yanıt formatı
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

// GET /api/reports - Tüm raporları listele
export async function GET(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz token',
        error: 'Invalid token'
      }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      return NextResponse.json({
        success: false,
        message: 'Yetkisiz erişim',
        error: 'Forbidden'
      }, { status: 403 });
    }
    
    // URL'den filtreleme parametrelerini al
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Filtre koşullarını oluştur
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    
    // Kullanıcı rolüne göre filtreleme
    if (userData.role === 'BUSINESS') {
      // İşletme sadece kendi raporlarını görebilir
      filter.userId = userData.id;
    }
    
    // Raporları sorgula
    const reports = await prisma.report.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    // Toplam rapor sayısını al
    const totalReports = await prisma.report.count({ where: filter });
    
    logger.info('Raporlar başarıyla getirildi', {
      module: 'api',
      context: {
        count: reports.length,
        total: totalReports,
        page,
        userId: userData.id
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Raporlar başarıyla getirildi',
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalItems: totalReports,
          totalPages: Math.ceil(totalReports / limit),
        }
      }
    });
  } catch (error) {
    logger.error('Raporları getirme hatası', error as Error, {
      module: 'api'
    });
    
    return NextResponse.json({
      success: false,
      message: 'Raporlar alınırken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}

// POST /api/reports - Yeni rapor oluştur
export async function POST(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Kimlik doğrulama gerekli',
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz token',
        error: 'Invalid token'
      }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      return NextResponse.json({
        success: false,
        message: 'Yetkisiz erişim',
        error: 'Forbidden'
      }, { status: 403 });
    }
    
    // İstek gövdesinden rapor seçeneklerini al
    const body = await req.json();
    
    // Temel doğrulama
    if (!body.startDate || !body.endDate || !body.type || !body.format) {
      return NextResponse.json({
        success: false,
        message: 'Eksik parametreler',
        error: 'Missing required parameters'
      }, { status: 400 });
    }
    
    // Rapor seçeneklerini oluştur
    const reportOptions: ReportOptions = {
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      type: body.type,
      format: body.format,
      filters: {
        ...(body.filters || {}),
        userId: userData.id // Kullanıcı ID'sini ekle
      },
      recipients: body.recipients || [],
      title: body.title,
      description: body.description,
    };
    
    // Rapor oluştur
    const report = await createReport(reportOptions);
    
    logger.info('Rapor başarıyla oluşturuldu', {
      module: 'api',
      context: {
        reportId: report.id,
        userId: userData.id,
        type: body.type,
        format: body.format
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Rapor başarıyla oluşturuldu',
      data: { report }
    });
  } catch (error) {
    logger.error('Rapor oluşturma hatası', error as Error, {
      module: 'api'
    });
    
    return NextResponse.json({
      success: false,
      message: 'Rapor oluşturulurken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}

// PATCH /api/reports/run-scheduled - Planlanmış raporları çalıştır (Cron Job'lar için)
export async function PATCH(req: Request) {
  try {
    // Bu endpoint sadece sistem veya adminler tarafından çağrılmalıdır
    // Gerçek uygulamada buraya IP kontrolü, özel token kontrolü gibi 
    // güvenlik önlemleri eklenmelidir
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Yetkisiz erişim',
        error: 'Unauthorized'
      }, { status: 403 });
    }
    
    const token = authHeader.split(' ')[1];
    const userData = await verifyJWT(token);
    
    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Yetkisiz erişim',
        error: 'Forbidden'
      }, { status: 403 });
    }
    
    // Planlanmış raporları çalıştır
    const result = await runScheduledReports();
    
    logger.info('Planlanmış raporlar çalıştırıldı', {
      module: 'reports',
      context: {
        reportsRun: result.length,
        triggeredBy: userData.id
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Planlanmış raporlar çalıştırıldı',
      data: { reports: result }
    });
  } catch (error) {
    logger.error('Planlanmış raporları çalıştırma hatası', error as Error, {
      module: 'reports'
    });
    
    return NextResponse.json({
      success: false,
      message: 'Planlanmış raporlar çalıştırılırken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 