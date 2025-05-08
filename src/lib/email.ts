import nodemailer from 'nodemailer'
import { NotificationType } from './notifications'
import { createTemplateMessage } from './notificationTemplates'

type EmailTemplate = {
  subject: string
  html: string
}

type OrderStatusEmailData = {
  orderId: string
  status: string
  customerName: string
  customerEmail: string
  courierName?: string
  estimatedDeliveryTime?: string
  trackingUrl?: string
}

type CourierAssignmentEmailData = {
  courierName: string
  courierEmail: string
  zoneName: string
  startTime: string
  contactInfo: {
    phone: string
    email: string
  }
  firstTaskGuide?: {
    url: string
    title: string
  }
}

type EmailConfig = {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

type EmailOptions = {
  to: string
  subject: string
  html: string
  from?: string
}

// E-posta şablonları
const emailTemplates = {
  ORDER_STATUS_CHANGED: (data: OrderStatusEmailData): EmailTemplate => {
    const statusMessages: Record<string, string> = {
      PENDING: 'Siparişiniz alındı ve hazırlanıyor.',
      PREPARING: 'Siparişiniz hazırlanıyor.',
      READY: 'Siparişiniz hazır ve kurye atanıyor.',
      ASSIGNED: 'Siparişiniz kuryeye atandı.',
      IN_DELIVERY: 'Siparişiniz yolda.',
      DELIVERED: 'Siparişiniz teslim edildi.',
      CANCELLED: 'Siparişiniz iptal edildi.',
    }

    const statusMessage = statusMessages[data.status] || 'Sipariş durumunuz güncellendi.'

    return {
      subject: `Sipariş Durumu: ${data.status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Merhaba ${data.customerName},</h2>
          <p style="color: #666;">${statusMessage}</p>
          
          ${data.courierName ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Kurye:</strong> ${data.courierName}</p>
            </div>
          ` : ''}
          
          ${data.estimatedDeliveryTime ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Tahmini Teslimat:</strong> ${data.estimatedDeliveryTime}</p>
            </div>
          ` : ''}
          
          ${data.trackingUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.trackingUrl}" 
                 style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Siparişi Takip Et
              </a>
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
  },

  COURIER_ASSIGNED: (data: CourierAssignmentEmailData): EmailTemplate => {
    return {
      subject: `Yeni Görev Atandı: ${data.zoneName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Merhaba ${data.courierName},</h2>
          <p style="color: #666;">Size yeni bir teslimat bölgesi atandı.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Görev Detayları</h3>
            <p style="margin: 10px 0;"><strong>Bölge:</strong> ${data.zoneName}</p>
            <p style="margin: 10px 0;"><strong>Başlangıç:</strong> ${data.startTime}</p>
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">İletişim Bilgileri</h3>
            <p style="margin: 10px 0;"><strong>Telefon:</strong> ${data.contactInfo.phone}</p>
            <p style="margin: 10px 0;"><strong>E-posta:</strong> ${data.contactInfo.email}</p>
          </div>

          ${data.firstTaskGuide ? `
            <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">İlk Görev Yönergesi</h3>
              <p style="margin: 10px 0;">${data.firstTaskGuide.title}</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${data.firstTaskGuide.url}" 
                   style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Yönergeleri Görüntüle
                </a>
              </div>
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
  },
}

// E-posta gönderici oluştur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
} as EmailConfig)

// E-posta gönder
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  } catch (error) {
    console.error('E-posta gönderilirken hata:', error)
    throw new Error('E-posta gönderilemedi')
  }
}

// Sipariş durumu güncelleme e-postası
export async function sendOrderStatusEmail(
  email: string,
  orderId: string,
  status: string,
  customerName: string
): Promise<void> {
  const { title, message } = createTemplateMessage(
    {
      name: 'Sipariş Durumu Değişti',
      description: 'Sipariş durumu güncellendiğinde gönderilir',
      type: 'ORDER_STATUS_CHANGED',
      variables: [
        { name: 'orderId', description: 'Sipariş ID', required: true },
        { name: 'status', description: 'Yeni Durum', required: true },
        { name: 'customerName', description: 'Müşteri Adı', required: true },
      ],
      translations: {
        tr: {
          title: 'Sipariş Durumu Güncellendi',
          message: `Sayın ${customerName}, ${orderId} numaralı siparişinizin durumu "${status}" olarak güncellendi.`,
        },
      },
      defaultLanguage: 'tr',
    },
    {
      orderId,
      status,
      customerName,
    }
  )

  await sendEmail({
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${title}</h2>
        <p>${message}</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
        </p>
      </div>
    `,
  })
}

// Kurye atama e-postası
export async function sendCourierAssignmentEmail(
  email: string,
  orderId: string,
  courierName: string,
  estimatedDeliveryTime?: string
): Promise<void> {
  const { title, message } = createTemplateMessage(
    {
      name: 'Sipariş Atandı',
      description: 'Kuryeye yeni sipariş atandığında gönderilir',
      type: 'ORDER_ASSIGNED',
      variables: [
        { name: 'orderId', description: 'Sipariş ID', required: true },
        { name: 'courierName', description: 'Kurye Adı', required: true },
        { name: 'estimatedDeliveryTime', description: 'Tahmini Teslimat Süresi', required: false },
      ],
      translations: {
        tr: {
          title: 'Yeni Sipariş Atandı',
          message: `${courierName} kuryesine yeni bir sipariş atandı. Sipariş ID: ${orderId}`,
        },
      },
      defaultLanguage: 'tr',
    },
    {
      orderId,
      courierName,
      estimatedDeliveryTime: estimatedDeliveryTime || '',
    }
  )

  await sendEmail({
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${title}</h2>
        <p>${message}</p>
        ${estimatedDeliveryTime ? `<p>Tahmini Teslimat: ${estimatedDeliveryTime}</p>` : ''}
        <p style="color: #6b7280; font-size: 0.875rem;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
        </p>
      </div>
    `,
  })
}

// Bölge dışı uyarı e-postası
export async function sendZoneBoundaryEmail(
  email: string,
  zoneName: string,
  distance: number,
  courierName: string
): Promise<void> {
  const { title, message } = createTemplateMessage(
    {
      name: 'Bölge Sınırı Uyarısı',
      description: 'Kurye bölge sınırına yaklaştığında gönderilir',
      type: 'ZONE_BOUNDARY_ALERT',
      variables: [
        { name: 'zoneName', description: 'Bölge Adı', required: true },
        { name: 'distance', description: 'Mesafe (metre)', required: true },
        { name: 'courierName', description: 'Kurye Adı', required: true },
      ],
      translations: {
        tr: {
          title: 'Bölge Sınırı Uyarısı',
          message: `${courierName}, ${zoneName} bölgesinin sınırına yaklaştınız (${distance}m).`,
        },
      },
      defaultLanguage: 'tr',
    },
    {
      zoneName,
      distance,
      courierName,
    }
  )

  await sendEmail({
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">${title}</h2>
        <p>${message}</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
        </p>
      </div>
    `,
  })
} 