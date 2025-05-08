import { useState, useEffect } from 'react'
import { NotificationType } from '@/lib/notifications'
import {
  NotificationPreference,
  NotificationChannel,
  NotificationFrequency,
} from '@/lib/notificationPreferences'

type NotificationPreferencesProps = {
  userId?: string
  courierId?: string
  className?: string
}

export default function NotificationPreferences({
  userId,
  courierId,
  className = '',
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [userId, courierId])

  const fetchPreferences = async () => {
    try {
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (courierId) params.append('courierId', courierId)

      const response = await fetch(`/api/notifications/preferences?${params}`)
      if (!response.ok) throw new Error('Tercihler getirilemedi')
      const data = await response.json()
      setPreferences(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = async (
    id: string,
    changes: Partial<NotificationPreference>
  ) => {
    try {
      setSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
      })

      if (!response.ok) throw new Error('Tercih güncellenemedi')
      await fetchPreferences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      })

      if (!response.ok) throw new Error('Tercihler kaydedilemedi')
      await fetchPreferences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Yükleniyor...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bildirim Tercihleri</h2>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
        </button>
      </div>

      <div className="space-y-4">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {getNotificationTypeLabel(preference.type)}
                </h3>
                <p className="text-sm text-gray-500">
                  {getNotificationTypeDescription(preference.type)}
                </p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preference.enabled}
                  onChange={(e) =>
                    handlePreferenceChange(preference.id, {
                      enabled: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Aktif</span>
              </label>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bildirim Kanalları
                </label>
                <div className="mt-2 space-x-4">
                  {(['push', 'email', 'sms'] as NotificationChannel[]).map(
                    (channel) => (
                      <label key={channel} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={preference.channels.includes(channel)}
                          onChange={(e) => {
                            const newChannels = e.target.checked
                              ? [...preference.channels, channel]
                              : preference.channels.filter((c) => c !== channel)
                            handlePreferenceChange(preference.id, {
                              channels: newChannels,
                            })
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {getChannelLabel(channel)}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bildirim Sıklığı
                </label>
                <select
                  value={preference.frequency}
                  onChange={(e) =>
                    handlePreferenceChange(preference.id, {
                      frequency: e.target.value as NotificationFrequency,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="immediate">Anında</option>
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'ORDER_ASSIGNED':
      return 'Sipariş Atama Bildirimleri'
    case 'ORDER_STATUS_CHANGED':
      return 'Sipariş Durumu Değişikliği Bildirimleri'
    case 'ZONE_BOUNDARY_ALERT':
      return 'Bölge Sınırı Uyarıları'
    default:
      return type
  }
}

function getNotificationTypeDescription(type: NotificationType): string {
  switch (type) {
    case 'ORDER_ASSIGNED':
      return 'Yeni sipariş atandığında bildirim alın'
    case 'ORDER_STATUS_CHANGED':
      return 'Sipariş durumu değiştiğinde bildirim alın'
    case 'ZONE_BOUNDARY_ALERT':
      return 'Bölge sınırına yaklaştığınızda bildirim alın'
    default:
      return ''
  }
}

function getChannelLabel(channel: NotificationChannel): string {
  switch (channel) {
    case 'push':
      return 'Push Bildirim'
    case 'email':
      return 'E-posta'
    case 'sms':
      return 'SMS'
    default:
      return channel
  }
} 