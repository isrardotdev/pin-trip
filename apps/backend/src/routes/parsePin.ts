import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { reelParserQueue } from '../queues/reelParser.queue'

export const parsePinRouter = Router()

parsePinRouter.use(authenticate)

const parseSchema = z.object({
  url: z.string().url(),
})

parsePinRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = parseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid URL', code: 'VALIDATION_ERROR' })
    return
  }

  const job = await reelParserQueue.add('parse-reel', {
    url: parsed.data.url,
    userId: req.userId!,
  })

  res.status(202).json({ success: true, data: { jobId: job.id, status: 'queued' } })
})

parsePinRouter.get('/:jobId', async (req: AuthRequest, res: Response) => {
  const job = await reelParserQueue.getJob(String(req.params.jobId))
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' })
    return
  }

  const state = await job.getState()
  const stateMap: Record<string, string> = {
    waiting: 'queued',
    active: 'processing',
    completed: 'done',
    failed: 'failed',
    delayed: 'queued',
  }

  res.json({
    success: true,
    data: {
      jobId: job.id,
      status: stateMap[state] || 'queued',
      ...(state === 'failed' ? { error: job.failedReason } : {}),
    },
  })
})
