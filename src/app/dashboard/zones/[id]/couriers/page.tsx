'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ZoneCourierMap from '@/components/map/ZoneCourierMap'

type Coordinate = {
  latitude: number
  longitude: number
}

type Courier = {
  id: string
  name: string
  phone: string
  email: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
  location: Coordinate | null
}

type Zone = {
  id: string
  name: string
  description: string | null
  coordinates: Coordinate[]
  isActive: boolean
  couriers: Courier[]
}

export default function ZoneCouriersPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([])
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([])

  useEffect(() => {
    fetchZone()
    fetchAvailableCouriers()
  }, [params.id])

  const fetchZone = async () => {
    try {
      const response = await fetch(`/api/couriers/zones/${params.id}/couriers`)
      if (!response.ok) throw new Error('Failed to fetch zone')
      const data = await response.json()
      setZone(data)
      setSelectedCouriers(data.couriers.map((c: Courier) => c.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCouriers = async () => {
    try {
      const response = await fetch('/api/couriers')
      if (!response.ok) throw new Error('Failed to fetch couriers')
      const data = await response.json()
      setAvailableCouriers(data)
    } catch (err) {
      console.error('Error fetching couriers:', err)
    }
  }

  const handleCourierSelect = (courierId: string) => {
    setSelectedCouriers((prev) => [...prev, courierId])
  }

  const handleCourierDeselect = (courierId: string) => {
    setSelectedCouriers((prev) => prev.filter((id) => id !== courierId))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/couriers/zones/${params.id}/couriers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courierIds: selectedCouriers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update zone couriers')
      }

      router.push(`/dashboard/zones/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
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

  if (!zone) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bölge Kuryeleri</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <Link
            href={`/dashboard/zones/${params.id}`}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200"
          >
            Geri Dön
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Bölge Bilgileri</h2>
            <div className="mt-2 rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{zone.name}</h3>
              {zone.description && (
                <p className="mt-1 text-sm text-gray-600">{zone.description}</p>
              )}
              <div className="mt-2 flex items-center space-x-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    zone.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {zone.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium">Kurye Listesi</h2>
            <div className="mt-2 max-h-96 space-y-2 overflow-y-auto rounded-lg border bg-white p-4">
              {availableCouriers.map((courier) => {
                const isSelected = selectedCouriers.includes(courier.id)
                const isAssigned = zone.couriers.some((c) => c.id === courier.id)

                return (
                  <div
                    key={courier.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <div className="font-medium">{courier.name}</div>
                      <div className="text-sm text-gray-500">{courier.phone}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          courier.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-800'
                            : courier.status === 'BUSY'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {courier.status === 'AVAILABLE'
                          ? 'Müsait'
                          : courier.status === 'BUSY'
                          ? 'Meşgul'
                          : 'Çevrimdışı'}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          isSelected
                            ? handleCourierDeselect(courier.id)
                            : handleCourierSelect(courier.id)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium">Harita Görünümü</h2>
          <div className="mt-2 h-[600px] rounded-lg border bg-white">
            <ZoneCourierMap
              zone={zone}
              availableCouriers={availableCouriers}
              selectedCouriers={selectedCouriers}
              onCourierSelect={handleCourierSelect}
              onCourierDeselect={handleCourierDeselect}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 