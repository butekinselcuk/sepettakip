import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken, withAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define types for API response
type OrderTrendItem = {
  date: string;
  count: number;
};

type DashboardStats = {
  users: { total: number; new: number };
  orders: { total: number; new: number };
  revenue: { total: number; new: number };
  couriers: { total: number; active: number };
};

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    // No need to check token or role here, withAuth already did that
    // Note that user contains the decoded token with userId, email, role etc.

    // Son 30 günlük verileri alma
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Kullanıcı sayısı istatistikleri
    const totalUsers = await prisma.user.count();
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Sipariş istatistikleri
    const totalOrders = await prisma.order.count();
    const newOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // Gelir istatistikleri
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      },
      where: {
        status: 'DELIVERED'
      }
    });
    
    const newRevenue = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      },
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Kurye istatistikleri
    const totalCouriers = await prisma.courier.count();
    const activeCouriers = await prisma.courier.count({
      where: {
        status: 'AVAILABLE'
      }
    });

    // Son aktivite kayıtları
    const recentActivities = await prisma.notification.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    }).catch(e => {
      console.warn('Aktivite kayıtları yüklenirken hata:', e);
      return [];
    });

    // Son tamamlanan siparişler
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        business: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Günlük sipariş trendi (son 7 gün)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let orderTrend: OrderTrendItem[] = [];
    try {
      // Raw SQL sorgusu yerine Prisma ile sorgu yapalım
      const lastSevenDays = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        lastSevenDays.push(date);
      }
      
      // Her gün için sipariş sayısını sorgula
      const trendData = await Promise.all(
        lastSevenDays.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);
          
          const count = await prisma.order.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          });
          
          return {
            date: date.toISOString().split('T')[0],
            count
          };
        })
      );
      
      orderTrend = trendData;
    } catch (err) {
      console.error('Sipariş trendi yüklenirken hata:', err);
    }

    const dashboardData: {
      stats: DashboardStats;
      recentActivities: typeof recentActivities;
      recentOrders: typeof recentOrders;
      orderTrend: OrderTrendItem[];
    } = {
      stats: {
        users: { total: totalUsers, new: newUsers },
        orders: { total: totalOrders, new: newOrders },
        revenue: { 
          total: totalRevenue._sum.totalPrice || 0, 
          new: newRevenue._sum.totalPrice || 0 
        },
        couriers: { total: totalCouriers, active: activeCouriers }
      },
      recentActivities,
      recentOrders,
      orderTrend
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}, ['ADMIN']); 