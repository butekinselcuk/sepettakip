import { NotificationType } from '../../generated/prisma'
import {
  processNotification,
  processEmailNotification,
  processSMSNotification,
  processPushNotification,
} from '../notificationProcessor'
import { prisma } from '../prisma'
import { sendEmail } from '../email'
import { sendSMS } from '../sms'
import { sendPushNotification } from '../push'

// Mock dependencies
jest.mock('../prisma', () => ({
  prisma: {
    notification: {
      update: jest.fn(),
    },
  },
}))

jest.mock('../email', () => ({
  sendEmail: jest.fn(),
}))

jest.mock('../sms', () => ({
  sendSMS: jest.fn(),
}))

jest.mock('../push', () => ({
  sendPushNotification: jest.fn(),
}))

describe('Notification Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processEmailNotification', () => {
    it('should process email notification successfully', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          email: 'test@example.com',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processEmailNotification(notification)

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Title',
        html: 'Test Message',
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { processed: true },
      })
    })

    it('should throw error when email is missing', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await expect(processEmailNotification(notification)).rejects.toThrow(
        'E-posta adresi bulunamadı'
      )
    })
  })

  describe('processSMSNotification', () => {
    it('should process SMS notification successfully', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          phone: '+905551234567',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processSMSNotification(notification)

      expect(sendSMS).toHaveBeenCalledWith({
        to: '+905551234567',
        message: 'Test Message',
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { processed: true },
      })
    })

    it('should throw error when phone is missing', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await expect(processSMSNotification(notification)).rejects.toThrow(
        'Telefon numarası bulunamadı'
      )
    })
  })

  describe('processPushNotification', () => {
    it('should process push notification successfully with userId', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          userId: 'user123',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processPushNotification(notification)

      expect(sendPushNotification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Test Title',
        message: 'Test Message',
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { processed: true },
      })
    })

    it('should process push notification successfully with courierId', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          courierId: 'courier123',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processPushNotification(notification)

      expect(sendPushNotification).toHaveBeenCalledWith({
        courierId: 'courier123',
        title: 'Test Title',
        message: 'Test Message',
      })

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { processed: true },
      })
    })

    it('should throw error when both userId and courierId are missing', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await expect(processPushNotification(notification)).rejects.toThrow(
        'Kullanıcı veya kurye ID bulunamadı'
      )
    })
  })

  describe('processNotification', () => {
    it('should process order notification through all channels', async () => {
      const notification = {
        type: NotificationType.ORDER_ASSIGNED,
        data: {
          email: 'test@example.com',
          phone: '+905551234567',
          userId: 'user123',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processNotification(notification)

      expect(sendEmail).toHaveBeenCalled()
      expect(sendSMS).toHaveBeenCalled()
      expect(sendPushNotification).toHaveBeenCalled()
    })

    it('should process zone boundary alert through SMS and push only', async () => {
      const notification = {
        type: NotificationType.ZONE_BOUNDARY_ALERT,
        data: {
          phone: '+905551234567',
          userId: 'user123',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processNotification(notification)

      expect(sendEmail).not.toHaveBeenCalled()
      expect(sendSMS).toHaveBeenCalled()
      expect(sendPushNotification).toHaveBeenCalled()
    })

    it('should process system alert through email and push only', async () => {
      const notification = {
        type: NotificationType.SYSTEM_ALERT,
        data: {
          email: 'test@example.com',
          userId: 'user123',
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await processNotification(notification)

      expect(sendEmail).toHaveBeenCalled()
      expect(sendSMS).not.toHaveBeenCalled()
      expect(sendPushNotification).toHaveBeenCalled()
    })

    it('should throw error for unknown notification type', async () => {
      const notification = {
        type: 'UNKNOWN_TYPE' as NotificationType,
        data: {
          title: 'Test Title',
          message: 'Test Message',
          notificationId: '123',
        },
      }

      await expect(processNotification(notification)).rejects.toThrow(
        'Bilinmeyen bildirim tipi: UNKNOWN_TYPE'
      )
    })
  })
}) 