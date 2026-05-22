import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../src/lib/api'
import { useAuthStore } from '../src/stores/authStore'
import { colors } from '../src/constants/theme'

// expo-share-intent is only available in native builds
let useShareIntentContext: () => { hasShareIntent: boolean; shareIntent: any; resetShareIntent: () => void }
try {
  useShareIntentContext = require('expo-share-intent').useShareIntentContext
} catch {
  useShareIntentContext = () => ({ hasShareIntent: false, shareIntent: null, resetShareIntent: () => {} })
}

export default function HandleShareScreen() {
  const router = useRouter()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext()
  const user = useAuthStore((s) => s.user)

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
      const url = shareIntent?.webUrl || shareIntent?.text || ''
      if (!url) {
        router.replace('/(tabs)')
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
        resetShareIntent()
        router.replace('/(tabs)')
      }
    }

    handleShare()
  }, [hasShareIntent])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPrimary }}>
      <ActivityIndicator size="large" color={colors.accentGreen} />
    </View>
  )
}
