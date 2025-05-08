'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type ZoneStats = {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  averageDeliveryTime: number
  courierPerformance: {
    courierId: string
    courierName: string
    totalDeliveries: number
    averageDeliveryTime: number
    customerRating: number
  }[]
  hourlyDistribution: {
    hour: number
    orders: number
  }[]
  dailyDistribution: {
    day: string
    orders: number
  }[]
}

export default function ZoneStatsPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ZoneStats | null>(null)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchStats()
  }, [params.id, timeRange])

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `/api/couriers/zones/${params.id}/stats?timeRange=${timeRange}`
      )
      if (!response.ok) throw new Error('Failed to fetch zone statistics')
      const data = await response.json()
      setStats(data)
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

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bölge İstatistikleri</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="day">Günlük</option>
            <option value="week">Haftalık</option>
            <option value="month">Aylık</option>
          </select>
          <Link
            href={`/dashboard/zones/${params.id}`}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200"
          >
            Geri Dön
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Toplam Sipariş</h3>
          <p className="mt-2 text-3xl font-semibold">{stats.totalOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Tamamlanan Sipariş</h3>
          <p className="mt-2 text-3xl font-semibold">{stats.completedOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">İptal Edilen Sipariş</h3>
          <p className="mt-2 text-3xl font-semibold">{stats.cancelledOrders}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="text-sm font-medium text-gray-500">Ortalama Teslimat Süresi</h3>
          <p className="mt-2 text-3xl font-semibold">
            {Math.round(stats.averageDeliveryTime)} dk
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium">Saatlik Dağılım</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  label={{ value: 'Saat', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{
                    value: 'Sipariş Sayısı',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip />
                <Bar dataKey="orders" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium">Günlük Dağılım</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  label={{ value: 'Gün', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  label={{
                    value: 'Sipariş Sayısı',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <Tooltip />
                <Bar dataKey="orders" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium">Kurye Performansı</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kurye
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Toplam Teslimat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ortalama Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Müşteri Puanı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.courierPerformance.map((courier) => (
                <tr key={courier.courierId}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {courier.courierName}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {courier.totalDeliveries}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {Math.round(courier.averageDeliveryTime)} dk
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {courier.customerRating.toFixed(1)} / 5.0
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 