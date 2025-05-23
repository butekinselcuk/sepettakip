import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwtToken } from '@/lib/auth';

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
    
    // Query parametrelerini al
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // day, week, month
    
    // Tarih aralığını belirle
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'week':
      default:
        startDate.setDate(endDate.getDate() - 7);
        break;
    }
    
    // İşletmenin siparişlerini getir
    const orders = await prisma.order.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Veri noktalarını gruplandır (günlük)
    const dataPoints: Record<string, { date: string, orders: number, revenue: number }> = {};
    
    // Tarih formatını belirle
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
    };
    
    // Tüm tarih aralığını doldur (boş günler olmasın)
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = formatDate(currentDate);
      dataPoints[dateStr] = {
        date: dateStr,
        orders: 0,
        revenue: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Siparişleri datelere göre grupla
    orders.forEach(order => {
      const orderDate = formatDate(order.createdAt);
      
      if (dataPoints[orderDate]) {
        dataPoints[orderDate].orders += 1;
        dataPoints[orderDate].revenue += order.totalPrice;
      }
    });
    
    // İstatistikler
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Sipariş durumu dağılımı
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    // Chart verilerini oluştur
    const chartData = Object.values(dataPoints);
    
    return NextResponse.json({
      success: true,
      period: period,
      timeRange: {
        start: startDate,
        end: endDate
      },
      chartData: chartData,
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusCounts
      }
    });
  } catch (error) {
    console.error('İşletme siparişleri grafik verisi alınırken hata:', error);
    return NextResponse.json(
      { error: 'Grafik verileri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 