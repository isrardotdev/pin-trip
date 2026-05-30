# PinTrip — Claude Code Build Instructions

> You are building PinTrip, a mobile-first travel pinning app. Read this entire file before writing a single line of code. Follow every decision here exactly. Do not improvise tech choices — if something is unclear, refer back to this document.

---

## 0. What Is PinTrip?

PinTrip lets travel enthusiasts save places they discover on Instagram Reels (and other social content) with a single share tap. Each saved place becomes a **pin** on a personal world map. When the user is ready to travel, they chat with an AI agent that builds a day-by-day itinerary using **only their saved pins** — not generic tourist recommendations.

**The core loop:**
1. User sees a travel reel on Instagram
2. Taps Share → selects PinTrip from the share sheet
3. App extracts the location from the reel (audio + caption)
4. A pin drops on the user's personal map
5. Later: user chats with AI → gets a personalized itinerary from their pins

---

## 1. Monorepo Structure

```
pintrip/
├── CLAUDE.md                  ← this file
├── .env.example               ← root env (shared secrets reference)
├── package.json               ← root workspace config (pnpm workspaces)
├── pnpm-workspace.yaml
│
├── apps/
│   ├── mobile/                ← React Native + Expo (main app)
│   │   ├── .env.example
│   │   └── ...
│   │
│   ├── backend/               ← Node.js + Express API
│   │   ├── .env.example
│   │   └── ...
│   │
│   └── web/                   ← Next.js landing page
│       ├── .env.example
│       └── ...
│
└── packages/
    └── shared/                ← shared TypeScript types (Pin, User, etc.)
        └── src/
            └── types.ts
```

Use **pnpm workspaces**. All three apps live under `apps/`. Shared TypeScript types live in `packages/shared` and are imported by both mobile and backend.

---

## 2. Tech Stack — Exact Decisions

### Mobile (`apps/mobile`)
| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo SDK 52 | Familiar stack, EAS Build support |
| Language | TypeScript (strict mode) | Always |
| Navigation | Expo Router v3 | File-based routing, works well with tabs |
| State | Zustand | Lightweight, no boilerplate |
| Map | MapLibre React Native (`@maplibre/maplibre-react-native`) | Open source Mapbox fork, zero cost, identical API |
| Map Tiles | Maptiler free tier | Free 100k tiles/mo, beautiful styles |
| Animations | React Native Reanimated v3 + Moti | 60fps animations |
| Gestures | React Native Gesture Handler | Needed with Reanimated |
| Bottom Sheet | `@gorhom/bottom-sheet` | For pin detail sheets |
| Share Intent | `expo-share-intent` | iOS Share Extension + Android Intent via single hook |
| HTTP | Axios | Familiar |
| Forms | React Hook Form | Clean form handling |
| Icons | `@expo/vector-icons` (Ionicons set) | Built-in to Expo |
| Lottie | `lottie-react-native` | Pin drop animation |
| Notifications | `expo-notifications` | Push notifications when pin is ready |
| Auth Storage | `expo-secure-store` | Store JWT securely |

### Backend (`apps/backend`)
| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript | Familiar |
| Framework | Express 5 | Known quantity |
| ORM | Prisma | Type-safe, good DX |
| Database | PostgreSQL 16 | Structured geo data |
| Queue | BullMQ + Redis (ioredis) | Async reel processing pipeline |
| Auth | JWT (jsonwebtoken) + bcrypt | Simple, no external deps |
| Validation | Zod | Schema validation, pairs with Prisma |
| Media download | yt-dlp (CLI, spawned as child_process) | Extract audio from reel URLs |
| Transcription | Groq SDK (Whisper large-v3-turbo) | Free tier: 2k req/day, 9x cheaper than OpenAI |
| LLM (extraction) | Groq SDK (llama-3.3-70b-versatile) | Free tier, great for structured extraction |
| LLM (planner) | Google Generative AI SDK (gemini-2.0-flash) | Free tier: 15 RPM, 1M tokens/day |
| Geocoding | Nominatim (OSM) via HTTP | Completely free, no API key |
| File storage | Local disk during dev, Cloudflare R2 in prod | |

### Web Landing Page (`apps/web`)
| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Fonts | Google Fonts (Playfair Display + DM Sans) |
| Animations | Framer Motion |

---

## 3. Design System

### Philosophy
Inspired by **CRED** (premium dark feel, spring animations, generous spacing), **ixigo** (information density done right, utility-first), and **Not Boring Weather** (data as art — the map IS the hero). The aesthetic is **warm editorial** — feels like a beautiful travel journal, not a SaaS dashboard.

### Color Palette

