import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/dashboard/metrics - Admin paneli için dashboard metriklerini döndürür
 */
export async function GET(request: NextRequest) {
  let period = 'today';
  
  try {
    // Extract period from query params or use default
    const { searchParams } = new URL(request.url);
    period = searchParams.get('period') || 'today';
    const { startDate, endDate } = getDateRange(period);
    
    // Token'ı alıp doğrulama
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
      
    if (!token) {
      return NextResponse.json({ error: 'Yetkisiz erişim: Token bulunamadı' }, { status: 401 });
      }
      
    // JWT token içindeki bilgileri al
    const decodedToken = await verifyJwtToken(token);
    
    if (!decodedToken || decodedToken.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim: Admin yetkisi gerekli' }, { status: 401 });
    }
    
    try {
      // Get metrics from the database
      const totalOrders = await prisma.order.count();
      
      // If no orders in database, return message
      if (totalOrders === 0) {
        return NextResponse.json({ 
          error: 'No data available in database',
          message: 'Please run the seed script to populate the database with test data' 
        }, { status: 404 });
      }
      
      // Get rest of the metrics
      const newOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const activeDeliveries = await prisma.order.count({
        where: {
          status: {
            in: ['PROCESSING', 'IN_TRANSIT'],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const completedDeliveries = await prisma.order.count({
        where: {
          status: 'DELIVERED',
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalCustomers = await prisma.customer.count();
      
      // Customer modelinde createdAt alanı User modelinde olduğu için, 
      // doğrudan Customer'da bu alanı sorgulayamayız.
      // Dolayısıyla yeni müşteri sayısını User modeli üzerinden bulalım
      const newCustomers = await prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalCouriers = await prisma.courier.count();
      const activeCouriers = await prisma.courier.count({
        where: {
          status: 'AVAILABLE'
        }
      });

      const totalBusinesses = await prisma.business.count();
      const activeBusinesses = totalBusinesses; // Tüm işletmeleri aktif sayalım, çünkü şu anda isActive alanı yok
      
      // Calculate revenue
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
        },
      });
      
      const totalRevenue = payments.reduce((total: number, payment: any) => total + payment.amount, 0);
      
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const revenueByPaymentMethod = await prisma.payment.groupBy({
        by: ['method'],
        _sum: {
          amount: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              amount: true,
              method: true,
            },
          },
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Calculate performance metrics
      const allDeliveries = await prisma.delivery.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      // Average delivery time in minutes
      let averageDeliveryTime = 30;
      
      if (allDeliveries.length > 0) {
        let totalMinutes = 0;
        let validDeliveriesCount = 0;
        
        allDeliveries.forEach((delivery: any) => {
          if (delivery.completedAt && delivery.createdAt) {
            const deliveryTime = (delivery.completedAt.getTime() - delivery.createdAt.getTime()) / (1000 * 60);
            if (deliveryTime > 0) {
              totalMinutes += deliveryTime;
              validDeliveriesCount++;
            }
          }
        });
        
        if (validDeliveriesCount > 0) {
          averageDeliveryTime = Math.round(totalMinutes / validDeliveriesCount);
        }
      }
      
      // Order completion rate
      const totalOrdersInPeriod = await prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const completedOrdersInPeriod = await prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      
      const completionRate = totalOrdersInPeriod > 0 
        ? Math.round((completedOrdersInPeriod / totalOrdersInPeriod) * 100) 
        : 0;
      
      // Try to get additional metrics from SystemSettings
      let additionalMetrics = {};
      try {
        // Şu an için SystemSettings modeli olmadığından, bu kısmı devre dışı bırakıyoruz
        // const dashboardMetricsSetting = await prisma.systemSettings.findUnique({
        //   where: {
        //     key: 'dashboard.metrics'
        //   }
        // });
        
        // if (dashboardMetricsSetting) {
        //   additionalMetrics = JSON.parse(dashboardMetricsSetting.value);
        // }
      } catch (error) {
        console.warn('Failed to fetch additional metrics from SystemSettings:', error);
      }
      
      return NextResponse.json({
        success: true,
        period,
        metrics: {
          orders: {
            total: totalOrders,
            new: newOrders,
            byStatus: ordersByStatus,
          },
          deliveries: {
            active: activeDeliveries,
            completed: completedDeliveries,
            averageDeliveryTime, // in minutes
            completionRate, // percentage
          },
          customers: {
            total: totalCustomers,
            new: newCustomers,
          },
          couriers: {
            total: totalCouriers,
            active: activeCouriers,
          },
          businesses: {
            total: totalBusinesses,
            active: activeBusinesses,
          },
          revenue: {
            total: totalRevenue,
            byPaymentMethod: revenueByPaymentMethod,
          },
          recentOrders,
          ...additionalMetrics,
        },
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database error', details: dbError }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}

// Calculate date range based on period
function getDateRange(period: string) {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setHours(0, 0, 0, 0); // Default to today
  }
  
  return { startDate, endDate: now };
} 