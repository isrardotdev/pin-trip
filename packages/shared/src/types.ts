export type PinStatus = 'WISHLIST' | 'PLANNING' | 'VISITED'
export type Category = 'NATURE' | 'FOOD' | 'ADVENTURE' | 'CULTURE' | 'STAY' | 'OFFBEAT'
export type SourceType = 'INSTAGRAM' | 'YOUTUBE' | 'MANUAL' | 'DISCOVER' | 'PLANNER'

export interface Place {
  id: string
  name: string
  city?: string
  state?: string
  country: string
  lat: number
  lng: number
  thumbnailUrl?: string
  aiConfidence?: number
  category: Category
  createdAt: string
}

export interface Pin {
  id: string
  userId: string
  placeId?: string
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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  questionOptions?: string[]   // structured options for preference-gathering (question type)
  readyToPlan?: boolean        // when true, show "Plan now" button
  suggestions?: string[]       // quick-reply chips on any AI message
}

export interface DayItem {
  type: 'pin' | 'suggestion'
  pinId?: string
  name: string
  category: Category
  description: string
  lat?: number
  lng?: number
  isAddable?: boolean
}

export interface ItineraryDay {
  day: number
  title: string
  description: string
  travelNote?: string
  items: DayItem[]
}

export interface TripDocument {
  type: 'itinerary'
  summary: string
  destination: string
  days: ItineraryDay[]
}

export interface SavedItinerary {
  id: string
  userId: string
  title: string
  destination: string
  document: TripDocument
  messages: ChatMessage[]
  createdAt: string
}

export interface Conversation {
  tripDocument: TripDocument | null
  destination: string | null
  messages: ChatMessage[]
}

// Planner API response types
export type PlannerResponse =
  | { type: 'itinerary_new'; document: TripDocument; title: string; destination: string }
  | { type: 'itinerary_update'; document: TripDocument }
  | { type: 'message'; content: string }
  | { type: 'question'; content: string; options: string[]; readyToPlan: boolean }
  | { type: 'conflict'; currentDestination: string; newDestination: string }

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type UserPlan = 'FREE' | 'PRO'

export const PLANNER_FREE_LIMIT = 5

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  plan: UserPlan
  aiMessagesUsed: number
  createdAt: string
}

export interface DiscoverPlace {
  id: string
  name: string
  city: string
  state: string
  country: string
  lat: number
  lng: number
  description?: string
  photoUrl?: string
  category: Category
  tags: string[]
}

export interface ParseJobStatus {
  jobId: string
  status: 'queued' | 'processing' | 'done' | 'failed'
  pin?: Pin
  error?: string
}
