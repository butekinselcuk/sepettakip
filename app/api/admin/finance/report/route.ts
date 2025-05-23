import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/admin/finance/report - Tüm işletmeler için finansal raporları getirme
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
    
    const decoded = await verifyJwtToken(token);
    if (!decoded || decoded.role !== Role.ADMIN) {
      return new NextResponse(JSON.stringify({ error: 'Bu işlemi gerçekleştirmek için yetkiniz yok' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query parametrelerini al
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const period = url.searchParams.get('period') || 'month'; // day, week, month, year
    const businessId = url.searchParams.get('businessId'); // İsteğe bağlı işletme filtresi

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

    // İşletme filtresi için where koşulu
    const businessWhereClause = businessId ? { id: businessId } : {};

    // Tüm işletmeleri getir (veya belirli bir işletme)
    const businesses = await prisma.business.findMany({
      where: businessWhereClause,
      select: {
        id: true,
        name: true
      }
    });

    // Her işletme için finansal verileri topla
    const businessReports = await Promise.all(
      businesses.map(async (business) => {
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
                  in: ['APPROVED', 'PARTIAL_APPROVED', 'AUTO_APPROVED']
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

        // İşletme raporu
        return {
          businessId: business.id,
          businessName: business.name,
          summary: {
            totalOrders: orders.length,
            deliveredOrders: statusCounts.delivered,
            cancelledOrders: statusCounts.cancelled,
            refundedOrders: statusCounts.refunded,
            totalRevenue: totalRevenue,
            totalRefunds: totalRefunds,
            totalCancellationFees: totalCancellationFees,
            netRevenue: totalRevenue - totalRefunds + totalCancellationFees
          },
          dailyData: {
            revenue: dailyRevenue,
            refunds: dailyRefunds
          }
        };
      })
    );

    // Tarih aralığındaki tüm günleri eksiksiz oluştur
    const allDates: string[] = [];
    let currentDate = new Date(reportStartDate);
    
    while (currentDate <= reportEndDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      allDates.push(dateKey);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Tüm işletmelerin finansal verilerini topla
    const consolidatedSummary = {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      totalRevenue: 0,
      totalRefunds: 0,
      totalCancellationFees: 0,
      netRevenue: 0
    };

    // Günlük konsolide veriler
    const consolidatedDailyRevenue: Record<string, number> = {};
    const consolidatedDailyRefunds: Record<string, number> = {};

    // İşletme verilerini konsolide et
    businessReports.forEach(report => {
      // Özetleri topla
      consolidatedSummary.totalOrders += report.summary.totalOrders;
      consolidatedSummary.deliveredOrders += report.summary.deliveredOrders;
      consolidatedSummary.cancelledOrders += report.summary.cancelledOrders;
      consolidatedSummary.refundedOrders += report.summary.refundedOrders;
      consolidatedSummary.totalRevenue += report.summary.totalRevenue;
      consolidatedSummary.totalRefunds += report.summary.totalRefunds;
      consolidatedSummary.totalCancellationFees += report.summary.totalCancellationFees;
      consolidatedSummary.netRevenue += report.summary.netRevenue;

      // Günlük verileri topla
      for (const date of allDates) {
        consolidatedDailyRevenue[date] = (consolidatedDailyRevenue[date] || 0) + (report.dailyData.revenue[date] || 0);
        consolidatedDailyRefunds[date] = (consolidatedDailyRefunds[date] || 0) + (report.dailyData.refunds[date] || 0);
      }
    });

    // Grafik verisi oluştur
    const chartData = allDates.sort().map(date => ({
      date,
      revenue: consolidatedDailyRevenue[date] || 0,
      refunds: consolidatedDailyRefunds[date] || 0,
      net: (consolidatedDailyRevenue[date] || 0) - (consolidatedDailyRefunds[date] || 0)
    }));

    // İşletme bazında performans sıralaması
    const businessPerformance = businessReports
      .map(report => ({
        id: report.businessId,
        name: report.businessName,
        revenue: report.summary.totalRevenue,
        refunds: report.summary.totalRefunds,
        net: report.summary.netRevenue,
        orders: report.summary.totalOrders
      }))
      .sort((a, b) => b.net - a.net); // Net gelire göre sırala

    // Sonuç raporu
    const report = {
      period: {
        start: reportStartDate,
        end: reportEndDate,
        periodType: period
      },
      summary: consolidatedSummary,
      chartData,
      businessPerformance,
      businessCount: businesses.length,
      businessReports: businessId ? businessReports : undefined // Tek işletme seçildiyse detayları da gönder
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