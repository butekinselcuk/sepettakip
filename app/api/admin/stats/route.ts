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
    
    // JWT token doğrulama
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Yetkilendirme başarısız: Admin yetkisi gerekli' },
        { status: 401 }
      );
    }
    
    // Periyot parametresini al
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    
    // Tarih aralığını belirle
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0); // Bugünün başlangıcı
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'week':
      default:
        startDate.setDate(endDate.getDate() - 7);
        break;
    }
    
    // İstatistik verilerini elde et
    
    // 1. Kullanıcı sayıları
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });
    
    // Rol bazlı kullanıcı sayıları
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const businessCount = await prisma.user.count({ where: { role: 'BUSINESS' } });
    const courierCount = await prisma.user.count({ where: { role: 'COURIER' } });
    const customerCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    
    // 2. Sipariş istatistikleri
    const totalOrders = await prisma.order.count();
    const newOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    });
    
    // Durum bazlı sipariş sayıları
    const pendingOrders = await prisma.order.count({ 
      where: { status: 'PENDING' }
    });
    const processingOrders = await prisma.order.count({ 
      where: { status: 'PROCESSING' } 
    });
    const inTransitOrders = await prisma.order.count({ 
      where: { status: 'IN_TRANSIT' } 
    });
    const deliveredOrders = await prisma.order.count({ 
      where: { status: 'DELIVERED' } 
    });
    const cancelledOrders = await prisma.order.count({ 
      where: { status: 'CANCELLED' } 
    });
    
    // 3. Ciro istatistikleri
    const allOrders = await prisma.order.findMany({
      where: {
        status: {
          not: 'CANCELLED'
        },
        createdAt: {
          gte: startDate
        }
      },
      select: {
        totalPrice: true,
        createdAt: true
      }
    });
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    // 4. Ürün istatistikleri
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: {
        isActive: true
      }
    });
    
    // 5. Teslimat istatistikleri
    const totalDeliveries = await prisma.delivery.count();
    const pendingDeliveries = await prisma.delivery.count({
      where: {
        status: 'PENDING'
      }
    });
    const completedDeliveries = await prisma.delivery.count({
      where: {
        status: 'COMPLETED'
      }
    });
    
    // 6. Son 5 sipariş
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        business: {
          select: {
            name: true
          }
        },
        customer: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // 7. Günlük veri noktalarını oluştur (grafik için)
    const dailyDataPoints = [];
    
    // Son 7 gün için veri noktaları oluştur
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // O gün için sipariş sayısı
      const orderCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });
      
      // O gün için ciro
      const dayRevenue = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          },
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          totalPrice: true
        }
      });
      
      dailyDataPoints.push({
        date: date.toISOString().split('T')[0],
        orders: orderCount,
        revenue: dayRevenue._sum.totalPrice || 0
      });
    }
    
    // 8. En iyi işletmeler
    const topBusinesses = await prisma.business.findMany({
      take: 5,
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate
            }
          }
        },
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
    
    const topBusinessesData = topBusinesses.map(business => ({
      id: business.id,
      name: business.name,
      ordersCount: business.orders.length,
      productsCount: business.products.length,
      revenue: business.orders.reduce((sum, order) => sum + order.totalPrice, 0)
    }));
    
    return NextResponse.json({
      success: true,
      period,
      stats: {
        users: {
          total: totalUsers,
          new: newUsers,
          byRole: {
            admin: adminCount,
            business: businessCount,
            courier: courierCount,
            customer: customerCount
          }
        },
        orders: {
          total: totalOrders,
          new: newOrders,
          byStatus: {
            pending: pendingOrders,
            processing: processingOrders,
            inTransit: inTransitOrders,
            delivered: deliveredOrders,
            cancelled: cancelledOrders
          }
        },
        revenue: {
          total: totalRevenue
        },
        products: {
          total: totalProducts,
          active: activeProducts
        },
        deliveries: {
          total: totalDeliveries,
          pending: pendingDeliveries,
          completed: completedDeliveries
        },
        recentOrders,
        topBusinesses: topBusinessesData,
        chart: {
          daily: dailyDataPoints
        }
      }
    });
  } catch (error) {
    console.error('Admin istatistikleri alınırken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'İstatistikler alınırken bir hata oluştu'
      }, 
      { status: 500 }
    );
  }
} 