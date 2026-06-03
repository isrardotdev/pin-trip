import { Router, Response } from 'express'
import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../db'
import { config } from '../config'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requirePlannerAccess } from '../middleware/requirePlannerAccess'
import { logger } from '../logger'
import type { TripDocument, ChatMessage } from '@wanderpin/shared'

export const planRouter = Router()
planRouter.use(authenticate)

const genAI = new GoogleGenerativeAI(config.geminiApiKey)
const MESSAGE_CAP = 20

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  confirmedReset: z.boolean().default(false),
})

const saveTripSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

// ── Helpers ────────────────────────────────────────────────────────────────

function extractDestination(text: string): string {
  // Simple heuristic — take the longest proper noun sequence
  // Good enough for conflict detection without an LLM call
  const patterns = [
    /(?:trip to|visit|plan|going to|travel to)\s+([A-Z][a-zA-Z\s,]+?)(?:\s+trip|\s+travel|\s*$|\s*[.,!?])/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1] && m[1].trim().length > 2) return m[1].trim()
  }
  return ''
}

function destinationsConflict(current: string, incoming: string): boolean {
  if (!current || !incoming) return false
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  const c = normalize(current)
  const i = normalize(incoming)
  // If the incoming destination shares no words with current → conflict
  const currentWords = new Set(c.split(/\s+/).filter(w => w.length > 3))
  const incomingWords = i.split(/\s+/).filter(w => w.length > 3)
  return incomingWords.length > 0 && !incomingWords.some(w => currentWords.has(w))
}

function buildSystemPrompt(
  pins: object[],
  discoverPlaces: object[],
  hasPins: boolean,
  tripDocument: TripDocument | null,
): string {
  const pinSection = hasPins
    ? `USER'S SAVED PINS (use these as fixed anchor points):
${JSON.stringify(pins, null, 2)}`
    : `The user has no saved pins yet. Use the curated places below as context.`

  const discoverSection = !hasPins || pins.length < 3
    ? `CURATED PLACES (use to fill gaps or when user has no pins):
${JSON.stringify(discoverPlaces.slice(0, 15), null, 2)}`
    : ''

  const documentSection = tripDocument
    ? `CURRENT TRIP DOCUMENT (modify this based on user's instruction):
${JSON.stringify(tripDocument, null, 2)}`
    : 'No active trip document yet.'

  return `You are WanderPin's travel planning assistant for Indian travelers.
You help users build trip itineraries, primarily using their saved pins as anchor points.

${pinSection}

${discoverSection}

${documentSection}

RULES:
- Pinned items are places the user has personally saved — always include them when relevant
- Fill gaps (stay, transport, activities) using your own knowledge of Indian travel
- Distinguish pin items from suggested items clearly in the response
- Factor in realistic Indian travel times (bus, train, drive)
- Keep tone warm and conversational — like a well-traveled friend
- For new users with no pins, still gather preferences before creating a plan

GATHERING PREFERENCES (critical flow for new trips):
When a user asks for a new trip AND there is NO existing trip document:
- DO NOT create an itinerary immediately
- Respond with type "question" (NOT "message") to collect key preferences first
- Ask ONE focused question with 2–4 short options relevant to that destination and trip type
- Cover: travel style, key interest (nature/food/adventure/culture), accommodation vibe
- After 2–3 questions, set readyToPlan: true on the final question
- When the user sends "Create my itinerary now" (triggered by the Plan now button), use ALL gathered context to build a rich, personalised itinerary
- IMPORTANT: If you would ask a follow-up question about trip style, preferences or logistics → always use "question" type, never "message" type

RESPONSE FORMAT — always return valid JSON, one of these four shapes:

1. Preference question (use when no document exists and you need more context):
{
  "type": "question",
  "content": "Kerala has so much to offer — what draws you most?",
  "options": ["Backwaters & beaches", "Hill stations & tea gardens", "Wildlife & forests", "Temples & culture"],
  "readyToPlan": false
}

When you have enough context (after 2–3 questions), set readyToPlan: true:
{
  "type": "question",
  "content": "Almost there! How do you prefer to stay?",
  "options": ["Budget hostels & guesthouses", "Mid-range with character", "Comfortable & well-equipped"],
  "readyToPlan": true
}

2. New itinerary (only when user sends "Create my itinerary now" after preference gathering, or when modifying an existing document):
{
  "type": "itinerary_new",
  "title": "5 Days in Dharamshala",
  "destination": "Dharamshala, Himachal Pradesh",
  "document": {
    "type": "itinerary",
    "summary": "...",
    "destination": "Dharamshala, Himachal Pradesh",
    "days": [
      {
        "day": 1,
        "title": "Arrive in Dharamshala",
        "description": "...",
        "travelNote": "Overnight bus from Delhi or fly to Gaggal",
        "items": [
          {
            "type": "pin",
            "pinId": "actual_pin_id_here",
            "name": "Nick's Italian Kitchen",
            "category": "FOOD",
            "description": "Your saved restaurant in McLeod Ganj"
          },
          {
            "type": "suggestion",
            "name": "Zostel Dharamshala",
            "category": "STAY",
            "description": "Popular hostel in McLeod Ganj, central location",
            "lat": 32.2396,
            "lng": 76.3219,
            "isAddable": true
          }
        ]
      }
    ]
  }
}

3. Update existing itinerary (user asked to modify the current plan):
{
  "type": "itinerary_update",
  "document": { ...full updated document... }
}

4. Conversational reply (question, clarification, not a plan change):
{
  "type": "message",
  "content": "October is perfect for Dharamshala — post-monsoon, crisp air, ideal for Triund trek.",
  "suggestions": ["What should I pack?", "Best treks nearby?", "How to get there from Delhi?"]
}

SUGGESTIONS RULE (critical):
- ALWAYS include a "suggestions" array in EVERY response (message, question, itinerary_new, itinerary_update)
- 2–3 short phrases (under 8 words each) the user is likely to say next
- Make them specific to the context — not generic
- For "question" type: include both "options" (structured preference chips) AND "suggestions" (free-text follow-ups)
- For itinerary responses: suggest modifications like "Add a rest day", "Replace Day 3 stay", "Make it budget-friendly"

Only use "question" when gathering preferences for a new trip (no existing document).
Only use "itinerary_new" when triggered by "Create my itinerary now" or building a fresh plan with full context.
Only use "itinerary_update" when modifying the current trip document.
Use "message" for all other conversational exchanges.`
}

