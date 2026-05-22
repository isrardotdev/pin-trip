import { Router, Request, Response } from 'express'
import { prisma } from '../db'

export const discoverRouter = Router()

discoverRouter.get('/', async (_req: Request, res: Response) => {
  const places = await prisma.discoverPlace.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: places })
})
