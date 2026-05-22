# Placeholders & TODO Assets

A reference of all placeholder assets and stub values added during development.
Replace these before shipping to production.

---

## Mobile App Icons (`apps/mobile/assets/`)

| File | Current | Replace With | Spec |
|---|---|---|---|
| `icon.png` | Green circle on beige — auto-generated | Real PinTrip app icon | 1024×1024px, no transparency |
| `splash.png` | Green circle on beige — auto-generated | Real splash screen | 1242×2436px |
| `adaptive-icon.png` | Green circle on beige — auto-generated | Android adaptive icon foreground | 1024×1024px, transparent bg |
| `favicon.png` | Green circle on beige — auto-generated | Web favicon | 64×64px |

**Notes:**
- All 4 were generated with a Python script using only stdlib (no Pillow)
- Icon concept: "P" lettermark on `#2D6A4F` green circle against `#F5F0E8` beige
- Fonts directory `assets/fonts/` exists but is unused — fonts now loaded via `@expo-google-fonts/*` packages

---

## Fonts

| Font | Status | Notes |
|---|---|---|
| Playfair Display | `@expo-google-fonts/playfair-display` | Loaded: Regular, Bold, Italic |
| DM Sans | `@expo-google-fonts/dm-sans` | Loaded: Light, Regular, Medium |
| IBM Plex Mono | `@expo-google-fonts/ibm-plex-mono` | Loaded: Regular |

No local `.ttf` files needed — all loaded from npm packages.

---

## Environment Variables (not real values yet)

### `apps/backend/.env`

| Variable | Placeholder | Notes |
|---|---|---|
| `GROQ_API_KEY` | `placeholder` | Needed for Phase 3 (Whisper transcription + Llama extraction) |
| `GEMINI_API_KEY` | `placeholder` | Needed for Phase 4 (AI planner) |
| `EXPO_ACCESS_TOKEN` | `placeholder` | Needed for push notifications (Phase 3) |
| `YTDLP_PATH` | `/usr/local/bin/yt-dlp` | Install via `brew install yt-dlp` before Phase 3 |

### `apps/mobile/.env`

| Variable | Status | Notes |
|---|---|---|
| `EXPO_PUBLIC_MAPTILER_API_KEY` | Real key added | Free tier — 100k tiles/month |
| `EXPO_PUBLIC_MAPTILER_STYLE_URL` | Real key added | dataviz-dark style |

### `apps/web/.env`

| Variable | Placeholder | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_STORE_URL` | `https://apps.apple.com` | Replace with real App Store link after publishing |
| `NEXT_PUBLIC_PLAY_STORE_URL` | `https://play.google.com` | Replace with real Play Store link after publishing |

---

## Discover Places Photos (`apps/backend/prisma/seed.ts`)

All 30 seeded `DiscoverPlace` records have `photoUrl: null`.

| What to add | Where |
|---|---|
| Real photo URLs for each place | `prisma/seed.ts` — add `photoUrl` field per entry |
| Recommended: Unsplash or own S3/R2 bucket | Use `CLOUDFLARE_R2_*` env vars (not set up yet) |

---

## Web Landing Page (`apps/web/app/page.tsx`)

| Section | Placeholder | Replace With |
|---|---|---|
| Hero phone mockup | CSS div with mock pins | Real app screenshot |
| Map showcase | CSS div with hardcoded pin dots | Real app screenshot or interactive map |
| Download buttons | `href="#"` links | Real App Store / Play Store URLs |
| India-first photos | Emoji only | Real destination photos |
| Footer links | `href="#"` | Real privacy policy, terms, contact pages |

---

## expo-share-intent Config Plugin

`expo-share-intent` is removed from `app.json` plugins temporarily due to a broken `@expo/plist` dependency in v6.1.0. The JS hook (`useShareIntentContext`) still works in code.

**Before native build (Phase 3):**
- Re-add to `app.json` plugins once the package is fixed, or pin to a working version
- The share extension (iOS) and intent filter (Android) require this plugin at build time

---

## Push Notifications

`expo-notifications` is installed but not configured. Before Phase 3:
- Register for push token in the app
- Set `EXPO_ACCESS_TOKEN` in backend `.env`
- Implement notification sending in `reelParser.worker.ts` (step 5 has a TODO comment)