// ── GET /plan/conversation — fetch current conversation ───────────────────

planRouter.get('/conversation', async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'GET /plan/conversation')
  try {
    const conv = await prisma.conversation.findUnique({
      where: { userId: req.userId },
    })
    logger.debug({ userId: req.userId, hasDocument: !!conv?.tripDocument, messageCount: (conv?.messages as unknown[])?.length ?? 0 }, 'Conversation fetched')
    res.json({
      success: true,
      data: {
        tripDocument: conv?.tripDocument ?? null,
        destination: conv?.destination ?? null,
        messages: conv?.messages ?? [],
      },
    })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Failed to fetch conversation')
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' })
  }
})

// ── POST /plan — send a message ───────────────────────────────────────────

planRouter.post('/', requirePlannerAccess, async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'POST /plan')
  const parsed = sendMessageSchema.safeParse(req.body)
  if (!parsed.success) {
    logger.warn({ userId: req.userId, errors: parsed.error.errors }, 'Plan message validation failed')
    res.status(400).json({ success: false, error: 'Invalid request body', code: 'VALIDATION_ERROR' })
    return
  }

  const { message, confirmedReset } = parsed.data

  // Get or create conversation
  let conv = await prisma.conversation.findUnique({ where: { userId: req.userId } })
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { userId: req.userId!, messages: [], tripDocument: undefined, destination: null },
    })
  }

  const currentDoc = conv.tripDocument as unknown as TripDocument | null

  // Conflict detection — only when there's an active document and user hasn't confirmed reset
  if (currentDoc && !confirmedReset) {
    const incoming = extractDestination(message)
    if (incoming && destinationsConflict(conv.destination ?? '', incoming)) {
      res.json({
        success: true,
        data: {
          type: 'conflict',
          currentDestination: conv.destination,
          newDestination: incoming,
        },
      })
      return
    }
  }

  // If confirmed reset — clear document and messages
  if (confirmedReset && currentDoc) {
    conv = await prisma.conversation.update({
      where: { userId: req.userId },
      data: { tripDocument: undefined, destination: null, messages: [] },
    })
  }

  // Fetch user's pins (lean fields only)
  const pins = await prisma.pin.findMany({
    where: { userId: req.userId },
    select: { id: true, name: true, city: true, state: true, lat: true, lng: true, category: true, status: true, notes: true, sourceThumbnailUrl: true },
  })

  // Fetch discover places as fallback context when pins are sparse
  const discoverPlaces = pins.length < 5
    ? await prisma.discoverPlace.findMany({ where: { isActive: true }, select: { name: true, city: true, state: true, lat: true, lng: true, category: true, description: true, tags: true }, take: 15 })
    : []

  const currentMessages = conv.messages as unknown as ChatMessage[]
  const recentMessages = currentMessages.slice(-MESSAGE_CAP)

  const systemPrompt = buildSystemPrompt(pins, discoverPlaces, pins.length > 0, currentDoc)

  const historyContext = recentMessages.length > 0
    ? `\n\nRECENT CONVERSATION:\n${recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}`
    : ''

  logger.info({ userId: req.userId, pinCount: pins.length, hasDocument: !!currentDoc, message: message.slice(0, 80) }, 'Calling Gemini')

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const result = await model.generateContent([
      systemPrompt + historyContext,
      `USER: ${message}`,
    ])
    const text = result.response.text()

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.error({ userId: req.userId, rawText: text.slice(0, 200) }, 'Gemini returned no JSON')
      throw new Error('No JSON in Gemini response')
    }
    const aiResponse = JSON.parse(jsonMatch[0]) as { type: string; document?: TripDocument; title?: string; destination?: string; content?: string; options?: string[]; readyToPlan?: boolean; suggestions?: string[] }
    logger.info({ userId: req.userId, responseType: aiResponse.type }, 'Gemini response parsed')

    // Build new messages array (capped at MESSAGE_CAP)
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date().toISOString() }

    let assistantContent: string
    if (aiResponse.type === 'question') {
      assistantContent = aiResponse.content ?? ''
    } else if (aiResponse.type === 'message') {
      assistantContent = aiResponse.content ?? ''
    } else {
      assistantContent = `Your ${aiResponse.destination ?? aiResponse.document?.destination ?? 'trip'} itinerary is ready! Tap the banner above to explore it ↑`
    }

    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
      ...(aiResponse.type === 'question' && {
        questionOptions: aiResponse.options,
        readyToPlan: aiResponse.readyToPlan,
      }),
      ...(aiResponse.suggestions?.length && { suggestions: aiResponse.suggestions }),
    }
    const updatedMessages = [...recentMessages, userMsg, assistantMsg].slice(-MESSAGE_CAP)

    // Update conversation based on response type
    const updateData: Record<string, unknown> = { messages: updatedMessages }
    if (aiResponse.type === 'itinerary_new' || aiResponse.type === 'itinerary_update') {
      updateData.tripDocument = aiResponse.document
      updateData.destination = aiResponse.destination ?? aiResponse.document?.destination ?? conv.destination
    }

    await prisma.conversation.update({
      where: { userId: req.userId },
      data: updateData,
    })

    // Charge the message for FREE users only (after confirmed success)
    await prisma.user.updateMany({
      where: { id: req.userId, plan: 'FREE' },
      data: { aiMessagesUsed: { increment: 1 } },
    })

    logger.info({ userId: req.userId, responseType: aiResponse.type }, 'Plan message handled successfully')
    res.json({ success: true, data: aiResponse })
  } catch (err: any) {
    logger.error({ err, userId: req.userId, status: err?.status }, 'Gemini API error')
    if (err?.status === 429) {
      res.status(503).json({ success: false, error: 'AI planner is busy right now. Please try again in a moment.', code: 'PLANNER_RATE_LIMITED' })
      return
    }
    res.status(500).json({ success: false, error: 'AI planner temporarily unavailable' })
  }
})

