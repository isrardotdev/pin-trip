import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '../src/stores/authStore'
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display'
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans'
import {
  IBMPlexMono_400Regular,
} from '@expo-google-fonts/ibm-plex-mono'

// expo-share-intent requires a native build — not available in Expo Go
let ShareIntentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>
try {
  const mod = require('expo-share-intent')
  if (mod?.ShareIntentProvider) {
    ShareIntentProvider = mod.ShareIntentProvider
  }
} catch {}

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const isHydrated = useAuthStore((s) => s.isHydrated)

  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'DMSans-Light': DMSans_300Light,
    'DMSans-Regular': DMSans_400Regular,
    'DMSans-Medium': DMSans_500Medium,
    'IBMPlexMono-Regular': IBMPlexMono_400Regular,
  })

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, isHydrated])

  if (!fontsLoaded || !isHydrated) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ShareIntentProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)/pin-detail" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(modals)/pin-confirm" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(modals)/manual-add" options={{ presentation: 'modal' }} />
          <Stack.Screen name="handle-share" />
        </Stack>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  )
}
