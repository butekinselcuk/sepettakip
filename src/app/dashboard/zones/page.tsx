'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DeliveryZoneMap from '@/components/map/DeliveryZoneMap'

type DeliveryZone = {
  id: string
  name: string
  description: string | null
  coordinates: { latitude: number; longitude: number }[]
  isActive: boolean
  couriers: { id: string; name: string }[]
  orders: { id: string }[]
  createdAt: string
  updatedAt: string
}

export default function ZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/couriers/zones')
      if (!response.ok) throw new Error('Failed to fetch zones')
      const data = await response.json()
      setZones(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teslimat Bölgeleri</h1>
        <Link
          href="/dashboard/zones/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Yeni Bölge Ekle
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="overflow-hidden rounded-lg border bg-white shadow"
          >
            <div className="h-48">
              <DeliveryZoneMap
                coordinates={zone.coordinates}
                className="h-full w-full"
              />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{zone.name}</h3>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    zone.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {zone.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              {zone.description && (
                <p className="mb-4 text-sm text-gray-600">{zone.description}</p>
              )}
              <div className="mb-4 space-y-2 text-sm">
                <div>
                  <span className="font-medium">Kurye Sayısı:</span>{' '}
                  {zone.couriers.length}
                </div>
                <div>
                  <span className="font-medium">Aktif Sipariş:</span>{' '}
                  {zone.orders.length}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Link
                  href={`/dashboard/zones/${zone.id}`}
                  className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Düzenle
                </Link>
                <button
                  onClick={() => {
                    // TODO: Implement zone deletion
                  }}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 