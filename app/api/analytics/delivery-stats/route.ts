import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// API yanıt tipi
interface DeliveryStatsResponse {
  date: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  peakHours: {
    hour: number;
    count: number;
  }[];
}

// Stats için azaltım fonksiyonu için interface
interface DeliveryStatsAcc {
  [date: string]: {
    date: string;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
  };
}

// Saat bazlı istatistikler için interface
interface HourlyStatsAcc {
  [hour: string]: number;
}

export async function GET() {
  try {
    // Örnek veri - gerçek uygulamada veritabanından çekilecek
    const stats = {
      totalDeliveries: 128,
      completedDeliveries: 112,
      ongoingDeliveries: 16,
      averageDeliveryTime: "28 dakika",
      customerSatisfaction: "4.7/5",
      weeklyTrend: "+12%"
    };

    return NextResponse.json({ success: true, data: stats });

    /* Gerçek veritabanı sorgusu için:
    // Son 30 günlük teslimat istatistiklerini getir
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deliveryStats = await prisma.delivery.groupBy({
      by: ['createdAt', 'status'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      },
      _avg: {
        deliveryTime: true
      }
    });

    // Verileri günlük bazda grupla
    const dailyStats = deliveryStats.reduce((acc: DeliveryStatsAcc, curr) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          averageDeliveryTime: 0
        };
      }

      acc[date].totalDeliveries += curr._count.id;
      
      if (curr.status === 'COMPLETED') {
        acc[date].successfulDeliveries += curr._count.id;
      } else if (curr.status === 'FAILED') {
        acc[date].failedDeliveries += curr._count.id;
      }

      if (curr._avg.deliveryTime) {
        acc[date].averageDeliveryTime = curr._avg.deliveryTime;
      }

      return acc;
    }, {});

    // Peak hours analizi
    const peakHours = await prisma.delivery.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      }
    });

    const hourlyStats = peakHours.reduce((acc: HourlyStatsAcc, curr) => {
      const hour = curr.createdAt.getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour] += curr._count.id;
      return acc;
    }, {});

    const peakHoursData = Object.entries(hourlyStats)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count: count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sonuçları birleştir
    const result: DeliveryStatsResponse[] = Object.values(dailyStats).map((stat) => ({
      ...stat,
      peakHours: peakHoursData
    }));

    return NextResponse.json({ success: true, data: result });
    */
  } catch (error) {
    console.error('Teslimat istatistikleri alınamadı:', error);
    return NextResponse.json(
      { success: false, error: 'Teslimat istatistikleri alınamadı' },
      { status: 500 }
    );
  }
} 