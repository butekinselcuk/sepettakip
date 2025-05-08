import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Status } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const regionFilter = searchParams.get('region');
    const courier = searchParams.get('courier');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform') || 'all';
    const orderType = searchParams.get('orderType') || 'all';
    
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // Tarih filtresi
    let dateFilter = {};
    if (fromDate && toDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(fromDate),
          lte: new Date(toDate)
        }
      };
    }
    
    // Temel filtreleme koşulları
    const baseConditions = {
      ...dateFilter,
      ...(courier && courier !== 'all' ? { courierId: courier } : {}),
      ...(status && status !== 'all' ? { status: status as Status } : {}),
    };
    
    // Bölgeleri getir
    let regions;
    if (regionFilter && regionFilter !== 'all') {
      // Sadece belirli bir bölge için veri getir
      regions = await prisma.zone.findMany({
        where: {
          id: regionFilter
        },
        select: {
          id: true,
          name: true,
        },
      });
    } else {
      // Tüm bölgeler için veri getir
      regions = await prisma.zone.findMany({
        select: {
          id: true,
          name: true,
        },
      });
    }
    
    // Her bölge için performans verileri
    const result = await Promise.all(
      regions.map(async (region) => {
        // Bölge için filtreleme koşulları
        const regionConditions = {
          ...baseConditions,
          zoneId: region.id,
        };
        
        // Toplam teslimat sayısı
        const deliveries = await prisma.delivery.count({
          where: regionConditions,
        });
        
        // Tamamlanan teslimatlar
        const completed = await prisma.delivery.count({
          where: {
            ...regionConditions,
            status: Status.COMPLETED,
          },
        });
        
        // Başarı oranı
        const successRate = deliveries > 0
          ? Math.round((completed / deliveries) * 100)
          : 0;
        
        return {
          name: region.name,
          id: region.id,
          deliveries,
          successRate,
        };
      })
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bölge performans verileri alınamadı:', error);
    return NextResponse.json(
      { error: 'Bölge performans verileri alınamadı' },
      { status: 500 }
    );
  }
} 