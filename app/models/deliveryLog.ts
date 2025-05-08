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

export interface DeliveryLogFilter {
  deliveryId?: string;
  courierId?: string;
  zoneId?: string;
  status?: DeliveryStatus;
  startDate?: Date;
  endDate?: Date;
  includeLocation?: boolean;
}

// Time series tracking
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