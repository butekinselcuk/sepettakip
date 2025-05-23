import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData } from '@/lib/auth';
import { JWTPayload } from '@/lib/validations/auth';

// GET: Kurye istatistiklerini getir
export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const tokenData = await getTokenData(request);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Yetkilendirme token'ı eksik veya geçersiz" },
        { status: 401 }
      );
    }

    const userData = tokenData as JWTPayload;
    
    // Kullanıcının rolünü kontrol et
    if (userData.role !== "COURIER") {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const courierId = userData.userId;
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    // Bugün tamamlanan teslimatları say
    const todayDeliveries = await prisma.delivery.count({
      where: {
        courierId: courierId,
        deliveredAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'DELIVERED',
      },
    });
    
    // Toplam teslimat sayısı
    const totalDeliveries = await prisma.delivery.count({
      where: {
        courierId: courierId,
        status: 'DELIVERED',
      },
    });
    
    // Ortalama puan - veritabanı modelimizde rating olmadığı için 
    // şimdilik sabit bir değer kullanıyoruz
    const averageRating = 4.5; // Demo için sabit değer
    
    // Bugünkü kazançları hesapla - order ilişkisinden
    const todayOrders = await prisma.order.findMany({
      where: {
        delivery: {
          courierId: courierId,
          deliveredAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: 'DELIVERED',
        }
      },
      select: {
        totalPrice: true,
      }
    });
    
    // Toplam kazançları hesapla
    const allOrders = await prisma.order.findMany({
      where: {
        delivery: {
          courierId: courierId,
          status: 'DELIVERED',
        }
      },
      select: {
        totalPrice: true,
      }
    });
    
    // Siparişlerden toplam kazanç hesapla
    const commissionRate = 0.1; // %10
    
    const todayEarningsValue = todayOrders.reduce((total, order) => {
      return total + ((order.totalPrice || 0) * commissionRate);
    }, 0);
    
    const totalEarningsValue = allOrders.reduce((total, order) => {
      return total + ((order.totalPrice || 0) * commissionRate);
    }, 0);
    
    return NextResponse.json({
      deliveriesToday: todayDeliveries,
      totalDeliveries: totalDeliveries,
      rating: averageRating.toFixed(1),
      earningsToday: `${todayEarningsValue.toFixed(2)} TL`,
      totalEarnings: `${totalEarningsValue.toFixed(2)} TL`,
    });
  } catch (error) {
    console.error("Kurye istatistikleri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kurye istatistikleri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 