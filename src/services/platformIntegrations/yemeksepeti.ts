import { OrderStatus, Platform } from '@prisma/client'
import {
  BasePlatformIntegration,
  PlatformIntegration,
  PlatformOrder,
} from './base'

export class YemeksepetiIntegration extends BasePlatformIntegration {
  constructor(apiKey: string) {
    super(apiKey, 'https://api.yemeksepeti.com/v1', Platform.YEMEKSEPETI)
  }

  getPlatformInfo() {
    return {
      name: 'Yemeksepeti',
      logo: '/images/platforms/yemeksepeti.png',
      apiVersion: '1.0',
    }
  }

  async syncOrders(): Promise<PlatformOrder[]> {
    const response = await this.makeRequest('/orders')
    return response.orders.map(this.mapOrder)
  }

  async updateOrderStatus(
    platformOrderId: string,
    status: OrderStatus
  ): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/status`, 'PUT', {
      status: this.mapStatusToPlatform(status),
    })
    return true
  }

  async getOrderDetails(platformOrderId: string): Promise<PlatformOrder> {
    const response = await this.makeRequest(`/orders/${platformOrderId}`)
    return this.mapOrder(response)
  }

  async cancelOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/cancel`, 'POST')
    return true
  }

  async acceptOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/accept`, 'POST')
    return true
  }

  async rejectOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/reject`, 'POST')
    return true
  }

  async markOrderAsReady(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/ready`, 'POST')
    return true
  }

  async markOrderAsPickedUp(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/picked-up`, 'POST')
    return true
  }

  async markOrderAsDelivered(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/delivered`, 'POST')
    return true
  }

  private mapOrder(data: any): PlatformOrder {
    return {
      id: data.id,
      orderNumber: data.orderNumber,
      status: this.mapStatusFromPlatform(data.status),
      customer: {
        name: data.customer.name,
        phone: data.customer.phone,
      },
      address: {
        street: data.address.street,
        district: data.address.district,
        city: data.address.city,
        postalCode: data.address.postalCode,
      },
      items: data.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: data.totalAmount,
      platform: Platform.YEMEKSEPETI,
      platformOrderId: data.id,
      createdAt: new Date(data.createdAt),
    }
  }

  private mapStatusFromPlatform(status: string): OrderStatus {
    const statusMap: { [key: string]: OrderStatus } = {
      'NEW': OrderStatus.PENDING,
      'ACCEPTED': OrderStatus.ACCEPTED,
      'PREPARING': OrderStatus.PREPARING,
      'READY': OrderStatus.READY_FOR_PICKUP,
      'PICKED_UP': OrderStatus.PICKED_UP,
      'ON_THE_WAY': OrderStatus.IN_TRANSIT,
      'DELIVERED': OrderStatus.DELIVERED,
      'CANCELLED': OrderStatus.CANCELLED,
    }
    return statusMap[status] || OrderStatus.PENDING
  }

  private mapStatusToPlatform(status: OrderStatus): string {
    const statusMap: { [key in OrderStatus]: string } = {
      [OrderStatus.PENDING]: 'NEW',
      [OrderStatus.ACCEPTED]: 'ACCEPTED',
      [OrderStatus.PREPARING]: 'PREPARING',
      [OrderStatus.READY_FOR_PICKUP]: 'READY',
      [OrderStatus.PICKED_UP]: 'PICKED_UP',
      [OrderStatus.IN_TRANSIT]: 'ON_THE_WAY',
      [OrderStatus.DELIVERED]: 'DELIVERED',
      [OrderStatus.CANCELLED]: 'CANCELLED',
    }
    return statusMap[status]
  }
} 