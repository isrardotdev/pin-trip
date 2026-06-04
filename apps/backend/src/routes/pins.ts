import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { authenticate, AuthRequest } from '../middleware/auth'
import { logger } from '../logger'
import { PinStatus, Category } from '@prisma/client'

export const pinsRouter = Router()

pinsRouter.use(authenticate)

const createPinSchema = z.object({
  name: z.string().min(1),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().default('India'),
  lat: z.number(),
  lng: z.number(),
  source: z.enum(['INSTAGRAM', 'YOUTUBE', 'MANUAL', 'DISCOVER', 'PLANNER']).default('MANUAL'),
  sourceUrl: z.string().url().optional(),
  sourceThumbnailUrl: z.string().url().optional(),
  status: z.enum(['WISHLIST', 'PLANNING', 'VISITED']).default('WISHLIST'),
  category: z.enum(['NATURE', 'FOOD', 'ADVENTURE', 'CULTURE', 'STAY', 'OFFBEAT']).default('NATURE'),
  notes: z.string().optional(),
  placeId: z.string().optional(),
  osmType: z.string().optional(),
  osmId: z.string().optional(),
  locationType: z.enum(['POINT', 'AREA']).optional(),
})

const updatePinSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['WISHLIST', 'PLANNING', 'VISITED']).optional(),
  category: z.enum(['NATURE', 'FOOD', 'ADVENTURE', 'CULTURE', 'STAY', 'OFFBEAT']).optional(),
  notes: z.string().optional(),
  visitedAt: z.string().datetime().optional(),
})

pinsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { status, category } = req.query
  logger.debug({ userId: req.userId, status, category }, 'GET /pins')

  try {
    const pins = await prisma.pin.findMany({
      where: {
        userId: req.userId,
        ...(status ? { status: status as PinStatus } : {}),
        ...(category ? { category: category as Category } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    const pinsJson = pins.map(p => ({ ...p, osmId: p.osmId?.toString() ?? null }))
    logger.info({ userId: req.userId, count: pins.length }, 'Fetched pins')
    res.json({ success: true, data: pinsJson })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Failed to fetch pins')
    res.status(500).json({ success: false, error: 'Failed to fetch pins' })
  }
})

pinsRouter.post('/', async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId, body: req.body }, 'POST /pins')
  const parsed = createPinSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ userId: req.userId, errors: parsed.error.errors }, 'Pin creation validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const { osmId, ...rest } = parsed.data
    const pin = await prisma.pin.create({
      data: {
        ...rest,
        userId: req.userId!,
        ...(osmId ? { osmId: BigInt(osmId) } : {}),
      },
    })
    // Serialise BigInt for JSON response
    const pinJson = { ...pin, osmId: pin.osmId?.toString() ?? null }
    logger.info({ userId: req.userId, pinId: pin.id, name: pin.name, source: pin.source, locationType: pin.locationType }, 'Pin created')
    res.status(201).json({ success: true, data: pinJson })
  } catch (err) {
    logger.error({ err, userId: req.userId, data: parsed.data }, 'Failed to create pin')
    res.status(500).json({ success: false, error: 'Failed to create pin' })
  }
})

pinsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  logger.debug({ userId: req.userId, pinId: id }, 'GET /pins/:id')

  try {
    const pin = await prisma.pin.findFirst({
      where: { id, userId: req.userId },
    })

    if (!pin) {
      logger.warn({ userId: req.userId, pinId: id }, 'Pin not found')
      res.status(404).json({ success: false, error: 'Pin not found' })
      return
    }

    res.json({ success: true, data: { ...pin, osmId: pin.osmId?.toString() ?? null } })
  } catch (err) {
    logger.error({ err, userId: req.userId, pinId: id }, 'Failed to fetch pin')
    res.status(500).json({ success: false, error: 'Failed to fetch pin' })
  }
})

pinsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  logger.debug({ userId: req.userId, pinId: id, body: req.body }, 'PATCH /pins/:id')
  const parsed = updatePinSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ userId: req.userId, pinId: id, errors: parsed.error.errors }, 'Pin update validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const existing = await prisma.pin.findFirst({
      where: { id, userId: req.userId },
    })
    if (!existing) {
      logger.warn({ userId: req.userId, pinId: id }, 'Pin not found for update')
      res.status(404).json({ success: false, error: 'Pin not found' })
      return
    }

    const pin = await prisma.pin.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.visitedAt ? { visitedAt: new Date(parsed.data.visitedAt) } : {}),
      },
    })
    logger.info({ userId: req.userId, pinId: id, changes: parsed.data }, 'Pin updated')
    res.json({ success: true, data: { ...pin, osmId: pin.osmId?.toString() ?? null } })
  } catch (err) {
    logger.error({ err, userId: req.userId, pinId: id }, 'Failed to update pin')
    res.status(500).json({ success: false, error: 'Failed to update pin' })
  }
})

pinsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  logger.debug({ userId: req.userId, pinId: id }, 'DELETE /pins/:id')

  try {
    const existing = await prisma.pin.findFirst({
      where: { id, userId: req.userId },
    })
    if (!existing) {
      logger.warn({ userId: req.userId, pinId: id }, 'Pin not found for deletion')
      res.status(404).json({ success: false, error: 'Pin not found' })
      return
    }

    await prisma.pin.delete({ where: { id } })
    logger.info({ userId: req.userId, pinId: id }, 'Pin deleted')
    res.json({ success: true, data: null })
  } catch (err) {
    logger.error({ err, userId: req.userId, pinId: id }, 'Failed to delete pin')
    res.status(500).json({ success: false, error: 'Failed to delete pin' })
  }
})
