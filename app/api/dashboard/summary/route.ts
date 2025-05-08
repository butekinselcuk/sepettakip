import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const courier = searchParams.get('courier');
    const statusParam = searchParams.get('status');
    const platform = searchParams.get('platform');
    const orderType = searchParams.get('orderType');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const onlyLate = searchParams.get('onlyLate') === 'true';
    
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // Filtreleme koşulları oluştur
    let dateFilter = {};
    if (fromDate && toDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(fromDate),
          lte: new Date(toDate)
        }
      };
    }
    
    // Teslimat verilerini çek
    const deliveryFilter: any = {
      ...dateFilter,
      ...(region && region !== 'all' ? { zoneId: region } : {}),
      ...(courier && courier !== 'all' ? { courierId: courier } : {}),
    };
    
    // Status değerini ekle - schema'da String olarak tanımlandığı için doğrudan gönderiyoruz
    if (statusParam && statusParam !== 'all') {
      deliveryFilter.status = statusParam;
    }

    // Prisma sorguları 
    const totalDeliveries = await prisma.delivery.count({
      where: deliveryFilter,
    });
    
    // Bugünkü teslimatlar için filtre
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayFilter = {
      ...deliveryFilter,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    };
    
    const todayDeliveries = await prisma.delivery.count({
      where: todayFilter,
    });
    
    // Ortalama teslimat süresi - duration kullanılıyor
    const deliveriesWithDuration = await prisma.delivery.findMany({
      where: {
        ...deliveryFilter,
        duration: { not: null },
      },
      select: {
        duration: true,
      },
    });
    
    let avgDeliveryTime = 0;
    if (deliveriesWithDuration.length > 0) {
      const totalDuration = deliveriesWithDuration.reduce(
        (sum, delivery) => sum + (delivery.duration || 0), 
        0
      );
      avgDeliveryTime = Math.round(totalDuration / deliveriesWithDuration.length);
    }
    
    // Aktif kuryeler
    const activeCouriers = await prisma.courier.count({
      where: {
        status: 'ACTIVE',
        ...(region && region !== 'all' ? { zoneId: region } : {}),
      },
    });
    
    // Başarı oranı
    const allDeliveries = await prisma.delivery.count({
      where: deliveryFilter,
    });
    
    const completedDeliveries = await prisma.delivery.count({
      where: {
        ...deliveryFilter,
        status: 'COMPLETED',
      },
    });
    
    const successRate = allDeliveries > 0
      ? Math.round((completedDeliveries / allDeliveries) * 100)
      : 0;
    
    // Mock Toplam Gelir (gerçek bir alan yok, bu sadece bir örnek)
    const totalIncome = totalDeliveries * 25; // 25₺ ortalama gelir varsayımı
    
    return NextResponse.json({
      totalDeliveries,
      todayDeliveries,
      avgDeliveryTime,
      activeCouriers,
      totalIncome,
      successRate,
    });
  } catch (error) {
    console.error('Dashboard özet verileri alınamadı:', error);
    return NextResponse.json(
      { error: 'Dashboard özet verileri alınamadı' },
      { status: 500 }
    );
  }
} 