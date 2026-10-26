import { useRef, useState, useCallback, useEffect } from 'react'
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, ListRenderItemInfo, ViewToken,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'

const { width, height } = Dimensions.get('window')
const CARD_HEIGHT = height * 0.46
const CARD_WIDTH = CARD_HEIGHT * (640 / 1381) // preserve the screenshots' intrinsic aspect ratio

// ─── Shared screenshot presentation ───────────────────────────────────────────
// A real app screenshot, floated as a card (rounded + shadow/glow) — no fake
// phone bezel or notch. Animates in on mount: card first, then copy below it.

function ScreenshotCard({ source }: { source: number }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(1, { damping: 16, stiffness: 110 })
  }, [])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: 0.92 + progress.value * 0.08 },
      { translateY: (1 - progress.value) * 18 },
    ],
  }))

  return (
    <View style={s.cardWrap}>
      <View style={s.cardGlow} />
      <Animated.View style={[s.card, cardStyle]}>
        <Image source={source} style={s.cardImage} resizeMode="cover" />
      </Animated.View>
    </View>
  )
}

function OnboardCopy({ headline, body }: { headline: string; body: string }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(180, withTiming(1, { duration: 450 }))
  }, [])

  const copyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 10 }],
  }))

  return (
    <Animated.View style={[s.copy, copyStyle]}>
      <Text style={s.headline}>{headline}</Text>
      <Text style={s.body}>{body}</Text>
    </Animated.View>
  )
}

// ─── Screens ───────────────────────────────────────────────────────────────────

function ReelScreen() {
  return (
    <View style={s.screen}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} />
      <ScreenshotCard source={require('../../assets/onboarding/reel-found.png')} />
      <OnboardCopy
        headline={'Save what\nyou scroll past.'}
        body="Share any travel reel. WanderPin finds the place and drops a pin — before you've finished scrolling."
      />
      <View style={{ flex: 1 }} />
    </View>
  )
}

function MapScreen() {
  return (
    <View style={s.screen}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} />
      <ScreenshotCard source={require('../../assets/onboarding/map-pins.png')} />
      <OnboardCopy
        headline={'Your world,\npinned.'}
        body="Every place you save lands on one map. Wishlist, planning, visited — filter however you like."
      />
      <View style={{ flex: 1 }} />
    </View>
  )
}

function PlannerScreen() {
  return (
    <View style={s.screen}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} />
      <ScreenshotCard source={require('../../assets/onboarding/planner.png')} />
      <OnboardCopy
        headline={'Tell us where.\nWe’ll plan it.'}
        body="Chat with your AI planner. It builds a day-by-day route from the places you've actually saved — not generic tourist lists."
      />
      <View style={{ flex: 1 }} />
    </View>
  )
}

const SCREENS = [ReelScreen, MapScreen, PlannerScreen]

// ─── Dot indicator (isolated component to safely use hooks) ──────────────────

function DotIndicator({ active }: { active: boolean }) {
  const dotWidth = useSharedValue(active ? 24 : 8)

  useEffect(() => {
    dotWidth.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 120 })
  }, [active])

  const animStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    backgroundColor: active ? colors.accentGreen : colors.borderMedium,
  }))

  return <Animated.View style={[s.dot, animStyle]} />
}

// ─── Main onboarding container ────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter()
  const flatListRef = useRef<FlatList>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return
      setCurrentIndex(viewableItems[0].index ?? 0)
    },
    [],
  )

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 }

  const finish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true')
    router.replace('/(auth)/welcome')
  }

  const next = () => {
    if (currentIndex < SCREENS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      finish()
    }
  }

  const isLast = currentIndex === SCREENS.length - 1

  return (
    <View style={s.container}>
      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Pager */}
      <FlatList
        ref={flatListRef}
        data={SCREENS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item: Screen }: ListRenderItemInfo<() => JSX.Element>) => (
          <View style={{ width }}>
            <Screen />
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        {/* Dot indicators */}
        <View style={s.dots}>
          {SCREENS.map((_, i) => (
            <DotIndicator key={i} active={i === currentIndex} />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.ctaBtn} onPress={next} activeOpacity={0.85}>
          <Text style={s.ctaBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  skipBtn: {
    position: 'absolute', top: 56, right: spacing[6], zIndex: 10,
    paddingVertical: spacing[2], paddingHorizontal: spacing[3],
  },
  skipText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary },

  // ── Screen base ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingTop: 72,
    paddingHorizontal: spacing[6],
    paddingBottom: 160, // space for bottom bar
  },

  // ── Screenshot card ──────────────────────────────────────────────────────────
  cardWrap: { alignItems: 'center', marginBottom: spacing[8] },
  cardGlow: {
    position: 'absolute',
    width: CARD_WIDTH + 60, height: CARD_HEIGHT * 0.7,
    borderRadius: 999,
    backgroundColor: colors.accentGreen,
    opacity: 0.1,
    top: CARD_HEIGHT * 0.15,
  },
  card: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  cardImage: { width: '100%', height: '100%' },

  // ── Copy block ───────────────────────────────────────────────────────────────
  copy: { gap: spacing[3], alignItems: 'center' },
  headline: {
    fontSize: fontSizes['2xl'], fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, lineHeight: 36, textAlign: 'center',
  },
  body: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, lineHeight: 23, textAlign: 'center',
    maxWidth: 320,
  },

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing[6], paddingBottom: 48, paddingTop: spacing[5],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgPrimary,
  },
  dots: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  ctaBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[6],
  },
  ctaBtnText: { color: '#FFFFFF', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },
})
