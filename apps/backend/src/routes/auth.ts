import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../db'
import { config } from '../config'
import { authenticate, AuthRequest } from '../middleware/auth'
import { logger } from '../logger'

export const authRouter = Router()

const googleClient = new OAuth2Client(config.googleWebClientId)

function issueToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

const USER_SELECT = { id: true, email: true, name: true, avatarUrl: true, plan: true, aiMessagesUsed: true, createdAt: true } as const

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
      select: USER_SELECT,
    })

    const token = issueToken(user.id)

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
    if (!user.passwordHash) {
      logger.warn({ email, userId: user.id }, 'Login: account has no password (Google-only)')
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      logger.warn({ email, userId: user.id }, 'Login: invalid password')
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' })
      return
    }

    const token = issueToken(user.id)

    const { passwordHash: _, updatedAt: __, ...safeUser } = user
    logger.info({ userId: user.id, email }, 'User logged in')
    res.json({ success: true, data: { user: safeUser, token } })
  } catch (err) {
    logger.error({ err, email }, 'Login failed')
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

const googleSchema = z.object({
  idToken: z.string(),
})

authRouter.post('/google', async (req: Request, res: Response) => {
  logger.debug('POST /auth/google')
  if (!config.googleWebClientId) {
    logger.error('POST /auth/google called but GOOGLE_WEB_CLIENT_ID is not configured')
    res.status(503).json({ success: false, error: 'Google sign-in is not configured', code: 'GOOGLE_NOT_CONFIGURED' })
    return
  }
  const parsed = googleSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ errors: parsed.error.errors }, 'Google auth validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: config.googleWebClientId,
    })
    const payload = ticket.getPayload()

    if (!payload || !payload.email || !payload.sub) {
      logger.warn('Google auth: token payload missing email/sub')
      res.status(401).json({ success: false, error: 'Invalid Google token', code: 'INVALID_TOKEN' })
      return
    }
    if (!payload.email_verified) {
      logger.warn({ email: payload.email }, 'Google auth: email not verified')
      res.status(401).json({ success: false, error: 'Google account email is not verified', code: 'EMAIL_NOT_VERIFIED' })
      return
    }

    const { sub: googleId, email, name, picture } = payload

    let user = await prisma.user.findUnique({ where: { googleId }, select: USER_SELECT })

    if (!user) {
      // Email already registered (e.g. via the dormant password flow) — link
      // this Google account onto it instead of creating a duplicate. Safe
      // because payload.email_verified was already checked above.
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        user = await prisma.user.update({ where: { id: existing.id }, data: { googleId }, select: USER_SELECT })
        logger.info({ userId: user.id, email }, 'Linked Google account to existing user')
      } else {
        user = await prisma.user.create({
          data: { email, googleId, name: name ?? undefined, avatarUrl: picture ?? undefined },
          select: USER_SELECT,
        })
        logger.info({ userId: user.id, email }, 'Created user via Google sign-in')
      }
    }

    const token = issueToken(user.id)
    logger.info({ userId: user.id, email }, 'User signed in via Google')
    res.json({ success: true, data: { user, token } })
  } catch (err) {
    logger.error({ err }, 'Google auth failed')
    res.status(401).json({ success: false, error: 'Google sign-in failed', code: 'GOOGLE_AUTH_FAILED' })
  }
})

authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'GET /auth/me')
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
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

authRouter.delete('/me', authenticate, async (req: AuthRequest, res: Response) => {
  logger.info({ userId: req.userId }, 'DELETE /auth/me')
  const userId = req.userId as string

  try {
    // UnresolvedPin carries a userId but has no FK relation to User, so it is
    // not covered by the onDelete: Cascade that clears pins, conversations and
    // saved itineraries. Delete it explicitly or it outlives the account.
    await prisma.$transaction([
      prisma.unresolvedPin.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ])

    logger.info({ userId }, 'Account and all associated data deleted')
    res.json({ success: true, data: { deleted: true } })
  } catch (err) {
    logger.error({ err, userId }, 'Account deletion failed')
    res.status(500).json({ success: false, error: 'Failed to delete account' })
  }
})
