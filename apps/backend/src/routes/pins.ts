import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { authenticate, AuthRequest } from '../middleware/auth'
import { PinStatus, Category } from '@prisma/client'

export const pinsRouter = Router()

pinsRouter.use(authenticate)

const createPinSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  lat: z.number(),
  lng: z.number(),
  source: z.enum(['INSTAGRAM', 'YOUTUBE', 'MANUAL', 'DISCOVER']).default('MANUAL'),
  sourceUrl: z.string().url().optional(),
  sourceThumbnailUrl: z.string().url().optional(),
  status: z.enum(['WISHLIST', 'PLANNING', 'VISITED']).default('WISHLIST'),
  category: z.enum(['NATURE', 'FOOD', 'ADVENTURE', 'CULTURE', 'STAY', 'OFFBEAT']).default('NATURE'),
  notes: z.string().optional(),
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

  const pins = await prisma.pin.findMany({
    where: {
      userId: req.userId,
      ...(status ? { status: status as PinStatus } : {}),
      ...(category ? { category: category as Category } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: pins })
})

pinsRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createPinSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const pin = await prisma.pin.create({
    data: { ...parsed.data, userId: req.userId! },
  })

  res.status(201).json({ success: true, data: pin })
})

pinsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  const pin = await prisma.pin.findFirst({
    where: { id, userId: req.userId },
  })

  if (!pin) {
    res.status(404).json({ success: false, error: 'Pin not found' })
    return
  }

  res.json({ success: true, data: pin })
})

pinsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  const parsed = updatePinSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const existing = await prisma.pin.findFirst({
    where: { id, userId: req.userId },
  })
  if (!existing) {
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

  res.json({ success: true, data: pin })
})

pinsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id)
  const existing = await prisma.pin.findFirst({
    where: { id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ success: false, error: 'Pin not found' })
    return
  }

  await prisma.pin.delete({ where: { id } })
  res.json({ success: true, data: null })
})
