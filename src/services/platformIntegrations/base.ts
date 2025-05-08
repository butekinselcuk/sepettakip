import { Order, OrderStatus, Platform } from '@prisma/client'

export interface PlatformOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  customer: {
    name: string
    phone: string
  }
  address: {
    street: string
    district: string
    city: string
    postalCode?: string
  }
  items: {
    name: string
    quantity: number
    price: number
  }[]
  totalAmount: number
  platform: Platform
  platformOrderId: string
  createdAt: Date
}

export interface PlatformIntegration {
  // Platform bilgilerini getir
  getPlatformInfo(): {
    name: string
    logo: string
    apiVersion: string
  }

  // Siparişleri senkronize et
  syncOrders(): Promise<PlatformOrder[]>

  // Sipariş durumunu güncelle
  updateOrderStatus(
    platformOrderId: string,
    status: OrderStatus
  ): Promise<boolean>

  // Sipariş detaylarını getir
  getOrderDetails(platformOrderId: string): Promise<PlatformOrder>

  // Siparişi iptal et
  cancelOrder(platformOrderId: string): Promise<boolean>

  // Siparişi kabul et
  acceptOrder(platformOrderId: string): Promise<boolean>

  // Siparişi reddet
  rejectOrder(platformOrderId: string): Promise<boolean>

  // Siparişi hazırlandı olarak işaretle
  markOrderAsReady(platformOrderId: string): Promise<boolean>

  // Siparişi teslim alındı olarak işaretle
  markOrderAsPickedUp(platformOrderId: string): Promise<boolean>

  // Siparişi teslim edildi olarak işaretle
  markOrderAsDelivered(platformOrderId: string): Promise<boolean>
}

export class BasePlatformIntegration implements PlatformIntegration {
  protected apiKey: string
  protected apiUrl: string
  protected platform: Platform

  constructor(apiKey: string, apiUrl: string, platform: Platform) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
    this.platform = platform
  }

  getPlatformInfo() {
    throw new Error('Method not implemented.')
  }

  async syncOrders(): Promise<PlatformOrder[]> {
    throw new Error('Method not implemented.')
  }

  async updateOrderStatus(
    platformOrderId: string,
    status: OrderStatus
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async getOrderDetails(platformOrderId: string): Promise<PlatformOrder> {
    throw new Error('Method not implemented.')
  }

  async cancelOrder(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async acceptOrder(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async rejectOrder(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async markOrderAsReady(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async markOrderAsPickedUp(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async markOrderAsDelivered(platformOrderId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  protected async makeRequest(
    endpoint: string,
    method: string = 'GET',
    data?: any
  ): Promise<any> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      ...(data && { body: JSON.stringify(data) }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }
} 