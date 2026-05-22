import { Router, Response } from 'express'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../db'
import { config } from '../config'
import { authenticate, AuthRequest } from '../middleware/auth'
import { logger } from '../logger'

export const planRouter = Router()

planRouter.use(authenticate)

const planSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })
    )
    .default([]),
})

const genAI = new GoogleGenerativeAI(config.geminiApiKey)

planRouter.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = planSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const { message, conversationHistory } = parsed.data

  const pins = await prisma.pin.findMany({
    where: { userId: req.userId },
    select: {
      id: true, name: true, city: true, state: true, country: true,
      lat: true, lng: true, status: true, category: true, notes: true,
      sourceThumbnailUrl: true,
    },
  })

  const systemPrompt = `You are PinTrip's travel planning assistant for Indian travelers.
You help users build trip itineraries using ONLY the places they have personally saved.

The user's saved pins are provided below. Do not suggest places outside this list unless the user explicitly asks. Keep recommendations grounded, practical, and specific to India.

When building itineraries:
- Group pins that are geographically close on the same day
- Factor in realistic Indian travel times (train, bus, drive)
- Mention which days to allocate for travel vs exploration
- Keep tone warm and conversational — like advice from a well-traveled friend
- If the user asks about a region where they have NO pins, gently tell them and ask if they want general suggestions

Always respond in this JSON structure when creating an itinerary:
{
  "type": "itinerary",
  "summary": "...",
  "days": [
    {
      "day": 1,
      "title": "...",
      "pinIds": ["pin_id_1"],
      "description": "...",
      "travelNote": "..."
    }
  ]
}

For conversational replies (not itineraries), respond:
{ "type": "message", "content": "..." }

USER PINS:
${JSON.stringify(pins, null, 2)}

CONVERSATION HISTORY:
${JSON.stringify(conversationHistory, null, 2)}`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent([systemPrompt, `USER MESSAGE: ${message}`])
    const text = result.response.text()

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.json({ success: true, data: { type: 'message', content: text } })
      return
    }

    const parsed = JSON.parse(jsonMatch[0])
    res.json({ success: true, data: parsed })
  } catch (err) {
    logger.error({ err }, 'Gemini API error')
    res.status(500).json({ success: false, error: 'AI planner temporarily unavailable' })
  }
})
