import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((val) => {
      if (!val) router.replace('/(auth)/onboarding')
    })
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.appName}>WanderPin</Text>
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
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
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
  primaryBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontFamily: 'DMSans-Medium',
  },
  secondaryBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
  },
})
