import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'
import { getMessaging, BatchResponse, SendResponse } from 'firebase-admin/messaging'
import { logger } from './logger'

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  throw new Error('Firebase credentials are not properly configured')
}

const app = initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
})

export interface PushNotificationData {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushNotification(data: PushNotificationData): Promise<string> {
  try {
    const messaging = getMessaging(app)

    const message = {
      token: data.token,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: data.data || {},
    }

    const response = await messaging.send(message)
    logger.info('Successfully sent push notification:', { messageId: response })
    return response
  } catch (error) {
    logger.error('Error sending push notification:', error)
    throw new Error('Failed to send push notification')
  }
}

export async function sendBulkPushNotifications(notifications: PushNotificationData[]): Promise<{
  successful: string[]
  failed: Error[]
}> {
  const messaging = getMessaging(app)
  const results = {
    successful: [] as string[],
    failed: [] as Error[],
  }

  try {
    const messages = notifications.map((data) => ({
      token: data.token,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: data.data || {},
    }))

    const responses = await Promise.all(
      messages.map(message => messaging.send(message).catch(error => ({ error })))
    )

    responses.forEach((response, idx) => {
      if ('error' in response) {
        results.failed.push(new Error(`Failed to send notification to token ${notifications[idx].token}: ${response.error.message || 'Unknown error'}`))
      } else {
        results.successful.push(response)
      }
    })

    logger.info('Bulk push notification results:', {
      total: notifications.length,
      successful: results.successful.length,
      failed: results.failed.length,
    })

    if (results.successful.length === 0 && results.failed.length > 0) {
      throw new Error('All push notifications failed to send')
    }

    return results
  } catch (error) {
    logger.error('Error sending bulk push notifications:', error)
    throw error
  }
}

export async function subscribeTopic(token: string, topic: string): Promise<void> {
  try {
    const messaging = getMessaging(app)
    await messaging.subscribeToTopic([token], topic)
    logger.info('Successfully subscribed to topic:', { token, topic })
  } catch (error) {
    logger.error('Error subscribing to topic:', error)
    throw new Error('Failed to subscribe to topic')
  }
}

export async function unsubscribeTopic(token: string, topic: string): Promise<void> {
  try {
    const messaging = getMessaging(app)
    await messaging.unsubscribeFromTopic([token], topic)
    logger.info('Successfully unsubscribed from topic:', { token, topic })
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error)
    throw new Error('Failed to unsubscribe from topic')
  }
}

export async function sendTopicNotification(topic: string, data: Omit<PushNotificationData, 'token'>): Promise<string> {
  try {
    const messaging = getMessaging(app)

    const message = {
      topic,
      notification: {
        title: data.title,
        body: data.body,
      },
      data: data.data || {},
    }

    const response = await messaging.send(message)
    logger.info('Successfully sent topic notification:', { topic, messageId: response })
    return response
  } catch (error) {
    logger.error('Error sending topic notification:', error)
    throw new Error('Failed to send topic notification')
  }
}