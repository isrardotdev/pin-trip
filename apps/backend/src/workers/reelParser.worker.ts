import { Worker, Job } from 'bullmq'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import Groq from 'groq-sdk'
import { Category } from '@pintrip/shared'
import { config } from '../config'
import { prisma } from '../db'
import { logger } from '../logger'
import { ReelParseJob } from '../queues/reelParser.queue'

const groq = new Groq({ apiKey: config.groqApiKey })

// ─── yt-dlp helpers ──────────────────────────────────────────────────────────

interface MetaResult {
  caption: string
  thumbnailUrl: string
}

function spawnYtDlp(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(config.ytdlpPath, args)
    let stderr = ''
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code, signal) => {
      if (signal) return reject(new Error(`KILLED:${signal}`))
      if (code !== 0) return reject(new Error(`yt-dlp exit ${code}: ${stderr}`))
      resolve()
    })
  })
}

async function fetchMetadataOnly(url: string, jobId: string): Promise<MetaResult> {
  fs.mkdirSync(config.tempDir, { recursive: true })
  const outputPath = path.join(config.tempDir, `${jobId}_meta`)
  const infoPath = `${outputPath}.info.json`

  await spawnYtDlp([
    '--skip-download',
    '--write-info-json',
    '--output', outputPath,
    '--no-playlist',
    '--quiet',
    url,
  ])

  let caption = '', thumbnailUrl = ''
  if (fs.existsSync(infoPath)) {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
    caption = info.description || info.title || ''
    thumbnailUrl = info.thumbnail || ''
    fs.unlinkSync(infoPath)
  }
  return { caption, thumbnailUrl }
}

interface AudioDownloadHandle {
  promise: Promise<string>  // resolves to audioPath
  abort: () => void
}

function startAudioDownload(url: string, jobId: string): AudioDownloadHandle {
  fs.mkdirSync(config.tempDir, { recursive: true })
  const audioPath = path.join(config.tempDir, `${jobId}_audio.mp3`)
  let proc: ChildProcess | null = null

  const promise = new Promise<string>((resolve, reject) => {
    proc = spawn(config.ytdlpPath, [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--no-write-info-json',
      '--output', audioPath,
      '--no-playlist',
      '--quiet',
      url,
    ])
    let stderr = ''
    proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('close', (code, signal) => {
      if (signal) return reject(new Error(`KILLED:${signal}`))
      if (code !== 0) return reject(new Error(`yt-dlp audio exit ${code}: ${stderr}`))
      resolve(audioPath)
    })
  })

  return {
    promise,
    abort: () => {
      proc?.kill('SIGTERM')
      try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath) } catch {}
    },
  }
}

// ─── Transcription ───────────────────────────────────────────────────────────

async function transcribeAudio(audioPath: string): Promise<string> {
  const file = fs.createReadStream(audioPath) as unknown as File
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
  })
  return result.text
}

// ─── Location extraction ─────────────────────────────────────────────────────

interface LocationExtraction {
  name: string | null
  city: string
  state: string
  country: string
  category: string
  confidence: number
  reasoning: string
}

const EXTRACTION_SYSTEM = `You are a location extraction specialist for a travel app.
Extract the most specific location from a social media travel video caption (and optionally transcript).

Rules:
- Prefer specific place names ("Dawki River" > "a river in Meghalaya")
- Pick the PRIMARY location the video is about
- confidence: 0.0–1.0 (honest — if guessing say 0.3, if obvious say 0.95)
- category: one of NATURE, FOOD, ADVENTURE, CULTURE, STAY, OFFBEAT
- Respond with valid JSON only.

Format:
{ "name": "Dawki River", "city": "Dawki", "state": "Meghalaya", "country": "India", "category": "NATURE", "confidence": 0.92, "reasoning": "..." }

If no location with confidence > 0.2:
{ "name": null, "confidence": 0.0, "reasoning": "No location signals found" }`

