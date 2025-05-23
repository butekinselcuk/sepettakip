import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * GET /api/admin/dashboard/orders-timeseries - Order time series data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Yetki kontrolü
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
    
    // İzin kontrolü
    const hasAccess = await hasPermission('dashboard:view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }

    // Query parametresi olarak gelen zaman aralığı
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    const compareWithPrevious = url.searchParams.get('compare') === 'true';
    
    // Tarih aralıklarını belirle
    const { labels, dateRanges, intervalType } = getTimeSeriesParams(period);
    
    // Mevcut dönemin siparişleri
    const currentOrdersData = await getOrdersTimeSeriesData(dateRanges.current, intervalType);
    
    // Karşılaştırma dönemi siparişleri
    let previousOrdersData = null;
    if (compareWithPrevious) {
      previousOrdersData = await getOrdersTimeSeriesData(dateRanges.previous, intervalType);
    }
    
    // Veriyi chart.js formatına dönüştür
    const datasets = [
      {
        label: 'Siparişler',
        data: currentOrdersData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true
      }
    ];
    
    if (previousOrdersData) {
      datasets.push({
        label: 'Önceki Dönem',
        data: previousOrdersData,
        borderColor: '#9CA3AF',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        fill: true
      });
    }
    
    return NextResponse.json({
      data: {
        labels,
        datasets
      },
      period
    });
  } catch (error) {
    console.error('Sipariş zaman serisi hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * Zaman aralığına göre chart parametrelerini oluşturur
 */
function getTimeSeriesParams(period: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  let labels: string[] = [];
  let dateRanges = {
    current: { start: new Date(), end: new Date() },
    previous: { start: new Date(), end: new Date() }
  };
  let intervalType: 'day' | 'hour' | 'month' = 'day';
  
  switch (period) {
    case 'today': {
      // Bugünün saatleri için
      intervalType = 'hour';
      labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      
      const start = new Date(today);
      const end = new Date(now);
      
      dateRanges.current = { start, end };
      
      // Bir önceki gün için
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      const previousEnd = new Date(previousStart);
      previousEnd.setHours(23, 59, 59, 999);
      
      dateRanges.previous = { start: previousStart, end: previousEnd };
      break;
    }
    
    case 'yesterday': {
      // Dünün saatleri için
      intervalType = 'hour';
      labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      
      dateRanges.current = { start, end };
      
      // İki gün önce için
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      const previousEnd = new Date(previousStart);
      previousEnd.setHours(23, 59, 59, 999);
      
      dateRanges.previous = { start: previousStart, end: previousEnd };
      break;
    }
    
    case 'week': {
      // Son 7 gün
      intervalType = 'day';
      const days = [];
      const start = new Date(today);
      start.setDate(start.getDate() - 6); // Son 7 gün (bugün dahil)
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        days.push(day.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }));
      }
      
      labels = days;
      dateRanges.current = { start, end: now };
      
      // Önceki 7 gün
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      
      dateRanges.previous = { start: previousStart, end: previousEnd };
      break;
    }
    
    case 'month': {
      // Bu ay
      intervalType = 'day';
      const start = new Date(today);
      start.setDate(1); // Ayın ilk günü
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const days = [];
      
      for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(today.getFullYear(), today.getMonth(), i);
        if (day <= now) {
          days.push(i.toString());
        }
      }
      
      labels = days;
      dateRanges.current = { start, end: now };
      
      // Önceki ay
      const previousStart = new Date(start);
      previousStart.setMonth(previousStart.getMonth() - 1);
      const previousEnd = new Date(start);
      previousEnd.setDate(0);
      previousEnd.setHours(23, 59, 59, 999);
      
      dateRanges.previous = { start: previousStart, end: previousEnd };
      break;
    }
    
    case 'year': {
      // Bu yıl
      intervalType = 'month';
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const start = new Date(today.getFullYear(), 0, 1); // Yılın ilk günü
      
      labels = months.slice(0, today.getMonth() + 1);
      dateRanges.current = { start, end: now };
      
      // Önceki yıl
      const previousStart = new Date(start);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      
      dateRanges.previous = { start: previousStart, end: previousEnd };
      break;
    }
    
    default:
      return getTimeSeriesParams('week');
  }
  
  return { labels, dateRanges, intervalType };
}

/**
 * Sipariş verilerini zaman serisi olarak getirir
 */
async function getOrdersTimeSeriesData(
  dateRange: { start: Date, end: Date },
  intervalType: 'hour' | 'day' | 'month'
): Promise<number[]> {
  const { start, end } = dateRange;
  
  switch (intervalType) {
    case 'hour': {
      // Her saat için sipariş sayısını hesapla
      const hours = Array(24).fill(0);
      
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        select: {
          createdAt: true
        }
      });
      
      orders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hours[hour]++;
      });
      
      return hours;
    }
    
    case 'day': {
      // Her gün için sipariş sayısını hesapla
      const startDay = start.getDate();
      const endDay = end.getDate();
      const daysInRange = (endDay - startDay) + 1;
      const days = Array(daysInRange).fill(0);
      
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        select: {
          createdAt: true
        }
      });
      
      orders.forEach(order => {
        const day = new Date(order.createdAt).getDate();
        const index = day - startDay;
        if (index >= 0 && index < days.length) {
          days[index]++;
        }
      });
      
      return days;
    }
    
    case 'month': {
      // Her ay için sipariş sayısını hesapla
      const startMonth = start.getMonth();
      const endMonth = end.getMonth();
      const monthsInRange = (endMonth - startMonth) + 1;
      const months = Array(monthsInRange).fill(0);
      
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          }
        },
        select: {
          createdAt: true
        }
      });
      
      orders.forEach(order => {
        const month = new Date(order.createdAt).getMonth();
        const index = month - startMonth;
        if (index >= 0 && index < months.length) {
          months[index]++;
        }
      });
      
      return months;
    }
    
    default:
      return [];
  }
} 