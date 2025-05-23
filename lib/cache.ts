import { Redis } from 'ioredis';
import NodeCache from 'node-cache';
import logger from './logger';

// Environment configuration
const CACHE_PROVIDER = process.env.CACHE_PROVIDER || 'memory';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = parseInt(process.env.CACHE_TTL || '3600', 10); // Default 1 hour

// Cache interface
export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

// In-memory cache implementation
class MemoryCache implements CacheProvider {
  private cache: NodeCache;

  constructor(defaultTtl: number = DEFAULT_TTL) {
    this.cache = new NodeCache({ stdTTL: defaultTtl });
    logger.info('In-memory cache initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    return value || null;
  }

  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
  }

  async flush(): Promise<void> {
    this.cache.flushAll();
  }
}

// Redis cache implementation
class RedisCache implements CacheProvider {
  private client: Redis;

  constructor(redisUrl: string = REDIS_URL) {
    this.client = new Redis(redisUrl, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
    });
    
    this.client.on('error', (err) => {
      logger.error('Redis connection error', err);
    });
    
    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to parse cached value', error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const stringValue = JSON.stringify(value);
    await this.client.set(key, stringValue, 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async flush(): Promise<void> {
    await this.client.flushall();
  }
}

// Factory function to get the appropriate cache instance
export function getCacheProvider(): CacheProvider {
  if (CACHE_PROVIDER === 'redis') {
    return new RedisCache();
  }
  return new MemoryCache();
}

// Export singleton cache instance
export const cache = getCacheProvider(); 