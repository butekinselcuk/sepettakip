'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet'

type Coordinate = {
  latitude: number
  longitude: number
}

type DeliveryZoneMapProps = {
  coordinates?: Coordinate[]
  onCoordinatesChange?: (coordinates: Coordinate[]) => void
  isEditable?: boolean
  className?: string
}

function MapUpdater({ coordinates }: { coordinates?: Coordinate[] }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = coordinates.map((coord) => [coord.latitude, coord.longitude])
      map.fitBounds(bounds as L.LatLngBoundsExpression)
    }
  }, [coordinates, map])

  return null
}

export default function DeliveryZoneMap({
  coordinates = [],
  onCoordinatesChange,
  isEditable = false,
  className = 'h-[400px] w-full',
}: DeliveryZoneMapProps) {
  const defaultCenter: [number, number] = [41.0082, 28.9784] // İstanbul merkezi
  const mapRef = useRef<L.Map>(null)
  const [drawing, setDrawing] = useState(false)
  const [tempCoordinates, setTempCoordinates] = useState<Coordinate[]>([])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isEditable || !drawing) return

    const newCoordinate = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
    }

    setTempCoordinates((prev) => [...prev, newCoordinate])
  }

  const startDrawing = () => {
    if (!isEditable) return
    setDrawing(true)
    setTempCoordinates([])
  }

  const finishDrawing = () => {
    if (!isEditable || !drawing) return
    setDrawing(false)
    if (onCoordinatesChange && tempCoordinates.length >= 3) {
      onCoordinatesChange(tempCoordinates)
    }
  }

  const cancelDrawing = () => {
    setDrawing(false)
    setTempCoordinates([])
  }

  const polygonPositions = coordinates.map((coord) => [
    coord.latitude,
    coord.longitude,
  ]) as [number, number][]

  const tempPolygonPositions = tempCoordinates.map((coord) => [
    coord.latitude,
    coord.longitude,
  ]) as [number, number][]

  return (
    <div className={className}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
        onClick={handleMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coordinates.length > 0 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
          />
        )}
        {drawing && tempCoordinates.length > 0 && (
          <Polygon
            positions={tempPolygonPositions}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
          />
        )}
        <MapUpdater coordinates={coordinates} />
      </MapContainer>

      {isEditable && (
        <div className="mt-4 flex gap-2">
          {!drawing ? (
            <button
              onClick={startDrawing}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Bölge Çizmeye Başla
            </button>
          ) : (
            <>
              <button
                onClick={finishDrawing}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
              >
                Çizimi Tamamla
              </button>
              <button
                onClick={cancelDrawing}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              >
                İptal
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
} 