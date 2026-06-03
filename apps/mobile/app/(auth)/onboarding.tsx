import { useRef, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, ListRenderItemInfo, ViewToken,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'

const { width } = Dimensions.get('window')

// ─── Map dot data (Screen 2) ──────────────────────────────────────────────────

const MAP_DOTS = [
  { x: 0.18, y: 0.22, status: 'VISITED' },
  { x: 0.55, y: 0.15, status: 'WISHLIST' },
  { x: 0.72, y: 0.30, status: 'PLANNING' },
  { x: 0.30, y: 0.42, status: 'VISITED' },
  { x: 0.80, y: 0.48, status: 'WISHLIST' },
  { x: 0.12, y: 0.60, status: 'PLANNING' },
  { x: 0.48, y: 0.55, status: 'VISITED' },
  { x: 0.65, y: 0.68, status: 'WISHLIST' },
  { x: 0.25, y: 0.75, status: 'VISITED' },
  { x: 0.88, y: 0.22, status: 'VISITED' },
  { x: 0.40, y: 0.82, status: 'PLANNING' },
  { x: 0.75, y: 0.80, status: 'WISHLIST' },
  { x: 0.60, y: 0.38, status: 'VISITED' },
  { x: 0.08, y: 0.38, status: 'WISHLIST' },
  { x: 0.92, y: 0.62, status: 'PLANNING' },
]

const DOT_COLOR: Record<string, string> = {
  VISITED: colors.accentGreen,
  PLANNING: '#C4862A',
  WISHLIST: '#FFFFFF',
}

// ─── Screen components ────────────────────────────────────────────────────────

function ReelScreen() {
  return (
    <View style={s.screen}>
      <StatusBar style="dark" />

      {/* Spacer pushes reel + copy toward the bottom */}
      <View style={{ flex: 1 }} />

      {/* Dark hero — reel mockup */}
      <View style={s.reelHero}>
        {/* Phone frame */}
        <View style={s.reelFrame}>
          {/* Simulated video content */}
          <View style={s.reelContent}>
            <View style={s.reelGradientTop} />
            <Text style={s.reelLocation}>Dawki River</Text>
            <Text style={s.reelCaption}>crystal clear waters of meghalaya</Text>
            <View style={s.reelGradientBottom} />
          </View>

          {/* Floating "Pinned!" confirmation card */}
          <View style={s.pinnedCard}>
            <View style={s.pinnedDot} />
            <View style={s.pinnedInfo}>
              <Text style={s.pinnedTitle}>Pinned!</Text>
              <Text style={s.pinnedPlace}>Dawki River · Meghalaya</Text>
            </View>
            <Text style={s.pinnedCheck}>✓</Text>
          </View>

          {/* IG-style side controls */}
          <View style={s.reelSideControls}>
            <Text style={s.reelIcon}>♥{'\n'}<Text style={s.reelIconLabel}>24k</Text></Text>
            <Text style={s.reelIcon}>✈</Text>
          </View>
        </View>

        {/* Glow behind frame */}
        <View style={s.reelGlow} />
      </View>

      {/* Text copy */}
      <View style={s.copy}>
        <Text style={[s.headline, { color: colors.textPrimary }]}>Save what{'\n'}you scroll past.</Text>
        <Text style={[s.body, { color: colors.textSecondary }]}>
          Share any travel reel to WanderPin. The AI finds the location and drops a pin on your personal map — in seconds.
        </Text>
      </View>
    </View>
  )
}

function MapScreen() {
  const DOT_AREA_HEIGHT = 260

  return (
    <View style={[s.screen, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar style="dark" />

      {/* Dot map visualization */}
      <View style={[s.mapArea, { height: DOT_AREA_HEIGHT }]}>
        {/* Subtle grid lines */}
        {[0.33, 0.66].map((pos) => (
          <View key={`h${pos}`} style={[s.gridLine, { top: DOT_AREA_HEIGHT * pos, width: '100%', height: 1 }]} />
        ))}
        {[0.25, 0.5, 0.75].map((pos) => (
          <View key={`v${pos}`} style={[s.gridLine, { left: (width - 48) * pos, height: DOT_AREA_HEIGHT, width: 1 }]} />
        ))}

        {/* Pins */}
        {MAP_DOTS.map((dot, i) => (
          <View
            key={i}
            style={[
              s.mapDot,
              {
                left: dot.x * (width - 48),
                top: dot.y * DOT_AREA_HEIGHT,
                backgroundColor: DOT_COLOR[dot.status],
                borderWidth: dot.status === 'WISHLIST' ? 2 : 0,
                borderColor: colors.accentGreen,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {[
          { status: 'VISITED', label: 'Visited' },
          { status: 'PLANNING', label: 'Planning' },
          { status: 'WISHLIST', label: 'Wishlist' },
        ].map(({ status, label }) => (
          <View key={status} style={s.legendItem}>
            <View style={[
              s.legendDot,
              {
                backgroundColor: DOT_COLOR[status],
                borderWidth: status === 'WISHLIST' ? 1.5 : 0,
                borderColor: colors.accentGreen,
              },
            ]} />
            <Text style={s.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Text copy */}
      <View style={s.copy}>
        <Text style={[s.headline, { color: colors.textPrimary }]}>Your world,{'\n'}pinned.</Text>
        <Text style={[s.body, { color: colors.textSecondary }]}>
          Every saved place lives on your personal map. Filter by status, category, or region — and watch your travel wishlist come alive.
        </Text>
      </View>
    </View>
  )
}

function PlannerScreen() {
  const days = [
    {
      day: 1,
      title: 'Arrive in Guwahati',
      pins: ['Brahmaputra River', 'Kamakhya Temple'],
      travel: 'Fly into LGB — 2hr from Delhi',
    },
    {
      day: 2,
      title: 'Dawki & the glass river',
      pins: ['Dawki River', 'Umngot Village'],
      travel: '~5hr drive from Guwahati',
    },
  ]

  return (
    <View style={[s.screen, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar style="dark" />

      {/* Photo placeholder */}
      <View style={s.photoPlaceholder}>
        <View style={s.photoInner}>
          <Text style={s.photoIcon}>🏔</Text>
          <Text style={s.photoLabel}>Northeast India</Text>
        </View>
      </View>

      {/* Mock itinerary cards */}
      <View style={s.itineraryCards}>
        {days.map((day) => (
          <View key={day.day} style={s.dayCard}>
            <View style={s.dayHeader}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>Day {day.day}</Text>
              </View>
              <Text style={s.dayTitle}>{day.title}</Text>
            </View>
            <View style={s.dayPins}>
              {day.pins.map((pin) => (
                <View key={pin} style={s.pinChip}>
                  <Text style={s.pinChipDot}>·</Text>
                  <Text style={s.pinChipText}>{pin}</Text>
                </View>
              ))}
            </View>
            <Text style={s.travelNote}>{day.travel}</Text>
          </View>
        ))}
      </View>

      {/* Text copy */}
      <View style={[s.copy, { marginTop: spacing[4] }]}>
        <Text style={[s.headline, { color: colors.textPrimary, fontSize: fontSizes.xl }]}>
          You pick the places.{'\n'}We connect the dots.
        </Text>
        <Text style={[s.body, { color: colors.textSecondary }]}>
          Chat with your travel assistant. It weaves your saved pins into a curated day-by-day route — your choices, in the smartest order.
        </Text>
      </View>
    </View>
  )
}

const SCREENS = [ReelScreen, MapScreen, PlannerScreen]

// ─── Dot indicator (isolated component to safely use hooks) ──────────────────

function DotIndicator({ active }: { active: boolean }) {
  const dotWidth = useSharedValue(active ? 24 : 8)

  if (active && dotWidth.value !== 24) dotWidth.value = withSpring(24, { damping: 15, stiffness: 120 })
  if (!active && dotWidth.value !== 8) dotWidth.value = withSpring(8, { damping: 15, stiffness: 120 })

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

  // ── Reel mockup (Screen 1) ───────────────────────────────────────────────────
  reelHero: { alignItems: 'center', marginBottom: spacing[5] },
  reelGlow: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    backgroundColor: colors.accentGreen,
    opacity: 0.12,
    bottom: -20,
  },
  reelFrame: {
    width: 240, height: 380,
    borderRadius: radius.lg,
    backgroundColor: '#2A2A27',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reelContent: {
    flex: 1,
    backgroundColor: '#0A1A10',
    justifyContent: 'flex-end',
    padding: spacing[3],
  },
  reelGradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  reelGradientBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  reelLocation: {
    fontSize: fontSizes.md, fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF', marginBottom: 2,
  },
  reelCaption: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.7)', marginBottom: spacing[5],
  },
  reelSideControls: {
    position: 'absolute', right: spacing[3], bottom: 80,
    alignItems: 'center', gap: spacing[4],
  },
  reelIcon: {
    fontSize: 18, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', fontFamily: 'DMSans-Regular',
  },
  reelIconLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },

  // Floating pinned card
  pinnedCard: {
    position: 'absolute', bottom: spacing[4], left: spacing[3], right: spacing[3],
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md, padding: spacing[3], gap: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  pinnedDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.accentGreen,
  },
  pinnedInfo: { flex: 1 },
  pinnedTitle: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium',
    color: colors.accentGreen, marginBottom: 1,
  },
  pinnedPlace: {
    fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular',
    color: colors.textSecondary,
  },
  pinnedCheck: {
    fontSize: fontSizes.md, color: colors.accentGreen, fontFamily: 'DMSans-Medium',
  },

  // ── Map dots (Screen 2) ──────────────────────────────────────────────────────
  mapArea: {
    marginHorizontal: -spacing[6],
    backgroundColor: '#EDE8DE',
    marginBottom: spacing[4], position: 'relative', overflow: 'hidden',
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(200,191,176,0.5)' },
  mapDot: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    marginLeft: -6, marginTop: -6,
    shadowColor: colors.accentGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4,
  },
  legend: {
    flexDirection: 'row', gap: spacing[5],
    marginBottom: spacing[6], paddingHorizontal: spacing[1],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },

  // ── Planner cards (Screen 3) ─────────────────────────────────────────────────
  photoPlaceholder: {
    height: 140, borderRadius: radius.lg,
    backgroundColor: '#C8BFB0',
    marginBottom: spacing[4],
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  photoInner: { alignItems: 'center', gap: spacing[1] },
  photoIcon: { fontSize: 36 },
  photoLabel: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  itineraryCards: { gap: spacing[3] },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md, padding: spacing[4],
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: '#1C1C1A',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
  dayBadge: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.sm, paddingHorizontal: spacing[2], paddingVertical: 3,
  },
  dayBadgeText: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: '#FFFFFF',
  },
  dayTitle: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: colors.textPrimary, flex: 1 },
  dayPins: { gap: 3, marginBottom: spacing[2] },
  pinChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  pinChipDot: { fontSize: fontSizes.md, color: colors.accentGreen, fontFamily: 'DMSans-Regular' },
  pinChipText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  travelNote: {
    fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary, marginTop: spacing[1],
  },

  // ── Copy block ───────────────────────────────────────────────────────────────
  copy: { gap: spacing[3] },
  headline: {
    fontSize: fontSizes['2xl'], fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF', lineHeight: 36,
  },
  body: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.65)', lineHeight: 23,
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
