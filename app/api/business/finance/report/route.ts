import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// Decoded JWT payload type
interface JWTBusinessPayload {
  userId: string;
  role: Role;
  businessId?: string;
  iat: number;
  exp: number;
}

// GET /api/business/finance/report - İşletme için finansal raporları getirme
export async function GET(request: NextRequest) {
  try {
    // Token doğrulama
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Yetkisiz erişim' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const decoded = await verifyJwtToken(token) as JWTBusinessPayload;
    if (!decoded || decoded.role !== Role.BUSINESS) {
      return new NextResponse(JSON.stringify({ error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // İş yeri ID'si kontrol et
    const businessId = decoded.businessId || await getBusinessIdFromUserId(decoded.userId);
    if (!businessId) {
      return new NextResponse(JSON.stringify({ error: 'İşletme bilgisi bulunamadı' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query parametrelerini al
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || 'month'; // day, week, month, year

    // Tarih aralığını belirle
    const today = new Date();
    const defaultEndDate = new Date(today);
    
    let defaultStartDate: Date;
    switch (period) {
      case 'day':
        defaultStartDate = new Date(today);
        defaultStartDate.setDate(today.getDate() - 1);
        break;
      case 'week':
        defaultStartDate = new Date(today);
        defaultStartDate.setDate(today.getDate() - 7);
        break;
      case 'year':
        defaultStartDate = new Date(today);
        defaultStartDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'month':
      default:
        defaultStartDate = new Date(today);
        defaultStartDate.setMonth(today.getMonth() - 1);
        break;
    }

    const reportStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const reportEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // İşletme bilgilerini getir
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true
      }
    });

    if (!business) {
      return new NextResponse(JSON.stringify({ error: 'İşletme bulunamadı' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // İşletmeye ait siparişleri getir
    const orders = await prisma.order.findMany({
      where: {
        businessId: business.id,
        createdAt: {
          gte: reportStartDate,
          lte: reportEndDate
        }
      },
      include: {
        payments: true,
        refundRequests: {
          where: {
            status: {
              // String literals for RefundRequestStatus
              in: ['APPROVED', 'PARTIAL_APPROVED', 'AUTO_APPROVED'] as any[]
            },
            refundedAt: {
              not: null
            }
          }
        },
        cancellationRequests: true
      }
    });

    // Sipariş durumlarına göre hesaplama
    const statusCounts = {
      delivered: 0,
      cancelled: 0,
      refunded: 0
    };

    // Mali özet hesaplama
    let totalRevenue = 0;
    let totalRefunds = 0;
    let totalCancellationFees = 0;
    
    // Grafik verisi için
    const dailyRevenue: Record<string, number> = {};
    const dailyRefunds: Record<string, number> = {};
    
    // Tarih gruplandırma formatı
    const getDateKey = (date: Date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    };

    // Verileri işle
    orders.forEach((order: any) => {
      const orderDate = order.createdAt;
      const dateKey = getDateKey(orderDate);
      
      // Sipariş toplam tutarı
      const orderAmount = order.totalPrice;
      
      // İade tutarı (eğer varsa)
      const refundAmount = order.refundRequests.reduce((sum: number, req: any) => {
        return sum + (req.approvedAmount || req.refundAmount || 0);
      }, 0);

      // Sipariş durumlarını say
      if (order.status === 'DELIVERED') {
        statusCounts.delivered++;
        totalRevenue += orderAmount;
        
        // Günlük gelir takibi
        dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + orderAmount;
      } else if (order.status === 'CANCELLED') {
        statusCounts.cancelled++;
        
        // İptal ücreti hesaplama
        const cancellationFee = order.cancellationRequests.reduce((sum: number, req: any) => {
          return sum + (req.cancellationFee || 0);
        }, 0);
        
        totalCancellationFees += cancellationFee;
      } else if (order.status === 'REFUNDED' || order.status === 'PARTIALLY_REFUNDED') {
        statusCounts.refunded++;
        totalRefunds += refundAmount;
        
        // Kısmi iade durumunda geriye kalan gelir
        if (order.status === 'PARTIALLY_REFUNDED') {
          totalRevenue += (orderAmount - refundAmount);
        }
        
        // Günlük iade takibi
        dailyRefunds[dateKey] = (dailyRefunds[dateKey] || 0) + refundAmount;
      }
    });

    // Tarih aralığındaki tüm günleri eksiksiz oluştur
    const allDates: string[] = [];
    let currentDate = new Date(reportStartDate);
    
    while (currentDate <= reportEndDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      allDates.push(dateKey);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Özet verileri oluştur
    const summary = {
      totalOrders: orders.length,
      deliveredOrders: statusCounts.delivered,
      cancelledOrders: statusCounts.cancelled,
      refundedOrders: statusCounts.refunded,
      totalRevenue: totalRevenue,
      totalRefunds: totalRefunds,
      totalCancellationFees: totalCancellationFees,
      netRevenue: totalRevenue - totalRefunds + totalCancellationFees
    };

    // Grafik verisi oluştur
    const chartData = allDates.sort().map(date => ({
      date,
      revenue: dailyRevenue[date] || 0,
      refunds: dailyRefunds[date] || 0,
      net: (dailyRevenue[date] || 0) - (dailyRefunds[date] || 0)
    }));

    // Sonuç raporu
    const report = {
      period: {
        start: reportStartDate,
        end: reportEndDate,
        periodType: period
      },
      business: {
        id: business.id,
        name: business.name
      },
      summary,
      chartData
    };

    return new NextResponse(JSON.stringify({ 
      success: true, 
      report
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Finans raporu hatası:', error);
    return new NextResponse(JSON.stringify({ error: 'Finans raporu oluşturulurken bir hata oluştu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Kullanıcı ID'si ile işletme ID'sini bul
async function getBusinessIdFromUserId(userId: string): Promise<string | null> {
  try {
    const business = await prisma.business.findFirst({
      where: { userId },
      select: { id: true }
    });
    
    return business?.id || null;
  } catch (error) {
    console.error('Business ID alınırken hata:', error);
    return null;
  }
} 