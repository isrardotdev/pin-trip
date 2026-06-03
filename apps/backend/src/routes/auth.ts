import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import jwksClient from 'jwks-rsa'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../db'
import { config } from '../config'
import { authenticate, AuthRequest } from '../middleware/auth'
import { logger } from '../logger'

const appleJwksClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 600_000, // 10 minutes
})

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

    if (!user.passwordHash) {
      res.status(401).json({ success: false, error: 'This account uses social login. Please sign in with Google or Apple.', code: 'SOCIAL_ACCOUNT' })
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

// ─── Shared: find-or-create user via OAuth ────────────────────────────────────

const USER_SELECT = {
  id: true, email: true, name: true, avatarUrl: true,
  plan: true, aiMessagesUsed: true, createdAt: true,
} as const

async function upsertOAuthUser(
  provider: string,
  providerId: string,
  providerEmail: string | null,
  displayName: string | null,
  avatarUrl: string | null,
) {
  // 1. Fast path: known OAuth account
  const existing = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider, providerId } },
    include: { user: { select: USER_SELECT } },
  })
  if (existing) return existing.user

  // 2. Account linking: email already registered
  if (providerEmail) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: providerEmail },
      select: USER_SELECT,
    })
    if (userByEmail) {
      await prisma.oAuthAccount.create({ data: { userId: userByEmail.id, provider, providerId, email: providerEmail } })
      return userByEmail
    }
  }

  // 3. New user
  return prisma.user.create({
    data: {
      email: providerEmail ?? `${provider}.${providerId}@privaterelay.pintrip.app`,
      name: displayName,
      avatarUrl,
      oauthAccounts: { create: { provider, providerId, email: providerEmail } },
    },
    select: USER_SELECT,
  })
}

function issueToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  })
}

// ─── POST /auth/apple ─────────────────────────────────────────────────────────

const appleSchema = z.object({
  identityToken: z.string(),
  user: z.object({ name: z.string().optional() }).optional(),
})

authRouter.post('/apple', async (req: Request, res: Response) => {
  logger.debug('POST /auth/apple')
  const parsed = appleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const { identityToken, user: userHint } = parsed.data
  try {
    // Decode header to get key ID, then verify with Apple's JWKS
    const decoded = jwt.decode(identityToken, { complete: true })
    if (!decoded || typeof decoded === 'string') throw new Error('Invalid token format')

    const kid = decoded.header.kid
    const signingKey = await appleJwksClient.getSigningKey(kid)
    const publicKey = signingKey.getPublicKey()

    const payload = jwt.verify(identityToken, publicKey, {
      issuer: 'https://appleid.apple.com',
      audience: config.appleBundleId,
      algorithms: ['RS256'],
    }) as jwt.JwtPayload

    const providerId = payload.sub!
    const providerEmail = (payload.email as string | undefined) ?? null
    const displayName = userHint?.name?.trim() || null

    const user = await upsertOAuthUser('apple', providerId, providerEmail, displayName, null)
    const token = issueToken(user.id)

    logger.info({ userId: user.id }, 'Apple sign-in success')
    res.json({ success: true, data: { user, token } })
  } catch (err) {
    logger.error({ err }, 'Apple sign-in failed')
    res.status(401).json({ success: false, error: 'Invalid Apple identity token', code: 'INVALID_TOKEN' })
  }
})

// ─── POST /auth/google ────────────────────────────────────────────────────────

const googleSchema = z.object({ idToken: z.string() })

authRouter.post('/google', async (req: Request, res: Response) => {
  logger.debug('POST /auth/google')
  const parsed = googleSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  if (!config.googleClientId) {
    res.status(503).json({ success: false, error: 'Google Sign-In not configured', code: 'NOT_CONFIGURED' })
    return
  }

  try {
    const client = new OAuth2Client(config.googleClientId)
    const ticket = await client.verifyIdToken({ idToken: parsed.data.idToken, audience: config.googleClientId })
    const payload = ticket.getPayload()!

    const providerId = payload.sub
    const providerEmail = payload.email ?? null
    const displayName = payload.name ?? null
    const avatarUrl = payload.picture ?? null

    const user = await upsertOAuthUser('google', providerId, providerEmail, displayName, avatarUrl)
    const token = issueToken(user.id)

    logger.info({ userId: user.id }, 'Google sign-in success')
    res.json({ success: true, data: { user, token } })
  } catch (err) {
    logger.error({ err }, 'Google sign-in failed')
    res.status(401).json({ success: false, error: 'Invalid Google ID token', code: 'INVALID_TOKEN' })
  }
})

authRouter.delete('/account', authenticate, async (req: AuthRequest, res: Response) => {
  logger.info({ userId: req.userId }, 'DELETE /auth/account')
  try {
    await prisma.user.delete({ where: { id: req.userId } })
    logger.info({ userId: req.userId }, 'Account deleted')
    res.json({ success: true, data: { message: 'Account deleted' } })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Delete account failed')
    res.status(500).json({ success: false, error: 'Failed to delete account' })
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
