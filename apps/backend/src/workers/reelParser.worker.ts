import { Worker, Job } from 'bullmq'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import Groq from 'groq-sdk'
import { Category } from '@wanderpin/shared'
import { config } from '../config'
import { prisma } from '../db'
import { logger } from '../logger'
import { notifyDiscord } from '../lib/discord'
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
    proc.on('error', (err) => reject(new Error(`yt-dlp spawn error: ${err.message}`)))
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
    proc.on('error', (err) => reject(new Error(`yt-dlp spawn error: ${err.message}`)))
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
  osm_type: string   // "node" | "way" | "relation"
  osm_id: number
  class: string      // "boundary" | "natural" | "amenity" | "place" etc.
  type: string       // "administrative" | "valley" | "restaurant" etc.
  extratags?: { admin_level?: string }
  address?: { country?: string; country_code?: string }
}

type LocationType = 'POINT' | 'AREA'

interface ClassifyResult {
  locationType: LocationType
  blocked: boolean
  blockReason?: string
}

function classifyNominatimResult(result: NominatimResult): ClassifyResult {
  const adminLevel = parseInt(result.extratags?.admin_level ?? '99', 10)

  // Block countries and states (admin_level ≤ 4 for India)
  if (result.class === 'boundary' && result.type === 'administrative' && adminLevel <= 4) {
    const label = adminLevel <= 2 ? 'country' : 'state'
    return { locationType: 'AREA', blocked: true, blockReason: `Too broad — this is an entire ${label}` }
  }

  // Areas: geographic features and administrative subdivisions below state
  if (result.osm_type === 'relation' || result.osm_type === 'way') {
    return { locationType: 'AREA', blocked: false }
  }

  // Everything else (nodes: temples, cafes, hotels, etc.) → point
  return { locationType: 'POINT', blocked: false }
}

async function geocodeQuery(query: string): Promise<NominatimResult | null> {
  const response = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    params: { q: query, format: 'json', limit: 1, extratags: 1, addressdetails: 1 },
    headers: { 'User-Agent': config.nominatimUserAgent },
  })
  return response.data[0] || null
}

interface GeocodeResult {
  nominatim: NominatimResult
  locationType: LocationType
  blocked: boolean
  blockReason?: string
}

async function geocode(name: string, city: string, state: string, country: string): Promise<GeocodeResult | null> {
  // Always keep country context in fallbacks to avoid matching same-named places in wrong countries.
  const queries = [
    [name, city, state],
    [name, city, country],
    [name, country],
    [city, state],
  ]
    .map(parts => parts.filter(Boolean).join(', '))
    .filter(Boolean)
    .filter((q, i, arr) => arr.indexOf(q) === i) // dedupe

  for (const query of queries) {
    logger.info({ query }, 'Geocoding')
    const result = await geocodeQuery(query)
    if (result) {
      logger.info({ query, display_name: result.display_name, osm_type: result.osm_type, osm_id: result.osm_id }, 'Geocode result')
      const classification = classifyNominatimResult(result)
      return { nominatim: result, ...classification }
    }
  }

  logger.info({ name, city, state }, 'Geocode: all queries returned no results')
  return null
}

function computeGeoMatch(nominatim: NominatimResult, extractedCountry: string): { score: number; mismatchNote: string | null } {
  const geocodedCountry = nominatim.address?.country ?? ''
  const geocodedCode = nominatim.address?.country_code?.toLowerCase() ?? ''

  if (!geocodedCountry) return { score: 0.5, mismatchNote: null }

  const extracted = extractedCountry.toLowerCase().trim()

  // Build a small alias map for common cases
  const matches = [
    geocodedCountry.toLowerCase().includes(extracted),
    extracted.includes(geocodedCountry.toLowerCase()),
    // country code shortcuts: "india" → "in", "uae" → "ae"
    (extracted === 'india' && geocodedCode === 'in'),
    (extracted === 'uae' && geocodedCode === 'ae'),
    (extracted === 'usa' && geocodedCode === 'us'),
    (extracted === 'uk' && geocodedCode === 'gb'),
  ]

  if (matches.some(Boolean)) return { score: 1.0, mismatchNote: null }

  const note = `The reel mentions ${extractedCountry} but the closest match we found is in ${geocodedCountry}. It may be a different location.`
  return { score: 0.0, mismatchNote: note }
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
  osmType?: string | null
  osmId?: string | null   // BigInt serialised as string for JSON safety
  locationType?: string | null
  geoMatchScore: number         // 1.0 = country matches, 0.0 = mismatch, 0.5 = unknown
  geoMismatchNote: string | null  // human-readable warning when score < 1.0
  mapsSearchQuery: string       // pre-built query for Maps deep link
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
        return { placeData: { placeId: place.id, name: place.name, city: place.city, state: place.state, country: place.country, lat: place.lat, lng: place.lng, thumbnailUrl: place.thumbnailUrl, category: place.category, confidence: place.aiConfidence ?? 1, sourceUrl: url, osmType: place.osmType, osmId: place.osmId?.toString() ?? null, locationType: place.locationType, geoMatchScore: 1, geoMismatchNote: null, mapsSearchQuery: [place.name, place.city, place.state, place.country].filter(Boolean).join(', ') } }
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
    const geoResult = await geocode(extraction.name, extraction.city, extraction.state, extraction.country)
    if (!geoResult) {
      logger.info({ jobId }, 'Geocoding failed — returning null')
      return { placeData: null }
    }

    if (geoResult.blocked) {
      logger.info({ jobId, blockReason: geoResult.blockReason }, 'Geocode blocked — location too broad')
      return { placeData: null }
    }

    const { nominatim: geo, locationType } = geoResult
    const osmType = geo.osm_type
    const osmId = BigInt(geo.osm_id)
    const { score: geoMatchScore, mismatchNote: geoMismatchNote } = computeGeoMatch(geo, extraction.country)
    const mapsSearchQuery = [extraction.name, extraction.city, extraction.state, extraction.country].filter(Boolean).join(', ')

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
          osmType,
          osmId,
          locationType,
          sources: { create: { url } },
        },
      })
      logger.info({ jobId, placeId: place.id, locationType }, 'New Place created')
    }

    logger.info({ jobId, placeId: place.id, geoMatchScore }, 'Returning place data for user confirmation')
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
        osmType: place.osmType,
        osmId: place.osmId?.toString() ?? null,
        locationType: place.locationType,
        geoMatchScore,
        geoMismatchNote,
        mapsSearchQuery,
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
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Job failed')
    notifyDiscord(
      'Reel Parse Job Failed',
      `URL: ${job?.data.url ?? 'unknown'}\nUser: ${job?.data.userId ?? 'unknown'}\nError: ${err.message}`,
      'warn',
    )
  })

  return worker
}
