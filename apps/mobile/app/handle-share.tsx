import { useEffect, useRef, useState } from 'react'
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../src/lib/api'
import { useAuthStore } from '../src/stores/authStore'
import { colors, fontSizes, spacing, radius } from '../src/constants/theme'

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
  const handled = useRef(false)

  // Process the intent as soon as it's available
  useEffect(() => {
    if (!hasShareIntent || handled.current) return
    handled.current = true

    if (!user) {
      router.replace('/(auth)/welcome')
      return
    }

    const handleShare = async () => {
      const url = extractUrl(shareIntent)

      if (!url) {
        setError('could_not_process')
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
      } catch {
        setError('could_not_process')
        resetShareIntent()
      }
    }

    handleShare()
  }, [hasShareIntent])

  // Fallback: if no intent arrives within 2s, go home
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handled.current) router.replace('/(tabs)')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary, padding: spacing[6] }}>
        <Text style={{ fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[3] }}>
          Couldn't process this link
        </Text>
        <Text style={{ fontSize: fontSizes.base, fontFamily: 'DMSans-Regular', color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing[8] }}>
          Try sharing again, or add the place manually from the map.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{ backgroundColor: colors.accentGreen, borderRadius: radius.full, paddingVertical: spacing[4], paddingHorizontal: spacing[8] }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' }}>Go to my map</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <ActivityIndicator size="large" color={colors.accentGreen} />
    </View>
  )
}
