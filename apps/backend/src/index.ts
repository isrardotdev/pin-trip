import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { logger } from './logger'
import { authRouter } from './routes/auth'
import { pinsRouter } from './routes/pins'
import { parsePinRouter } from './routes/parsePin'
import { discoverRouter } from './routes/discover'
import { planRouter } from './routes/plan'
import { startReelParserWorker } from './workers/reelParser.worker'

const app = express()

app.use(cors({ origin: config.allowedOrigins, credentials: true }))
app.use(express.json())

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
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'PinTrip backend running')
  startReelParserWorker()
  logger.info('Reel parser worker started')
})
