import { create } from 'zustand'
import axios from 'axios'
import { api } from '../lib/api'
import { Pin } from '@wanderpin/shared'

interface PinsState {
  pins: Pin[]
  isLoading: boolean
  polygonCache: Record<string, GeoJSON.FeatureCollection>

  fetchPins: () => Promise<void>
  addPin: (pin: Omit<Pin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Pin>
  updatePin: (id: string, updates: Partial<Pin>) => Promise<void>
  deletePin: (id: string) => Promise<void>
  fetchPolygon: (osmType: string, osmId: string) => Promise<GeoJSON.FeatureCollection | null>
}

export const usePinsStore = create<PinsState>((set, get) => ({
  pins: [],
  isLoading: false,
  polygonCache: {},

  fetchPins: async () => {
    set({ isLoading: true })
    try {
      const res = await api.get('/pins')
      set({ pins: res.data.data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  addPin: async (pin) => {
    const res = await api.post('/pins', pin)
    const newPin: Pin = res.data.data
    set((state) => ({ pins: [newPin, ...state.pins] }))
    return newPin
  },

  updatePin: async (id, updates) => {
    const res = await api.patch(`/pins/${id}`, updates)
    const updated: Pin = res.data.data
    set((state) => ({
      pins: state.pins.map((p) => (p.id === id ? updated : p)),
    }))
  },

  deletePin: async (id) => {
    await api.delete(`/pins/${id}`)
    set((state) => ({ pins: state.pins.filter((p) => p.id !== id) }))
  },

  fetchPolygon: async (osmType, osmId) => {
    const cacheKey = `${osmType}:${osmId}`
    const cached = get().polygonCache[cacheKey]
    if (cached) return cached

    // OSM prefix: R=relation, W=way, N=node
    const prefix = osmType === 'relation' ? 'R' : osmType === 'way' ? 'W' : 'N'
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/lookup', {
        params: {
          osm_ids: `${prefix}${osmId}`,
          format: 'json',
          polygon_geojson: 1,
          polygon_threshold: 0.001,
        },
        headers: { 'User-Agent': 'WanderPin/1.0' },
      })
      const results: any[] = res.data
      const geometry = results[0]?.geojson
      if (!geometry) return null

      const featureCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry, properties: {} }],
      }
      set((state) => ({
        polygonCache: { ...state.polygonCache, [cacheKey]: featureCollection },
      }))
      return featureCollection
    } catch {
      return null
    }
  },
}))
