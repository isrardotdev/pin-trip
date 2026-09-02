// Standalone script — deliberately does NOT import `config.ts` or `db.ts`,
// since those require DATABASE_URL/JWT_SECRET/REDIS_URL etc. that this check
// has no need for. Run via GitHub Actions cron (see .github/workflows/healthcheck.yml)
// so we find out about upstream breakage (model deprecations, Instagram
// extractor breakage, geocoder/tiles outages) before a user does.
//
// Run locally: pnpm --filter backend healthcheck

import 'dotenv/config'
import axios from 'axios'
import { spawn } from 'child_process'

interface CheckResult {
  name: string
  ok: boolean
  detail: string
}

const results: CheckResult[] = []

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name} — ${detail}`)
}

// ─── Groq: verify every model we depend on is still listed ──────────────────
const REQUIRED_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'whisper-large-v3-turbo',
  'whisper-large-v3',
]

async function checkGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return record('Groq models', false, 'GROQ_API_KEY not set')

  try {
    const res = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 15_000,
    })
    const available = new Set((res.data.data as { id: string }[]).map((m) => m.id))
    const missing = REQUIRED_GROQ_MODELS.filter((m) => !available.has(m))
    if (missing.length > 0) {
      record('Groq models', false, `Missing/deprecated: ${missing.join(', ')}`)
    } else {
      record('Groq models', true, `All ${REQUIRED_GROQ_MODELS.length} required models available`)
    }
  } catch (err) {
    record('Groq models', false, `Request failed: ${errMsg(err)}`)
  }
}

// ─── Gemini: verify the planner model is still listed ────────────────────────
const REQUIRED_GEMINI_MODEL = 'models/gemini-flash-latest'

async function checkGemini() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return record('Gemini planner model', false, 'GEMINI_API_KEY not set')

  try {
    const res = await axios.get('https://generativelanguage.googleapis.com/v1beta/models', {
      params: { key: apiKey },
      timeout: 15_000,
    })
    const available = new Set((res.data.models as { name: string }[]).map((m) => m.name))
    if (available.has(REQUIRED_GEMINI_MODEL)) {
      record('Gemini planner model', true, `${REQUIRED_GEMINI_MODEL} available`)
    } else {
      record('Gemini planner model', false, `${REQUIRED_GEMINI_MODEL} not in models list`)
    }
  } catch (err) {
    record('Gemini planner model', false, `Request failed: ${errMsg(err)}`)
  }
}

// ─── Nominatim: geocoding still reachable and returning results ─────────────
async function checkNominatim() {
  const userAgent = process.env.NOMINATIM_USER_AGENT || 'WanderPin-HealthCheck/1.0'
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: 'Taj Mahal, Agra, India', format: 'json', limit: 1 },
      headers: { 'User-Agent': userAgent },
      timeout: 15_000,
    })
    if (Array.isArray(res.data) && res.data.length > 0) {
      record('Nominatim geocoding', true, 'Returned a result for known-good query')
    } else {
      record('Nominatim geocoding', false, 'Returned zero results for known-good query')
    }
  } catch (err) {
    record('Nominatim geocoding', false, `Request failed: ${errMsg(err)}`)
  }
}

// ─── MapTiler: style URL still resolves ──────────────────────────────────────
async function checkMaptiler() {
  const apiKey = process.env.MAPTILER_API_KEY
  if (!apiKey) return record('MapTiler tiles', false, 'MAPTILER_API_KEY not set (skipped check has no signal)')

  try {
    const res = await axios.get(`https://api.maptiler.com/maps/outdoor-v4/style.json`, {
      params: { key: apiKey },
      timeout: 15_000,
    })
    if (res.data?.sources) {
      record('MapTiler tiles', true, 'outdoor-v4 style resolved')
    } else {
      record('MapTiler tiles', false, 'Style response missing sources')
    }
  } catch (err) {
    record('MapTiler tiles', false, `Request failed: ${errMsg(err)}`)
  }
}

// ─── yt-dlp: binary present AND can still extract from Instagram ────────────
// Uses a durable public reel (a large official account) as a smoke test.
// If this specific reel is ever deleted, swap it for another durable one —
// a 404/"not available" here is ambiguous (deleted vs extractor broken),
// but anything mentioning yt_dlp internals/tracebacks is an unambiguous signal.
const SMOKE_TEST_REEL = 'https://www.instagram.com/reel/C6H1mCJIziF/'

function runYtDlp(args: string[], timeoutMs: number): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const ytdlpPath = process.env.YTDLP_PATH || 'yt-dlp'
    const proc = spawn(ytdlpPath, args)
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => proc.kill('SIGKILL'), timeoutMs)
    proc.stdout.on('data', (d) => (stdout += d.toString()))
    proc.stderr.on('data', (d) => (stderr += d.toString()))
    proc.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
    proc.on('error', () => {
      clearTimeout(timer)
      resolve({ code: -1, stdout, stderr: 'yt-dlp binary not found or failed to spawn' })
    })
  })
}

async function checkYtDlp() {
  const { code, stdout, stderr } = await runYtDlp(
    ['--skip-download', '--print', '%(id)s', '--no-playlist', '--quiet', SMOKE_TEST_REEL],
    30_000,
  )
  if (code === 0 && stdout.trim().length > 0) {
    record('yt-dlp Instagram extraction', true, 'Extracted metadata successfully')
  } else {
    record('yt-dlp Instagram extraction', false, `exit ${code}: ${stderr.slice(0, 500) || 'no output'}`)
  }
}

function errMsg(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return `HTTP ${err.response?.status ?? '?'} ${JSON.stringify(err.response?.data ?? err.message).slice(0, 300)}`
  }
  return err instanceof Error ? err.message : String(err)
}

async function notifyDiscord(summary: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  // Only page Discord from the real scheduled run in CI. Local runs (e.g. a
  // laptop without yt-dlp installed, or a .env with a placeholder API key)
  // fail for reasons that don't reflect production — don't cry wolf.
  if (process.env.GITHUB_ACTIONS !== 'true') {
    console.log('\n(Discord alert suppressed — not running in GitHub Actions)')
    return
  }

  try {
    await axios.post(webhookUrl, {
      embeds: [
        {
          title: '🚨 WanderPin — Dependency Health Check Failed',
          description: `\`\`\`\n${summary}\n\`\`\``,
          color: 0xc0392b,
          timestamp: new Date().toISOString(),
        },
      ],
    })
  } catch {
    // Never let a failed Discord notification crash the check
  }
}

async function main() {
  await Promise.all([checkGroq(), checkGemini(), checkNominatim(), checkMaptiler(), checkYtDlp()])

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)

  if (failed.length > 0) {
    const summary = failed.map((r) => `${r.name}: ${r.detail}`).join('\n')
    await notifyDiscord(summary)
    process.exitCode = 1
  }
}

main()
