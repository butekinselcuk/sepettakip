import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPointInPolygon, isPointNearPolygon } from '@/lib/mapUtils'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { latitude, longitude } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Konum bilgileri eksik' },
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

    const location = { latitude, longitude }
    const inZone = isPointInPolygon(location, zone.coordinates)
    const nearZone = isPointNearPolygon(location, zone.coordinates, 0.5) // 500m buffer

    return NextResponse.json({
      isValid: inZone,
      isNearBoundary: nearZone,
      zone: {
        id: zone.id,
        name: zone.name,
      },
    })
  } catch (error) {
    console.error('Konum doğrulama hatası:', error)
    return NextResponse.json(
      { error: 'Konum doğrulama işlemi başarısız' },
      { status: 500 }
    )
  }
} 