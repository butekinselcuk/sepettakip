import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCourierAssignmentEmail } from '@/lib/email'
import { Courier } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: params.id },
      include: {
        couriers: {
          include: {
            location: true,
          },
        },
      },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error fetching zone couriers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zone couriers' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { courierIds } = await request.json()

    if (!Array.isArray(courierIds)) {
      return NextResponse.json(
        { error: 'Geçersiz kurye listesi' },
        { status: 400 }
      )
    }

    // Bölgeyi güncelle
    const zone = await prisma.deliveryZone.update({
      where: { id: params.id },
      data: {
        couriers: {
          set: courierIds.map((id) => ({ id })),
        },
      },
      include: {
        couriers: true,
      },
    })

    // Yeni atanan kuryelere e-posta gönder
    const startTime = new Date()
    await Promise.all(
      zone.couriers.map((courier: Courier) =>
        sendCourierAssignmentEmail(courier.id, zone.id, startTime)
      )
    )

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Kurye atama hatası:', error)
    return NextResponse.json(
      { error: 'Kuryeler atanamadı' },
      { status: 500 }
    )
  }
} 