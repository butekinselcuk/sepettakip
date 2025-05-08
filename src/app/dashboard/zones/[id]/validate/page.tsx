'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LocationValidator from '@/components/map/LocationValidator'

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

export default function ValidateZonePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [zone, setZone] = useState<Zone | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testLocation, setTestLocation] = useState<Coordinate | null>(null)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    isNearBoundary: boolean
    zoneId: string | null
  } | null>(null)

  useEffect(() => {
    fetchZone()
  }, [params.id])

  const fetchZone = async () => {
    try {
      const response = await fetch(`/api/couriers/zones/${params.id}`)
      if (!response.ok) {
        throw new Error('Bölge bilgileri alınamadı')
      }
      const data = await response.json()
      setZone(data)
    } catch (error) {
      setError('Bölge bilgileri yüklenirken bir hata oluştu')
      console.error('Bölge yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidationComplete = (
    isValid: boolean,
    zoneId: string | null
  ) => {
    setValidationResult({
      isValid,
      isNearBoundary: false,
      zoneId,
    })
  }

  const handleTestLocation = () => {
    // Test için örnek konum (İstanbul merkez)
    setTestLocation({
      latitude: 41.0082,
      longitude: 28.9784,
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !zone) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error || 'Bölge bulunamadı'}</p>
          <Link
            href="/dashboard/zones"
            className="text-blue-500 hover:text-blue-700"
          >
            Bölgelere Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Bölge Doğrulama</h1>
        <p className="text-gray-600">
          {zone.name} bölgesi için konum doğrulama testi
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={handleTestLocation}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Test Konumu Ekle
          </button>
        </div>
        <Link
          href={`/dashboard/zones/${params.id}`}
          className="text-blue-500 hover:text-blue-700"
        >
          Bölge Detaylarına Dön
        </Link>
      </div>

      {testLocation && (
        <div className="mb-8 rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Test Konumu</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">Enlem</p>
              <p className="font-medium">{testLocation.latitude}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Boylam</p>
              <p className="font-medium">{testLocation.longitude}</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-[600px] rounded-lg border">
        <LocationValidator
          zones={[zone]}
          location={testLocation || { latitude: 41.0082, longitude: 28.9784 }}
          onValidationComplete={handleValidationComplete}
          className="h-full"
        />
      </div>

      {validationResult && (
        <div className="mt-8 rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Doğrulama Sonucu</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                  validationResult.isValid
                    ? 'bg-green-100 text-green-800'
                    : validationResult.isNearBoundary
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {validationResult.isValid
                  ? 'Bölge içinde'
                  : validationResult.isNearBoundary
                  ? 'Bölge sınırına yakın'
                  : 'Bölge dışında'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bölge</p>
              <p className="font-medium">{zone.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bölge ID</p>
              <p className="font-medium">{validationResult.zoneId}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 