import Redis from 'ioredis'
import { config } from '../config'

// Shared Redis client for rate limiting (separate from BullMQ connections)
export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})
