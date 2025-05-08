import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: params.id },
      include: {
        couriers: true,
        orders: true,
      },
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Delivery zone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error fetching delivery zone:', error)
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
    const { name, description, coordinates, isActive } = body

    const zone = await prisma.deliveryZone.update({
      where: { id: params.id },
      data: {
        name,
        description,
        coordinates,
        isActive,
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error updating delivery zone:', error)
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
    await prisma.deliveryZone.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting delivery zone:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 