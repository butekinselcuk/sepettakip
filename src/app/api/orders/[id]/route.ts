import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: true,
        address: true,
        courier: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
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
    const {
      status,
      platform,
      customerId,
      items,
      totalAmount,
      addressId,
      courierId,
    } = body

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(platform && { platform }),
        ...(customerId && {
          customer: {
            connect: { id: customerId },
          },
        }),
        ...(items && {
          items: {
            deleteMany: {},
            create: items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        }),
        ...(totalAmount && { totalAmount }),
        ...(addressId && {
          address: {
            connect: { id: addressId },
          },
        }),
        ...(courierId && {
          courier: {
            connect: { id: courierId },
          },
        }),
      },
      include: {
        customer: true,
        items: true,
        address: true,
        courier: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
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
    await prisma.order.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 