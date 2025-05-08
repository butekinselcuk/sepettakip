import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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
    const dailyStats = deliveryStats.reduce((acc: any, curr) => {
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

    const hourlyStats = peakHours.reduce((acc: any, curr) => {
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
        count: count as number
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sonuçları birleştir
    const result = Object.values(dailyStats).map((stat: any) => ({
      ...stat,
      peakHours: peakHoursData
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 