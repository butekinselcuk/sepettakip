'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isPointInPolygon, isPointNearPolygon } from '@/lib/mapUtils'

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

type LocationValidatorProps = {
  zones: Zone[]
  location: Coordinate
  onValidationComplete: (isValid: boolean, zoneId: string | null) => void
  className?: string
}

export default function LocationValidator({
  zones,
  location,
  onValidationComplete,
  className = '',
}: LocationValidatorProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isNearBoundary, setIsNearBoundary] = useState(false)

  useEffect(() => {
    validateLocation()
  }, [location, zones])

  const validateLocation = () => {
    let foundZone: Zone | null = null
    let isInZone = false
    let isNearZone = false

    for (const zone of zones) {
      if (!zone.isActive) continue

      const inZone = isPointInPolygon(location, zone.coordinates)
      const nearZone = isPointNearPolygon(location, zone.coordinates, 0.5) // 500m buffer

      if (inZone) {
        foundZone = zone
        isInZone = true
        break
      } else if (nearZone) {
        foundZone = zone
        isNearZone = true
      }
    }

    setSelectedZone(foundZone)
    setIsValid(isInZone)
    setIsNearBoundary(isNearZone)
    onValidationComplete(isInZone, foundZone?.id || null)
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location Marker */}
        <Marker position={[location.latitude, location.longitude]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">Konum</h3>
              <p className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              {isValid !== null && (
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      isValid
                        ? 'bg-green-100 text-green-800'
                        : isNearBoundary
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isValid
                      ? 'Bölge içinde'
                      : isNearBoundary
                      ? 'Bölge sınırına yakın'
                      : 'Bölge dışında'}
                  </span>
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Zone Polygons */}
        {zones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates.map((coord) => [
              coord.latitude,
              coord.longitude,
            ])}
            pathOptions={{
              color: zone.id === selectedZone?.id ? '#3B82F6' : '#9CA3AF',
              fillColor: zone.id === selectedZone?.id ? '#93C5FD' : '#D1D5DB',
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
      </MapContainer>

      {/* Validation Status */}
      {isValid !== null && (
        <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Konum Doğrulama</h3>
              <p className="text-sm text-gray-600">
                {selectedZone
                  ? `Seçili Bölge: ${selectedZone.name}`
                  : 'Bölge bulunamadı'}
              </p>
            </div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                isValid
                  ? 'bg-green-100 text-green-800'
                  : isNearBoundary
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isValid
                ? 'Bölge içinde'
                : isNearBoundary
                ? 'Bölge sınırına yakın'
                : 'Bölge dışında'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
} 