import { NotificationType } from './notifications'

export type TemplateVariable = {
  name: string
  description: string
  required: boolean
}

export type NotificationTemplate = {
  id: string
  name: string
  description: string
  type: NotificationType
  variables: TemplateVariable[]
  translations: {
    [key: string]: {
      title: string
      message: string
    }
  }
  defaultLanguage: string
  createdAt: Date
  updatedAt: Date
}

// Varsayılan şablonlar
const defaultTemplates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
        message: '${courierName} kuryesine yeni bir sipariş atandı. Sipariş ID: ${orderId}',
      },
      en: {
        title: 'New Order Assigned',
        message: 'A new order has been assigned to courier ${courierName}. Order ID: ${orderId}',
      },
    },
    defaultLanguage: 'tr',
  },
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
        message: 'Sayın ${customerName}, ${orderId} numaralı siparişinizin durumu "${status}" olarak güncellendi.',
      },
      en: {
        title: 'Order Status Updated',
        message: 'Dear ${customerName}, your order ${orderId} status has been updated to "${status}".',
      },
    },
    defaultLanguage: 'tr',
  },
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
        message: '${courierName}, ${zoneName} bölgesinin sınırına yaklaştınız (${distance}m).',
      },
      en: {
        title: 'Zone Boundary Alert',
        message: '${courierName}, you are approaching the boundary of ${zoneName} zone (${distance}m).',
      },
    },
    defaultLanguage: 'tr',
  },
]

// Şablon değişkenlerini değiştir
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\${(\w+)}/g, (match, key) => {
    const value = variables[key]
    return value !== undefined ? String(value) : match
  })
}

// Şablon mesajı oluştur
export function createTemplateMessage(
  template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  variables: Record<string, string | number>
): { title: string; message: string } {
  const translation = template.translations[template.defaultLanguage]
  if (!translation) {
    throw new Error(`Translation not found for language: ${template.defaultLanguage}`)
  }

  return {
    title: replaceTemplateVariables(translation.title, variables),
    message: replaceTemplateVariables(translation.message, variables),
  }
}

// Şablonları getir
export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  // TODO: Veritabanından şablonları getir
  return defaultTemplates.map((template, index) => ({
    ...template,
    id: `template-${index + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
}

// Şablon oluştur
export async function createNotificationTemplate(
  template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<NotificationTemplate> {
  // TODO: Veritabanına şablon ekle
  return {
    ...template,
    id: `template-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Şablon güncelle
export async function updateNotificationTemplate(
  id: string,
  template: Partial<Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<NotificationTemplate> {
  // TODO: Veritabanında şablonu güncelle
  const existingTemplate = defaultTemplates.find((t) => t.id === id)
  if (!existingTemplate) {
    throw new Error('Template not found')
  }

  return {
    ...existingTemplate,
    ...template,
    id,
    updatedAt: new Date(),
  }
}

// Şablon sil
export async function deleteNotificationTemplate(id: string): Promise<void> {
  // TODO: Veritabanından şablonu sil
  const index = defaultTemplates.findIndex((t) => t.id === id)
  if (index === -1) {
    throw new Error('Template not found')
  }
  defaultTemplates.splice(index, 1)
} 