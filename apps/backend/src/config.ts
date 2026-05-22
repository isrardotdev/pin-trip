import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('30d'),
  GROQ_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  NOMINATIM_USER_AGENT: z.string().default('PinTrip/1.0'),
  MAPTILER_API_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  YTDLP_PATH: z.string().default('/usr/local/bin/yt-dlp'),
  TEMP_DIR: z.string().default('/tmp/pintrip'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:8081,http://localhost:3000'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  groqApiKey: parsed.data.GROQ_API_KEY,
  geminiApiKey: parsed.data.GEMINI_API_KEY,
  nominatimUserAgent: parsed.data.NOMINATIM_USER_AGENT,
  maptilerApiKey: parsed.data.MAPTILER_API_KEY,
  expoAccessToken: parsed.data.EXPO_ACCESS_TOKEN,
  ytdlpPath: parsed.data.YTDLP_PATH,
  tempDir: parsed.data.TEMP_DIR,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(','),
}
