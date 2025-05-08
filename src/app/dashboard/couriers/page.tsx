'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWebSocket } from '@/hooks/useWebSocket'
import { CourierStatus } from '@/generated/prisma'

type Courier = {
  id: string
  name: string
  phone: string
  email: string | null
  status: CourierStatus
  location: { latitude: number; longitude: number } | null
  orders: any[]
  createdAt: string
  updatedAt: string
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(true)
  const ws = useWebSocket()

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const response = await fetch('/api/couriers')
        const data = await response.json()
        setCouriers(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching couriers:', error)
        setLoading(false)
      }
    }

    fetchCouriers()

    // Subscribe to courier updates
    ws.onCourierUpdate((update) => {
      if (update.type === 'COURIER_CREATED') {
        setCouriers((prev) => [...prev, update.courier])
      } else if (update.type === 'COURIER_UPDATED') {
        setCouriers((prev) =>
          prev.map((courier) =>
            courier.id === update.courier.id ? update.courier : courier
          )
        )
      } else if (update.type === 'COURIER_DELETED') {
        setCouriers((prev) =>
          prev.filter((courier) => courier.id !== update.courierId)
        )
      }
    })
  }, [ws])

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

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Kuryeler</h1>
          <p className="mt-2 text-sm text-gray-700">
            Tüm kuryelerin listesi ve durumları
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/couriers/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Yeni Kurye Ekle
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Ad Soyad
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Telefon
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    E-posta
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Durum
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Aktif Siparişler
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {couriers.map((courier) => (
                  <tr key={courier.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {courier.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {courier.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {courier.email || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                          courier.status
                        )}`}
                      >
                        {getStatusText(courier.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {courier.orders.length}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Link
                        href={`/dashboard/couriers/${courier.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 