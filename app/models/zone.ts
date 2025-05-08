export interface Zone {
  id: string;
  name: string;
  description?: string;
  boundaries: {
    type: 'Polygon';
    coordinates: [number, number][];
  };
  metrics: ZoneMetrics;
  activeCouriers: number;
  status: ZoneStatus;
}

export interface ZoneMetrics {
  totalDeliveries: number;
  activeDeliveries: number;
  averageDeliveryTime: number;
  successRate: number;
  customerSatisfaction: number;
  courierEfficiency: number;
}

export enum ZoneStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OVERLOADED = 'OVERLOADED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface ZonePerformance {
  zoneId: string;
  timestamp: Date;
  metrics: ZoneMetrics;
  courierDistribution: {
    courierId: string;
    activeDeliveries: number;
    completedDeliveries: number;
    averageTime: number;
  }[];
  hourlyMetrics: {
    hour: number;
    deliveries: number;
    averageTime: number;
    successRate: number;
  }[];
}

export interface ZoneFilter {
  status?: ZoneStatus;
  startDate?: Date;
  endDate?: Date;
  includeMetrics?: boolean;
  includeCourierDistribution?: boolean;
  includeHourlyMetrics?: boolean;
} 