```
Primary Background:   #F5F0E8  (warm parchment / soft beige)
Secondary Background: #EDE8DE  (slightly deeper beige, for cards)
Surface / Cards:      #FFFFFF  (pure white cards on beige bg)
Dark Surface:         #1C1C1A  (near-black, for contrast sections)
Dark Secondary:       #2A2A27  (slightly lighter dark, for dark cards)

Primary Text:         #1C1C1A  (near-black)
Secondary Text:       #6B6355  (warm muted brown)
Tertiary Text:        #A89F93  (light warm grey)

Accent Green:         #2D6A4F  (deep forest green — primary CTA)
Accent Green Light:   #52B788  (for tags, badges)
Accent Amber:         #C4862A  (warnings, planning status)
Accent Red:           #C0392B  (errors only)

Map Background:       #1C1C1A  (dark map on light app = beautiful contrast)
Pin Wishlist:         #F5F0E8  with #2D6A4F glow ring
Pin Planning:         #C4862A  pulsing
Pin Visited:          #2D6A4F  filled

Border Light:         #E0D9CC
Border Medium:        #C8BFB0

Success:              #52B788
Warning:              #C4862A
Error:                #C0392B
```

### Typography

```
Display / Headers:    Playfair Display (serif) — weights 400i, 700
Body / UI:            DM Sans — weights 300, 400, 500
Monospace:            IBM Plex Mono — for source tags, metadata
```

**Size scale:**
```
xs:   11px
sm:   13px
base: 15px
md:   17px
lg:   20px
xl:   24px
2xl:  30px
3xl:  38px
```

**Usage rules:**
- Place names, section headers → Playfair Display
- All UI text, buttons, labels → DM Sans
- Source URLs, technical tags, metadata → IBM Plex Mono
- Never use Inter, Roboto, or system fonts

### Spacing
Use an 8px base grid. All spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

### Border Radius
```
sm:   6px   (tags, badges)
md:   12px  (cards, inputs)
lg:   20px  (bottom sheets, modals)
full: 999px (pill buttons, avatar)
```

### Shadows
```
card:   0 2px 12px rgba(28,28,26,0.08)
sheet:  0 -4px 24px rgba(28,28,26,0.12)
pin:    0 4px 16px rgba(45,106,79,0.3)  (green glow for pins)
```

### Animation Principles
- All screen transitions: spring physics (Reanimated `withSpring`)
- Tab switches: 250ms ease
- Bottom sheet: spring with `damping: 15, stiffness: 120`
- Pin drop: Lottie animation (a dot falling and bouncing)
- Map collapse on scroll: driven by `useAnimatedScrollHandler`
- Button press: `withSpring` scale to 0.96, back to 1.0
- List items entrance: staggered `withDelay` fade+slide up, 50ms apart

---

## 4. Mobile App — Screen-by-Screen Spec

### Navigation Structure
```
(tabs)/
├── index.tsx          → Tab 1: Home (Map + List)
├── discover.tsx       → Tab 2: Discover
├── plan.tsx           → Tab 3: Plan (AI Chat)
└── profile.tsx        → Tab 4: Profile

(modals)/
├── pin-detail.tsx     → Bottom sheet — pin info
├── pin-confirm.tsx    → Shown after share intent — confirm/edit location
└── manual-add.tsx     → Manual pin search

(auth)/
├── welcome.tsx        → Onboarding / login
└── callback.tsx       → OAuth callback handler

handle-share.tsx       → Intercepts share intent, triggers pipeline
```

### Tab Bar Design
- Background: `#F5F0E8` (beige) with slight blur
- Active icon: `#2D6A4F` (forest green) + label
- Inactive: `#A89F93`
- Tab bar height: 84px (includes safe area)
- Icons: Ionicons — `map-outline`, `compass-outline`, `chatbubble-outline`, `person-outline`
- No border on top — use subtle shadow instead

---

### Screen 1: Home (Map + List)

**Layout:** Full screen. Map takes top ~55% of screen. Scrollable pin list below. As user scrolls the list up, the map smoothly collapses using Reanimated `useAnimatedScrollHandler` (like Apple Maps search).

**Map section:**
- MapLibre with dark Maptiler style (`MAPTILER_STYLE_URL` from env)
- Map fills the full phone width including under the status bar
- Custom pins — NOT the default MapLibre markers. Rendered via GeoJSONSource + Layer (GPU-accelerated, handles hundreds of pins)
- Pin shapes:
  - `locationType=POINT` (temple, café, hotel) → circle marker
  - `locationType=AREA` (valley, national park, district) → diamond / rotated-square marker
- Pin states (visual):
  - `WISHLIST`: white fill, green border
  - `PLANNING`: amber fill, pulsing ring (Reanimated)
  - `VISITED`: forest green fill, white checkmark glyph
- When AREA pin is selected: polygon boundary fetched on demand from Nominatim lookup API (osm_ids=R{osmId}), rendered as FillLayer (green, 12% opacity) + LineLayer (green, 2px). Camera fits to polygon bounds. Polygon cached in Zustand for the session.
- Cluster behavior: numbered cluster bubble (green circle, white number). Tap → zoom to expansion level + 0.5 overshoot.
- FAB (+) button: bottom-right of map, `#2D6A4F`, circular, shadow. Tap → open `manual-add` modal.

**List section:**
- Header: "Your Pins" (Playfair Display, 22px) + filter chips row
- Filter chips: All · Wishlist · Planning · Visited · (category filters)
- Each pin card:
  - Left: reel thumbnail (if from Instagram) OR category icon on beige circle
  - Title: place name (DM Sans 500, 15px)
  - Subtitle: city, state (DM Sans 300, 13px, warm muted)
  - Right: source badge (tiny "IG" or "Manual" in IBM Plex Mono), status dot
  - Tap → open `pin-detail` bottom sheet
