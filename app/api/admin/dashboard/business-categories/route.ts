import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * GET /api/admin/dashboard/business-categories - Business categories statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('dashboard:view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // İşletme kategorilerini getir - 'type' field kullanarak
    const businessTypes = await prisma.$queryRaw`
      SELECT "type", COUNT(*) as count
      FROM "businesses"
      WHERE "type" IS NOT NULL
      GROUP BY "type"
      ORDER BY count DESC
    `;
    
    // Aktif işletmeleri kategoriye göre say
    const activeBusinessesByType = await prisma.$queryRaw`
      SELECT "type", COUNT(*) as count
      FROM "businesses"
      WHERE "type" IS NOT NULL AND "status" = 'ACTIVE'
      GROUP BY "type"
      ORDER BY count DESC
    `;
    
    // Renk paleti
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', 
      '#673AB7', '#3F51B5', '#00BCD4', '#009688', '#FFC107'
    ];
    
    // Grafik verisi formatı
    const data = {
      labels: (businessTypes as any[]).map(item => item.type || 'Tanımlanmamış'),
      values: (businessTypes as any[]).map(item => Number(item.count)),
      colors: (businessTypes as any[]).map((_, index) => colors[index % colors.length])
    };
    
    // Her kategorideki toplam sipariş sayısını hesapla
    const ordersByCategory = await Promise.all(
      (businessTypes as any[]).map(async (typeData) => {
        // Raw query kullanarak işletme ID'lerini al
        const businessesOfType = await prisma.$queryRaw`
          SELECT "id" FROM "businesses" 
          WHERE "type" = ${typeData.type}
        `;
        
        const businessIds = (businessesOfType as any[]).map(b => b.id);
        
        const orderCount = businessIds.length > 0 
          ? await prisma.order.count({
              where: {
                businessId: {
                  in: businessIds
                }
              }
            })
          : 0;
        
        return {
          category: typeData.type,
          businessCount: Number(typeData.count),
          orderCount
        };
      })
    );
    
    // Toplam işletme sayısı
    const totalBusinesses = await prisma.business.count();
    const totalActiveBusinesses = await prisma.business.count({
      where: {
        status: 'ACTIVE'
      }
    });
    
    return NextResponse.json({
      data,
      totalBusinesses,
      totalActiveBusinesses,
      activeBusinessesByType: (activeBusinessesByType as any[]).map(item => ({
        type: item.type,
        count: Number(item.count)
      })),
      ordersByCategory
    });
  } catch (error) {
    console.error('İşletme kategorileri veri hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 