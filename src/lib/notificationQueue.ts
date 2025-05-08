import { NotificationType } from '../generated/prisma'
import { createClient } from 'redis'

// Redis istemcisini oluştur
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redis.on('error', (error) => {
  console.error('Redis bağlantı hatası:', error)
})

// Kuyruk anahtarları
const QUEUE_KEYS = {
  EMAIL: 'notification:queue:email',
  SMS: 'notification:queue:sms',
  PUSH: 'notification:queue:push',
} as const

// E-posta bildirimi kuyruğa ekle
export async function queueEmailNotification(
  type: NotificationType,
  data: {
    email: string
    title: string
    message: string
    notificationId: string
    [key: string]: any
  }
): Promise<void> {
  try {
    await redis.connect()
    await redis.lPush(QUEUE_KEYS.EMAIL, JSON.stringify({ type, data }))
  } catch (error) {
    console.error('E-posta bildirimi kuyruğa eklenirken hata:', error)
    throw new Error('E-posta bildirimi kuyruğa eklenemedi')
  } finally {
    await redis.disconnect()
  }
}

// SMS bildirimi kuyruğa ekle
export async function queueSMSNotification(
  type: NotificationType,
  data: {
    phone: string
    message: string
    notificationId: string
    [key: string]: any
  }
): Promise<void> {
  try {
    await redis.connect()
    await redis.lPush(QUEUE_KEYS.SMS, JSON.stringify({ type, data }))
  } catch (error) {
    console.error('SMS bildirimi kuyruğa eklenirken hata:', error)
    throw new Error('SMS bildirimi kuyruğa eklenemedi')
  } finally {
    await redis.disconnect()
  }
}

// Push bildirimi kuyruğa ekle
export async function queuePushNotification(
  type: NotificationType,
  data: {
    userId?: string
    courierId?: string
    title: string
    message: string
    notificationId: string
    [key: string]: any
  }
): Promise<void> {
  try {
    await redis.connect()
    await redis.lPush(QUEUE_KEYS.PUSH, JSON.stringify({ type, data }))
  } catch (error) {
    console.error('Push bildirimi kuyruğa eklenirken hata:', error)
    throw new Error('Push bildirimi kuyruğa eklenemedi')
  } finally {
    await redis.disconnect()
  }
}

// Kuyruktaki bildirimleri işle
export async function processNotificationQueue(): Promise<void> {
  try {
    await redis.connect()

    // E-posta bildirimlerini işle
    const emailNotification = await redis.rPop(QUEUE_KEYS.EMAIL)
    if (emailNotification) {
      const { type, data } = JSON.parse(emailNotification)
      // TODO: E-posta gönderme işlemi
      console.log('E-posta gönderiliyor:', { type, data })
    }

    // SMS bildirimlerini işle
    const smsNotification = await redis.rPop(QUEUE_KEYS.SMS)
    if (smsNotification) {
      const { type, data } = JSON.parse(smsNotification)
      // TODO: SMS gönderme işlemi
      console.log('SMS gönderiliyor:', { type, data })
    }

    // Push bildirimlerini işle
    const pushNotification = await redis.rPop(QUEUE_KEYS.PUSH)
    if (pushNotification) {
      const { type, data } = JSON.parse(pushNotification)
      // TODO: Push bildirimi gönderme işlemi
      console.log('Push bildirimi gönderiliyor:', { type, data })
    }
  } catch (error) {
    console.error('Bildirim kuyruğu işlenirken hata:', error)
    throw new Error('Bildirim kuyruğu işlenemedi')
  } finally {
    await redis.disconnect()
  }
}

// Kuyruk istatistiklerini getir
export async function getQueueStats(): Promise<{
  email: number
  sms: number
  push: number
}> {
  try {
    await redis.connect()

    const [emailCount, smsCount, pushCount] = await Promise.all([
      redis.lLen(QUEUE_KEYS.EMAIL),
      redis.lLen(QUEUE_KEYS.SMS),
      redis.lLen(QUEUE_KEYS.PUSH),
    ])

    return {
      email: emailCount,
      sms: smsCount,
      push: pushCount,
    }
  } catch (error) {
    console.error('Kuyruk istatistikleri getirilirken hata:', error)
    throw new Error('Kuyruk istatistikleri getirilemedi')
  } finally {
    await redis.disconnect()
  }
} 