- Empty state: Playfair Display italic "No pins yet. Share a reel to start." + illustration

---

### Screen 2: Discover

A curated feed of trending places — aggregated from popular Indian travel destinations (pre-seeded for MVP, later driven by community pin data).

**Layout:** Vertical scrollable list of cards. No map on this screen.

**Hero card** (first item, full width, tall):
- Full bleed background photo
- Gradient overlay bottom → dark
- Place name in Playfair Display white, large
- "Trending" badge
- "Save to my map" button (pill, white text on green)

**Regular cards** (remaining items, 2-column grid):
- Photo top half
- Place name + state below
- Category tag (small pill)
- "Save" icon button (top-right of card)

**Tapping any card:**
- Opens place detail bottom sheet
- Shows: photo, name, state, description, category
- "Open in Google Maps" button (deep links to `maps.google.com/?q=place+name+city`)
- "Save to my map" button

**For MVP:** Pre-seed 30 Indian destinations in the DB. Cover: Himachal (Jibhi, Kasol, Tirthan), Northeast (Meghalaya, Majuli, Ziro), Rajasthan (Jaisalmer, Bundi), Goa (Galgibaga, Agonda), Uttarakhand (Chopta, Munsiyari), Andaman (Neil Island), Kerala (Munnar, Alleppey).

---

### Screen 3: Plan (AI Chat)

**Layout:** Chat interface. Messages scroll from bottom. Input bar fixed at bottom.

**Design:**
- Background: `#F5F0E8`
- User messages: right-aligned, `#1C1C1A` background, white text, rounded pill
- AI messages: left-aligned, white card with `#E0D9CC` border, dark text
- AI avatar: small forest-green circle with "P" (PinTrip logo mark)
- Input bar: white rounded input + send button (`#2D6A4F`)

**First-time empty state:**
Show suggestion chips the user can tap to start:
- "Plan a 5-day trip to Himachal"
- "What can I do in my Northeast pins?"
- "Build a weekend trip from my wishlist"

**AI Planner behavior (backend):**
1. User sends message
2. Backend fetches all user's pins from DB
3. Constructs a system prompt with pin data + user's query
4. Calls Gemini 1.5 Flash
5. Returns itinerary as structured JSON (day-wise)
6. Mobile renders the JSON as beautiful day cards — NOT raw text

**Itinerary card format** (AI response rendered as cards, not text):
```
Day 1 card:
  - Day number + date (if given)
  - List of pins for that day (pin card with thumbnail, name)
  - Route hint ("~3hr drive from Guwahati")
  - Tap any pin card → opens pin detail
```

---

### Screen 4: Profile

Simple. No clutter.

- Avatar circle (initials if no photo) on beige background
- Name + email
- Stats row: [X Pins] [X Countries] [X Visited]
- Settings list:
  - Notifications toggle
  - Clear all pins (with confirmation)
  - About / version
  - Sign Out
- Design: clean, lots of whitespace, Playfair Display for the name

---

### Modal: Pin Detail (Bottom Sheet)

Triggered when tapping any pin on map or in list.

**Sheet height:** ~60% of screen, draggable to 85%

**Content:**
- Reel thumbnail (if available) — rounded 12px, full width, 160px height
- Place name: Playfair Display, 22px, dark
- City, State, Country: DM Sans 300, muted
- Source row: source icon (IG logo SVG or "manual" text) + source URL as tappable link
- Status selector: segmented control — Wishlist / Planning / Visited (green when selected)
- Category tag: pill chip, green border
- "View on Google Maps" button: secondary style, full width
- Notes field: multiline text input, placeholder "Add a personal note..."
- Delete pin: small red text link at bottom
- All edits auto-save on change (no save button needed)

---

### Modal: Pin Confirm (Post-Share Intent)

This appears immediately after the user shares a reel to PinTrip. The reel is queued for async processing, but we immediately show this screen.

**States:**

**A) Processing state** (shown while pipeline runs):
- Animated loading indicator (Lottie or Reanimated spinner)
- Text: "Finding the location..." (Playfair italic)
- Reel URL shown below in IBM Plex Mono, small, muted
- Estimated time: "Usually under 10 seconds"

**B) Success state** (pin found):
- Lottie pin-drop animation plays
- "Pinned!" in Playfair Display, large
- Place name + city
- Category auto-detected
- Two buttons: "View on Map" | "Done"

