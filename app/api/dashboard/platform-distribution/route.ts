import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

interface PlatformData {
  name: string;
  value: number;
  percentage: number;
}

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
    
    // Kurye ve durum filtreleri
    if (courierFilter && courierFilter !== 'all') {
      whereConditions.courierId = courierFilter;
    }
    
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.status = statusFilter as Status;
    }
    
    if (regionFilter && regionFilter !== 'all') {
      whereConditions.zoneId = regionFilter;
    }
    
    if (platformFilter && platformFilter !== 'all') {
      whereConditions.platformId = platformFilter;
    }
    
    if (orderTypeFilter && orderTypeFilter !== 'all') {
      whereConditions.orderType = orderTypeFilter;
    }
    
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
    
    if (onlyLate) {
      whereConditions.isLate = true;
    }
    
    // Gerçek bir uygulamada platformları veritabanından alacağız
    // Örnek simülasyon için sabit platform listesi
    const platformNames = ['Yemeksepeti', 'Getir', 'Trendyol', 'Migros', 'Diğer'];
    
    // Her platform için teslimat sayısı
    const platformData: PlatformData[] = [];
    
    for (let i = 0; i < platformNames.length; i++) {
      const platformId = `platform-${i + 1}`;
      
      // Platform ID'sine göre teslimat sayısını say
      const count = await prisma.delivery.count({
        where: {
          ...whereConditions,
          platformId: platformId
        }
      });
      
      if (count > 0) {
        platformData.push({
          name: platformNames[i],
          value: count,
          percentage: 0 // Daha sonra hesaplanacak
        });
      }
    }
    
    // Toplam teslimat sayısı
    const totalDeliveries = platformData.reduce((acc: number, curr: PlatformData) => acc + curr.value, 0);
    
    // Yüzdeleri hesapla
    const result = platformData.map((item: PlatformData) => ({
      ...item,
      percentage: totalDeliveries > 0 ? Math.round((item.value / totalDeliveries) * 100) : 0
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Platform dağılımı verileri alınamadı:', error);
    return NextResponse.json({ error: 'Platform dağılımı verileri alınamadı' }, { status: 500 });
  }
} 