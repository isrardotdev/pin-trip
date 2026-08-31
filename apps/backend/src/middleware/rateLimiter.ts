import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../lib/redis'
import type { AuthRequest } from './auth'

function redisStore(prefix: string) {
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    // @ts-expect-error — ioredis call signature is compatible
    sendCommand: (...args: string[]) => redis.call(...args),
  })
}

// 120 req/min per IP — blanket abuse protection on all routes
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('global'),
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
})

// 10 req / 15 min per IP — brute force protection on login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('login'),
  message: { success: false, error: 'Too many login attempts, please try again later', code: 'RATE_LIMITED' },
})

// 5 req / hour per IP — prevent fake account spam
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('register'),
  message: { success: false, error: 'Too many accounts created from this IP', code: 'RATE_LIMITED' },
})

// 15 req / hour per authenticated user — Gemini API is expensive
export const planLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('plan'),
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip ?? ''),
  message: { success: false, error: 'AI planner limit reached, please try again later', code: 'RATE_LIMITED' },
})

// 20 req / hour per authenticated user — yt-dlp + Whisper + Llama pipeline
export const parseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('parse'),
  keyGenerator: (req) => (req as AuthRequest).userId ?? ipKeyGenerator(req.ip ?? ''),
  message: { success: false, error: 'Reel parsing limit reached, please try again later', code: 'RATE_LIMITED' },
})