**C) Fallback state** (AI couldn't find location, confidence < 0.6):
- Reel thumbnail shown
- "We couldn't identify the location"
- Text: "Help us pin it:"
- Search input: user types the place name
- Results from Nominatim shown as list
- User taps correct result → pin created
- "Skip for now" option (saves as unresolved pin)

---

### Screen: Handle Share (invisible)

This is not a visible screen — it's a route that intercepts the share intent.

```typescript
// apps/mobile/app/handle-share.tsx
// Uses useShareIntent hook
// On mount: if hasShareIntent → extract URL → POST to backend → navigate to pin-confirm
// Handles the transition from "outside app" to "inside app"
```

---

## 5. Backend API Spec

### Base URL
`http://localhost:4000/api` (development)

### Auth
All protected routes require: `Authorization: Bearer <jwt_token>`

### Endpoints

```
POST   /auth/register          Register with email + password
POST   /auth/login             Login, returns JWT
GET    /auth/me                Get current user

GET    /pins                   Get all pins for current user
POST   /pins                   Create manual pin (body: name, lat, lng, etc.)
GET    /pins/:id               Get single pin
PATCH  /pins/:id               Update pin (status, notes, category)
DELETE /pins/:id               Delete pin

POST   /pins/parse             Submit a reel URL for async processing
                               Returns: { jobId, status: 'queued' }

GET    /pins/parse/:jobId      Poll job status
                               Returns: { status: 'processing'|'done'|'failed', pin? }

GET    /discover               Get curated discover feed (pre-seeded places)

POST   /plan                   AI planner endpoint
                               Body: { message, conversationHistory[] }
                               Returns: { reply, itinerary? }
```

### Reel Parsing Pipeline (BullMQ)

Worker file: `apps/backend/src/workers/reelParser.ts`

```
Job: { url, userId }

Step 1: Download reel metadata + audio
  → spawn yt-dlp as child_process
  → extract: audioPath (temp file), caption, thumbnailUrl

Step 2: Transcribe audio
  → Groq SDK: groq.audio.transcriptions.create({ file, model: 'whisper-large-v3-turbo' })
  → result: transcript string

Step 3: Extract location via LLM
  → Groq SDK: groq.chat.completions.create with llama-3.3-70b-versatile
  → System prompt: (see Section 7 — Prompts)
  → Input: { caption, transcript }
  → Output (JSON): { name, city, state, country, category, confidence }

Step 4: Geocode via Nominatim
  → GET https://nominatim.openstreetmap.org/search
  → params: { q: `${name} ${city} ${state}`, format: 'json', limit: 1 }
  → result: { lat, lon, display_name, osm_type, osm_id, class, type, extratags.admin_level }
  → Classify: osm_type=node → POINT. osm_type=relation/way → AREA.
  → Block: class=boundary + type=administrative + admin_level ≤ 4 (country/state)
  → Store osmType + osmId + locationType on Place (polygons fetched on demand by client, not stored)

Step 5: Check confidence
  → if confidence >= 0.6 AND nominatim returned results:
      create Pin in DB, push notification "📍 Pinned — {name}!"
  → if confidence < 0.6 OR no nominatim results:
      create UnresolvedPin in DB, push notification asking user to confirm

Step 6: Cleanup
  → delete temp audio file
  → update job status to 'done' or 'failed'
```

---

## 6. Database Schema (Prisma)

File: `apps/backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  avatarUrl     String?
  pushToken     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  pins          Pin[]
  conversations Conversation[]
}

model Pin {
  id                  String     @id @default(cuid())
  userId              String
  user                User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Place identity
  name                String
  city                String?
  state               String?
  country             String     @default("India")
  lat                 Float
  lng                 Float
  googlePlaceId       String?

  // Source info
  source              SourceType @default(MANUAL)
  sourceUrl           String?
  sourceThumbnailUrl  String?
  sourceCaption       String?

  // User-controlled fields
  status              PinStatus  @default(WISHLIST)
  category            Category   @default(NATURE)
  notes               String?
  visitedAt           DateTime?

  // AI metadata
  aiConfidence        Float?
  isManuallyVerified  Boolean    @default(false)
  rawTranscript       String?

  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@index([userId])
  @@index([lat, lng])
}

model UnresolvedPin {
  id            String     @id @default(cuid())
  userId        String
  sourceUrl     String
  sourceThumbnailUrl String?
  sourceCaption String?
  rawTranscript String?
  aiResponse    String?    // raw JSON from extraction step
  createdAt     DateTime   @default(now())
}

// Note: actual schema has Place + PlaceSource models for canonical dedup (Phase 3).
// Place also carries osmType/osmId/locationType added in Phase 5.5.
// See apps/backend/prisma/schema.prisma for the live schema.

model DiscoverPlace {
  id          String    @id @default(cuid())
  name        String
  city        String
  state       String
  country     String    @default("India")
  lat         Float
  lng         Float
  description String?
  photoUrl    String?
  category    Category
  tags        String[]
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  Json[]    // array of { role, content, timestamp }
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum SourceType {
  INSTAGRAM
  YOUTUBE
  MANUAL
  DISCOVER
}

enum PinStatus {
  WISHLIST
  PLANNING
  VISITED
}

enum Category {
  NATURE
  FOOD
  ADVENTURE
  CULTURE
  STAY
  OFFBEAT
}
```

---

## 7. AI Prompts

### Location Extraction Prompt (Groq / Llama)

```
SYSTEM:
You are a location extraction specialist for a travel app. 
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
  "reasoning": "Caption explicitly mentions Dawki and transcript says 'we are at the crystal clear Dawki river'"
}

If you cannot identify any location with confidence > 0.2, respond:
{ "name": null, "confidence": 0.0, "reasoning": "No location signals found" }

USER:
Caption: {caption}
Transcript: {transcript}
```

### AI Planner Prompt (Gemini)

```
SYSTEM:
You are PinTrip's travel planning assistant for Indian travelers.
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
  "summary": "10 days across Northeast India...",
  "days": [
    {
      "day": 1,
      "title": "Arrive in Guwahati",
      "pinIds": ["pin_id_1"],
      "description": "...",
      "travelNote": "Fly into LGB Airport..."
    }
  ]
}

For conversational replies (not itineraries), respond:
{ "type": "message", "content": "..." }

USER PINS:
{pinsJson}

USER MESSAGE:
{userMessage}

CONVERSATION HISTORY:
{conversationHistory}
```

---

## 8. Environment Variables

### Root `.env.example`
```env
# This is a reference file. Copy to .env in each app directory.
# Never commit real .env files to git.
```

### `apps/backend/.env.example`
```env
# Server
NODE_ENV=development
PORT=4000

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/pintrip_dev

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=30d

# Groq (Free tier — transcription + LLM)
# Sign up at console.groq.com — no credit card needed for free tier
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Google Gemini (Free tier — AI planner)
# Sign up at aistudio.google.com — free API key
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxx

# Nominatim (OpenStreetMap geocoding — completely free, no key needed)
# Just set a user agent string identifying your app (required by OSM policy)
NOMINATIM_USER_AGENT=PinTrip/1.0 (dev@pintrip.app)

# Maptiler (map tiles — free 100k/month)
# Sign up at maptiler.com — free account
MAPTILER_API_KEY=xxxxxxxxxxxxxxxxxxxx

# Expo Push Notifications (no key needed — uses Expo's free service)
# Just set this to identify your app
EXPO_ACCESS_TOKEN=your_expo_access_token

# yt-dlp path (installed globally or local binary)
YTDLP_PATH=/usr/local/bin/yt-dlp

# Temp file directory for audio processing
TEMP_DIR=/tmp/pintrip

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000
```

### `apps/mobile/.env.example`
```env
# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:4000/api

# Maptiler (map tiles)
EXPO_PUBLIC_MAPTILER_API_KEY=xxxxxxxxxxxxxxxxxxxx

# Maptiler style URL — pick one:
# Streets dark: https://api.maptiler.com/maps/streets-v2-dark/style.json?key=YOUR_KEY
# Dataviz dark: https://api.maptiler.com/maps/dataviz-dark/style.json?key=YOUR_KEY
EXPO_PUBLIC_MAPTILER_STYLE_URL=https://api.maptiler.com/maps/dataviz-dark/style.json?key=YOUR_KEY

# App scheme (for deep links and share intent)
EXPO_PUBLIC_APP_SCHEME=pintrip
```

### `apps/web/.env.example`
```env
# Next.js landing page
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com (placeholder)
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com (placeholder)
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 9. Key Files to Create

### `apps/mobile/app.json` (Expo config)
Must include:
```json
{
  "expo": {
    "name": "PinTrip",
    "slug": "pintrip",
    "scheme": "pintrip",
    "plugins": [
      "expo-router",
      "expo-share-intent",
      "expo-secure-store",
      "expo-notifications"
    ]
  }
}
```

### `apps/backend/src/queues/reelParser.queue.ts`
BullMQ queue definition. Queue name: `reel-parsing`.

### `apps/backend/src/workers/reelParser.worker.ts`
BullMQ worker. Processes jobs from `reel-parsing` queue. Implements the 6-step pipeline from Section 5.

### `apps/backend/prisma/seed.ts`
Seed script that inserts the 30 pre-seeded Indian discover places.

### `packages/shared/src/types.ts`
All shared TypeScript types. Both backend and mobile import from here.

```typescript
export type PinStatus = 'WISHLIST' | 'PLANNING' | 'VISITED'
export type Category = 'NATURE' | 'FOOD' | 'ADVENTURE' | 'CULTURE' | 'STAY' | 'OFFBEAT'
export type SourceType = 'INSTAGRAM' | 'YOUTUBE' | 'MANUAL' | 'DISCOVER'

export interface Pin {
  id: string
  userId: string
  name: string
  city?: string
  state?: string
  country: string
  lat: number
  lng: number
  source: SourceType
  sourceUrl?: string
  sourceThumbnailUrl?: string
  status: PinStatus
  category: Category
  notes?: string
  aiConfidence?: number
  createdAt: string
  updatedAt: string
}

export interface ItineraryDay {
  day: number
  title: string
  pinIds: string[]
  description: string
  travelNote?: string
}

export interface Itinerary {
  type: 'itinerary'
  summary: string
  days: ItineraryDay[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  itinerary?: Itinerary
}
```

---

## 10. Landing Page (`apps/web`)

Single page. Sections:

1. **Hero** — "Save what you scroll past." Dark section (`#1C1C1A`), beige text. Phone mockup showing the map with pins. Download buttons (App Store + Play Store — placeholder links for now).

2. **Problem** — "You've saved 200 reels. You remember none of them." Beige background. Three pain points with icons.

3. **How it works** — Three steps. White cards on beige. Step 1: Share the reel. Step 2: Pin drops on your map. Step 3: Chat to plan your trip.

4. **Map showcase** — Full-width dark map visual with glowing pins. No interactivity needed — a static screenshot or mock is fine.

5. **India-first** — Section about being built for Indian travel. Callouts: Northeast India, Himachal, Rajasthan, etc. with photos.

6. **Footer** — Logo, links, "Made with ❤️ for Indian travelers."

---

## 11. Development Setup Instructions

After cloning, the setup should work like this:

```bash
# Install dependencies
pnpm install

# Backend setup
cd apps/backend
cp .env.example .env
# Edit .env with your keys
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Start Redis (required for BullMQ)
# Mac: brew services start redis
# Linux: sudo systemctl start redis

# Install yt-dlp
# Mac: brew install yt-dlp
# Linux: pip install yt-dlp

# Start backend
pnpm dev

# Mobile setup (separate terminal)
cd apps/mobile
cp .env.example .env
# Edit with your keys

# Start Expo dev server
npx expo start

# Web (separate terminal)
cd apps/web
cp .env.example .env
pnpm dev
```

Add a root `package.json` with these scripts:
```json
{
  "scripts": {
    "dev:backend": "pnpm --filter backend dev",
    "dev:web": "pnpm --filter web dev",
    "dev:mobile": "pnpm --filter mobile start",
    "db:migrate": "pnpm --filter backend prisma migrate dev",
    "db:seed": "pnpm --filter backend prisma db seed",
    "db:studio": "pnpm --filter backend prisma studio"
  }
}
```

---

## 12. MVP Scope — Build in This Order

Build **strictly** in this sequence. Do not skip ahead.

**Phase 1 — Foundation (get something running)**
- [ ] Monorepo scaffold (pnpm workspaces, all three apps)
- [ ] Shared types package
- [ ] Backend: Express server, Prisma + Postgres connected, basic auth (register/login/me)
- [ ] Backend: `/pins` CRUD endpoints working
- [ ] Mobile: Expo project initialized with all dependencies
- [ ] Mobile: Auth screens (welcome, login, register)
- [ ] Mobile: JWT stored in SecureStore, auth state in Zustand

**Phase 2 — Map + Pins**
- [ ] Mobile: Home screen with MapLibre map rendering (dark Maptiler style)
- [ ] Mobile: Fetch user pins from backend, render on map as custom markers
- [ ] Mobile: Pin detail bottom sheet
- [ ] Mobile: Manual pin add (search → Nominatim → create pin)
- [ ] Mobile: Pin list below map, collapsible with scroll animation

**Phase 3 — Share Intent Pipeline (the core feature)**
- [ ] Backend: BullMQ + Redis setup
- [ ] Backend: yt-dlp integration (spawn child process, extract audio)
- [ ] Backend: Groq Whisper transcription
- [ ] Backend: Groq Llama location extraction
- [ ] Backend: Nominatim geocoding
- [ ] Backend: `POST /pins/parse` and `GET /pins/parse/:jobId` endpoints
- [ ] Mobile: `expo-share-intent` integrated
- [ ] Mobile: `handle-share.tsx` route
- [ ] Mobile: Pin confirm modal (processing → success → fallback states)
- [ ] Mobile: Push notification when pin is ready

**Phase 4 — Subscription Foundation (before building Plan UI)**
- [ ] Backend: Add `plan: UserPlan @default(FREE)` + `planExpiresAt` + `aiMessagesUsed` to User model + migrate
- [ ] Backend: `requirePro` middleware (binary gate — built but not applied to any route yet)
- [ ] Backend: `requirePlannerAccess` middleware (metered gate — 5 free messages, then blocks with `PLANNER_LIMIT_REACHED`)
- [ ] Backend: Increment `aiMessagesUsed` on each `/plan` call for FREE users
- [ ] Mobile: `useEntitlements` hook (`isPro`, `canSendPlannerMessage`, `plannerMessagesRemaining`)
- [ ] Mobile: Stub `PaywallScreen` component (shown when limit hit — upgrade CTA does nothing yet)
- [ ] Mobile: Stub `UpgradeModal` component for future RevenueCat purchase sheet

**Phase 5 — Discover + Plan**
- [ ] Backend: Discover endpoints + seed data (30 Indian places)
- [ ] Mobile: Discover screen
- [ ] Backend: `/plan` endpoint with Gemini integration + `requirePlannerAccess` middleware applied
- [ ] Mobile: Plan (chat) screen with itinerary card rendering
- [ ] Mobile: Show "X free messages remaining" badge in chat header for free users
- [ ] Mobile: Show `PaywallScreen` when `canSendPlannerMessage` is false

**Phase 5.5 — Area Pins + Polygon Boundaries**

Distinguish between *point locations* (a temple, a café, a guesthouse) and *area locations* (a valley, a national park, a district). Area pins show a polygon boundary on the map when tapped, and use a different marker shape so they're visually distinct even when zoomed out.

---

**Key architectural decision — store OSM IDs, fetch polygons on demand:**

We do NOT store polygon GeoJSON in our database. Instead we store two tiny fields (`osmType` + `osmId`) on the `Place` model. When the user taps an AREA pin, the mobile app calls the Nominatim lookup API directly from the device to fetch the polygon on demand. This keeps our DB lean (8 bytes per place vs 50–300KB), and polygons are always up to date as OSM improves boundaries over time.

```
Mobile → tap AREA pin
  → GET https://nominatim.openstreetmap.org/lookup
      ?osm_ids=R{osmId}&format=json&polygon_geojson=1&polygon_threshold=0.005
  → render FillLayer + LineLayer from returned GeoJSON
  → cache result in Zustand (in-memory, session-scoped)
```

`polygon_threshold=0.005` uses Nominatim's built-in Ramer-Douglas-Peucker simplification — reduces polygon size ~85% with zero perceptible visual difference at mobile zoom levels.

**Caching:** Polygon is cached in a Zustand `Map<osmId, GeoJSON>` for the current app session. First tap: ~300–500ms fetch. Subsequent taps that session: instant. Cache is cleared on app restart (no AsyncStorage needed for MVP — the fetch is fast enough). Future upgrade: backend proxy cache where our server fetches once and serves all users.

**App Store / Nominatim policy:** Calling Nominatim from the device is fine with Apple. Nominatim's public instance usage policy is also not a concern at MVP scale — polygon fetches only happen on explicit user tap of AREA pins, not on every screen load or in background. At scale, swap the URL to a self-hosted Nominatim instance (open source, $10/mo droplet) with zero code changes.

---

**State/country blocking:**

OSM `admin_level` encodes the administrative hierarchy:
- `admin_level=2` → country
- `admin_level=4` → state (India: Himachal Pradesh, Rajasthan, etc.)
- `admin_level=5` → district
- `admin_level=6` → tehsil/block
- `admin_level=7–8` → city/town/village

Block saving `admin_level ≤ 4`. Show error: *"This is an entire state — try searching for a specific place within it."*
Allow: district, city, town, valley, national park, forest, beach, lake — anything more specific than a state.

---

**Visual differentiation on map:**

POINT pins (temple, café, hotel) → circle marker (current behavior)
AREA pins (valley, national park, district) → diamond / rounded-square marker

This gives instant visual signal at any zoom level: "that one is a region, not a specific spot."

---

**What changes:**

*Backend:*
- [ ] Schema migration: add `osmType String?`, `osmId BigInt?`, `locationType String?` (`POINT` | `AREA`) to `Place` model
- [ ] Geocode util: add `osm_type` and `osm_id` to `NominatimResult` interface; parse and return them alongside lat/lng
- [ ] Classify result: `osm_type=node` → POINT. `osm_type=relation/way` → AREA. Block if `class=boundary` + `type=administrative` + `admin_level ≤ 4`
- [ ] `reelParser.worker.ts`: store `osmType`, `osmId`, `locationType` on Place creation; return them in `PlaceData`
- [ ] `POST /pins` route: pass `osmType`, `osmId`, `locationType` through when creating Pin from confirmed PlaceData

*Shared types:*
- [ ] Add `osmType?: string`, `osmId?: string`, `locationType?: 'POINT' | 'AREA'` to `Pin` and `Place` interfaces

*Mobile:*
- [ ] Zustand `pinsStore`: add `polygonCache: Map<string, GeoJSON.FeatureCollection>` + `fetchPolygon(osmType, osmId)` action
- [ ] `MapNative.tsx`: accept `selectedBoundary?: GeoJSON.FeatureCollection` prop; render as `GeoJSONSource` with `FillLayer` (green, 0.12 opacity) + `LineLayer` (green, 2px); render AREA pins as diamond marker (via SymbolLayer or CircleLayer with rotation)
- [ ] `index.tsx`: on AREA pin select, call `fetchPolygon`, pass result to MapNative; use `fitBounds` to polygon bbox instead of `flyTo` a point

---

**UX flow:**
```
User sees map — AREA pins show as diamonds, POINT pins as circles

User taps "Spiti Valley" diamond
  → App checks Zustand polygon cache
  → Cache miss: fetches from Nominatim (~300–500ms), stores in cache
  → Cache hit: instant
  → Polygon boundary renders as semi-transparent green fill over the valley
  → Camera fits to the full valley extent
  → Detail sheet opens as normal

User taps elsewhere / closes detail
  → Polygon disappears
```

**Phase 6 — Polish + App Store Submission**
- [ ] Mobile: Profile screen (show plan status — Free / Pro)
- [ ] Mobile: All animations (spring physics, staggered lists, pin drop Lottie)
- [ ] Mobile: Onboarding flow (3 screens showing the value prop)
- [ ] Web: Landing page

**Phase 7 — Monetisation (RevenueCat)**
- [ ] RevenueCat account + products configured in App Store Connect + Google Play Console
- [ ] Pricing: ₹199/mo or ₹999/yr (India), $2.99/mo or $14.99/yr (international)
- [ ] Install `react-native-purchases` (RevenueCat SDK) in mobile
- [ ] `UpgradeModal` wired to RevenueCat purchase sheet
- [ ] Backend: `POST /webhooks/revenuecat` — update `User.plan` on subscription events
- [ ] Backend: Apply `requirePro` to any additional Pro-only routes
- [ ] Mobile: `useEntitlements` updated to also check RevenueCat local entitlement cache
- [ ] Profile screen: subscription status + "Manage subscription" button

**Phase 8 — Shared Trips (Post-Launch, Pro Feature)**
- [ ] DB: `Trip` model (name, ownerId, coverPhoto), `TripMember` join table (tripId, userId, role: OWNER|MEMBER)
- [ ] DB: Pins optionally belong to a Trip (`tripId` on Pin model)
- [ ] Backend: Trip CRUD + invite system (invite link + username lookup)
- [ ] Backend: Push notification fan-out to all trip members when a pin is added
- [ ] Mobile: "New shared trip" flow — name it, invite by link or username
- [ ] Mobile: Trip selector in pin-confirm ("Add to: My Map / Goa 2026 with Rahul / ...")
- [ ] Mobile: Shared trip map view — separate tab per trip, shows all members' pins
- [ ] Mobile: Member list UI — who's in the trip, their contribution count
- [ ] Mobile: Pin comments — collaborators can comment on any pin in a shared trip
- [ ] Mobile: Notification: "Rahul pinned Café Chocolatti to Goa 2026 👀"
- [ ] Viral loop: invitee must download PinTrip to join a trip

---

## 13. Code Style Rules

- TypeScript strict mode everywhere. No `any`.
- No default exports in backend. Named exports only.
- Mobile: default exports for screen components (Expo Router requirement), named for everything else.
- File naming: `camelCase.ts` for utilities, `PascalCase.tsx` for components/screens.
- All API responses follow this shape:
  ```typescript
  // Success
  { success: true, data: T }
  // Error
  { success: false, error: string, code?: string }
  ```
- Zod validation on all incoming request bodies in backend.
- All env variables accessed via a central `config.ts` file — never `process.env.X` directly in handlers.
- Comments: only write comments that explain *why*, not *what*. If the code is obvious, no comment needed.
- No `console.log` in committed code. Use a simple logger utility (`pino` or basic wrapper).

---

## 14. What NOT to Build in MVP

Do not build any of these for the MVP:

- Social features (sharing maps, following users)
- YouTube / TikTok support (Instagram only for now)
- 3D globe view
- Offline maps
- Trip collaboration (Phase 8)
- RevenueCat / actual payment processing (Phase 7)
- Hindi / regional language UI
- Frame-by-frame video analysis (GPT-4o Vision) — caption + audio only
- In-app browser for viewing reels
- Custom onboarding illustrations (use text placeholders)
- Map drawing / annotation (see Section 15)

---

## 15. Post-Launch Feature Ideas (Not Scheduled Yet)

These are well-thought-out ideas that should be built after the app is live and validated. Do not build these during MVP phases.

### Map Drawing / Annotation (Crazy Good Idea)

Inspired by physical paper maps where travelers mark routes and notes by hand. When zoomed in to city/neighbourhood level on a shared trip map, a pen tool appears. Users can draw freehand strokes directly on the map.

**How it works technically:**
- Overlay a transparent drawing surface using `react-native-skia` (GPU-accelerated canvas, same library Shopify uses — works on top of MapLibre)
- Each stroke is recorded as an array of `{ lat, lng }` points (not screen pixels) — so drawings scale and pan correctly with the map
- Drawings are saved as geo-anchored SVG paths in the DB, associated with a Trip
- Only shown when zoom level is above a threshold (can see street/restaurant detail) — not when zoomed out to country level
- All trip members see each other's drawings in real time (or near-real-time)
- Works like the Instagram DM canvas but on a real map with geographic context

**Why it's differentiated:** No travel app does this. The "annotate a physical map" metaphor is deeply familiar and emotional for travelers.

**Tech dependencies when building:**
- `react-native-skia` for the drawing canvas overlay
- MapLibre zoom level events to show/hide the pen tool
- DB: `TripAnnotation` model (tripId, authorId, svgPath, boundingBoxLat/lng, createdAt)
- Requires Shared Trips (Phase 8) to be built first — annotations belong to a Trip

### Multi-Location Reel Support

When a reel covers multiple places ("Top 5 Valleys in Himachal", "Best cafés in Pondicherry"), extract all locations and let the user pick which ones to save.

**UX:**
- After processing, show a scrollable list of place cards instead of a single card
- Each card has an independent "+ Add" button that turns to "✓ Added" after tapping
- Places that couldn't be geocoded show as a bullet list with a "Search on Google" link (opens Google search with the place name as query) — no manual Nominatim flow for these
- "Done" button at the bottom navigates back; home screen highlights all newly added pins

**Backend changes:**
- LLM extraction prompt returns `{ "locations": [...] }` array (max 5, strict prompt to avoid hallucination)
- Worker geocodes each location independently; failed ones are dropped silently
- Job result returns `places: PlaceData[]` instead of `placeData: PlaceData | null`

**Why post-launch:** Listicle reels are real but not the primary use case. The current fallback ("couldn't identify — search manually") handles them acceptably for MVP. Build this once you have usage data showing how often it fails.

### Premium Tier (Phase 9)
When there are enough Pro features to justify a third tier. Likely candidates:
- Trip collaboration (if moved to Premium instead of Pro)
- Map drawing / annotation
- Offline maps
- Export itinerary as PDF / shareable image
- Priority AI processing (skip the queue)
- Pricing: ₹499/mo or ₹2499/yr

---

*End of CLAUDE.md*
