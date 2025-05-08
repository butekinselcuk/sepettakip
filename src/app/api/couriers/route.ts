import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { wsServer } from '@/lib/websocket'

export async function GET() {
  try {
    const couriers = await prisma.courier.findMany({
      include: {
        orders: {
          where: {
            status: {
              in: ['PICKED_UP', 'IN_TRANSIT'],
            },
          },
        },
      },
    })

    return NextResponse.json(couriers)
  } catch (error) {
    console.error('Error fetching couriers:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const courier = await prisma.courier.create({
      data: {
        name,
        phone,
        email,
      },
    })

    // Broadcast courier update
    wsServer.broadcastCourierUpdate(courier.id, {
      type: 'COURIER_CREATED',
      courier,
    })

    return NextResponse.json(courier)
  } catch (error) {
    console.error('Error creating courier:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 