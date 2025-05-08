import axios from 'axios';
import { OrderStatus, Platform } from '@prisma/client';
import {
  BasePlatformIntegration,
  PlatformIntegration,
  PlatformOrder,
} from './base';

/**
 * Trendyol API integration for handling orders and platform-specific operations
 */
export class TrendyolIntegration extends BasePlatformIntegration {
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    super(apiKey, 'https://api.trendyol.com/v1', Platform.TRENDYOL);
    this.secretKey = secretKey;
  }

  getPlatformInfo() {
    return {
      name: 'Trendyol',
      logo: '/images/platforms/trendyol.png',
      apiVersion: '1.0',
    };
  }

  async syncOrders(): Promise<PlatformOrder[]> {
    try {
      const response = await this.makeRequest('/orders');
      return (response.orders || []).map(this.mapOrder.bind(this));
    } catch (error) {
      console.error('Error fetching Trendyol orders:', error);
      return [];
    }
  }

  async getOrderDetails(platformOrderId: string): Promise<PlatformOrder> {
    const response = await this.makeRequest(`/orders/${platformOrderId}`);
    return this.mapOrder(response);
  }

  async updateOrderStatus(
    platformOrderId: string,
    status: OrderStatus
  ): Promise<boolean> {
    try {
      await this.makeRequest(
        `/orders/${platformOrderId}/status`,
        'PUT',
        { status: this.mapStatusToPlatform(status) }
      );
      return true;
    } catch (error) {
      console.error('Error updating Trendyol order status:', error);
      return false;
    }
  }

  async cancelOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/cancel`, 'POST');
    return true;
  }

  async acceptOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/accept`, 'POST');
    return true;
  }

  async rejectOrder(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/reject`, 'POST');
    return true;
  }

  async markOrderAsReady(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/ready`, 'POST');
    return true;
  }

  async markOrderAsPickedUp(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/picked-up`, 'POST');
    return true;
  }

  async markOrderAsDelivered(platformOrderId: string): Promise<boolean> {
    await this.makeRequest(`/orders/${platformOrderId}/delivered`, 'POST');
    return true;
  }

  private mapOrder(data: any): PlatformOrder {
    return {
      id: data.id,
      orderNumber: data.orderNumber.toString(),
      status: this.mapStatusFromPlatform(data.status),
      customer: {
        name: `${data.customerDetails?.firstName || ''} ${data.customerDetails?.lastName || ''}`.trim(),
        phone: data.customerDetails?.phoneNumber || '',
      },
      address: {
        street: data.address?.addressLine1 || '',
        district: data.address?.district || '',
        city: data.address?.city || '',
        postalCode: data.address?.postalCode || '',
      },
      items: (data.items || []).map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: data.totalPrice,
      platform: Platform.TRENDYOL,
      platformOrderId: data.id,
      createdAt: new Date(data.orderDate),
    };
  }

  private mapStatusFromPlatform(status: string): OrderStatus {
    const statusMap: { [key: string]: OrderStatus } = {
      'CREATED': OrderStatus.PENDING,
      'PREPARING': OrderStatus.PREPARING,
      'READY': OrderStatus.READY_FOR_PICKUP,
      'SHIPPING': OrderStatus.IN_TRANSIT,
      'DELIVERED': OrderStatus.DELIVERED,
      'CANCELLED': OrderStatus.CANCELLED,
      'REJECTED': OrderStatus.CANCELLED,
    };
    
    return statusMap[status] || OrderStatus.PENDING;
  }

  private mapStatusToPlatform(status: OrderStatus): string {
    const statusMap: { [key in OrderStatus]: string } = {
      [OrderStatus.PENDING]: 'CREATED',
      [OrderStatus.ACCEPTED]: 'PREPARING',
      [OrderStatus.PREPARING]: 'PREPARING',
      [OrderStatus.READY_FOR_PICKUP]: 'READY',
      [OrderStatus.PICKED_UP]: 'SHIPPING',
      [OrderStatus.IN_TRANSIT]: 'SHIPPING',
      [OrderStatus.DELIVERED]: 'DELIVERED',
      [OrderStatus.CANCELLED]: 'CANCELLED',
    };
    
    return statusMap[status] || 'CREATED';
  }
} 