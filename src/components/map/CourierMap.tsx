'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'

// Leaflet default marker icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
})

type CourierLocation = {
  latitude: number
  longitude: number
}

type CourierMapProps = {
  location?: CourierLocation | null
  onLocationChange?: (location: CourierLocation) => void
  isEditable?: boolean
  className?: string
}

function MapUpdater({ location }: { location?: CourierLocation | null }) {
  const map = useMap()

  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], map.getZoom())
    }
  }, [location, map])

  return null
}

export default function CourierMap({
  location,
  onLocationChange,
  isEditable = false,
  className = 'h-[400px] w-full',
}: CourierMapProps) {
  const defaultCenter: [number, number] = [41.0082, 28.9784] // İstanbul merkezi
  const mapRef = useRef<L.Map>(null)

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (isEditable && onLocationChange) {
      onLocationChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      })
    }
  }

  return (
    <div className={className}>
      <MapContainer
        center={
          location ? [location.latitude, location.longitude] : defaultCenter
        }
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {location && (
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>Kurye konumu</Popup>
          </Marker>
        )}
        <MapUpdater location={location} />
      </MapContainer>
    </div>
  )
} 