import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPointInPolygon, isPointNearPolygon, calculateDistance } from '@/lib/mapUtils'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { orders } = await request.json()

    if (!Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş verisi' },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        coordinates: true,
        isActive: true,
      },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Bölge bulunamadı' },
        { status: 404 }
      )
    }

    if (!zone.isActive) {
      return NextResponse.json(
        { error: 'Bölge aktif değil' },
        { status: 400 }
      )
    }

    const boundaryAlerts = orders
      .filter((order) => order.status !== 'DELIVERED')
      .map((order) => {
        const inZone = isPointInPolygon(order.location, zone.coordinates)
        const nearZone = isPointNearPolygon(order.location, zone.coordinates, 0.5) // 500m buffer

        if (!inZone && nearZone) {
          // En yakın noktaya olan mesafeyi hesapla
          const distance = calculateDistance(
            order.location,
            findNearestPointOnPolygon(order.location, zone.coordinates)
          )

          return {
            orderId: order.id,
            zoneId: zone.id,
            distance,
            location: order.location,
          }
        }

        return null
      })
      .filter(Boolean)

    return NextResponse.json({
      zone: {
        id: zone.id,
        name: zone.name,
      },
      alerts: boundaryAlerts,
    })
  } catch (error) {
    console.error('Sınır kontrolü hatası:', error)
    return NextResponse.json(
      { error: 'Sınır kontrolü işlemi başarısız' },
      { status: 500 }
    )
  }
}

function findNearestPointOnPolygon(point: any, polygon: any[]): any {
  let minDistance = Infinity
  let nearestPoint = polygon[0]

  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i]
    const end = polygon[(i + 1) % polygon.length]
    const nearest = findNearestPointOnLine(point, start, end)
    const distance = calculateDistance(point, nearest)

    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = nearest
    }
  }

  return nearestPoint
}

function findNearestPointOnLine(point: any, start: any, end: any): any {
  const dx = end.longitude - start.longitude
  const dy = end.latitude - start.latitude
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) return start

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.longitude - start.longitude) * dx +
        (point.latitude - start.latitude) * dy) /
        (length * length)
    )
  )

  return {
    latitude: start.latitude + t * dy,
    longitude: start.longitude + t * dx,
  }
} 