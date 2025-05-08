import { prisma } from './prisma'
import { NotificationType, NotificationChannel, NotificationFrequency, Prisma, Notification, NotificationPreference } from '../generated/prisma'
import { queueEmailNotification } from './notificationQueue'
import { queueSMSNotification } from './notificationQueue'
import { queuePushNotification } from './notificationQueue'
import { getCache, setCache, deleteCache } from './cache'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  priority: NotificationPriority
  userId?: string
  courierId?: string
  orderId?: string
  zoneId?: string
  createdAt: Date
  readAt?: Date
}

export type NotificationPreference = {
  id: string
  userId?: string
  courierId?: string
  type: NotificationType
  channel: NotificationChannel
  frequency: NotificationFrequency
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

// Önbellek anahtarları
const CACHE_KEYS = {
  NOTIFICATIONS: 'notifications',
  UNREAD_COUNT: 'unread_count',
  PREFERENCES: 'preferences',
} as const

// Önbellek süreleri (saniye)
const CACHE_TTL = {
  NOTIFICATIONS: 300, // 5 dakika
  UNREAD_COUNT: 60, // 1 dakika
  PREFERENCES: 3600, // 1 saat
} as const

export interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  userId?: string
  courierId?: string
  orderId?: string
  zoneId?: string
  data?: Record<string, any>
}

export async function createNotification({
  type,
  title,
  message,
  userId,
  courierId,
  orderId,
  zoneId,
  data,
}: CreateNotificationParams): Promise<Notification> {
  // Create notification record
  const notification = await prisma.notification.create({
    data: {
      type,
      title,
      message,
      data,
      userId,
      courierId,
      orderId,
      zoneId,
      read: false,
    },
  })

  // Get user preferences if userId is provided
  if (userId) {
    const userPreferences = await prisma.notificationPreference.findMany({
      where: {
        userId,
        type,
        enabled: true,
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    })

    // Queue notifications based on user preferences
    for (const preference of userPreferences) {
      if (!preference.user?.email && !preference.user?.phone) continue

      switch (preference.channel) {
        case NotificationChannel.EMAIL:
          if (preference.user.email) {
            await queueEmailNotification(type, {
              email: preference.user.email,
              title,
              message,
              notificationId: notification.id,
            })
          }
          break
        case NotificationChannel.SMS:
          if (preference.user.phone) {
            await queueSMSNotification(type, {
              phone: preference.user.phone,
              message,
              notificationId: notification.id,
            })
          }
          break
        case NotificationChannel.PUSH:
          await queuePushNotification(type, {
            userId,
            title,
            message,
            notificationId: notification.id,
          })
          break
      }
    }
  }

  // Get courier preferences if courierId is provided
  if (courierId) {
    const courierPreferences = await prisma.notificationPreference.findMany({
      where: {
        courierId,
        type,
        enabled: true,
      },
      include: {
        courier: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    })

    // Queue notifications based on courier preferences
    for (const preference of courierPreferences) {
      if (!preference.courier?.email && !preference.courier?.phone) continue

      switch (preference.channel) {
        case NotificationChannel.EMAIL:
          if (preference.courier.email) {
            await queueEmailNotification(type, {
              email: preference.courier.email,
              title,
              message,
              notificationId: notification.id,
            })
          }
          break
        case NotificationChannel.SMS:
          if (preference.courier.phone) {
            await queueSMSNotification(type, {
              phone: preference.courier.phone,
              message,
              notificationId: notification.id,
            })
          }
          break
        case NotificationChannel.PUSH:
          await queuePushNotification(type, {
            courierId,
            title,
            message,
            notificationId: notification.id,
          })
          break
      }
    }
  }

  return notification
}

export async function getNotifications(params: {
  userId?: string
  courierId?: string
  orderId?: string
  zoneId?: string
  skip?: number
  take?: number
}): Promise<Notification[]> {
  const { userId, courierId, orderId, zoneId, skip = 0, take = 10 } = params

  const where: Prisma.NotificationWhereInput = {
    userId,
    courierId,
    orderId,
    zoneId,
  }

  return prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take,
  })
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  })
}

export async function getUnreadNotificationCount(params: {
  userId?: string
  courierId?: string
}): Promise<number> {
  const { userId, courierId } = params

  const where: Prisma.NotificationWhereInput = {
    userId,
    courierId,
    read: false,
  }

  return prisma.notification.count({
    where,
  })
}

// Örnek bildirim şablonları
export const notificationTemplates = {
  ORDER_ASSIGNED: (orderId: string, courierName: string) => ({
    type: 'ORDER_ASSIGNED' as NotificationType,
    title: 'Yeni Sipariş Atandı',
    message: `${courierName} size yeni bir sipariş atandı.`,
    priority: 'HIGH' as NotificationPriority,
    orderId,
  }),

  ZONE_BOUNDARY_ALERT: (zoneName: string, distance: number) => ({
    type: 'ZONE_BOUNDARY_ALERT' as NotificationType,
    title: 'Bölge Sınırı Uyarısı',
    message: `${zoneName} bölgesinin ${distance}m yakınındasınız.`,
    priority: 'MEDIUM' as NotificationPriority,
  }),

  COURIER_NEARBY: (courierName: string, distance: number) => ({
    type: 'COURIER_NEARBY' as NotificationType,
    title: 'Kurye Yaklaşıyor',
    message: `${courierName} ${distance}m uzaklıkta.`,
    priority: 'LOW' as NotificationPriority,
  }),
}

