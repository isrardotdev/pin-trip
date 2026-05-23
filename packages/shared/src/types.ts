export type PinStatus = 'WISHLIST' | 'PLANNING' | 'VISITED'
export type Category = 'NATURE' | 'FOOD' | 'ADVENTURE' | 'CULTURE' | 'STAY' | 'OFFBEAT'
export type SourceType = 'INSTAGRAM' | 'YOUTUBE' | 'MANUAL' | 'DISCOVER'

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

export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
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
