import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { api } from '../lib/api'
import { User } from '@wanderpin/shared'

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isHydrated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  hydrate: () => Promise<void>
  refreshUser: () => Promise<void>
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

  loginWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
      const response = await GoogleSignin.signIn()
      if (!isSuccessResponse(response)) {
        // User cancelled the native picker — not an error.
        set({ isLoading: false })
        return
      }
      const idToken = response.data.idToken
      if (!idToken) throw new Error('Google sign-in did not return an ID token')

      const res = await api.post('/auth/google', { idToken })
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
    try { await GoogleSignin.signOut() } catch {}
    set({ user: null, token: null })
  },

  deleteAccount: async () => {
    set({ isLoading: true })
    try {
      await api.delete('/auth/me')
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
    // Only clear local state once the server confirms deletion, otherwise the
    // user is signed out of an account that still exists.
    await SecureStore.deleteItemAsync('auth_token')
    try { await GoogleSignin.revokeAccess() } catch {}
    try { await GoogleSignin.signOut() } catch {}
    set({ user: null, token: null, isLoading: false })
  },

  // Call after any action that changes plan or aiMessagesUsed on the server
  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.data })
    } catch {}
  },
}))
