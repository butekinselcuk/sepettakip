import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courierId = searchParams.get('courierId')
    const type = searchParams.get('type') as NotificationType | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Filtreleme koşullarını oluştur
    const where = {
      AND: [
        {
          OR: [
            { userId: userId || undefined },
            { courierId: courierId || undefined },
          ],
        },
        type ? { type } : {},
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    }

    // Bildirimleri getir
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Son 50 bildirim
    })

    // İstatistikleri hesapla
    const total = await prisma.notification.count({ where })
    const unread = await prisma.notification.count({
      where: { ...where, readAt: null },
    })

    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where,
      _count: true,
    })

    const stats = {
      total,
      unread,
      byType: byType.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.type]: curr._count,
        }),
        {} as Record<NotificationType, number>
      ),
    }

    return NextResponse.json({ notifications, stats })
  } catch (error) {
    console.error('Bildirim geçmişi getirme hatası:', error)
    return NextResponse.json(
      { error: 'Bildirim geçmişi alınamadı' },
      { status: 500 }
    )
  }
} 