import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db'
import { config } from '../config'
import { authenticate, AuthRequest } from '../middleware/auth'
import { logger } from '../logger'

export const authRouter = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

authRouter.post('/register', async (req: Request, res: Response) => {
  logger.debug({ email: req.body?.email }, 'POST /auth/register')
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Register validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const { email, password, name } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      logger.warn({ email }, 'Register: email already taken')
      res.status(409).json({ success: false, error: 'Email already registered', code: 'EMAIL_TAKEN' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, avatarUrl: true, plan: true, aiMessagesUsed: true, createdAt: true },
    })

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    })

    logger.info({ userId: user.id, email }, 'User registered')
    res.status(201).json({ success: true, data: { user, token } })
  } catch (err) {
    logger.error({ err, email }, 'Register failed')
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

authRouter.post('/login', async (req: Request, res: Response) => {
  logger.debug({ email: req.body?.email }, 'POST /auth/login')
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Login validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const { email, password } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logger.warn({ email }, 'Login: user not found')
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      logger.warn({ email, userId: user.id }, 'Login: invalid password')
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    })

    const { passwordHash: _, updatedAt: __, ...safeUser } = user
    logger.info({ userId: user.id, email }, 'User logged in')
    res.json({ success: true, data: { user: safeUser, token } })
  } catch (err) {
    logger.error({ err, email }, 'Login failed')
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'GET /auth/me')
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, plan: true, aiMessagesUsed: true, createdAt: true },
    })

    if (!user) {
      logger.warn({ userId: req.userId }, 'GET /me: user not found')
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }

    res.json({ success: true, data: user })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'GET /me failed')
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
})
