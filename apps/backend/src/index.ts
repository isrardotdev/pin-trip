import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { logger } from './logger'
import { notifyDiscord } from './lib/discord'
import { globalLimiter, loginLimiter, registerLimiter } from './middleware/rateLimiter'
import { authRouter } from './routes/auth'
import { pinsRouter } from './routes/pins'
import { parsePinRouter } from './routes/parsePin'
import { discoverRouter } from './routes/discover'
import { planRouter } from './routes/plan'
import { startReelParserWorker } from './workers/reelParser.worker'

const app = express()

app.use(cors({ origin: config.allowedOrigins, credentials: true }))
app.use(express.json())
app.use(globalLimiter)

app.use('/api/auth/login', loginLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api/auth', authRouter)
app.use('/api/pins', pinsRouter)
app.use('/api/pins/parse', parsePinRouter)
app.use('/api/discover', discoverRouter)
app.use('/api/plan', planRouter)

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error')
  notifyDiscord('Unhandled Server Error', `${err.name}: ${err.message}\n\n${err.stack ?? ''}`)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception')
  notifyDiscord('Uncaught Exception', `${err.name}: ${err.message}\n\n${err.stack ?? ''}`)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason)
  logger.error({ reason }, 'Unhandled rejection')
  notifyDiscord('Unhandled Promise Rejection', message, 'warn')
})

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'WanderPin backend running')
  startReelParserWorker()
  logger.info('Reel parser worker started')
})
