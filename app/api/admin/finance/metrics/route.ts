import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
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
    
    // Sorgu parametrelerini al
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
    
    // Genel gelir metriklerini al
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          notIn: ['CANCELLED', 'REJECTED']
        }
      },
      include: {
        payments: true
      }
    });
    
    // Toplam satış tutarı
    const totalRevenue = orders.reduce((total, order) => total + order.totalPrice, 0);
    
    // Toplam sipariş sayısı
    const totalOrders = orders.length;
    
    // Ortalama sipariş tutarı
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Ödeme tipleri bazında dağılım
    const paymentsByType = orders.reduce((acc: any, order) => {
      order.payments.forEach(payment => {
        if (!acc[payment.method]) {
          acc[payment.method] = 0;
        }
        acc[payment.method] += payment.amount;
      });
      return acc;
    }, {});
    
    // Günlük gelir dağılımı
    const dailyRevenue: any[] = [];
    
    // Tarih aralığına göre döngü oluştur
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i < dayDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      // O gün için sipariş filtresi
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      // O günün toplam geliri
      const dayRevenue = dayOrders.reduce((total, order) => total + order.totalPrice, 0);
      
      // O günün toplam sipariş sayısı
      const dayOrderCount = dayOrders.length;
      
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orderCount: dayOrderCount
      });
    }
    
    // İade edilen ödemeler
    const refunds = await prisma.payment.findMany({
      where: {
        status: 'REFUNDED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    const totalRefunds = refunds.reduce((total, refund) => total + refund.amount, 0);
    
    // İşletme bazında satış dağılımı
    const businessSales = await prisma.business.findMany({
      include: {
        orders: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            status: {
              notIn: ['CANCELLED', 'REJECTED']
            }
          }
        }
      }
    });
    
    const businessRevenue = businessSales.map(business => ({
      id: business.id,
      name: business.name,
      totalOrders: business.orders.length,
      totalRevenue: business.orders.reduce((total, order) => total + order.totalPrice, 0)
    })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    
    return NextResponse.json({
      success: true,
      period,
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalRefunds,
        refundRate: totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0,
        paymentsByType,
        dailyRevenue,
        businessRevenue
      }
    });
  } catch (error) {
    console.error('Finance metrics API error:', error);
    return NextResponse.json(
      { error: 'Finansal metrikler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 