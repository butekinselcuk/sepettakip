import { NextResponse } from 'next/server';
import { createReport, ReportOptions, runScheduledReports } from '@/lib/reporting';
import { verifyJWT, getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reports - Tüm raporları listele
export async function GET(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
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
    
    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        totalItems: totalReports,
        totalPages: Math.ceil(totalReports / limit),
      },
    });
  } catch (error) {
    console.error('Raporları getirme hatası:', error);
    return NextResponse.json({ error: 'Raporlar alınırken bir hata oluştu' }, { status: 500 });
  }
}

// POST /api/reports - Yeni rapor oluştur
export async function POST(req: Request) {
  try {
    // Yetkilendirme kontrolü
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Kimlik doğrulama gerekli' }, { status: 401 });
    }
    
    const userData = await verifyJWT(token);
    if (!userData) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }
    
    // Rol kontrolü
    if (!['ADMIN', 'BUSINESS'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }
    
    // İstek gövdesinden rapor seçeneklerini al
    const body = await req.json();
    
    // Temel doğrulama
    if (!body.startDate || !body.endDate || !body.type || !body.format) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
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
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Rapor oluşturma hatası:', error);
    return NextResponse.json({ error: 'Rapor oluşturulurken bir hata oluştu' }, { status: 500 });
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
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }
    
    const token = authHeader.split(' ')[1];
    const userData = await verifyJWT(token);
    
    if (!userData || userData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }
    
    // Planlanmış raporları çalıştır
    await runScheduledReports();
    
    return NextResponse.json({ message: 'Planlanmış raporlar çalıştırıldı' });
  } catch (error) {
    console.error('Planlanmış raporları çalıştırma hatası:', error);
    return NextResponse.json({ error: 'Planlanmış raporlar çalıştırılırken bir hata oluştu' }, { status: 500 });
  }
} 