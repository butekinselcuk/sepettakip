import { NotificationType } from '../generated/prisma'
import { sendEmail } from './email'
import { sendSMS } from './sms'
import { sendPushNotification } from './push'
import { prisma } from './prisma'

interface ProcessedNotification {
  type: NotificationType
  data: {
    email?: string
    phone?: string
    userId?: string
    courierId?: string
    title: string
    message: string
    notificationId: string
    [key: string]: any
  }
}

export async function processEmailNotification(notification: ProcessedNotification): Promise<void> {
  try {
    const { email, title, message } = notification.data
    if (!email) {
      throw new Error('E-posta adresi bulunamadı')
    }

    await sendEmail({
      to: email,
      subject: title,
      html: message,
    })

    // Bildirimi işlendi olarak işaretle
    await prisma.notification.update({
      where: { id: notification.data.notificationId },
      data: { processed: true },
    })
  } catch (error) {
    console.error('E-posta bildirimi işlenirken hata:', error)
    throw error
  }
}

export async function processSMSNotification(notification: ProcessedNotification): Promise<void> {
  try {
    const { phone, message } = notification.data
    if (!phone) {
      throw new Error('Telefon numarası bulunamadı')
    }

    await sendSMS({
      to: phone,
      message,
    })

    // Bildirimi işlendi olarak işaretle
    await prisma.notification.update({
      where: { id: notification.data.notificationId },
      data: { processed: true },
    })
  } catch (error) {
    console.error('SMS bildirimi işlenirken hata:', error)
    throw error
  }
}

export async function processPushNotification(notification: ProcessedNotification): Promise<void> {
  try {
    const { userId, courierId, title, message } = notification.data
    if (!userId && !courierId) {
      throw new Error('Kullanıcı veya kurye ID bulunamadı')
    }

    await sendPushNotification({
      userId,
      courierId,
      title,
      message,
    })

    // Bildirimi işlendi olarak işaretle
    await prisma.notification.update({
      where: { id: notification.data.notificationId },
      data: { processed: true },
    })
  } catch (error) {
    console.error('Push bildirimi işlenirken hata:', error)
    throw error
  }
}

export async function processNotification(notification: ProcessedNotification): Promise<void> {
  try {
    switch (notification.type) {
      case NotificationType.ORDER_ASSIGNED:
      case NotificationType.ORDER_STATUS_CHANGED:
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.DELIVERY_DELAYED:
      case NotificationType.DELIVERY_COMPLETED:
        // Bu bildirimler tüm kanallara gönderilebilir
        await Promise.all([
          processEmailNotification(notification),
          processSMSNotification(notification),
          processPushNotification(notification),
        ])
        break

      case NotificationType.ZONE_BOUNDARY_ALERT:
        // Bölge sınırı uyarıları sadece push ve SMS'e gönderilir
        await Promise.all([
          processSMSNotification(notification),
          processPushNotification(notification),
        ])
        break

      case NotificationType.SYSTEM_ALERT:
        // Sistem uyarıları sadece e-posta ve push'a gönderilir
        await Promise.all([
          processEmailNotification(notification),
          processPushNotification(notification),
        ])
        break

      default:
        throw new Error(`Bilinmeyen bildirim tipi: ${notification.type}`)
    }
  } catch (error) {
    console.error('Bildirim işlenirken hata:', error)
    throw error
  }
} 