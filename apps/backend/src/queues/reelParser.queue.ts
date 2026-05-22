import { Queue } from 'bullmq'
import { config } from '../config'

export interface ReelParseJob {
  url: string
  userId: string
}

export const reelParserQueue = new Queue<ReelParseJob>('reel-parsing', {
  connection: { url: config.redisUrl },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
})
