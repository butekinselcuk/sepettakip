import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Toplam teslimat sayısı
    const totalDeliveries = await prisma.delivery.count();
    // Son 24 saatteki teslimat
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveriesToday = await prisma.delivery.count({
      where: {
        createdAt: { gte: today },
      },
    });
    // Ortalama teslimat süresi (manuel hesaplama)
    const completedDeliveries = await prisma.delivery.findMany({
      where: { status: 'COMPLETED', deliveryTime: { not: null } },
      select: { deliveryTime: true },
    });
    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => sum + (d.deliveryTime || 0), 0) / completedDeliveries.length
      : 0;
    // Aktif kurye sayısı
    const activeCouriers = await prisma.courier.count({
      where: { status: 'ACTIVE' },
    });
    // Toplam gelir (örnek: teslimat başı 50 TL varsayalım)
    const totalIncome = totalDeliveries * 50;
    // Başarı oranı (tamamlanan/total)
    const completed = await prisma.delivery.count({ where: { status: 'COMPLETED' } });
    const successRate = totalDeliveries > 0 ? (completed / totalDeliveries) * 100 : 0;

    return NextResponse.json({
      totalDeliveries,
      deliveriesToday,
      avgDeliveryTime,
      activeCouriers,
      totalIncome,
      // avgRating: avgRating._avg?.averageRating || 0, // Geçici olarak kaldırıldı
      successRate,
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 