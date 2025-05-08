'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { useWebSocket } from '@/hooks/useWebSocket'
import { CourierStatus } from '@/generated/prisma'
import CourierMap from '@/components/map/CourierMap'

type CourierDetailProps = {
  params: {
    id: string
  }
}

export default function CourierDetailPage({ params }: CourierDetailProps) {
  const [courier, setCourier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'AVAILABLE' as CourierStatus,
  })
  const ws = useWebSocket()

  useEffect(() => {
    const fetchCourier = async () => {
      try {
        const response = await fetch(`/api/couriers/${params.id}`)
        if (!response.ok) {
          throw new Error('Courier not found')
        }
        const data = await response.json()
        setCourier(data)
        setFormData({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          status: data.status,
        })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching courier:', error)
        setLoading(false)
        notFound()
      }
    }

    fetchCourier()

    // Join courier room for real-time updates
    ws.joinCourier(params.id)

    // Subscribe to courier updates
    ws.onCourierUpdate((update) => {
      if (update.type === 'COURIER_UPDATED' && update.courier.id === params.id) {
        setCourier(update.courier)
        setFormData({
          name: update.courier.name,
          phone: update.courier.phone,
          email: update.courier.email || '',
          status: update.courier.status,
        })
      }
    })

    return () => {
      ws.leaveCourier(params.id)
    }
  }, [params.id, ws])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/couriers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update courier')
      }

      setEditing(false)
      setLoading(false)
    } catch (error) {
      console.error('Error updating courier:', error)
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLocationChange = async (location: { latitude: number; longitude: number }) => {
    if (!editing) return

    try {
      await fetch(`/api/couriers/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          location,
        }),
      })
    } catch (error) {
      console.error('Error updating courier location:', error)
    }
  }

  const getStatusColor = (status: CourierStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 text-green-700 ring-green-600/20'
      case 'BUSY':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
      case 'OFFLINE':
        return 'bg-gray-50 text-gray-700 ring-gray-600/20'
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20'
    }
  }

  const getStatusText = (status: CourierStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Müsait'
      case 'BUSY':
        return 'Meşgul'
      case 'OFFLINE':
        return 'Çevrimdışı'
      default:
        return status
    }
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  if (!courier) {
    return notFound()
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Kurye Detayları
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Kurye bilgileri ve aktif siparişleri
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-4">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Düzenle
              </button>
              <Link
                href="/dashboard/couriers"
                className="block rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Geri Dön
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Courier Information */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Kurye Bilgileri
            </h3>
            <div className="mt-5 border-t border-gray-200">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Ad Soyad
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Telefon
                    </label>
                    <div className="mt-2">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      E-posta
                    </label>
                    <div className="mt-2">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Durum
                    </label>
                    <div className="mt-2">
                      <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        <option value="AVAILABLE">Müsait</option>
                        <option value="BUSY">Meşgul</option>
                        <option value="OFFLINE">Çevrimdışı</option>
                      </select>
                    </div>
                  </div>
                </form>
              ) : (
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Ad Soyad</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {courier.name}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {courier.phone}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      {courier.email || '-'}
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">Durum</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                          courier.status
                        )}`}
                      >
                        {getStatusText(courier.status)}
                      </span>
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Konum Takibi
            </h3>
            <div className="mt-5">
              <CourierMap
                location={courier.location}
                onLocationChange={handleLocationChange}
                isEditable={editing}
              />
            </div>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Aktif Siparişler
            </h3>
            <div className="mt-5">
              {courier.orders.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {courier.orders.map((order: any) => (
                    <li key={order.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Sipariş #{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customer.name}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          Detay
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Aktif sipariş bulunmuyor</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 