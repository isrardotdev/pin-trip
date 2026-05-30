import { Router, Request, Response } from 'express'
import { prisma } from '../db'
import { logger } from '../logger'

export const discoverRouter = Router()

discoverRouter.get('/', async (_req: Request, res: Response) => {
  logger.debug('GET /discover')
  try {
    const places = await prisma.discoverPlace.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    logger.info({ count: places.length }, 'Fetched discover places')
    res.json({ success: true, data: places })
  } catch (err) {
    logger.error({ err }, 'Failed to fetch discover places')
    res.status(500).json({ success: false, error: 'Failed to fetch places' })
  }
})
