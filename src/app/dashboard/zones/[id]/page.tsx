'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DeliveryZoneMap from '@/components/map/DeliveryZoneMap'

type Coordinate = {
  latitude: number
  longitude: number
}

type Courier = {
  id: string
  name: string
  phone: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'
}

type DeliveryZone = {
  id: string
  name: string
  description: string | null
  coordinates: Coordinate[]
  isActive: boolean
  couriers: Courier[]
  createdAt: string
  updatedAt: string
}

export default function EditZonePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zone, setZone] = useState<DeliveryZone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  })
  const [coordinates, setCoordinates] = useState<Coordinate[]>([])
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([])
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([])

  useEffect(() => {
    fetchZone()
    fetchCouriers()
  }, [params.id])

  const fetchZone = async () => {
    try {
      const response = await fetch(`/api/couriers/zones/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch zone')
      const data = await response.json()
      setZone(data)
      setFormData({
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
      })
      setCoordinates(data.coordinates)
      setSelectedCouriers(data.couriers.map((c: Courier) => c.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCouriers = async () => {
    try {
      const response = await fetch('/api/couriers')
      if (!response.ok) throw new Error('Failed to fetch couriers')
      const data = await response.json()
      setAvailableCouriers(data)
    } catch (err) {
      console.error('Error fetching couriers:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (coordinates.length < 3) {
      setError('Lütfen en az 3 nokta ile bir bölge çizin')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/couriers/zones/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          coordinates,
          courierIds: selectedCouriers,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update zone')
      }

      router.push('/dashboard/zones')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleCourierToggle = (courierId: string) => {
    setSelectedCouriers((prev) =>
      prev.includes(courierId)
        ? prev.filter((id) => id !== courierId)
        : [...prev, courierId]
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Bu bölgeyi silmek istediğinizden emin misiniz?')) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/couriers/zones/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete zone')
      }

      router.push('/dashboard/zones')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bölge Detayları</h1>
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/zones/${params.id}/couriers`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Kurye Yönetimi
          </Link>
          <Link
            href={`/dashboard/zones/${params.id}/stats`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            İstatistikler
          </Link>
          <Link
            href="/dashboard/zones"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200"
          >
            Geri Dön
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Bölge Adı
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Bölge Aktif
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bölge Sınırları
            </label>
            <div className="mt-1">
              <DeliveryZoneMap
                coordinates={coordinates}
                onCoordinatesChange={setCoordinates}
                isEditable
                className="h-[300px] w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bölge Kuryeleri
          </label>
          <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-md border p-4">
            {availableCouriers.map((courier) => (
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
                    checked={selectedCouriers.includes(courier.id)}
                    onChange={() => handleCourierToggle(courier.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-200 disabled:opacity-50"
          >
            Bölgeyi Sil
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
} 