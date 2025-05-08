import { NotificationType } from './notifications'
import { createTemplateMessage } from './notificationTemplates'
import twilio from 'twilio'

type SMSConfig = {
  apiKey: string
  sender: string
}

type SMSOptions = {
  to: string
  message: string
}

// Twilio istemcisini oluştur
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const config = {
  from: process.env.TWILIO_PHONE_NUMBER || '',
}

interface SMSData {
  to: string
  message: string
}

// SMS gönder
export async function sendSMS(data: SMSData): Promise<void> {
  try {
    if (!config.from) {
      throw new Error('Twilio phone number is not configured')
    }

    const response = await twilioClient.messages.create({
      body: data.message,
      from: config.from,
      to: data.to,
    })

    console.log('SMS sent successfully:', {
      sid: response.sid,
      status: response.status,
      to: data.to,
    })
  } catch (error) {
    console.error('SMS error:', error)
    throw new Error('SMS failed')
  }
}

// SMS gönderim durumunu kontrol et
export async function checkSMSStatus(sid: string): Promise<string> {
  try {
    const message = await twilioClient.messages(sid).fetch()
    return message.status
  } catch (error) {
    console.error('SMS status check error:', error)
    throw new Error('Failed to check SMS status')
  }
}

// Toplu SMS gönderimi
export async function sendBulkSMS(messages: SMSData[]): Promise<void> {
  try {
    if (!config.from) {
      throw new Error('Twilio phone number is not configured')
    }

    const promises = messages.map((message) =>
      twilioClient.messages.create({
        body: message.message,
        from: config.from,
        to: message.to,
      })
    )

    const results = await Promise.allSettled(promises)

    // Başarılı ve başarısız gönderimleri logla
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`SMS sent successfully to ${messages[index].to}:`, {
          sid: result.value.sid,
          status: result.value.status,
        })
      } else {
        console.error(`Failed to send SMS to ${messages[index].to}:`, result.reason)
      }
    })

    // Eğer tüm gönderimler başarısız olduysa hata fırlat
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('All SMS messages failed to send')
    }
  } catch (error) {
    console.error('Bulk SMS error:', error)
    throw new Error('Bulk SMS failed')
  }
}

// Sipariş durumu güncelleme SMS'i
export async function sendOrderStatusSMS(
  phone: string,
  orderId: string,
  status: string,
  customerName: string
): Promise<void> {
  const template = {
    type: 'ORDER_STATUS_CHANGED' as NotificationType,
    translations: {
      tr: {
        title: 'Sipariş Durumu Güncellendi',
        message: `Sayın ${customerName}, ${orderId} numaralı siparişinizin durumu "${status}" olarak güncellendi.`,
      },
    },
    defaultLanguage: 'tr',
  }

  const { message } = createTemplateMessage(template, {
    orderId,
    status,
    customerName,
  })

  await sendSMS({
    to: phone,
    message,
  })
}

// Kurye atama SMS'i
export async function sendCourierAssignmentSMS(
  phone: string,
  orderId: string,
  courierName: string,
  estimatedDeliveryTime?: string
): Promise<void> {
  const template = {
    type: 'ORDER_ASSIGNED' as NotificationType,
    translations: {
      tr: {
        title: 'Yeni Sipariş Atandı',
        message: `${courierName} kuryesine yeni bir sipariş atandı. Sipariş ID: ${orderId}`,
      },
    },
    defaultLanguage: 'tr',
  }

  const { message } = createTemplateMessage(template, {
    orderId,
    courierName,
    estimatedDeliveryTime,
  })

  await sendSMS({
    to: phone,
    message: estimatedDeliveryTime
      ? `${message} Tahmini Teslimat: ${estimatedDeliveryTime}`
      : message,
  })
}

// Bölge dışı uyarı SMS'i
export async function sendZoneBoundarySMS(
  phone: string,
  zoneName: string,
  distance: number,
  courierName: string
): Promise<void> {
  const template = {
    type: 'ZONE_BOUNDARY_ALERT' as NotificationType,
    translations: {
      tr: {
        title: 'Bölge Sınırı Uyarısı',
        message: `${courierName}, ${zoneName} bölgesinin sınırına yaklaştınız (${distance}m).`,
      },
    },
    defaultLanguage: 'tr',
  }

  const { message } = createTemplateMessage(template, {
    zoneName,
    distance,
    courierName,
  })

  await sendSMS({
    to: phone,
    message,
  })
} 