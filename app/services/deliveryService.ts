import { prisma } from '@/lib/prisma';
import {
  Delivery,
  DeliveryFilter,
  DeliveryTrend,
  DeliveryTimeline,
  DeliveryLog,
  DeliveryLogFilter,
  DeliveryMetrics,
  DeliveryStatus
} from '../types/index';

export class DeliveryService {
  async getDeliveries(filter: DeliveryFilter): Promise<Delivery[]> {
    const where = {
      ...(filter.startDate && { createdAt: { gte: filter.startDate } }),
      ...(filter.endDate && { createdAt: { lte: filter.endDate } }),
      ...(filter.courierId && { courierId: filter.courierId }),
      ...(filter.zoneId && { zoneId: filter.zoneId }),
      ...(filter.status && { status: { equals: filter.status as any } }),
    };

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: true,
        logs: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return deliveries.map(this.mapDelivery);
  }

  async getDeliveryTrends(filter: DeliveryFilter): Promise<DeliveryTrend[]> {
    const deliveries = await this.getDeliveries(filter);
    const metrics = await this.calculateDeliveryMetrics(deliveries);
    const hourlyDistribution = await this.analyzeHourlyDistribution(deliveries);

    return [{
      timestamp: new Date(),
      metrics,
      hourlyDistribution,
    }];
  }

  async getDeliveryTimeline(deliveryId: string): Promise<DeliveryTimeline> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { logs: true },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const events = delivery.logs.map(log => ({
      timestamp: log.timestamp,
      status: log.status as DeliveryStatus,
      location: log.lat && log.lng ? { lat: log.lat, lng: log.lng } : undefined,
    }));

    const statusDurations: { [key in DeliveryStatus]?: number } = {};
    let totalDuration = 0;

    for (let i = 1; i < events.length; i++) {
      const duration = (events[i].timestamp.getTime() - events[i - 1].timestamp.getTime()) / (1000 * 60);
      statusDurations[events[i - 1].status] = (statusDurations[events[i - 1].status] || 0) + duration;
      totalDuration += duration;
    }

    return {
      deliveryId,
      events,
      totalDuration,
      statusDurations,
    };
  }

  async getDeliveryLogs(filter: DeliveryLogFilter): Promise<DeliveryLog[]> {
    const where = {
      ...(filter.deliveryId && { deliveryId: filter.deliveryId }),
      ...(filter.courierId && { courierId: filter.courierId }),
      ...(filter.zoneId && { zoneId: filter.zoneId }),
      ...(filter.status && { status: filter.status }),
      ...(filter.startDate && { timestamp: { gte: filter.startDate } }),
      ...(filter.endDate && { timestamp: { lte: filter.endDate } }),
    };

    const logs = await prisma.deliveryLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(this.mapDeliveryLog);
  }

  async calculateDeliveryMetrics(deliveries: Delivery[]): Promise<DeliveryMetrics> {
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'COMPLETED').length;
    const averageDeliveryTime = deliveries.reduce((acc, d) => acc + (d.metrics.actualDuration || d.metrics.duration), 0) / (totalDeliveries || 1);
    const successRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;
    const customerSatisfaction = deliveries.reduce((acc, d) => acc + (d.customer.rating || 0), 0) / (totalDeliveries || 1);

    return {
      totalDeliveries,
      completedDeliveries,
      averageDeliveryTime,
      successRate,
      customerSatisfaction,
    };
  }

  async analyzeHourlyDistribution(deliveries: Delivery[]): Promise<{
    hour: number;
    count: number;
    averageTime: number;
  }[]> {
    const hourlyData = new Map<number, { count: number; totalTime: number }>();

    deliveries.forEach(delivery => {
      const hour = new Date(delivery.timestamps.created).getHours();
      const duration = delivery.metrics.actualDuration || delivery.metrics.duration;

      const current = hourlyData.get(hour) || { count: 0, totalTime: 0 };
      hourlyData.set(hour, {
        count: current.count + 1,
        totalTime: current.totalTime + duration,
      });
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      count: data.count,
      averageTime: data.totalTime / data.count,
    }));
  }

  private mapDelivery(delivery: any): Delivery {
    return {
      id: delivery.id,
      courierId: delivery.courierId,
      zoneId: delivery.zoneId,
      status: delivery.status as DeliveryStatus,
      timestamps: {
        created: delivery.createdAt,
        assigned: delivery.assignedAt,
        pickedUp: delivery.pickedUpAt,
        delivered: delivery.deliveredAt,
        cancelled: delivery.cancelledAt,
      },
      metrics: {
        distance: delivery.distance,
        duration: delivery.duration,
        actualDuration: delivery.actualDuration,
      },
      location: {
        pickup: {
          lat: delivery.pickupLat || 0,
          lng: delivery.pickupLng || 0,
          address: delivery.pickupAddress || '',
        },
        delivery: {
          lat: delivery.deliveryLat || 0,
          lng: delivery.deliveryLng || 0,
          address: delivery.deliveryAddress || '',
        },
      },
      customer: {
        id: delivery.customerId,
        name: delivery.customer?.name || '',
        phone: delivery.customer?.phone || '',
        rating: delivery.customer?.averageRating || 0,
        feedback: '',
      },
    };
  }

  private mapDeliveryLog(log: any): DeliveryLog {
    return {
      id: log.id,
      deliveryId: log.deliveryId,
      timestamp: log.timestamp,
      status: log.status as DeliveryStatus,
      location: log.lat && log.lng ? { lat: log.lat, lng: log.lng } : undefined,
      metadata: {
        courierId: log.courierId,
        zoneId: log.zoneId,
        reason: log.reason,
        notes: log.notes,
      },
    };
  }
} 