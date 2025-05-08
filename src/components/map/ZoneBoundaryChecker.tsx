'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isPointInPolygon, isPointNearPolygon, calculateDistance } from '@/lib/mapUtils'

type Coordinate = {
  latitude: number
  longitude: number
}

type Zone = {
  id: string
  name: string
  coordinates: Coordinate[]
  isActive: boolean
}

type Order = {
  id: string
  location: Coordinate
  status: 'PENDING' | 'ASSIGNED' | 'IN_DELIVERY' | 'DELIVERED'
}

type ZoneBoundaryCheckerProps = {
  zones: Zone[]
  orders: Order[]
  onBoundaryAlert: (orderId: string, zoneId: string, distance: number) => void
  className?: string
}

export default function ZoneBoundaryChecker({
  zones,
  orders,
  onBoundaryAlert,
  className = '',
}: ZoneBoundaryCheckerProps) {
  const [boundaryAlerts, setBoundaryAlerts] = useState<{
    orderId: string
    zoneId: string
    distance: number
  }[]>([])

  useEffect(() => {
    checkBoundaries()
  }, [zones, orders])

  const checkBoundaries = () => {
    const alerts: typeof boundaryAlerts = []

    orders.forEach((order) => {
      if (order.status === 'DELIVERED') return

      zones.forEach((zone) => {
        if (!zone.isActive) return

        const inZone = isPointInPolygon(order.location, zone.coordinates)
        const nearZone = isPointNearPolygon(order.location, zone.coordinates, 0.5) // 500m buffer

        if (!inZone && nearZone) {
          // En yakın noktaya olan mesafeyi hesapla
          const distance = calculateDistance(
            order.location,
            findNearestPointOnPolygon(order.location, zone.coordinates)
          )

          alerts.push({
            orderId: order.id,
            zoneId: zone.id,
            distance,
          })
        }
      })
    })

    setBoundaryAlerts(alerts)
    alerts.forEach((alert) => {
      onBoundaryAlert(alert.orderId, alert.zoneId, alert.distance)
    })
  }

  const findNearestPointOnPolygon = (point: Coordinate, polygon: Coordinate[]): Coordinate => {
    let minDistance = Infinity
    let nearestPoint: Coordinate = polygon[0]

    for (let i = 0; i < polygon.length; i++) {
      const start = polygon[i]
      const end = polygon[(i + 1) % polygon.length]
      const nearest = findNearestPointOnLine(point, start, end)
      const distance = calculateDistance(point, nearest)

      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = nearest
      }
    }

    return nearestPoint
  }

  const findNearestPointOnLine = (
    point: Coordinate,
    start: Coordinate,
    end: Coordinate
  ): Coordinate => {
    const dx = end.longitude - start.longitude
    const dy = end.latitude - start.latitude
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) return start

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.longitude - start.longitude) * dx +
          (point.latitude - start.latitude) * dy) /
          (length * length)
      )
    )

    return {
      latitude: start.latitude + t * dy,
      longitude: start.longitude + t * dx,
    }
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[41.0082, 28.9784]} // İstanbul merkez
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zone Polygons */}
        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates.map((coord) => [
              coord.latitude,
              coord.longitude,
            ])}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#93C5FD',
              fillOpacity: 0.4,
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{zone.name}</h3>
                <p className="text-sm text-gray-600">
                  {zone.isActive ? 'Aktif' : 'Pasif'}
                </p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Order Markers */}
        {orders.map((order) => {
          const alert = boundaryAlerts.find((a) => a.orderId === order.id)
          const zone = alert ? zones.find((z) => z.id === alert.zoneId) : null

          return (
            <div key={order.id}>
              <Marker
                position={[order.location.latitude, order.location.longitude]}
                icon={L.divIcon({
                  className: `h-4 w-4 rounded-full ${
                    alert ? 'bg-yellow-500' : 'bg-green-500'
                  }`,
                })}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">Sipariş #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      {order.location.latitude.toFixed(6)},{' '}
                      {order.location.longitude.toFixed(6)}
                    </p>
                    {alert && (
                      <div className="mt-2">
                        <p className="text-sm text-yellow-600">
                          {zone?.name} bölgesine {alert.distance.toFixed(2)} km uzakta
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Alert Circle */}
              {alert && zone && (
                <Circle
                  center={[order.location.latitude, order.location.longitude]}
                  radius={500} // 500m radius
                  pathOptions={{
                    color: '#F59E0B',
                    fillColor: '#FCD34D',
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </div>
          )
        })}
      </MapContainer>

      {/* Alerts Panel */}
      {boundaryAlerts.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white p-4 shadow-lg">
          <h3 className="mb-2 font-semibold">Sınır Uyarıları</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {boundaryAlerts.map((alert) => {
              const order = orders.find((o) => o.id === alert.orderId)
              const zone = zones.find((z) => z.id === alert.zoneId)

              return (
                <div
                  key={alert.orderId}
                  className="rounded-md border border-yellow-200 bg-yellow-50 p-2"
                >
                  <p className="text-sm">
                    <span className="font-medium">Sipariş #{alert.orderId}</span>
                    {' - '}
                    <span className="text-yellow-700">
                      {zone?.name} bölgesine {alert.distance.toFixed(2)} km uzakta
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
} 