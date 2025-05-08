import { verifyJWT } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reports/[id] - Rapor detaylarını getir
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Token kontrolü
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Yetkilendirme başlığı geçersiz' },
        { status: 401 }
      );
    }
    
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json(
        { message: 'Rapor ID gereklidir' },
        { status: 400 }
      );
    }

    // Prisma şemasında Report modeli bulunduğunu varsayıyorum
    const report = await prisma.$queryRaw`
      SELECT r.*, u.id as userId, u.name, u.email, u.role
      FROM "Report" r
      LEFT JOIN "User" u ON r.userId = u.id
      WHERE r.id = ${reportId}
    `;

    if (!report || Array.isArray(report) && report.length === 0) {
      return NextResponse.json(
        { message: 'Rapor bulunamadı' },
        { status: 404 }
      );
    }

    const reportData = Array.isArray(report) ? report[0] : report;

    // BUSINESS rolünde kullanıcı sadece kendi raporlarını görebilir
    if (payload.role === 'BUSINESS' && reportData.userId !== payload.id) {
      return NextResponse.json(
        { message: 'Bu rapora erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // Rapor opsiyonlarını parse et
    let options = {};
    if (reportData.options) {
      try {
        options = JSON.parse(reportData.options as string);
      } catch (e) {
        console.error('Rapor opsiyonları parse edilemedi:', e);
      }
    }

    return NextResponse.json({
      ...reportData,
      options
    });
  } catch (error) {
    console.error('Rapor getirme hatası:', error);
    return NextResponse.json(
      { message: 'Rapor getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Raporu sil
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Token kontrolü
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Yetkilendirme başlığı geçersiz' },
        { status: 401 }
      );
    }
    
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { message: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Sadece ADMIN ve BUSINESS rolleri silme yapabilir
    if (!['ADMIN', 'BUSINESS'].includes(payload.role as string)) {
      return NextResponse.json(
        { message: 'Bu işlem için yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json(
        { message: 'Rapor ID gereklidir' },
        { status: 400 }
      );
    }

    // Raporu bul
    const reportResult = await prisma.$queryRaw`
      SELECT * FROM "Report" WHERE id = ${reportId}
    `;

    const report = Array.isArray(reportResult) && reportResult.length > 0 ? reportResult[0] : null;

    if (!report) {
      return NextResponse.json(
        { message: 'Rapor bulunamadı' },
        { status: 404 }
      );
    }

    // BUSINESS rolünde kullanıcı sadece kendi raporlarını silebilir
    if (payload.role === 'BUSINESS' && report.userId !== payload.id) {
      return NextResponse.json(
        { message: 'Bu raporu silme yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // Raporu sil
    await prisma.$executeRaw`DELETE FROM "Report" WHERE id = ${reportId}`;

    return NextResponse.json({
      message: 'Rapor başarıyla silindi'
    });
  } catch (error) {
    console.error('Rapor silme hatası:', error);
    return NextResponse.json(
      { message: 'Rapor silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 