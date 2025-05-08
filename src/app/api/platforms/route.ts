import { NextResponse } from 'next/server'
import { PlatformIntegrationManager } from '@/services/platformIntegrations/manager'
import { prisma } from '@/lib/prisma'

const platformManager = new PlatformIntegrationManager()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'sync':
        const orders = await platformManager.syncAllOrders()
        
        // Sync orders to database
        for (const order of orders) {
          await prisma.order.upsert({
            where: {
              platformOrderId: order.platformOrderId,
            },
            create: {
              orderNumber: order.orderNumber,
              status: order.status,
              platform: order.platform,
              platformOrderId: order.platformOrderId,
              customer: {
                connectOrCreate: {
                  where: {
                    phone: order.customer.phone,
                  },
                  create: {
                    name: order.customer.name,
                    phone: order.customer.phone,
                  },
                },
              },
              items: {
                create: order.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
              totalAmount: order.totalAmount,
              address: {
                create: {
                  street: order.address.street,
                  district: order.address.district,
                  city: order.address.city,
                  postalCode: order.address.postalCode,
                },
              },
            },
            update: {
              status: order.status,
              items: {
                deleteMany: {},
                create: order.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
              },
              totalAmount: order.totalAmount,
            },
          })
        }

        return NextResponse.json({ success: true, count: orders.length })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in platform API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { platform, platformOrderId, action } = body

    if (!platform || !platformOrderId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    let success = false

    switch (action) {
      case 'updateStatus':
        const { status } = body
        success = await platformManager.updateOrderStatus(
          platform,
          platformOrderId,
          status
        )
        break

      case 'cancel':
        success = await platformManager.cancelOrder(platform, platformOrderId)
        break

      case 'accept':
        success = await platformManager.acceptOrder(platform, platformOrderId)
        break

      case 'reject':
        success = await platformManager.rejectOrder(platform, platformOrderId)
        break

      case 'ready':
        success = await platformManager.markOrderAsReady(platform, platformOrderId)
        break

      case 'pickedUp':
        success = await platformManager.markOrderAsPickedUp(
          platform,
          platformOrderId
        )
        break

      case 'delivered':
        success = await platformManager.markOrderAsDelivered(
          platform,
          platformOrderId
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (success) {
      // Update order status in database
      await prisma.order.update({
        where: {
          platformOrderId,
        },
        data: {
          status: body.status,
        },
      })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Error in platform API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 