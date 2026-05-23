import { useEffect, useState } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../src/lib/api'
import { useAuthStore } from '../src/stores/authStore'
import { colors, fontSizes, spacing } from '../src/constants/theme'

// expo-share-intent is only available in native builds
let useShareIntentContext: () => { hasShareIntent: boolean; shareIntent: any; resetShareIntent: () => void }
try {
  useShareIntentContext = require('expo-share-intent').useShareIntentContext
} catch {
  useShareIntentContext = () => ({ hasShareIntent: false, shareIntent: null, resetShareIntent: () => {} })
}

// Extract URL from any share intent shape expo-share-intent might return
function extractUrl(shareIntent: any): string {
  if (!shareIntent) return ''
  return (
    shareIntent.webUrl ||
    shareIntent.url ||
    shareIntent.text ||
    shareIntent.data ||
    ''
  )
}

export default function HandleShareScreen() {
  const router = useRouter()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext()
  const user = useAuthStore((s) => s.user)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasShareIntent) {
      router.replace('/(tabs)')
      return
    }

    if (!user) {
      router.replace('/(auth)/welcome')
      return
    }

    const handleShare = async () => {
      const url = extractUrl(shareIntent)

      if (!url) {
        setError(`No URL found in share intent.\nIntent: ${JSON.stringify(shareIntent)}`)
        return
      }

      try {
        const res = await api.post('/pins/parse', { url })
        const { jobId } = res.data.data
        resetShareIntent()
        router.replace({
          pathname: '/(modals)/pin-confirm',
          params: { jobId, url },
        })
      } catch (e: any) {
        const msg = e?.response?.data?.error || e?.message || 'Unknown error'
        setError(`Failed to queue reel: ${msg}\nURL: ${url}`)
        resetShareIntent()
      }
    }

    handleShare()
  }, [hasShareIntent])

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary, padding: spacing[6] }}>
        <Text style={{ fontSize: fontSizes.sm, color: colors.accentRed, textAlign: 'center', fontFamily: 'IBMPlexMono-Regular' }}>
          {error}
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <ActivityIndicator size="large" color={colors.accentGreen} />
    </View>
  )
}
