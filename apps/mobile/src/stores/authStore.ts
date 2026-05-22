import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { api } from '../lib/api'
import { User } from '@pintrip/shared'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isHydrated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      if (!token) {
        set({ isHydrated: true })
        return
      }
      const res = await api.get('/auth/me')
      set({ user: res.data.data, token, isHydrated: true })
    } catch {
      await SecureStore.deleteItemAsync('auth_token')
      set({ user: null, token: null, isHydrated: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/auth/login', { email, password })
      const { user, token } = res.data.data
      await SecureStore.setItemAsync('auth_token', token)
      set({ user, token, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true })
    try {
      const res = await api.post('/auth/register', { email, password, name })
      const { user, token } = res.data.data
      await SecureStore.setItemAsync('auth_token', token)
      set({ user, token, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    set({ user: null, token: null })
  },
}))
