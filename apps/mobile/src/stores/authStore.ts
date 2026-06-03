import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import * as AppleAuthentication from 'expo-apple-authentication'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { api } from '../lib/api'
import { User } from '@pintrip/shared'

// Configure Google Sign-In once at module level
GoogleSignin.configure({
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isHydrated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  loginWithApple: () => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
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

  loginWithApple: async () => {
    set({ isLoading: true })
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      const name = [cred.fullName?.givenName, cred.fullName?.familyName]
        .filter(Boolean).join(' ').trim() || undefined
      const res = await api.post('/auth/apple', {
        identityToken: cred.identityToken,
        user: name ? { name } : undefined,
      })
      const { user, token } = res.data.data
      await SecureStore.setItemAsync('auth_token', token)
      set({ user, token, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false })
      // ERR_CANCELED = user dismissed the sheet — not a real error
      if (err?.code !== 'ERR_CANCELED') throw err
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await GoogleSignin.hasPlayServices()
      await GoogleSignin.signIn()
      const { idToken } = await GoogleSignin.getTokens()
      if (!idToken) throw new Error('No ID token from Google')
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
    set({ user: null, token: null })
  },

  // Call after any action that changes plan or aiMessagesUsed on the server
  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data.data })
    } catch {}
  },
}))
