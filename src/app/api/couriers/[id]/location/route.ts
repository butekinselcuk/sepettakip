import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { wsServer } from '@/lib/websocket'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { latitude, longitude } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const courier = await prisma.courier.update({
      where: { id: params.id },
      data: {
        location: {
          latitude,
          longitude,
        },
      },
    })

    // Broadcast location update
    wsServer.broadcastCourierLocation(courier.id, {
      latitude,
      longitude,
    })

    return NextResponse.json(courier)
  } catch (error) {
    console.error('Error updating courier location:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 