import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { parseLimiter } from '../middleware/rateLimiter'
import { reelParserQueue } from '../queues/reelParser.queue'
import { logger } from '../logger'

export const parsePinRouter = Router()

parsePinRouter.use(authenticate)

const parseSchema = z.object({
  url: z.string().url(),
})

// parseLimiter only guards the expensive pipeline trigger (yt-dlp + Whisper +
// Llama). It must NOT apply router-wide — pin-confirm.tsx polls GET /:jobId
// every 2s for up to 60s per job, which would burn through the same 20/hour
// budget just from status checks on a single share.
parsePinRouter.post('/', parseLimiter, async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId, url: req.body?.url }, 'POST /pins/parse')
  const parsed = parseSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ userId: req.userId, body: req.body }, 'Parse: invalid URL')
    res.status(400).json({ success: false, error: 'Invalid URL', code: 'VALIDATION_ERROR' })
    return
  }

  try {
    const job = await reelParserQueue.add('parse-reel', {
      url: parsed.data.url,
      userId: req.userId!,
    })
    logger.info({ userId: req.userId, jobId: job.id, url: parsed.data.url }, 'Reel parse job queued')
    res.status(202).json({ success: true, data: { jobId: job.id, status: 'queued' } })
  } catch (err) {
    logger.error({ err, userId: req.userId, url: parsed.data.url }, 'Failed to queue reel parse job')
    res.status(500).json({ success: false, error: 'Failed to queue job' })
  }
})

parsePinRouter.get('/:jobId', async (req: AuthRequest, res: Response) => {
  const jobId = String(req.params.jobId)
  logger.debug({ userId: req.userId, jobId }, 'GET /pins/parse/:jobId')

  try {
    const job = await reelParserQueue.getJob(jobId)
    if (!job) {
      logger.warn({ userId: req.userId, jobId }, 'Parse job not found')
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

    const status = stateMap[state] || 'queued'
    const extra =
      state === 'failed' ? { error: job.failedReason } :
      state === 'completed' ? { placeData: (job.returnvalue as any)?.placeData ?? null } :
      {}

    logger.debug({ userId: req.userId, jobId, state, status }, 'Parse job status polled')
    if (state === 'failed') {
      logger.warn({ userId: req.userId, jobId, reason: job.failedReason }, 'Parse job failed')
    }

    res.json({ success: true, data: { jobId: job.id, status, ...extra } })
  } catch (err) {
    logger.error({ err, userId: req.userId, jobId }, 'Failed to get job status')
    res.status(500).json({ success: false, error: 'Failed to get job status' })
  }
})
