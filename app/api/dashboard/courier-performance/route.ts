import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Tarih parametreleri
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Filtre parametreleri
    const regionFilter = searchParams.get('region');
    const courierFilter = searchParams.get('courier');
    const statusFilter = searchParams.get('status');
    const platformFilter = searchParams.get('platform');
    const orderTypeFilter = searchParams.get('orderType');
    const minAmountParam = searchParams.get('minAmount');
    const maxAmountParam = searchParams.get('maxAmount');
    const onlyLate = searchParams.get('onlyLate') === 'true';
    
    // Tarih filtresi
    const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = toParam ? new Date(toParam) : new Date();
    
    // Temel filtre koşulları
    const whereConditions: any = {
      createdAt: {
        gte: from,
        lte: to
      }
    };
    
    // Bölge filtresi
    if (regionFilter && regionFilter !== 'all') {
      whereConditions.zoneId = regionFilter;
    }
    
    // Platform filtresi
    if (platformFilter && platformFilter !== 'all') {
      whereConditions.platformId = platformFilter;
    }
    
    // Sipariş türü filtresi
    if (orderTypeFilter && orderTypeFilter !== 'all') {
      whereConditions.orderType = orderTypeFilter;
    }
    
    // Tutar filtreleri
    if (minAmountParam) {
      whereConditions.amount = {
        ...whereConditions.amount,
        gte: parseFloat(minAmountParam)
      };
    }
    
    if (maxAmountParam) {
      whereConditions.amount = {
        ...whereConditions.amount,
        lte: parseFloat(maxAmountParam)
      };
    }
    
    // Gecikme filtresi
    if (onlyLate) {
      whereConditions.isLate = true;
    }
    
    // Kuryeler için filtreleme
    const couriers = courierFilter && courierFilter !== 'all'
      ? await prisma.courier.findMany({ where: { id: courierFilter } })
      : await prisma.courier.findMany();
    
    // Her kurye için performans metriklerini hesapla
    const courierPerformanceData = await Promise.all(
      couriers.map(async (courier) => {
        // Kurye için toplam teslimat sayısı
        const totalDeliveries = await prisma.delivery.count({
          where: {
            ...whereConditions,
            courierId: courier.id
          }
        });
        
        // Tamamlanan teslimatlar
        const completedDeliveries = await prisma.delivery.count({
          where: {
            ...whereConditions,
            courierId: courier.id,
            status: 'COMPLETED'
          }
        });
        
        // Başarı oranı
        const successRate = totalDeliveries > 0 
          ? Math.round((completedDeliveries / totalDeliveries) * 100) 
          : 0;
        
        // Ortalama teslimat süresi (dakika olarak)
        const deliveries = await prisma.delivery.findMany({
          where: {
            ...whereConditions,
            courierId: courier.id,
            status: 'COMPLETED'
          },
          select: {
            deliveryTime: true
          }
        });
        
        const totalDeliveryTime = deliveries.reduce((acc, delivery) => acc + (delivery.deliveryTime || 0), 0);
        const avgDeliveryTime = deliveries.length > 0 
          ? Math.round(totalDeliveryTime / deliveries.length) 
          : 0;
        
        // Kurye puanı (5 üzerinden) - müşteri derecelendirmelerinden hesaplanır
        const ratings = await prisma.delivery.findMany({
          where: {
            courierId: courier.id,
            customerRating: {
              not: null
            }
          },
          select: {
            customerRating: true
          }
        });
        
        let rating = 0;
        if (ratings.length > 0) {
          const totalRating = ratings.reduce((acc, delivery) => acc + (delivery.customerRating || 0), 0);
          rating = totalRating / ratings.length;
        } else {
          // Değerlendirme yoksa varsayılan değer
          rating = 3.5;
        }
        
        return {
          id: courier.id,
          name: `Kurye ${courier.id.slice(-3)}`, // Kuryenin ID'sine göre isim oluştur
          totalDeliveries,
          completedDeliveries,
          successRate,
          avgDeliveryTime,
          rating
        };
      })
    );
    
    // Sadece teslimatı olan kuryeleri göster ve sonuçları döndür
    const filteredData = courierPerformanceData.filter(item => item.totalDeliveries > 0);
    
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Kurye performansı verileri alınamadı:', error);
    return NextResponse.json({ error: 'Kurye performansı verileri alınamadı' }, { status: 500 });
  }
} 