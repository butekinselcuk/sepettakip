import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Token doğrulama fonksiyonu
const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key', (err, decoded) => {
      if (err) return resolve(null);
      resolve(decoded);
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.userId) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Kullanıcı business mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { business: true }
    });
    
    if (!user || user.role !== 'BUSINESS' || !user.business) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: İşletme erişimi gerekiyor' },
        { status: 403 }
      );
    }
    
    const businessId = user.business.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay()); // Haftanın başlangıcı (Pazar)
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Bugünkü siparişleri getir
    const todayOrders = await prisma.order.count({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfDay
        }
      }
    });
    
    // Aktif siparişleri getir (tamamlanmamış)
    const activeOrders = await prisma.order.count({
      where: {
        businessId: businessId,
        status: {
          notIn: ['DELIVERED', 'CANCELLED']
        }
      }
    });
    
    // Toplam siparişleri getir
    const totalOrders = await prisma.order.count({
      where: {
        businessId: businessId
      }
    });
    
    // Bugünkü gelir
    const todayRevenue = await prisma.order.aggregate({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        totalPrice: true
      }
    });
    
    // Bu haftaki gelir
    const weekRevenue = await prisma.order.aggregate({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfWeek
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        totalPrice: true
      }
    });
    
    // Bu ayki gelir
    const monthRevenue = await prisma.order.aggregate({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startOfMonth
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        totalPrice: true
      }
    });
    
    // Popüler ürünleri getir
    // Not: Bu örnekte sadece sipariş sayısı dikkate alınıyor, gerçek uygulamada
    // işletmenin menü öğelerini ve popüler ürünlerini belirlemek için daha karmaşık
    // bir sorgu kullanılabilir.
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        menuItems: {
          where: {
            isAvailable: true
          },
          take: 5,
          orderBy: {
            price: 'desc' // Geçici olarak en pahalı ürünleri listeliyoruz
          }
        }
      }
    });
    
    // Formatlanmış yanıt oluştur
    const stats = {
      ordersToday: todayOrders,
      activeOrders: activeOrders,
      totalOrders: totalOrders,
      revenue: {
        today: `${todayRevenue._sum.totalPrice || 0} TL`,
        week: `${weekRevenue._sum.totalPrice || 0} TL`,
        month: `${monthRevenue._sum.totalPrice || 0} TL`
      },
      popularItems: business?.menuItems || [],
      businessRating: business?.rating || 0
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('İşletme istatistikleri alınırken hata:', error);
    return NextResponse.json(
      { error: 'İşletme istatistikleri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 