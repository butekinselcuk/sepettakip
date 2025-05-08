import { createClient } from 'redis'

// Redis istemcisini oluştur
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redis.on('error', (error) => {
  console.error('Redis bağlantı hatası:', error)
})

// Önbellek anahtarı oluştur
function createCacheKey(prefix: string, key: string): string {
  return `${prefix}:${key}`
}

// Veriyi önbelleğe ekle
export async function setCache<T>(
  prefix: string,
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  try {
    await redis.connect()
    const cacheKey = createCacheKey(prefix, key)
    await redis.set(cacheKey, JSON.stringify(data))
    if (ttl) {
      await redis.expire(cacheKey, ttl)
    }
  } catch (error) {
    console.error('Önbelleğe veri eklenirken hata:', error)
    throw new Error('Önbelleğe veri eklenemedi')
  } finally {
    await redis.disconnect()
  }
}

// Veriyi önbellekten getir
export async function getCache<T>(prefix: string, key: string): Promise<T | null> {
  try {
    await redis.connect()
    const cacheKey = createCacheKey(prefix, key)
    const data = await redis.get(cacheKey)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Önbellekten veri getirilirken hata:', error)
    throw new Error('Önbellekten veri getirilemedi')
  } finally {
    await redis.disconnect()
  }
}

// Veriyi önbellekten sil
export async function deleteCache(prefix: string, key: string): Promise<void> {
  try {
    await redis.connect()
    const cacheKey = createCacheKey(prefix, key)
    await redis.del(cacheKey)
  } catch (error) {
    console.error('Önbellekten veri silinirken hata:', error)
    throw new Error('Önbellekten veri silinemedi')
  } finally {
    await redis.disconnect()
  }
}

// Belirli bir önekle başlayan tüm verileri sil
export async function clearCachePrefix(prefix: string): Promise<void> {
  try {
    await redis.connect()
    const keys = await redis.keys(`${prefix}:*`)
    if (keys.length > 0) {
      await redis.del(keys)
    }
  } catch (error) {
    console.error('Önbellek temizlenirken hata:', error)
    throw new Error('Önbellek temizlenemedi')
  } finally {
    await redis.disconnect()
  }
}

// Önbellek istatistiklerini getir
export async function getCacheStats(): Promise<{
  totalKeys: number
  usedMemory: number
  hitRate?: number
}> {
  try {
    await redis.connect()
    const info = await redis.info()
    const stats = info.split('\n').reduce((acc: Record<string, string>, line: string) => {
      const [key, value] = line.split(':')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {})

    return {
      totalKeys: parseInt(stats['keyspace_hits'] || '0', 10),
      usedMemory: parseInt(stats['used_memory'] || '0', 10),
      hitRate: stats['keyspace_hits'] && stats['keyspace_misses']
        ? parseInt(stats['keyspace_hits'], 10) / (parseInt(stats['keyspace_hits'], 10) + parseInt(stats['keyspace_misses'], 10))
        : undefined,
    }
  } catch (error) {
    console.error('Önbellek istatistikleri getirilirken hata:', error)
    throw new Error('Önbellek istatistikleri getirilemedi')
  } finally {
    await redis.disconnect()
  }
}

// Önbelleği başlat
export async function initCache(): Promise<void> {
  try {
    await redis.connect()
    console.log('Redis bağlantısı başarılı')
  } catch (error) {
    console.error('Redis bağlantısı başlatılırken hata:', error)
    throw new Error('Redis bağlantısı başlatılamadı')
  }
}

// Önbelleği kapat
export async function closeCache(): Promise<void> {
  try {
    await redis.disconnect()
    console.log('Redis bağlantısı kapatıldı')
  } catch (error) {
    console.error('Redis bağlantısı kapatılırken hata:', error)
    throw new Error('Redis bağlantısı kapatılamadı')
  }
} 