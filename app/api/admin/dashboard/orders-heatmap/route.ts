import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/app/lib/admin/permissions';

/**
 * GET /api/admin/dashboard/orders-heatmap - Order heatmap data (day of week x hour)
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
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Tarih aralığını belirle
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Siparişleri getir
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true
      }
    });
    
    // Haftanın günlerine ve saate göre sipariş sayılarını hesapla
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const dayOfWeek = date.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
      const hour = date.getHours();
      
      heatmapData[dayOfWeek][hour]++;
    });
    
    // Haftanın günleri (Pazartesi'den başlatıyoruz)
    const dayLabels = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    
    // Türkçe gün sıralaması için diziyi yeniden düzenle (Pazartesi = 0, Pazar = 6)
    const heatmapDataSorted = [
      ...heatmapData.slice(1), // Pazartesi - Cumartesi
      heatmapData[0]           // Pazar
    ];
    
    // Saat etiketleri
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    // Toplam order sayısı
    const totalOrders = orders.length;
    
    // En yoğun gün ve saat
    let maxCount = 0;
    let peakDay = 0;
    let peakHour = 0;
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (heatmapDataSorted[day][hour] > maxCount) {
          maxCount = heatmapDataSorted[day][hour];
          peakDay = day;
          peakHour = hour;
        }
      }
    }
    
    // Günlük toplam sipariş sayıları
    const dailyTotals = heatmapDataSorted.map(day => day.reduce((sum, count) => sum + count, 0));
    
    // Saatlik toplam sipariş sayıları
    const hourlyTotals = Array(24).fill(0);
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        hourlyTotals[hour] += heatmapDataSorted[day][hour];
      }
    }
    
    return NextResponse.json({
      data: heatmapDataSorted,
      xLabels: hourLabels,
      yLabels: dayLabels,
      metrics: {
        totalOrders,
        peakDay: dayLabels[peakDay],
        peakHour: hourLabels[peakHour],
        peakCount: maxCount,
        dailyTotals,
        hourlyTotals
      },
      period: `${days} gün`
    });
  } catch (error) {
    console.error('Sipariş heatmap hatası:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
} 