async function extractLocation(caption: string, transcript: string): Promise<LocationExtraction> {
  const userContent = transcript
    ? `Caption: ${caption}\nTranscript: ${transcript}`
    : `Caption: ${caption}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

// ─── Geocoding ───────────────────────────────────────────────────────────────

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

async function geocodeQuery(query: string): Promise<NominatimResult | null> {
  const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1 },
    headers: { 'User-Agent': config.nominatimUserAgent },
  })
  return response.data[0] || null
}

async function geocode(name: string, city: string, state: string): Promise<NominatimResult | null> {
  // Try progressively broader queries until one returns a result
  const queries = [
    [name, city, state],   // specific: "Ruh Musafir, Shangarh, Himachal Pradesh"
    [city, state],          // area: "Shangarh, Himachal Pradesh"
    [state],                // region: "Himachal Pradesh"
  ].map(parts => parts.filter(Boolean).join(', ')).filter(Boolean)

  for (const query of queries) {
    logger.info({ query }, 'Geocoding')
    const result = await geocodeQuery(query)
    if (result) {
      logger.info({ query, display_name: result.display_name }, 'Geocode result')
      return result
    }
  }

  logger.info({ name, city, state }, 'Geocode: all queries returned no results')
  return null
}

// ─── Main job processor ──────────────────────────────────────────────────────

// Worker does NOT create the Pin — it returns extracted place data for the user to confirm.
// The client shows a confirmation sheet; on confirm it calls POST /pins to create the Pin.
interface PlaceData {
  placeId: string
  name: string
  city?: string | null
  state?: string | null
  country: string
  lat: number
  lng: number
  thumbnailUrl?: string | null
  category: string
  confidence: number
  sourceUrl: string
}

interface JobResult {
  placeData: PlaceData | null
}

async function processJob(job: Job<ReelParseJob>): Promise<JobResult> {
  const { url } = job.data
  const jobId = job.id || Date.now().toString()
  let audioPath: string | null = null

  try {
    // ── Level 1: URL cache (same reel, return existing Place data) ────────
    const existingSource = await prisma.placeSource.findUnique({ where: { url } })
    if (existingSource) {
      const place = await prisma.place.findUnique({ where: { id: existingSource.placeId } })
      if (place) {
        logger.info({ jobId }, 'URL cache hit — skipped pipeline')
        return { placeData: { placeId: place.id, name: place.name, city: place.city, state: place.state, country: place.country, lat: place.lat, lng: place.lng, thumbnailUrl: place.thumbnailUrl, category: place.category, confidence: place.aiConfidence ?? 1, sourceUrl: url } }
      }
    }

    // ── Parallel: start metadata fetch AND audio download simultaneously ──
    const metaPromise = fetchMetadataOnly(url, jobId)
    const audioHandle = startAudioDownload(url, jobId)

    let caption = '', thumbnailUrl = ''
    let extraction: LocationExtraction

    // Metadata arrives fast (~1–2s)
    ;({ caption, thumbnailUrl } = await metaPromise)
    logger.info({ jobId, captionLen: caption.length }, 'Metadata fetched')

    // Try caption-only extraction first
    const captionResult = await extractLocation(caption, '')

    if (captionResult.name && captionResult.confidence >= 0.70) {
      // Fast path: caption was clear enough, abort audio download
      audioHandle.abort()
      audioHandle.promise.catch(() => {}) // suppress abort error
      extraction = captionResult
      logger.info({ jobId, confidence: captionResult.confidence, name: captionResult.name, city: captionResult.city, state: captionResult.state }, 'Caption-fast path')
    } else {
      // Slow path: audio was already downloading in background
      audioPath = await audioHandle.promise
      const transcript = await transcribeAudio(audioPath)
      extraction = await extractLocation(caption, transcript)
      logger.info({ jobId, confidence: extraction.confidence }, 'Audio fallback path')
    }

    // ── Low confidence → no place data, show fallback ────────────────────
    if (!extraction.name || extraction.confidence < 0.6) {
      logger.info({ jobId, confidence: extraction.confidence }, 'Low confidence — returning null')
      return { placeData: null }
    }

    // ── Geocode ───────────────────────────────────────────────────────────
    const geo = await geocode(extraction.name, extraction.city, extraction.state)
    if (!geo) {
      logger.info({ jobId }, 'Geocoding failed — returning null')
      return { placeData: null }
    }

    // ── Level 2: name+city+state dedup (different reel, same place) ───────
    let place = await prisma.place.findFirst({
      where: {
        name: { equals: extraction.name, mode: 'insensitive' },
        city: { equals: extraction.city, mode: 'insensitive' },
        state: { equals: extraction.state, mode: 'insensitive' },
      },
    })

    if (place) {
      await prisma.placeSource.create({ data: { url, placeId: place.id } })
      logger.info({ jobId, placeId: place.id }, 'Name+city+state cache hit')
    } else {
      place = await prisma.place.create({
        data: {
          name: extraction.name,
          city: extraction.city,
          state: extraction.state,
          country: extraction.country || 'India',
          lat: parseFloat(geo.lat),
          lng: parseFloat(geo.lon),
          thumbnailUrl: thumbnailUrl || null,
          aiConfidence: extraction.confidence,
          category: extraction.category as Category,
          sources: { create: { url } },
        },
      })
      logger.info({ jobId, placeId: place.id }, 'New Place created')
    }

    logger.info({ jobId, placeId: place.id }, 'Returning place data for user confirmation')
    return {
      placeData: {
        placeId: place.id,
        name: place.name,
        city: place.city,
        state: place.state,
        country: place.country,
        lat: place.lat,
        lng: place.lng,
        thumbnailUrl: thumbnailUrl || place.thumbnailUrl || null,
        category: place.category,
        confidence: extraction.confidence,
        sourceUrl: url,
      },
    }
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      try { fs.unlinkSync(audioPath) } catch {}
    }
  }
}

// ─── Worker export ────────────────────────────────────────────────────────────

export function startReelParserWorker(): Worker<ReelParseJob> {
  const worker = new Worker<ReelParseJob, JobResult>('reel-parsing', processJob, {
    connection: { url: config.redisUrl },
    concurrency: 3,
  })

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Job completed'))
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'))

  return worker
}
