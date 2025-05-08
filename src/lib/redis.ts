import { createClient, RedisClientType } from 'redis'

class RedisService {
  private static instance: RedisService
  private client: RedisClientType
  private isConnected: boolean = false

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    })

    this.client.on('error', (error) => {
      console.error('Redis bağlantı hatası:', error)
      this.isConnected = false
    })

    this.client.on('connect', () => {
      console.log('Redis bağlantısı başarılı')
      this.isConnected = true
    })

    this.client.on('reconnecting', () => {
      console.log('Redis yeniden bağlanıyor...')
    })

    this.client.on('end', () => {
      console.log('Redis bağlantısı sonlandı')
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