'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Coordinate = {
  latitude: number
  longitude: number
}

type Courier = {
  id: string
  name: string
  location: Coordinate | null
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
}

type Zone = {
  id: string
  name: string
  coordinates: Coordinate[]
  isActive: boolean
  couriers: Courier[]
}

type ZoneCourierMapProps = {
  zone: Zone
  availableCouriers: Courier[]
  selectedCouriers: string[]
  onCourierSelect: (courierId: string) => void
  onCourierDeselect: (courierId: string) => void
  className?: string
}

export default function ZoneCourierMap({
  zone,
  availableCouriers,
  selectedCouriers,
  onCourierSelect,
  onCourierDeselect,
  className = '',
}: ZoneCourierMapProps) {
  const mapRef = useRef<L.Map>(null)

  useEffect(() => {
    if (mapRef.current && zone.coordinates.length > 0) {
      const bounds = L.latLngBounds(
        zone.coordinates.map((coord) => [coord.latitude, coord.longitude])
      )
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [zone.coordinates])

  const getStatusColor = (status: Courier['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-500'
      case 'BUSY':
        return 'bg-yellow-500'
      case 'OFFLINE':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: Courier['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Müsait'
      case 'BUSY':
        return 'Meşgul'
      case 'OFFLINE':
        return 'Çevrimdışı'
      default:
        return 'Bilinmiyor'
    }
  }

  return (
    <MapContainer
      ref={mapRef}
      center={[41.0082, 28.9784]} // İstanbul merkez
      zoom={13}
      className={`h-full w-full ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zone Polygon */}
      <Polygon
        positions={zone.coordinates.map((coord) => [coord.latitude, coord.longitude])}
        pathOptions={{
          color: zone.isActive ? '#3B82F6' : '#9CA3AF',
          fillColor: zone.isActive ? '#93C5FD' : '#D1D5DB',
          fillOpacity: 0.4,
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{zone.name}</h3>
            <p className="text-sm text-gray-600">
              {zone.couriers.length} kurye atanmış
            </p>
          </div>
        </Popup>
      </Polygon>

      {/* Courier Markers */}
      {availableCouriers.map((courier) => {
        if (!courier.location) return null

        const isSelected = selectedCouriers.includes(courier.id)
        const isAssigned = zone.couriers.some((c) => c.id === courier.id)

        return (
          <Marker
            key={courier.id}
            position={[courier.location.latitude, courier.location.longitude]}
            eventHandlers={{
              click: () => {
                if (isSelected) {
                  onCourierDeselect(courier.id)
                } else {
                  onCourierSelect(courier.id)
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{courier.name}</h3>
                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusColor(
                      courier.status
                    )}`}
                  />
                  <span className="text-sm text-gray-600">
                    {getStatusText(courier.status)}
                  </span>
                </div>
                {isAssigned && (
                  <p className="mt-1 text-sm text-blue-600">
                    Bu bölgeye atanmış
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
} 