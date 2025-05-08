import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const courier = searchParams.get('courier');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform') || 'all';
    const orderType = searchParams.get('orderType') || 'all';
    
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // Son 7 günlük veri için tarih aralığı
    const endDate = toDate ? new Date(toDate) : new Date();
    const startDate = fromDate 
      ? new Date(fromDate) 
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Her gün için veri dizisi oluştur
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Her gün için veri topla
    const result = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Filtreleme koşulları
        const baseConditions = {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          ...(region && region !== 'all' ? { zoneId: region } : {}),
          ...(courier && courier !== 'all' ? { courierId: courier } : {}),
        };
        
        // Toplam teslimat
        const total = await prisma.delivery.count({
          where: baseConditions,
        });
        
        // Tamamlanan teslimatlar
        const completed = await prisma.delivery.count({
          where: {
            ...baseConditions,
            status: 'COMPLETED',
          },
        });
        
        // İptal edilen teslimatlar
        const cancelled = await prisma.delivery.count({
          where: {
            ...baseConditions,
            status: 'FAILED',
          },
        });
        
        return {
          name: day.toLocaleDateString('tr-TR', { weekday: 'long' }),
          date: day.toISOString().split('T')[0],
          total,
          completed,
          cancelled,
        };
      })
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Trend verileri alınamadı:', error);
    return NextResponse.json(
      { error: 'Trend verileri alınamadı' },
      { status: 500 }
    );
  }
} 