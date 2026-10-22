import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'
import { useAuthStore } from '../../src/stores/authStore'
import GoogleLogo from '../../src/components/GoogleLogo'

const { width } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()
  const { loginWithGoogle } = useAuthStore()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((val) => {
      if (!val) router.replace('/(auth)/onboarding')
    })
  }, [])

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await loginWithGoogle()
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Google sign-in failed. Please try again.'
      Alert.alert('Sign-In Failed', msg)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <Image source={require('../../assets/icon.png')} style={styles.logoMark} />
        <Text style={styles.appName}>WanderPin</Text>
        <Text style={styles.tagline}>Save what you scroll past.</Text>
        <Text style={styles.subTagline}>
          Share a travel reel. It lands on your personal map. Plan your trip with AI.
        </Text>
      </View>

      <View style={styles.steps}>
        {[
          { icon: 'share-outline' as const, title: 'Share a Reel', desc: 'Tap share on any Instagram travel video' },
          { icon: 'location-outline' as const, title: 'Pin Drops', desc: 'AI finds the location and pins it on your map' },
          { icon: 'chatbubble-ellipses-outline' as const, title: 'Plan Your Trip', desc: 'Chat with AI to build a personalized itinerary' },
        ].map((step) => (
          <View key={step.title} style={styles.stepRow}>
            <View style={styles.stepIconBadge}>
              <Ionicons name={step.icon} size={20} color={colors.accentGreen} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.googleBtn, isSigningIn && styles.disabled]}
          onPress={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <View style={styles.googleIconCircle}>
                <GoogleLogo size={18} />
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing[6],
    paddingTop: 80,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  appName: {
    fontSize: fontSizes['3xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  tagline: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Italic',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  subTagline: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing[4],
  },
  steps: {
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  stepIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing[3],
  },
  googleBtn: {
    flexDirection: 'row',
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    minHeight: 56,
  },
  disabled: { opacity: 0.6 },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontFamily: 'DMSans-Medium',
  },
})
