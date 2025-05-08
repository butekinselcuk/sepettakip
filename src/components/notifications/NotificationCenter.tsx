'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle } from 'lucide-react'
import { Notification, getUnreadNotifications, markNotificationAsRead } from '@/lib/notifications'

type NotificationCenterProps = {
  userId?: string
  courierId?: string
  className?: string
}

export default function NotificationCenter({
  userId,
  courierId,
  className = '',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
    // Her 30 saniyede bir bildirimleri güncelle
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId, courierId])

  const fetchNotifications = async () => {
    try {
      const unreadNotifications = await getUnreadNotifications(userId, courierId)
      setNotifications(unreadNotifications)
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      )
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ORDER_ASSIGNED':
        return <Check className="h-5 w-5 text-green-500" />
      case 'ZONE_BOUNDARY_ALERT':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'COURIER_NEARBY':
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-gray-100"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-semibold">Bildirimler</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Bildirimler yükleniyor...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Yeni bildirim yok
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-b p-4 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="rounded-full p-1 text-sm text-gray-500 hover:bg-gray-100"
                        >
                          Okundu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
} 