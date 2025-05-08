import { Platform } from '@prisma/client'
import { PlatformIntegration, PlatformOrder } from './base'
import { YemeksepetiIntegration } from './yemeksepeti'
// import { GetirIntegration } from './getir'
import { TrendyolIntegration } from './trendyol'
// import { MigrosIntegration } from './migros'

export class PlatformIntegrationManager {
  private integrations: Map<Platform, PlatformIntegration>

  constructor() {
    this.integrations = new Map()
    this.initializeIntegrations()
  }

  private initializeIntegrations() {
    // Yemeksepeti entegrasyonu
    if (process.env.YEMEKSEPETI_API_KEY) {
      this.integrations.set(
        Platform.YEMEKSEPETI,
        new YemeksepetiIntegration(process.env.YEMEKSEPETI_API_KEY)
      )
    }

    // Trendyol entegrasyonu
    if (process.env.TRENDYOL_API_KEY && process.env.TRENDYOL_SECRET_KEY) {
      this.integrations.set(
        Platform.TRENDYOL,
        new TrendyolIntegration(
          process.env.TRENDYOL_API_KEY,
          process.env.TRENDYOL_SECRET_KEY
        )
      )
    }

    // Diğer platform entegrasyonları buraya eklenecek
    // if (process.env.GETIR_API_KEY) {
    //   this.integrations.set(
    //     Platform.GETIR,
    //     new GetirIntegration(process.env.GETIR_API_KEY)
    //   )
    // }
  }

  getIntegration(platform: Platform): PlatformIntegration | undefined {
    return this.integrations.get(platform)
  }

  async syncAllOrders(): Promise<PlatformOrder[]> {
    const allOrders: PlatformOrder[] = []

    for (const integration of this.integrations.values()) {
      try {
        const orders = await integration.syncOrders()
        allOrders.push(...orders)
      } catch (error) {
        console.error(`Error syncing orders for platform:`, error)
      }
    }

    return allOrders
  }

  async updateOrderStatus(
    platform: Platform,
    platformOrderId: string,
    status: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.updateOrderStatus(platformOrderId, status as any)
  }

  async getOrderDetails(
    platform: Platform,
    platformOrderId: string
  ): Promise<PlatformOrder> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.getOrderDetails(platformOrderId)
  }

  async cancelOrder(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.cancelOrder(platformOrderId)
  }

  async acceptOrder(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.acceptOrder(platformOrderId)
  }

  async rejectOrder(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.rejectOrder(platformOrderId)
  }

  async markOrderAsReady(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.markOrderAsReady(platformOrderId)
  }

  async markOrderAsPickedUp(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.markOrderAsPickedUp(platformOrderId)
  }

  async markOrderAsDelivered(
    platform: Platform,
    platformOrderId: string
  ): Promise<boolean> {
    const integration = this.getIntegration(platform)
    if (!integration) {
      throw new Error(`No integration found for platform: ${platform}`)
    }

    return integration.markOrderAsDelivered(platformOrderId)
  }
} 