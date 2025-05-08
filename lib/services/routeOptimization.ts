/**
 * Route Optimization Service
 * 
 * This service handles the delivery route planning and optimization
 * using various algorithms including nearest neighbor and clustering.
 */

import { PrismaClient } from '@prisma/client';
import { 
  GeoPosition, 
  calculateHaversineDistance, 
  estimateTravelTime,
  sortLocationsByProximity,
  groupLocationsByProximity
} from '../utils/location';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Interface representing a delivery point for route planning
 */
export interface DeliveryPoint {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  timeWindowId?: string;
  estimatedDuration?: number; // Minutes for the delivery itself
}

/**
 * Interface representing a courier for route planning
 */
export interface CourierForRoute {
  id: string;
  name: string;
  currentLatitude?: number;
  currentLongitude?: number;
  zoneId?: string;
  maxDeliveriesPerDay: number;
  maxDistance?: number;
  averageSpeed?: number;
}

/**
 * Interface representing a route plan
 */
export interface RoutePlan {
  courierId: string;
  deliveryPoints: DeliveryPoint[];
  totalDistance: number;
  totalDuration: number;
  zoneId?: string;
}

/**
 * Get delivery points for planning
 * 
 * @param zoneId Optional zone ID to filter deliveries
 * @param date Date for planning (defaults to today)
 * @returns Promise with array of delivery points
 */
export async function getDeliveryPointsForPlanning(
  zoneId?: string,
  date: Date = new Date()
): Promise<DeliveryPoint[]> {
  // Get orders that need to be delivered
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['PROCESSING', 'PREPARING', 'READY']
      },
      latitude: { not: null },
      longitude: { not: null },
      ...(zoneId ? {
        business: {
          zoneId
        }
      } : {})
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
      address: true,
      priority: true,
      timeWindowId: true,
      estimatedDuration: true
    }
  });

  // Filter out orders with missing coordinates
  return orders.filter(
    order => order.latitude !== null && order.longitude !== null
  ) as DeliveryPoint[];
}

/**
 * Get available couriers for planning
 * 
 * @param zoneId Optional zone ID to filter couriers
 * @param date Date for planning (defaults to today)
 * @returns Promise with array of couriers
 */
export async function getAvailableCouriers(
  zoneId?: string,
  date: Date = new Date()
): Promise<CourierForRoute[]> {
  // Today's date range
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get couriers that are available today
  const couriers = await prisma.courier.findMany({
    where: {
      status: 'ACTIVE',
      ...(zoneId ? { zoneId } : {}),
      availability: {
        some: {
          status: 'AVAILABLE',
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay }
        }
      }
    },
    select: {
      id: true,
      user: {
        select: { name: true }
      },
      currentLatitude: true,
      currentLongitude: true,
      zoneId: true,
      maxDeliveriesPerDay: true,
      maxDistance: true,
      averageSpeed: true
    }
  });

  // Format couriers for route planning
  return couriers.map(courier => ({
    id: courier.id,
    name: courier.user.name,
    currentLatitude: courier.currentLatitude || undefined,
    currentLongitude: courier.currentLongitude || undefined,
    zoneId: courier.zoneId || undefined,
    maxDeliveriesPerDay: courier.maxDeliveriesPerDay,
    maxDistance: courier.maxDistance || undefined,
    averageSpeed: courier.averageSpeed || undefined
  }));
}

/**
 * Plan route using nearest neighbor algorithm
 * Simple greedy algorithm that always selects the closest unvisited point
 * 
 * @param courier Courier for whom to plan the route
 * @param deliveryPoints Array of delivery points to include in the route
 * @returns Planned route with ordered delivery points
 */
