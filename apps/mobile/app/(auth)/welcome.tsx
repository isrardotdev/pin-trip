import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AppleAuthentication from 'expo-apple-authentication'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'
import { useAuthStore } from '../../src/stores/authStore'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()
  const { loginWithApple, loginWithGoogle, isLoading } = useAuthStore()
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((val) => {
      if (!val) router.replace('/(auth)/onboarding')
    })
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable)
    }
  }, [])

  const handleApple = async () => {
    try {
      await loginWithApple()
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.response?.data?.error || err?.message || 'Something went wrong')
    }
  }

  const handleGoogle = async () => {
    try {
      await loginWithGoogle()
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.response?.data?.error || err?.message || 'Something went wrong')
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.appName}>PinTrip</Text>
        <Text style={styles.tagline}>Save what you scroll past.</Text>
        <Text style={styles.subTagline}>
          Share a travel reel. It lands on your personal map. Plan your trip with AI.
        </Text>
      </View>

      <View style={styles.steps}>
        {[
          { icon: '📲', title: 'Share a Reel', desc: 'Tap share on any Instagram travel video' },
          { icon: '📍', title: 'Pin Drops', desc: 'AI finds the location and pins it on your map' },
          { icon: '🗺️', title: 'Plan Your Trip', desc: 'Chat with AI to build a personalized itinerary' },
        ].map((step) => (
          <View key={step.title} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accentGreen} style={{ marginVertical: spacing[6] }} />
        ) : (
          <>
            {/* Sign in with Apple — iOS only, shown only if available */}
            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={radius.full}
                style={styles.appleBtn}
                onPress={handleApple}
              />
            )}

            {/* Sign in with Google */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
              <Text style={styles.googleLogo}>G</Text>
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email fallback */}
            <TouchableOpacity style={styles.emailBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text style={styles.emailBtnText}>Continue with email</Text>
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  logoText: {
    fontSize: fontSizes['2xl'],
    color: colors.bgPrimary,
    fontFamily: 'PlayfairDisplay-Bold',
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
  stepIcon: {
    fontSize: 24,
    width: 36,
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
  appleBtn: {
    height: 52,
    width: '100%',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  googleLogo: {
    fontSize: fontSizes.md,
    fontFamily: 'DMSans-Medium',
    color: '#4285F4',
    fontWeight: '700',
  },
  googleBtnText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },
  emailBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  emailBtnText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
})
