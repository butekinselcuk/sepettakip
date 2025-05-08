import { NotificationType } from './notifications'

export type NotificationChannel = 'push' | 'email' | 'sms'

export type NotificationFrequency = 'immediate' | 'daily' | 'weekly'

export type NotificationPreference = {
  id: string
  userId?: string
  courierId?: string
  type: NotificationType
  channels: NotificationChannel[]
  frequency: NotificationFrequency
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// Varsayılan tercihler
const defaultPreferences: Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    type: 'ORDER_ASSIGNED',
    channels: ['push', 'email'],
    frequency: 'immediate',
    enabled: true,
  },
  {
    type: 'ORDER_STATUS_CHANGED',
    channels: ['push', 'email'],
    frequency: 'immediate',
    enabled: true,
  },
  {
    type: 'ZONE_BOUNDARY_ALERT',
    channels: ['push'],
    frequency: 'immediate',
    enabled: true,
  },
]

// Tercihleri getir
export async function getNotificationPreferences(
  userId?: string,
  courierId?: string
): Promise<NotificationPreference[]> {
  // TODO: Veritabanından tercihleri getir
  return defaultPreferences.map((pref) => ({
    ...pref,
    id: Math.random().toString(36).substr(2, 9),
    userId,
    courierId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

// Tercih oluştur
export async function createNotificationPreference(
  preference: Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NotificationPreference> {
  // TODO: Veritabanına tercih ekle
  return {
    ...preference,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Tercih güncelle
export async function updateNotificationPreference(
  id: string,
  preference: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  // TODO: Veritabanında tercihi güncelle
  const existingPreference = defaultPreferences.find((p) => p.id === id)
  if (!existingPreference) {
    throw new Error('Tercih bulunamadı')
  }

  return {
    ...existingPreference,
    ...preference,
    updatedAt: new Date(),
  }
}

// Tercih sil
export async function deleteNotificationPreference(id: string): Promise<void> {
  // TODO: Veritabanından tercihi sil
  const index = defaultPreferences.findIndex((p) => p.id === id)
  if (index === -1) {
    throw new Error('Tercih bulunamadı')
  }

  defaultPreferences.splice(index, 1)
}

// Tüm tercihleri toplu güncelle
export async function updateAllNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreference>[]
): Promise<NotificationPreference[]> {
  // TODO: Veritabanında tüm tercihleri güncelle
  return preferences.map((pref) => ({
    ...pref,
    id: Math.random().toString(36).substr(2, 9),
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  })) as NotificationPreference[]
} 