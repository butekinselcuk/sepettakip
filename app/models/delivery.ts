export interface Delivery {
  id: string;
  courierId: string;
  zoneId: string;
  status: DeliveryStatus;
  timestamps: {
    created: Date;
    assigned: Date;
    pickedUp: Date;
    delivered: Date;
    cancelled?: Date;
  };
  metrics: {
    distance: number; // km
    duration: number; // minutes
    actualDuration?: number; // minutes
  };
  location: {
    pickup: {
      lat: number;
      lng: number;
      address: string;
    };
    delivery: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    rating?: number;
    feedback?: string;
  };
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  successRate: number;
  customerSatisfaction: number;
}

export interface DeliveryTrend {
  timestamp: Date;
  metrics: DeliveryMetrics;
  hourlyDistribution: {
    hour: number;
    count: number;
    averageTime: number;
  }[];
}

export interface DeliveryFilter {
  startDate?: Date;
  endDate?: Date;
  courierId?: string;
  zoneId?: string;
  status?: DeliveryStatus;
  timeRange?: 'hourly' | 'daily' | 'weekly' | 'monthly';
} 