import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({
      include: {
        couriers: true,
        orders: true,
      },
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching delivery zones:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, coordinates } = body

    if (!name || !coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: 'Name and coordinates are required' },
        { status: 400 }
      )
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        description,
        coordinates,
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error creating delivery zone:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 