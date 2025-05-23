import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  handleDatabaseError, 
  handleServerError,
  createEmptyResponse
} from '@/lib/api-utils';

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
    
    try {
      // Kuryeler için filtreleme
      const couriers = courierFilter && courierFilter !== 'all'
        ? await prisma.courier.findMany({ 
            where: { id: courierFilter },
            include: { user: true }
          })
        : await prisma.courier.findMany({
            include: { user: true }
          });
      
      // Kurye yoksa boş sonuç döndür
      if (!couriers || couriers.length === 0) {
        return createEmptyResponse('kurye');
      }
      
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
          
          // Gerçek teslimat süresini ve puanı hesapla
          let avgDeliveryTime = 0;
          let rating = 0;
          
          try {
            // Teslimat süresi 
            const deliveryTimes = await prisma.delivery.findMany({
              where: {
                courierId: courier.id,
                status: 'COMPLETED'
              },
              select: {
                assignedAt: true,
                pickedUpAt: true,
                deliveredAt: true
              }
            });
            
            // Süre hesaplama - atama ile teslimat arasındaki süre
            if (deliveryTimes.length > 0) {
              const totalMinutes = deliveryTimes.reduce((total, delivery) => {
                if (delivery.assignedAt && delivery.deliveredAt) {
                  const minutes = Math.floor(
                    (delivery.deliveredAt.getTime() - delivery.assignedAt.getTime()) / (1000 * 60)
                  );
                  return total + minutes;
                }
                return total;
              }, 0);
              
              avgDeliveryTime = Math.round(totalMinutes / deliveryTimes.length);
            }
            
            // Kurye değerlendirmeleri - kurye modelindeki ratings değerini kullan
            rating = courier.ratings || 0;
          } catch (err) {
            // İlgili tablolar henüz yoksa varsayılan değerler kullan
            console.warn("Couldn't fetch delivery times:", err);
            avgDeliveryTime = 0;
            rating = 0;
          }
          
          return {
            id: courier.id,
            name: courier.user?.name || `Kurye ${courier.id.slice(-3)}`,
            totalDeliveries,
            completedDeliveries,
            successRate,
            avgDeliveryTime,
            rating: typeof rating === 'number' ? parseFloat(rating.toFixed(1)) : 0
          };
        })
      );
      
      // Sadece teslimatı olan kuryeleri göster ve sonuçları döndür
      const filteredData = courierPerformanceData.filter(item => item.totalDeliveries > 0);
      
      if (filteredData.length === 0) {
        return createEmptyResponse('teslimat kaydı olan kurye');
      }
      
      return NextResponse.json(filteredData);
    } catch (dbError: any) {
      return handleDatabaseError(dbError);
    }
  } catch (error) {
    return handleServerError(error);
  }
} 