import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDistance, isPointInPolygon } from '@/lib/mapUtils'

type Coordinate = {
  latitude: number
  longitude: number
}

type Zone = {
  id: string
  name: string
  coordinates: Coordinate[]
  couriers: {
    id: string
    name: string
    status: string
  }[]
}

type Suggestion = {
  zoneId: string
  zoneName: string
  distance: number
  isInZone: boolean
  activeCouriers: number
  center: Coordinate
}

export async function POST(request: Request) {
  try {
    const { location, maxDistance = 5 } = await request.json() // maxDistance in kilometers

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: 'Geçersiz konum verisi' },
        { status: 400 }
      )
    }

    // Tüm aktif bölgeleri getir
    const zones = await prisma.deliveryZone.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        coordinates: true,
        couriers: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    // Her bölge için mesafe ve uygunluk hesapla
    const suggestions = zones
      .map((zone: Zone) => {
        // Bölgenin merkez noktasını hesapla
        const center = calculateZoneCenter(zone.coordinates)
        
        // Mesafeyi hesapla
        const distance = calculateDistance(location, center)
        
        // Bölge içinde mi kontrol et
        const isInZone = isPointInPolygon(location, zone.coordinates)
        
        // Aktif kurye sayısını hesapla
        const activeCouriers = zone.couriers.filter(
          (courier) => courier.status === 'ACTIVE'
        ).length

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          distance,
          isInZone,
          activeCouriers,
          center,
        }
      })
      .filter((suggestion: Suggestion) => suggestion.distance <= maxDistance)
      .sort((a: Suggestion, b: Suggestion) => {
        // Öncelik sırası:
        // 1. Bölge içindeki konumlar
        // 2. Mesafeye göre
        // 3. Aktif kurye sayısına göre
        if (a.isInZone !== b.isInZone) return b.isInZone ? 1 : -1
        if (a.distance !== b.distance) return a.distance - b.distance
        return b.activeCouriers - a.activeCouriers
      })

    return NextResponse.json({
      suggestions: suggestions.map(({ zoneId, zoneName, distance, isInZone, activeCouriers }: Suggestion) => ({
        zoneId,
        zoneName,
        distance: Math.round(distance * 1000), // metre cinsinden
        isInZone,
        activeCouriers,
      })),
    })
  } catch (error) {
    console.error('Bölge önerisi hatası:', error)
    return NextResponse.json(
      { error: 'Bölge önerisi işlemi başarısız' },
      { status: 500 }
    )
  }
}

function calculateZoneCenter(coordinates: Coordinate[]): Coordinate {
  if (!coordinates.length) {
    throw new Error('Koordinat listesi boş olamaz')
  }

  const sum = coordinates.reduce(
    (acc, coord) => ({
      latitude: acc.latitude + coord.latitude,
      longitude: acc.longitude + coord.longitude,
    }),
    { latitude: 0, longitude: 0 }
  )

  return {
    latitude: sum.latitude / coordinates.length,
    longitude: sum.longitude / coordinates.length,
  }
} 