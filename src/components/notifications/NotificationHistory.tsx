import { useState, useEffect } from 'react'
import { Notification, NotificationType } from '@/lib/notifications'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type NotificationHistoryProps = {
  userId?: string
  courierId?: string
  className?: string
}

type FilterOptions = {
  type?: NotificationType
  startDate?: Date
  endDate?: Date
  search?: string
}

export default function NotificationHistory({
  userId,
  courierId,
  className = '',
}: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {} as Record<NotificationType, number>,
  })

  useEffect(() => {
    fetchNotifications()
  }, [userId, courierId, filters])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (courierId) params.append('courierId', courierId)
      if (filters.type) params.append('type', filters.type)
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/notifications/history?${params}`)
      if (!response.ok) throw new Error('Bildirim geçmişi alınamadı')

      const data = await response.json()
      setNotifications(data.notifications)
      setStats(data.stats)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })

      if (!response.ok) throw new Error('Bildirim okundu olarak işaretlenemedi')

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date() } : n
        )
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return '📦'
      case 'ORDER_STATUS_CHANGED':
        return '🔄'
      case 'ZONE_BOUNDARY_ALERT':
        return '⚠️'
      case 'COURIER_NEARBY':
        return '🚚'
      case 'SYSTEM_ALERT':
        return '🔔'
      default:
        return '📢'
    }
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 text-red-500 ${className}`}>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bildirim Geçmişi</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Toplam: {stats.total} | Okunmamış: {stats.unread}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.type || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  type: e.target.value as NotificationType,
                }))
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Tüm Bildirimler</option>
              <option value="ORDER_ASSIGNED">Sipariş Atamaları</option>
              <option value="ORDER_STATUS_CHANGED">Sipariş Durumları</option>
              <option value="ZONE_BOUNDARY_ALERT">Bölge Uyarıları</option>
              <option value="COURIER_NEARBY">Kurye Bildirimleri</option>
              <option value="SYSTEM_ALERT">Sistem Bildirimleri</option>
            </select>

            <input
              type="date"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />

            <input
              type="date"
              value={filters.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />

            <input
              type="text"
              placeholder="Ara..."
              value={filters.search || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            />
          </div>
        </div>

        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 ${
                !notification.readAt ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(notification.createdAt), 'PPp', {
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  {!notification.readAt && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Okundu olarak işaretle
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Bildirim bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 