import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/reports/scheduled/[id]/status - Planlanmış raporun durumunu güncelle
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ID parametresini kontrol et
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Rapor ID'si belirtilmedi" }, { status: 400 });
    }

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

    // Raporu bul
    const report = await prisma.scheduledReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
    }

    // İşletme rolündeki kullanıcılar sadece kendi raporlarını güncelleyebilir
    if (userData.role === 'BUSINESS' && report.userId !== userData.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 });
    }

    // İstek gövdesini al ve kontrol et
    const body = await req.json();
    if (body.isActive === undefined) {
      return NextResponse.json({ error: 'isActive parametresi gerekli' }, { status: 400 });
    }

    // Rapor durumunu güncelle
    const updatedReport = await prisma.scheduledReport.update({
      where: { id },
      data: {
        isActive: body.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Rapor durumu güncelleme hatası:', error);
    return NextResponse.json({ error: 'Rapor durumu güncellenirken bir hata oluştu' }, { status: 500 });
  }
} 