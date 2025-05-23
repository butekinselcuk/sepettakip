import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama - Headers veya cookie'den token al
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Token bulunamadı' },
        { status: 401 }
      );
    }
    
    const decodedToken = await verifyJwtToken(token);
    
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
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        products: {
          where: {
            isActive: true
          },
          take: 5,
          orderBy: {
            price: 'desc' 
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
      popularItems: business?.products || [],
      businessName: business?.name || ''
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