export function planRouteNearestNeighbor(
  courier: CourierForRoute,
  deliveryPoints: DeliveryPoint[]
): RoutePlan {
  if (!courier.currentLatitude || !courier.currentLongitude) {
    throw new Error('Courier location is required for route planning');
  }

  // Priority sorting: URGENT > HIGH > MEDIUM > LOW
  const priorityMap = {
    'URGENT': 3,
    'HIGH': 2,
    'MEDIUM': 1,
    'LOW': 0
  };

  // Priority sort first
  const sortedByPriority = [...deliveryPoints].sort(
    (a, b) => priorityMap[b.priority] - priorityMap[a.priority]
  );

  // Take urgent and high priority orders first, regardless of location
  const highPriorityPoints = sortedByPriority.filter(
    p => p.priority === 'URGENT' || p.priority === 'HIGH'
  );

  // Then take remaining orders based on proximity
  const normalPriorityPoints = sortedByPriority.filter(
    p => p.priority !== 'URGENT' && p.priority !== 'HIGH'
  );

  let currentLocation: GeoPosition = {
    latitude: courier.currentLatitude,
    longitude: courier.currentLongitude
  };

  const route: DeliveryPoint[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  // First add all high priority points
  for (const point of highPriorityPoints) {
    const distance = calculateHaversineDistance(
      currentLocation,
      { latitude: point.latitude, longitude: point.longitude }
    );

    // Skip if beyond max distance (if defined)
    if (courier.maxDistance && distance > courier.maxDistance) {
      continue;
    }

    const travelTime = estimateTravelTime(
      currentLocation,
      { latitude: point.latitude, longitude: point.longitude },
      courier.averageSpeed || 30
    );

    totalDistance += distance;
    totalDuration += travelTime;
    
    // Add delivery time if available
    if (point.estimatedDuration) {
      totalDuration += point.estimatedDuration;
    } else {
      totalDuration += 10; // Default 10 min per delivery
    }

    route.push(point);
    
    // Update current location
    currentLocation = {
      latitude: point.latitude,
      longitude: point.longitude
    };

    // Stop if we've reached the courier's daily limit
    if (route.length >= courier.maxDeliveriesPerDay) {
      break;
    }
  }

  // If we haven't reached max deliveries, add normal priority points based on proximity
  if (route.length < courier.maxDeliveriesPerDay) {
    // Remaining points to consider
    let remainingPoints = normalPriorityPoints;

    while (remainingPoints.length > 0 && route.length < courier.maxDeliveriesPerDay) {
      // Find closest point to current location
      let closestIdx = 0;
      let closestDistance = calculateHaversineDistance(
        currentLocation, 
        { latitude: remainingPoints[0].latitude, longitude: remainingPoints[0].longitude }
      );

      for (let i = 1; i < remainingPoints.length; i++) {
        const distance = calculateHaversineDistance(
          currentLocation,
          { latitude: remainingPoints[i].latitude, longitude: remainingPoints[i].longitude }
        );

        if (distance < closestDistance) {
          closestIdx = i;
          closestDistance = distance;
        }
      }

      // Skip if beyond max distance (if defined)
      if (courier.maxDistance && closestDistance > courier.maxDistance) {
        // Remove this point and continue
        remainingPoints = [...remainingPoints.slice(0, closestIdx), ...remainingPoints.slice(closestIdx + 1)];
        continue;
      }

      const nextPoint = remainingPoints[closestIdx];
      const travelTime = estimateTravelTime(
        currentLocation,
        { latitude: nextPoint.latitude, longitude: nextPoint.longitude },
        courier.averageSpeed || 30
      );

      totalDistance += closestDistance;
      totalDuration += travelTime;
      
      // Add delivery time if available
      if (nextPoint.estimatedDuration) {
        totalDuration += nextPoint.estimatedDuration;
      } else {
        totalDuration += 10; // Default 10 min per delivery
      }

      route.push(nextPoint);
      
      // Update current location
      currentLocation = {
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude
      };

      // Remove the point we just added to the route
      remainingPoints = [...remainingPoints.slice(0, closestIdx), ...remainingPoints.slice(closestIdx + 1)];
    }
  }

  return {
    courierId: courier.id,
    deliveryPoints: route,
    totalDistance,
    totalDuration,
    zoneId: courier.zoneId
  };
}

/**
 * Save a planned route to the database
 * 
 * @param routePlan Route plan to save
 * @param date Date for the route (defaults to today)
 * @returns Promise with the created route ID
 */
export async function saveRoutePlan(
  routePlan: RoutePlan,
  date: Date = new Date()
): Promise<string> {
  const startPoint = routePlan.deliveryPoints[0];
  const endPoint = routePlan.deliveryPoints[routePlan.deliveryPoints.length - 1];

  // Create the route
  const route = await prisma.deliveryRoute.create({
    data: {
      zoneId: routePlan.zoneId,
      startLatitude: startPoint?.latitude,
      startLongitude: startPoint?.longitude,
      endLatitude: endPoint?.latitude,
      endLongitude: endPoint?.longitude,
      totalDistance: routePlan.totalDistance,
      totalDuration: routePlan.totalDuration,
      date: date
    }
  });

  // Update the orders with the sequence number for delivery
  for (let i = 0; i < routePlan.deliveryPoints.length; i++) {
    const point = routePlan.deliveryPoints[i];
    await prisma.order.update({
      where: { id: point.id },
      data: {
        courierId: routePlan.courierId,
        sequenceNumber: i + 1,
        estimatedDistance: routePlan.totalDistance / routePlan.deliveryPoints.length, // Simple average for now
        estimatedDuration: point.estimatedDuration || 10 // Use provided or default
      }
    });
  }

  return route.id;
}

/**
 * Find optimal courier assignments for a set of delivery points
 * 
 * @param couriers Available couriers
 * @param deliveryPoints Delivery points to assign
 * @returns Map of courier IDs to their assigned delivery points
 */
export function findOptimalCourierAssignments(
  couriers: CourierForRoute[],
  deliveryPoints: DeliveryPoint[]
): Map<string, DeliveryPoint[]> {
  // Group delivery points by zone if applicable
  const pointsByZone = new Map<string | undefined, DeliveryPoint[]>();
  
  for (const point of deliveryPoints) {
    // Find the zone this point belongs to
    const zone = findZoneForPoint(point);
    const zoneId = zone?.id;
    
    if (!pointsByZone.has(zoneId)) {
      pointsByZone.set(zoneId, []);
    }
    
    pointsByZone.get(zoneId)?.push(point);
  }
  
  // For each zone, assign couriers
  const assignments = new Map<string, DeliveryPoint[]>();
  
  for (const [zoneId, zonePoints] of pointsByZone.entries()) {
    // Get couriers for this zone
    const zonesCouriers = couriers.filter(c => !c.zoneId || c.zoneId === zoneId);
    
    if (zonesCouriers.length === 0) continue;
    
    // Simple round-robin assignment for now
    for (let i = 0; i < zonePoints.length; i++) {
      const courierIdx = i % zonesCouriers.length;
      const courier = zonesCouriers[courierIdx];
      
      if (!assignments.has(courier.id)) {
        assignments.set(courier.id, []);
      }
      
      // Check if courier has reached their maximum deliveries
      if ((assignments.get(courier.id)?.length || 0) < courier.maxDeliveriesPerDay) {
        assignments.get(courier.id)?.push(zonePoints[i]);
      }
    }
  }
  
  return assignments;
}

/**
 * Find the zone for a given geographical point
 * Simple placeholder implementation - would need a proper point-in-polygon algorithm
 * for real zone boundaries
 * 
 * @param point Geographical point
 * @returns Zone the point belongs to, or undefined
 */
function findZoneForPoint(point: DeliveryPoint): { id: string } | undefined {
  // This is a placeholder. In a real implementation:
  // 1. Fetch all zones from database
  // 2. Use a point-in-polygon algorithm to check if the point is within any zone's boundaries
  // 3. Return the matching zone
  
  return undefined; // For now, assuming no zone matching
} 