import { createClient, RedisClientType } from 'redis'
import logger from '@/lib/logger'

class RedisService {
  private static instance: RedisService
  private client: RedisClientType
  private isConnected: boolean = false

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    this.client.on('error', (error) => {
      logger.error('Redis bağlantı hatası', error as Error, {
        module: 'redis'
      })
      this.isConnected = false
    })

    this.client.on('connect', () => {
      logger.info('Redis bağlantısı başarılı', {
        module: 'redis'
      })
      this.isConnected = true
    })

    this.client.on('reconnecting', () => {
      logger.info('Redis yeniden bağlanıyor...', {
        module: 'redis'
      })
    })

    this.client.on('end', () => {
      logger.info('Redis bağlantısı sonlandı', {
        module: 'redis'
      })
      this.isConnected = false
    })
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService()
    }
    return RedisService.instance
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect()
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect()
    }
  }

  public async lPush(key: string, value: string): Promise<number> {
    await this.ensureConnection()
    return this.client.lPush(key, value)
  }

  public async rPop(key: string): Promise<string | null> {
    await this.ensureConnection()
    return this.client.rPop(key)
  }

  public async lLen(key: string): Promise<number> {
    await this.ensureConnection()
    return this.client.lLen(key)
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect()
    }
  }
}

export const redis = RedisService.getInstance() 