// ── POST /plan/save — save current itinerary ──────────────────────────────

planRouter.post('/save', async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'POST /plan/save')
  const parsed = saveTripSchema.safeParse(req.body)

  try {
    const conv = await prisma.conversation.findUnique({ where: { userId: req.userId } })
    if (!conv?.tripDocument) {
      logger.warn({ userId: req.userId }, 'Save itinerary: no active document')
      res.status(400).json({ success: false, error: 'No active itinerary to save', code: 'NO_DOCUMENT' })
      return
    }

    const doc = conv.tripDocument as unknown as TripDocument
    const title = parsed.data?.title ?? `${doc.days.length} Days in ${conv.destination ?? doc.destination}`

    const saved = await prisma.savedItinerary.create({
      data: {
        userId: req.userId!,
        title,
        destination: conv.destination ?? doc.destination,
        document: conv.tripDocument as object,
        messages: { set: conv.messages.filter(m => m !== null) as object[] },
      },
    })
    logger.info({ userId: req.userId, itineraryId: saved.id, title }, 'Itinerary saved')
    res.json({ success: true, data: saved })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Failed to save itinerary')
    res.status(500).json({ success: false, error: 'Failed to save itinerary' })
  }
})

// ── GET /plan/saved — list saved itineraries ──────────────────────────────

