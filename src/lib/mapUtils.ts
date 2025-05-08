type Coordinate = {
  latitude: number
  longitude: number
}

/**
 * Ray casting algorithm for checking if a point is inside a polygon
 * @param point The point to check
 * @param polygon Array of coordinates forming the polygon
 * @returns boolean indicating if the point is inside the polygon
 */
export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  const x = point.latitude
  const y = point.longitude
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude
    const yi = polygon[i].longitude
    const xj = polygon[j].latitude
    const yj = polygon[j].longitude

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude)
  const dLon = toRad(point2.longitude - point1.longitude)
  const lat1 = toRad(point1.latitude)
  const lat2 = toRad(point2.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Find the nearest point in a polygon to a given point
 * @param point The point to check
 * @param polygon Array of coordinates forming the polygon
 * @returns The nearest point on the polygon boundary
 */
export function findNearestPointOnPolygon(
  point: Coordinate,
  polygon: Coordinate[]
): Coordinate {
  let minDistance = Infinity
  let nearestPoint: Coordinate = polygon[0]

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i]
    const p2 = polygon[(i + 1) % polygon.length]
    const nearest = findNearestPointOnLine(point, p1, p2)
    const distance = calculateDistance(point, nearest)

    if (distance < minDistance) {
      minDistance = distance
      nearestPoint = nearest
    }
  }

  return nearestPoint
}

/**
 * Find the nearest point on a line segment to a given point
 * @param point The point to check
 * @param lineStart Start point of the line segment
 * @param lineEnd End point of the line segment
 * @returns The nearest point on the line segment
 */
function findNearestPointOnLine(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate
): Coordinate {
  const x = point.latitude
  const y = point.longitude
  const x1 = lineStart.latitude
  const y1 = lineStart.longitude
  const x2 = lineEnd.latitude
  const y2 = lineEnd.longitude

  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  return { latitude: xx, longitude: yy }
}

/**
 * Check if a point is within a certain distance of a polygon
 * @param point The point to check
 * @param polygon Array of coordinates forming the polygon
 * @param maxDistance Maximum distance in kilometers
 * @returns boolean indicating if the point is within the specified distance
 */
export function isPointNearPolygon(
  point: Coordinate,
  polygon: Coordinate[],
  maxDistance: number
): boolean {
  if (isPointInPolygon(point, polygon)) return true

  const nearestPoint = findNearestPointOnPolygon(point, polygon)
  const distance = calculateDistance(point, nearestPoint)

  return distance <= maxDistance
} 