import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Every failed request logs here so `adb logcat` / Metro shows exactly
    // what happened — status vs. network error vs. timeout — instead of
    // callers only seeing a generic caught error with no detail.
    const method = error?.config?.method?.toUpperCase()
    const url = error?.config?.url
    if (error?.response) {
      console.warn(`[api] ${method} ${url} -> ${error.response.status}`, error.response.data)
    } else if (error?.request) {
      console.warn(`[api] ${method} ${url} -> no response (network error / timeout)`, error.message)
    } else {
      console.warn(`[api] request setup failed`, error?.message)
    }
    // Let callers handle errors
    return Promise.reject(error)
  }
)
