import { getMessaging } from 'firebase-admin/messaging'
import { sendPushNotification, sendBulkPushNotifications, subscribeTopic, unsubscribeTopic, sendTopicNotification } from '../push'

// Mock Firebase Admin SDK
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
}))

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}))

describe('Push Notification Service', () => {
  const mockMessaging = {
    send: jest.fn(),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getMessaging as jest.Mock).mockReturnValue(mockMessaging)
  })

  describe('sendPushNotification', () => {
    const mockNotification = {
      token: 'test-token',
      title: 'Test Title',
      body: 'Test Body',
      data: { key: 'value' },
    }

    it('should successfully send a push notification', async () => {
      const mockMessageId = 'test-message-id'
      mockMessaging.send.mockResolvedValueOnce(mockMessageId)

      const result = await sendPushNotification(mockNotification)

      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: mockNotification.token,
        notification: {
          title: mockNotification.title,
          body: mockNotification.body,
        },
        data: mockNotification.data,
      })
      expect(result).toBe(mockMessageId)
    })

    it('should throw an error when sending fails', async () => {
      const error = new Error('Failed to send')
      mockMessaging.send.mockRejectedValueOnce(error)

      await expect(sendPushNotification(mockNotification)).rejects.toThrow('Failed to send push notification')
    })
  })

  describe('sendBulkPushNotifications', () => {
    const mockNotifications = [
      {
        token: 'token-1',
        title: 'Title 1',
        body: 'Body 1',
      },
      {
        token: 'token-2',
        title: 'Title 2',
        body: 'Body 2',
      },
    ]

    it('should successfully send multiple notifications', async () => {
      const mockMessageIds = ['message-id-1', 'message-id-2']
      mockMessaging.send
        .mockResolvedValueOnce(mockMessageIds[0])
        .mockResolvedValueOnce(mockMessageIds[1])

      const result = await sendBulkPushNotifications(mockNotifications)

      expect(mockMessaging.send).toHaveBeenCalledTimes(2)
      expect(result.successful).toEqual(mockMessageIds)
      expect(result.failed).toHaveLength(0)
    })

    it('should handle partial failures', async () => {
      const error = new Error('Failed to send')
      mockMessaging.send
        .mockResolvedValueOnce('message-id-1')
        .mockRejectedValueOnce(error)

      const result = await sendBulkPushNotifications(mockNotifications)

      expect(result.successful).toHaveLength(1)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].message).toContain('Failed to send notification to token token-2')
    })

    it('should throw an error when all notifications fail', async () => {
      const error = new Error('Failed to send')
      mockMessaging.send
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)

      await expect(sendBulkPushNotifications(mockNotifications)).rejects.toThrow('All push notifications failed to send')
    })
  })

  describe('subscribeTopic', () => {
    it('should successfully subscribe to a topic', async () => {
      mockMessaging.subscribeToTopic.mockResolvedValueOnce({})

      await subscribeTopic('test-token', 'test-topic')

      expect(mockMessaging.subscribeToTopic).toHaveBeenCalledWith(['test-token'], 'test-topic')
    })

    it('should throw an error when subscription fails', async () => {
      const error = new Error('Failed to subscribe')
      mockMessaging.subscribeToTopic.mockRejectedValueOnce(error)

      await expect(subscribeTopic('test-token', 'test-topic')).rejects.toThrow('Failed to subscribe to topic')
    })
  })

  describe('unsubscribeTopic', () => {
    it('should successfully unsubscribe from a topic', async () => {
      mockMessaging.unsubscribeFromTopic.mockResolvedValueOnce({})

      await unsubscribeTopic('test-token', 'test-topic')

      expect(mockMessaging.unsubscribeFromTopic).toHaveBeenCalledWith(['test-token'], 'test-topic')
    })

    it('should throw an error when unsubscription fails', async () => {
      const error = new Error('Failed to unsubscribe')
      mockMessaging.unsubscribeFromTopic.mockRejectedValueOnce(error)

      await expect(unsubscribeTopic('test-token', 'test-topic')).rejects.toThrow('Failed to unsubscribe from topic')
    })
  })

  describe('sendTopicNotification', () => {
    const mockTopicData = {
      title: 'Test Title',
      body: 'Test Body',
      data: { key: 'value' },
    }

    it('should successfully send a topic notification', async () => {
      const mockMessageId = 'test-message-id'
      mockMessaging.send.mockResolvedValueOnce(mockMessageId)

      const result = await sendTopicNotification('test-topic', mockTopicData)

      expect(mockMessaging.send).toHaveBeenCalledWith({
        topic: 'test-topic',
        notification: {
          title: mockTopicData.title,
          body: mockTopicData.body,
        },
        data: mockTopicData.data,
      })
      expect(result).toBe(mockMessageId)
    })

    it('should throw an error when sending fails', async () => {
      const error = new Error('Failed to send')
      mockMessaging.send.mockRejectedValueOnce(error)

      await expect(sendTopicNotification('test-topic', mockTopicData)).rejects.toThrow('Failed to send topic notification')
    })
  })
}) 