planRouter.get('/saved', async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'GET /plan/saved')
  try {
    const saved = await prisma.savedItinerary.findMany({
      where: { userId: req.userId },
      select: { id: true, title: true, destination: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    logger.debug({ userId: req.userId, count: saved.length }, 'Saved itineraries fetched')
    res.json({ success: true, data: saved })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Failed to fetch saved itineraries')
    res.status(500).json({ success: false, error: 'Failed to fetch saved itineraries' })
  }
})

// ── GET /plan/saved/:id — get a saved itinerary ───────────────────────────

planRouter.get('/saved/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  logger.debug({ userId: req.userId, itineraryId: id }, 'GET /plan/saved/:id')
  try {
    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId: req.userId },
    })

    if (!itinerary) {
      logger.warn({ userId: req.userId, itineraryId: id }, 'Saved itinerary not found')
      res.status(404).json({ success: false, error: 'Itinerary not found' })
      return
    }

    res.json({ success: true, data: itinerary })
  } catch (err) {
    logger.error({ err, userId: req.userId, itineraryId: id }, 'Failed to fetch saved itinerary')
    res.status(500).json({ success: false, error: 'Failed to fetch itinerary' })
  }
})

// ── DELETE /plan/saved/:id — delete a saved itinerary ────────────────────

planRouter.delete('/saved/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  logger.debug({ userId: req.userId, itineraryId: id }, 'DELETE /plan/saved/:id')
  try {
    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId: req.userId },
    })

    if (!itinerary) {
      logger.warn({ userId: req.userId, itineraryId: id }, 'Saved itinerary not found for deletion')
      res.status(404).json({ success: false, error: 'Itinerary not found' })
      return
    }

    await prisma.savedItinerary.delete({ where: { id } })
    logger.info({ userId: req.userId, itineraryId: id }, 'Saved itinerary deleted')
    res.json({ success: true, data: null })
  } catch (err) {
    logger.error({ err, userId: req.userId, itineraryId: id }, 'Failed to delete saved itinerary')
    res.status(500).json({ success: false, error: 'Failed to delete itinerary' })
  }
})

// ── POST /plan/load/:id — load saved itinerary into active conversation ───

planRouter.post('/load/:id', async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  logger.debug({ userId: req.userId, itineraryId: id }, 'POST /plan/load/:id')
  try {
    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId: req.userId },
    })

    if (!itinerary) {
      logger.warn({ userId: req.userId, itineraryId: id }, 'Saved itinerary not found for load')
      res.status(404).json({ success: false, error: 'Itinerary not found' })
      return
    }

    const doc = itinerary.document as unknown as TripDocument

    await prisma.conversation.upsert({
      where: { userId: req.userId },
      create: {
        userId: req.userId!,
        tripDocument: itinerary.document ?? undefined,
        destination: itinerary.destination,
        messages: [],
      },
      update: {
        tripDocument: itinerary.document ?? undefined,
        destination: itinerary.destination,
        messages: [],
      },
    })

    logger.info({ userId: req.userId, itineraryId: id, destination: itinerary.destination }, 'Saved itinerary loaded into active conversation')
    res.json({ success: true, data: { tripDocument: doc, destination: itinerary.destination, messages: [] } })
  } catch (err) {
    logger.error({ err, userId: req.userId, itineraryId: id }, 'Failed to load saved itinerary')
    res.status(500).json({ success: false, error: 'Failed to load itinerary' })
  }
})

// ── POST /plan/reset — clear active conversation ──────────────────────────

planRouter.post('/reset', async (req: AuthRequest, res: Response) => {
  logger.debug({ userId: req.userId }, 'POST /plan/reset')
  try {
    await prisma.conversation.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId!, messages: [], tripDocument: undefined, destination: null },
      update: { tripDocument: undefined, destination: null, messages: [] },
    })
    logger.info({ userId: req.userId }, 'Conversation reset')
    res.json({ success: true, data: null })
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Failed to reset conversation')
    res.status(500).json({ success: false, error: 'Failed to reset conversation' })
  }
})
