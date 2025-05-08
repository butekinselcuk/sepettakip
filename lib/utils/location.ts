/**
 * Location utility functions for route optimization
 */

/**
 * Interface for a geographical position
 */
export interface GeoPosition {
  latitude: number;
  longitude: number;
}

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance between two points using the Haversine formula
 * This calculates the "as-the-crow-flies" distance between two points on Earth
 * 
 * @param point1 First geographical position (latitude, longitude)
 * @param point2 Second geographical position (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  point1: GeoPosition,
  point2: GeoPosition
): number {
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = degreesToRadians(point1.latitude);
  const lon1Rad = degreesToRadians(point1.longitude);
  const lat2Rad = degreesToRadians(point2.latitude);
  const lon2Rad = degreesToRadians(point2.longitude);

  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  const distance = EARTH_RADIUS_KM * c;
  
  return distance;
}

/**
 * Check if a point is within a specified radius of another point
 * 
 * @param center Center point
 * @param point Point to check
 * @param radiusKm Radius in kilometers
 * @returns Boolean indicating whether the point is within the radius
 */
export function isPointWithinRadius(
  center: GeoPosition,
  point: GeoPosition,
  radiusKm: number
): boolean {
  const distance = calculateHaversineDistance(center, point);
  return distance <= radiusKm;
}

/**
 * Estimate travel time between two points based on distance and average speed
 * 
 * @param point1 First geographical position
 * @param point2 Second geographical position
 * @param averageSpeedKmh Average speed in km/h
 * @returns Estimated travel time in minutes
 */
export function estimateTravelTime(
  point1: GeoPosition,
  point2: GeoPosition,
  averageSpeedKmh: number = 30
): number {
  const distance = calculateHaversineDistance(point1, point2);
  // Convert hours to minutes (distance / speed * 60)
  const travelTimeMinutes = (distance / averageSpeedKmh) * 60;
  return Math.ceil(travelTimeMinutes);
}

/**
 * Get center point from an array of positions
 * 
 * @param positions Array of geographical positions
 * @returns Center point (average latitude and longitude)
 */
export function getCenterPoint(positions: GeoPosition[]): GeoPosition {
  if (positions.length === 0) {
    throw new Error("Cannot calculate center point of an empty array");
  }
  
  let sumLat = 0;
  let sumLon = 0;
  
  for (const position of positions) {
    sumLat += position.latitude;
    sumLon += position.longitude;
  }
  
  return {
    latitude: sumLat / positions.length,
    longitude: sumLon / positions.length
  };
}

/**
 * Sort locations by proximity to a reference point
 * 
 * @param referencePoint Reference geographical position
 * @param locations Array of locations to sort
 * @returns Sorted array of locations by distance from reference point
 */
export function sortLocationsByProximity(
  referencePoint: GeoPosition,
  locations: GeoPosition[]
): GeoPosition[] {
  return [...locations].sort((a, b) => {
    const distanceA = calculateHaversineDistance(referencePoint, a);
    const distanceB = calculateHaversineDistance(referencePoint, b);
    return distanceA - distanceB;
  });
}

/**
 * Group locations by proximity (clustering)
 * Basic implementation using a fixed radius approach
 * 
 * @param locations Array of geographical positions
 * @param radiusKm Radius in kilometers to consider points as in the same cluster
 * @returns Array of clusters, each containing an array of positions
 */
export function groupLocationsByProximity(
  locations: GeoPosition[],
  radiusKm: number = 2
): GeoPosition[][] {
  if (locations.length === 0) return [];
  
  const clusters: GeoPosition[][] = [];
  const visited = new Set<number>();
  
  for (let i = 0; i < locations.length; i++) {
    if (visited.has(i)) continue;
    
    const currentCluster: GeoPosition[] = [locations[i]];
    visited.add(i);
    
    for (let j = 0; j < locations.length; j++) {
      if (i === j || visited.has(j)) continue;
      
      if (calculateHaversineDistance(locations[i], locations[j]) <= radiusKm) {
        currentCluster.push(locations[j]);
        visited.add(j);
      }
    }
    
    clusters.push(currentCluster);
  }
  
  return clusters;
} 