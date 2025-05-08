import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reports/scheduled - Planlanmış raporları listele
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
    const frequency = searchParams.get('frequency');
    const isActive = searchParams.get('isActive');
    
    // Filtre koşullarını oluştur
    const filter: any = {};
    if (frequency) filter.frequency = frequency;
    if (isActive !== null) filter.isActive = isActive === 'true';
    
    // Kullanıcı rolüne göre filtreleme
    if (userData.role === 'BUSINESS') {
      // İşletme sadece kendi raporlarını görebilir
      filter.userId = userData.id;
    }
    
    // Planlanmış raporları sorgula
    const scheduledReports = await prisma.scheduledReport.findMany({
      where: filter,
      orderBy: { nextRunAt: 'asc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({ scheduledReports });
  } catch (error) {
    console.error('Planlanmış raporları getirme hatası:', error);
    return NextResponse.json({ error: 'Planlanmış raporlar alınırken bir hata oluştu' }, { status: 500 });
  }
}

// POST /api/reports/scheduled - Yeni planlanmış rapor oluştur
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
    if (!body.title || !body.frequency || !body.options) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 });
    }
    
    // Sonraki çalıştırma zamanını hesapla
    const nextRunAt = calculateNextRunTime(body.frequency);
    
    // Planlanmış rapor oluştur
    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        title: body.title,
        description: body.description || '',
        frequency: body.frequency,
        isActive: body.isActive !== undefined ? body.isActive : true,
        options: typeof body.options === 'string' ? body.options : JSON.stringify(body.options),
        nextRunAt,
        userId: userData.id as string,
      },
    });
    
    return NextResponse.json({ scheduledReport });
  } catch (error) {
    console.error('Planlanmış rapor oluşturma hatası:', error);
    return NextResponse.json({ error: 'Planlanmış rapor oluşturulurken bir hata oluştu' }, { status: 500 });
  }
}

// Rapor sıklığına göre bir sonraki çalıştırma zamanını hesaplar
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