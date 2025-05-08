import { prisma } from '@/lib/prisma';
import type {
  Zone,
  ZoneFilter,
  ZonePerformance,
  ZoneMetrics,
  Delivery,
  ZoneStatus
} from '../types/index';

export class ZoneService {
  async getZones(filter: ZoneFilter): Promise<Zone[]> {
    const where = {
      ...(filter.status && { status: filter.status }),
    };

    const zones = await prisma.zone.findMany({
      where,
      include: {
        deliveries: filter.includeMetrics ? {
          where: {
            ...(filter.startDate && { createdAt: { gte: filter.startDate } }),
            ...(filter.endDate && { createdAt: { lte: filter.endDate } }),
          },
        } : undefined,
        couriers: filter.includeCourierDistribution ? true : undefined,
      },
    });

    return Promise.all(zones.map(zone => this.mapZone(zone, filter)));
  }

  async getZonePerformance(zoneId: string, filter: ZoneFilter): Promise<ZonePerformance> {
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        deliveries: {
          where: {
            ...(filter.startDate && { createdAt: { gte: filter.startDate } }),
            ...(filter.endDate && { createdAt: { lte: filter.endDate } }),
          },
        },
        couriers: true,
      },
    });

    if (!zone) {
      throw new Error('Zone not found');
    }

    const metrics = await this.calculateZoneMetrics(zone.deliveries);
    const courierDistribution = filter.includeCourierDistribution
      ? await this.analyzeCourierDistribution(zone.deliveries)
      : [];
    const hourlyMetrics = filter.includeHourlyMetrics
      ? await this.analyzeHourlyMetrics(zone.deliveries)
      : [];

    return {
      zoneId,
      timestamp: new Date(),
      metrics,
      courierDistribution,
      hourlyMetrics,
    };
  }

  async getZonePerformanceTrends(filter: ZoneFilter): Promise<ZonePerformance[]> {
    const zones = await this.getZones({
      ...filter,
      includeMetrics: true,
      includeCourierDistribution: true,
      includeHourlyMetrics: true,
    });

    return Promise.all(
      zones.map(zone => this.getZonePerformance(zone.id, filter))
    );
  }

  async calculateZoneMetrics(deliveries: Delivery[]): Promise<ZoneMetrics> {
    const totalDeliveries = deliveries.length;
    const activeDeliveries = deliveries.filter(d => d.status === 'IN_TRANSIT').length;
    const averageDeliveryTime = deliveries.reduce((acc, d) => {
      const metrics = d.metrics || { actualDuration: 0, duration: 0 };
      return acc + (metrics.actualDuration ?? metrics.duration ?? 0);
    }, 0) / (totalDeliveries || 1);
    const successRate = (deliveries.filter(d => d.status === 'DELIVERED').length / (totalDeliveries || 1)) * 100;
    const customerSatisfaction = deliveries.reduce((acc, d) => {
      const customer = d.customer || { rating: 0 };
      return acc + (customer.rating || 0);
    }, 0) / (totalDeliveries || 1);
    const courierEfficiency = await this.calculateCourierEfficiency(deliveries);

    return {
      totalDeliveries,
      activeDeliveries,
      averageDeliveryTime,
      successRate,
      customerSatisfaction,
      courierEfficiency,
    };
  }

  async analyzeCourierDistribution(deliveries: Delivery[]): Promise<{
    courierId: string;
    activeDeliveries: number;
    completedDeliveries: number;
    averageTime: number;
  }[]> {
    const courierData = new Map<string, {
      activeDeliveries: number;
      completedDeliveries: number;
      totalTime: number;
      deliveryCount: number;
    }>();

    deliveries.forEach(delivery => {
      const metrics = delivery.metrics || { actualDuration: 0, duration: 0 };
      const current = courierData.get(delivery.courierId) || {
        activeDeliveries: 0,
        completedDeliveries: 0,
        totalTime: 0,
        deliveryCount: 0,
      };

      if (delivery.status === 'IN_TRANSIT') {
        current.activeDeliveries++;
      } else if (delivery.status === 'DELIVERED') {
        current.completedDeliveries++;
      }

      current.totalTime += metrics.actualDuration ?? metrics.duration ?? 0;
      current.deliveryCount++;

      courierData.set(delivery.courierId, current);
    });

    return Array.from(courierData.entries()).map(([courierId, data]) => ({
      courierId,
      activeDeliveries: data.activeDeliveries,
      completedDeliveries: data.completedDeliveries,
      averageTime: data.totalTime / (data.deliveryCount || 1),
    }));
  }

  async analyzeHourlyMetrics(deliveries: Delivery[]): Promise<{
    hour: number;
    deliveries: number;
    averageTime: number;
    successRate: number;
  }[]> {
    const hourlyData = new Map<number, {
      deliveries: number;
      totalTime: number;
      successfulDeliveries: number;
    }>();

    deliveries.forEach(delivery => {
      const metrics = delivery.metrics || { actualDuration: 0, duration: 0 };
      const hour = delivery.timestamps?.created ? new Date(delivery.timestamps.created).getHours() : 0;
      const current = hourlyData.get(hour) || {
        deliveries: 0,
        totalTime: 0,
        successfulDeliveries: 0,
      };

      current.deliveries++;
      current.totalTime += metrics.actualDuration ?? metrics.duration ?? 0;
      if (delivery.status === 'DELIVERED') {
        current.successfulDeliveries++;
      }

      hourlyData.set(hour, current);
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      deliveries: data.deliveries,
      averageTime: data.totalTime / (data.deliveries || 1),
      successRate: (data.successfulDeliveries / (data.deliveries || 1)) * 100,
    }));
  }

  private async calculateCourierEfficiency(deliveries: Delivery[]): Promise<number> {
    const courierData = new Map<string, {
      totalDeliveries: number;
      totalTime: number;
      totalDistance: number;
    }>();

    deliveries.forEach(delivery => {
      const metrics = delivery.metrics || { actualDuration: 0, duration: 0, distance: 0 };
      const current = courierData.get(delivery.courierId) || {
        totalDeliveries: 0,
        totalTime: 0,
        totalDistance: 0,
      };

      current.totalDeliveries++;
      current.totalTime += metrics.actualDuration ?? metrics.duration ?? 0;
      current.totalDistance += metrics.distance ?? 0;

      courierData.set(delivery.courierId, current);
    });

    const efficiencies = Array.from(courierData.values()).map(data => {
      const averageTime = data.totalTime / (data.totalDeliveries || 1);
      const averageDistance = data.totalDistance / (data.totalDeliveries || 1);
      return averageTime > 0 ? (averageDistance / averageTime) * 100 : 0; // km/min * 100
    });

    return efficiencies.length > 0 ? (efficiencies.reduce((acc, val) => acc + val, 0) / efficiencies.length) : 0;
  }

  private async mapZone(zone: any, filter: ZoneFilter): Promise<Zone> {
    const metrics = filter.includeMetrics
      ? await this.calculateZoneMetrics(zone.deliveries)
      : {
          totalDeliveries: zone.totalDeliveries,
          activeDeliveries: zone.activeDeliveries,
          averageDeliveryTime: zone.averageDeliveryTime,
          successRate: zone.successRate,
          customerSatisfaction: zone.customerSatisfaction,
          courierEfficiency: zone.courierEfficiency,
        };

    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      boundaries: zone.boundaries,
      metrics,
      activeCouriers: zone.activeCouriers,
      status: zone.status as ZoneStatus,
    };
  }
} 