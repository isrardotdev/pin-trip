import { Worker, Job } from 'bullmq'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import Groq from 'groq-sdk'
import { config } from '../config'
import { prisma } from '../db'
import { logger } from '../logger'
import { ReelParseJob } from '../queues/reelParser.queue'

const groq = new Groq({ apiKey: config.groqApiKey })

async function downloadReel(url: string, jobId: string): Promise<{ audioPath: string; caption: string; thumbnailUrl: string }> {
  const audioPath = path.join(config.tempDir, `${jobId}.mp3`)
  fs.mkdirSync(config.tempDir, { recursive: true })

  return new Promise((resolve, reject) => {
    const proc = spawn(config.ytdlpPath, [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--output', audioPath,
      '--write-info-json',
      '--no-playlist',
      url,
    ])

    let stderr = ''
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`))
        return
      }

      const infoPath = audioPath.replace('.mp3', '.info.json')
      let caption = ''
      let thumbnailUrl = ''

      if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
        caption = info.description || info.title || ''
        thumbnailUrl = info.thumbnail || ''
        fs.unlinkSync(infoPath)
      }

      resolve({ audioPath, caption, thumbnailUrl })
    })
  })
}

async function transcribeAudio(audioPath: string): Promise<string> {
  const file = fs.createReadStream(audioPath) as unknown as File
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
  })
  return result.text
}

interface LocationExtraction {
  name: string | null
  city: string
  state: string
  country: string
  category: string
  confidence: number
  reasoning: string
}

async function extractLocation(caption: string, transcript: string): Promise<LocationExtraction> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a location extraction specialist for a travel app.
You will be given a video caption and audio transcript from a social media travel video.
Your job is to extract the most specific location mentioned.

Rules:
- Prefer specific place names over generic ones ("Dawki River" > "a river in Meghalaya")
- If multiple locations mentioned, pick the PRIMARY one the video is about
- confidence: 0.0 to 1.0. Be honest — if you're guessing, say 0.3. If obvious, say 0.95.
- category: one of NATURE, FOOD, ADVENTURE, CULTURE, STAY, OFFBEAT
- Always respond with valid JSON only. No other text.

Response format:
{
  "name": "Dawki River",
  "city": "Dawki",
  "state": "Meghalaya",
  "country": "India",
  "category": "NATURE",
  "confidence": 0.92,
  "reasoning": "Caption explicitly mentions Dawki"
}

If you cannot identify any location with confidence > 0.2, respond:
{ "name": null, "confidence": 0.0, "reasoning": "No location signals found" }`,
      },
      {
        role: 'user',
        content: `Caption: ${caption}\nTranscript: ${transcript}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

async function geocode(name: string, city: string, state: string): Promise<NominatimResult | null> {
  const query = [name, city, state].filter(Boolean).join(', ')
  const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1 },
    headers: { 'User-Agent': config.nominatimUserAgent },
  })

  return response.data[0] || null
}

async function processJob(job: Job<ReelParseJob>): Promise<void> {
  const { url, userId } = job.data
  const jobId = job.id || Date.now().toString()
  let audioPath: string | null = null

  try {
    logger.info({ jobId, url }, 'Starting reel parse job')

    // Step 1: Download
    const { audioPath: ap, caption, thumbnailUrl } = await downloadReel(url, jobId)
    audioPath = ap
    logger.info({ jobId }, 'Reel downloaded')

    // Step 2: Transcribe
    const transcript = await transcribeAudio(audioPath)
    logger.info({ jobId, transcript: transcript.slice(0, 100) }, 'Transcription complete')

    // Step 3: Extract location
    const extraction = await extractLocation(caption, transcript)
    logger.info({ jobId, extraction }, 'Location extracted')

    if (!extraction.name || extraction.confidence < 0.6) {
      // Save as unresolved
      await prisma.unresolvedPin.create({
        data: {
          userId,
          sourceUrl: url,
          sourceThumbnailUrl: thumbnailUrl || null,
          sourceCaption: caption || null,
          rawTranscript: transcript,
          aiResponse: JSON.stringify(extraction),
        },
      })
      logger.info({ jobId }, 'Saved as unresolved pin (low confidence)')
      return
    }

    // Step 4: Geocode
    const geo = await geocode(extraction.name, extraction.city, extraction.state)
    if (!geo) {
      await prisma.unresolvedPin.create({
        data: {
          userId,
          sourceUrl: url,
          sourceThumbnailUrl: thumbnailUrl || null,
          sourceCaption: caption || null,
          rawTranscript: transcript,
          aiResponse: JSON.stringify(extraction),
        },
      })
      logger.info({ jobId }, 'Saved as unresolved pin (geocoding failed)')
      return
    }

    // Step 5: Create pin
    await prisma.pin.create({
      data: {
        userId,
        name: extraction.name,
        city: extraction.city,
        state: extraction.state,
        country: extraction.country || 'India',
        lat: parseFloat(geo.lat),
        lng: parseFloat(geo.lon),
        source: 'INSTAGRAM',
        sourceUrl: url,
        sourceThumbnailUrl: thumbnailUrl || null,
        sourceCaption: caption || null,
        category: extraction.category as any,
        aiConfidence: extraction.confidence,
        rawTranscript: transcript,
        status: 'WISHLIST',
      },
    })

    logger.info({ jobId }, 'Pin created successfully')
  } finally {
    // Step 6: Cleanup
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath)
    }
  }
}

export function startReelParserWorker(): Worker<ReelParseJob> {
  const worker = new Worker<ReelParseJob>('reel-parsing', processJob, {
    connection: { url: config.redisUrl },
    concurrency: 3,
  })

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Job completed'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'))

  return worker
}
