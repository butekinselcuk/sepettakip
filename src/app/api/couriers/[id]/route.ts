import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { wsServer } from '@/lib/websocket'
import { CourierStatus } from '@/generated/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courier = await prisma.courier.findUnique({
      where: { id: params.id },
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

    if (!courier) {
      return NextResponse.json(
        { error: 'Courier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(courier)
  } catch (error) {
    console.error('Error fetching courier:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, phone, email, status, location } = body

    const courier = await prisma.courier.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email,
        status: status as CourierStatus,
        location,
      },
    })

    // Broadcast courier update
    wsServer.broadcastCourierUpdate(courier.id, {
      type: 'COURIER_UPDATED',
      courier,
    })

    return NextResponse.json(courier)
  } catch (error) {
    console.error('Error updating courier:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.courier.delete({
      where: { id: params.id },
    })

    // Broadcast courier deletion
    wsServer.broadcastCourierUpdate(params.id, {
      type: 'COURIER_DELETED',
      courierId: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting courier:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 