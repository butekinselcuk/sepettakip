// Delivery Types
export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

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

export interface DeliveryTimeline {
  deliveryId: string;
  events: {
    timestamp: Date;
    status: DeliveryStatus;
    location?: {
      lat: number;
      lng: number;
    };
    duration?: number; // minutes since last status
  }[];
  totalDuration: number;
  statusDurations: {
    [key in DeliveryStatus]?: number;
  };
}

// Zone Types
export enum ZoneStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

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

// Delivery Log Types
export interface DeliveryLog {
  id: string;
  deliveryId: string;
  timestamp: Date;
  status: DeliveryStatus;
  location?: {
    lat: number;
    lng: number;
  };
  metadata: {
    courierId: string;
    zoneId: string;
    reason?: string;
    notes?: string;
  };
}

export interface DeliveryLogFilter {
  deliveryId?: string;
  courierId?: string;
  zoneId?: string;
  status?: DeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  includeLocation?: boolean;
}

export interface DeliveryTimeSeries {
  timestamp: Date;
  metrics: {
    activeDeliveries: number;
    completedDeliveries: number;
    averageDeliveryTime: number;
    statusDistribution: {
      [key in DeliveryStatus]: number;
    };
  };
  zoneMetrics: {
    [zoneId: string]: {
      activeDeliveries: number;
      completedDeliveries: number;
      averageDeliveryTime: number;
    };
  };
} 