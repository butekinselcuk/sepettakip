import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Order, Courier } from '@prisma/client'

type OrderWithCourier = Order & {
  courier: Courier | null
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'week'

    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get zone orders
    const orders = await prisma.order.findMany({
      where: {
        deliveryZoneId: params.id,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        courier: true,
      },
    }) as OrderWithCourier[]

    // Calculate basic statistics
    const totalOrders = orders.length
    const completedOrders = orders.filter((order) => order.status === 'DELIVERED').length
    const cancelledOrders = orders.filter((order) => order.status === 'CANCELLED').length

    // Calculate average delivery time
    const completedOrderTimes = orders
      .filter((order) => order.status === 'DELIVERED')
      .map((order) => {
        const start = new Date(order.createdAt)
        const end = new Date(order.updatedAt)
        return (end.getTime() - start.getTime()) / (1000 * 60) // Convert to minutes
      })

    const averageDeliveryTime =
      completedOrderTimes.length > 0
        ? completedOrderTimes.reduce((a: number, b: number) => a + b, 0) / completedOrderTimes.length
        : 0

    // Get courier performance
    const courierStats = new Map<string, {
      courierId: string
      courierName: string
      totalDeliveries: number
      totalDeliveryTime: number
      totalRating: number
      ratingCount: number
    }>()

    orders.forEach((order) => {
      if (!order.courier) return

      const courierId = order.courier.id
      if (!courierStats.has(courierId)) {
        courierStats.set(courierId, {
          courierId,
          courierName: order.courier.name,
          totalDeliveries: 0,
          totalDeliveryTime: 0,
          totalRating: 0,
          ratingCount: 0,
        })
      }

      const stats = courierStats.get(courierId)!
      stats.totalDeliveries++

      if (order.status === 'DELIVERED') {
        const start = new Date(order.createdAt)
        const end = new Date(order.updatedAt)
        const deliveryTime = (end.getTime() - start.getTime()) / (1000 * 60)
        stats.totalDeliveryTime += deliveryTime
      }

      if (order.customerRating) {
        stats.totalRating += order.customerRating
        stats.ratingCount++
      }
    })

    const courierPerformance = Array.from(courierStats.values()).map((stats) => ({
      courierId: stats.courierId,
      courierName: stats.courierName,
      totalDeliveries: stats.totalDeliveries,
      averageDeliveryTime:
        stats.totalDeliveries > 0 ? stats.totalDeliveryTime / stats.totalDeliveries : 0,
      customerRating:
        stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0,
    }))

    // Calculate hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: orders.filter(
        (order) => new Date(order.createdAt).getHours() === i
      ).length,
    }))

    // Calculate daily distribution
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const dailyDistribution = days.map((day, index) => ({
      day,
      orders: orders.filter(
        (order) => new Date(order.createdAt).getDay() === index
      ).length,
    }))

    return NextResponse.json({
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageDeliveryTime,
      courierPerformance,
      hourlyDistribution,
      dailyDistribution,
    })
  } catch (error) {
    console.error('Error fetching zone statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch zone statistics' },
      { status: 500 }
    )
  }
} 