// Bildirim tercihlerini getir
export async function getNotificationPreferences(
  userId?: string,
  courierId?: string
): Promise<NotificationPreference[]> {
  try {
    const cacheKey = userId || courierId || 'all'
    const cachedPreferences = await getCache<NotificationPreference[]>(CACHE_KEYS.PREFERENCES, cacheKey)

    if (cachedPreferences) {
      return cachedPreferences
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: {
        OR: [
          { userId },
          { courierId },
        ],
      },
    })

    await setCache(CACHE_KEYS.PREFERENCES, cacheKey, preferences, CACHE_TTL.PREFERENCES)

    return preferences
  } catch (error) {
    console.error('Bildirim tercihleri getirilirken hata:', error)
    throw new Error('Bildirim tercihleri getirilemedi')
  }
}

// Bildirim tercihlerini güncelle
export async function updateNotificationPreference(
  id: string,
  data: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  return prisma.notificationPreference.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  })
}

// Bildirim tercihlerini oluştur
export async function createNotificationPreference(
  data: Omit<NotificationPreference, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NotificationPreference> {
  return prisma.notificationPreference.create({
    data: {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

// Bölge sınırı uyarısı oluştur
export async function createZoneBoundaryAlert(
  zoneId: string,
  courierId: string,
  distance: number
): Promise<Notification> {
  const zone = await prisma.deliveryZone.findUnique({
    where: { id: zoneId },
    include: {
      couriers: true,
    },
  })

  if (!zone) {
    throw new Error('Bölge bulunamadı')
  }

  const courier = await prisma.courier.findUnique({
    where: { id: courierId },
  })

  if (!courier) {
    throw new Error('Kurye bulunamadı')
  }

  // Bildirim tercihlerini kontrol et
  const preferences = await getNotificationPreferences(undefined, courierId)
  const boundaryAlertPref = preferences.find(
    (p) => p.type === 'ZONE_BOUNDARY_ALERT' && p.enabled
  )

  if (!boundaryAlertPref) {
    throw new Error('Bölge sınırı bildirimleri devre dışı')
  }

  // Alternatif bölgeleri bul
  const nearbyZones = await prisma.deliveryZone.findMany({
    where: {
      id: { not: zoneId },
      active: true,
    },
    include: {
      couriers: true,
    },
  })

  // Bildirimi oluştur
  const notification = await prisma.notification.create({
    data: {
      type: 'ZONE_BOUNDARY_ALERT',
      title: 'Bölge Sınırı Uyarısı',
      message: `${zone.name} bölgesinin sınırına yaklaştınız (${Math.round(distance)}m).`,
      priority: 'HIGH',
      courierId,
      zoneId,
      data: {
        distance,
        nearbyZones: nearbyZones.map((z) => ({
          id: z.id,
          name: z.name,
          courierCount: z.couriers.length,
        })),
      },
    },
  })

  // Bildirim kanallarına gönder
  if (boundaryAlertPref.channels.includes('PUSH')) {
    await sendPushNotification(notification)
  }

  if (boundaryAlertPref.channels.includes('EMAIL')) {
    await sendZoneBoundaryEmail(notification)
  }

  return notification
}

// Bölge sınırı e-postası gönder
async function sendZoneBoundaryEmail(notification: Notification): Promise<void> {
  const courier = await prisma.courier.findUnique({
    where: { id: notification.courierId! },
  })

  if (!courier) {
    throw new Error('Kurye bulunamadı')
  }

  const zone = await prisma.deliveryZone.findUnique({
    where: { id: notification.zoneId! },
  })

  if (!zone) {
    throw new Error('Bölge bulunamadı')
  }

  const template = {
    subject: 'Bölge Sınırı Uyarısı',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bölge Sınırı Uyarısı</h2>
        <p style="color: #666;">${notification.message}</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Bölge Bilgileri</h3>
          <p style="margin: 10px 0;"><strong>Bölge:</strong> ${zone.name}</p>
          <p style="margin: 10px 0;"><strong>Mesafe:</strong> ${Math.round(notification.data?.distance)}m</p>
        </div>

        ${notification.data?.nearbyZones?.length ? `
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Yakındaki Bölgeler</h3>
            <ul style="list-style: none; padding: 0;">
              ${notification.data.nearbyZones.map((z: any) => `
                <li style="margin: 10px 0;">
                  <strong>${z.name}</strong> (${z.courierCount} kurye)
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
          </p>
        </div>
      </div>
    `,
  }

  await sendEmail(courier.email, template)
} 