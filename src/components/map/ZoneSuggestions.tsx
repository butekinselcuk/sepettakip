'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

type Suggestion = {
  zoneId: string
  zoneName: string
  distance: number
  isInZone: boolean
  activeCouriers: number
}

type ZoneSuggestionsProps = {
  location: Coordinate
  zones: Zone[]
  suggestions: Suggestion[]
  onZoneSelect?: (zoneId: string) => void
  className?: string
}

export default function ZoneSuggestions({
  location,
  zones,
  suggestions,
  onZoneSelect,
  className = '',
}: ZoneSuggestionsProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId)
    onZoneSelect?.(zoneId)
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

        {/* Hedef Konum */}
        <Marker
          position={[location.latitude, location.longitude]}
          icon={L.divIcon({
            className: 'h-4 w-4 rounded-full bg-red-500',
          })}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold">Hedef Konum</h3>
              <p className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Önerilen Bölgeler */}
        {zones.map((zone) => {
          const suggestion = suggestions.find((s) => s.zoneId === zone.id)
          if (!suggestion) return null

          const isSelected = selectedZone === zone.id

          return (
            <div key={zone.id}>
              <Polygon
                positions={zone.coordinates.map((coord) => [
                  coord.latitude,
                  coord.longitude,
                ])}
                pathOptions={{
                  color: isSelected ? '#10B981' : '#3B82F6',
                  fillColor: isSelected ? '#6EE7B7' : '#93C5FD',
                  fillOpacity: 0.4,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => handleZoneClick(zone.id),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{zone.name}</h3>
                    <p className="text-sm text-gray-600">
                      Mesafe: {suggestion.distance} metre
                    </p>
                    <p className="text-sm text-gray-600">
                      Aktif Kurye: {suggestion.activeCouriers}
                    </p>
                    {suggestion.isInZone && (
                      <p className="mt-1 text-sm text-green-600">
                        Bu bölge içinde
                      </p>
                    )}
                  </div>
                </Popup>
              </Polygon>

              {/* Mesafe Çemberi */}
              <Circle
                center={[location.latitude, location.longitude]}
                radius={suggestion.distance}
                pathOptions={{
                  color: isSelected ? '#10B981' : '#3B82F6',
                  fillColor: isSelected ? '#6EE7B7' : '#93C5FD',
                  fillOpacity: 0.1,
                  weight: 1,
                }}
              />
            </div>
          )
        })}
      </MapContainer>

      {/* Öneriler Listesi */}
      <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-semibold">Önerilen Bölgeler</h3>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {suggestions.map((suggestion) => {
            const zone = zones.find((z) => z.id === suggestion.zoneId)
            if (!zone) return null

            const isSelected = selectedZone === suggestion.zoneId

            return (
              <div
                key={suggestion.zoneId}
                className={`cursor-pointer rounded-md border p-2 transition-colors ${
                  isSelected
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleZoneClick(suggestion.zoneId)}
              >
                <p className="font-medium">{zone.name}</p>
                <p className="text-sm text-gray-600">
                  {suggestion.distance} metre uzaklıkta
                </p>
                <p className="text-sm text-gray-600">
                  {suggestion.activeCouriers} aktif kurye
                </p>
                {suggestion.isInZone && (
                  <p className="mt-1 text-sm text-green-600">
                    Bu bölge içinde
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 