import { create } from 'zustand'
import { api } from '../lib/api'
import { Pin } from '@pintrip/shared'

interface PinsState {
  pins: Pin[]
  isLoading: boolean

  fetchPins: () => Promise<void>
  addPin: (pin: Omit<Pin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Pin>
  updatePin: (id: string, updates: Partial<Pin>) => Promise<void>
  deletePin: (id: string) => Promise<void>
}

export const usePinsStore = create<PinsState>((set) => ({
  pins: [],
  isLoading: false,

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
}))
