import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions, ScrollView, Animated,
  NativeModules,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'
import { Pin, PinStatus, Category } from '@pintrip/shared'

// MapLibre — only load if the native module is registered (not available in Expo Go)
let MapLibreGL: any = null
const hasMapLibreNative = !!(NativeModules.MLRNModule ?? NativeModules.RCTMLNModule ?? NativeModules.MapLibreGL)
if (hasMapLibreNative) {
  try {
    MapLibreGL = require('@maplibre/maplibre-react-native').default
    MapLibreGL.setAccessToken(null)
  } catch {}
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAP_HEIGHT_FULL = SCREEN_HEIGHT * 0.52
const MAP_HEIGHT_COLLAPSED = 120
const COLLAPSE_SCROLL_DISTANCE = 80

const MAPTILER_STYLE = process.env.EXPO_PUBLIC_MAPTILER_STYLE_URL || ''

const STATUS_FILTERS: { label: string; value: PinStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Wishlist', value: 'WISHLIST' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'Visited', value: 'VISITED' },
]

const CATEGORY_FILTERS: { label: string; value: Category }[] = [
  { label: '🌿 Nature', value: 'NATURE' },
  { label: '🍜 Food', value: 'FOOD' },
  { label: '⛰️ Adventure', value: 'ADVENTURE' },
  { label: '🏛️ Culture', value: 'CULTURE' },
  { label: '🏡 Stay', value: 'STAY' },
  { label: '🧭 Offbeat', value: 'OFFBEAT' },
]

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

const STATUS_DOT_COLORS: Record<PinStatus, string> = {
  WISHLIST: colors.textTertiary,
  PLANNING: colors.accentAmber,
  VISITED: colors.accentGreen,
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Pin card ─────────────────────────────────────────────────────────────────

function PinCard({ pin, onPress }: { pin: Pin; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.pinCard} onPress={onPress} activeOpacity={0.7}>
      {pin.sourceThumbnailUrl ? (
        <Image source={{ uri: pin.sourceThumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.categoryIcon}>{CATEGORY_ICONS[pin.category] || '📍'}</Text>
        </View>
      )}
      <View style={styles.pinInfo}>
        <Text style={styles.pinName} numberOfLines={1}>{pin.name}</Text>
        <Text style={styles.pinLocation} numberOfLines={1}>
          {[pin.city, pin.state].filter(Boolean).join(', ')}
        </Text>
      </View>
      <View style={styles.pinMeta}>
        {pin.source !== 'MANUAL' && (
          <Text style={styles.sourceBadge}>
            {pin.source === 'INSTAGRAM' ? 'IG' : pin.source}
          </Text>
        )}
        <View style={[styles.statusDot, { backgroundColor: STATUS_DOT_COLORS[pin.status] }]} />
      </View>
    </TouchableOpacity>
  )
}

// ─── Home screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { pins, fetchPins } = usePinsStore()

  const [statusFilter, setStatusFilter] = useState<PinStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL')

  // RN built-in Animated for map collapse (works everywhere including Expo Go)
  const scrollY = useRef(new Animated.Value(0)).current

  const mapHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL_DISTANCE],
    outputRange: [MAP_HEIGHT_FULL, MAP_HEIGHT_COLLAPSED],
    extrapolate: 'clamp',
  })

  const fabTop = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL_DISTANCE],
    outputRange: [MAP_HEIGHT_FULL - 68, MAP_HEIGHT_COLLAPSED - 68],
    extrapolate: 'clamp',
  })

  useEffect(() => { fetchPins() }, [])

  const filteredPins = pins.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
    return true
  })

  return (
    <View style={styles.container}>

      {/* ── Map ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        {MapLibreGL && MAPTILER_STYLE ? (
          <MapLibreGL.MapView
            style={StyleSheet.absoluteFill}
            styleURL={MAPTILER_STYLE}
            compassEnabled={false}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapLibreGL.Camera
              defaultSettings={{
                centerCoordinate: [78.9629, 20.5937],
                zoomLevel: 4,
              }}
            />
            {filteredPins.map((pin) => (
              <MapLibreGL.MarkerView key={pin.id} coordinate={[pin.lng, pin.lat]}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(modals)/pin-detail', params: { id: pin.id } })}
                >
                  <View style={[styles.mapPin, { backgroundColor: STATUS_DOT_COLORS[pin.status as PinStatus] }]} />
                </TouchableOpacity>
              </MapLibreGL.MarkerView>
            ))}
          </MapLibreGL.MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackIcon}>🗺️</Text>
            <Text style={styles.mapFallbackText}>
              {hasMapLibreNative ? 'Loading map...' : 'Map available in development build'}
            </Text>
            {pins.length > 0 && (
              <Text style={styles.mapFallbackSub}>{pins.length} pins saved</Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* ── FAB ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.fabContainer, { top: fabTop }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(modals)/manual-add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Pin list ─────────────────────────────────────────── */}
      <Animated.ScrollView
        style={styles.listSection}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Pins</Text>
          <View style={styles.pinCountBadge}>
            <Text style={styles.pinCount}>{filteredPins.length}</Text>
          </View>
        </View>

        {/* Status + category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              onPress={() => setStatusFilter((prev) => prev === f.value ? 'ALL' : f.value)}
            />
          ))}
          <View style={styles.chipDivider} />
          {CATEGORY_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={categoryFilter === f.value}
              onPress={() => setCategoryFilter((prev) => prev === f.value ? 'ALL' : f.value)}
            />
          ))}
        </ScrollView>

        {/* Empty state */}
        {filteredPins.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {pins.length === 0 ? 'No pins yet.' : 'No pins match this filter.'}
            </Text>
            <Text style={styles.emptySubText}>
              {pins.length === 0
                ? 'Share a travel reel to start building your map.'
                : 'Try a different filter above.'}
            </Text>
          </View>
        ) : (
          filteredPins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              onPress={() => router.push({ pathname: '/(modals)/pin-detail', params: { id: pin.id } })}
            />
          ))
        )}
      </Animated.ScrollView>
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  mapContainer: { width: '100%', overflow: 'hidden', backgroundColor: colors.darkSurface },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  mapFallbackIcon: { fontSize: 32 },
  mapFallbackText: {
    color: colors.textTertiary, fontFamily: 'DMSans-Regular',
    fontSize: fontSizes.sm, textAlign: 'center', paddingHorizontal: spacing[6],
  },
  mapFallbackSub: { color: colors.textTertiary, fontFamily: 'IBMPlexMono-Regular', fontSize: fontSizes.xs },
  mapPin: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },

  fabContainer: { position: 'absolute', right: spacing[5], zIndex: 20 },
  fab: {
    width: 52, height: 52, borderRadius: radius.full,
    backgroundColor: colors.accentGreen, alignItems: 'center', justifyContent: 'center',
    ...shadows.pin,
  },

  listSection: { flex: 1 },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2],
  },
  listTitle: { fontSize: fontSizes.lg, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },
  pinCountBadge: { backgroundColor: colors.bgSecondary, borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 2 },
  pinCount: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },

  chipsScroll: { marginBottom: spacing[3] },
  chipsRow: { paddingHorizontal: spacing[4], gap: spacing[2], alignItems: 'center' },
  chip: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  chipText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF', fontFamily: 'DMSans-Medium' },
  chipDivider: { width: 1, height: 20, backgroundColor: colors.borderLight, marginHorizontal: spacing[1] },

  emptyState: { alignItems: 'center', paddingTop: spacing[10], paddingHorizontal: spacing[6] },
  emptyText: { fontSize: fontSizes.md, fontFamily: 'PlayfairDisplay-Italic', color: colors.textSecondary, marginBottom: spacing[2] },
  emptySubText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary, textAlign: 'center' },

  pinCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing[3], marginHorizontal: spacing[4], marginBottom: spacing[2],
    ...shadows.card,
  },
  thumbnail: { width: 48, height: 48, borderRadius: radius.sm, marginRight: spacing[3] },
  thumbnailPlaceholder: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] },
  categoryIcon: { fontSize: 22 },
  pinInfo: { flex: 1 },
  pinName: { fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.textPrimary, marginBottom: 2 },
  pinLocation: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  pinMeta: { alignItems: 'flex-end', gap: spacing[2], marginLeft: spacing[2] },
  sourceBadge: { fontSize: 10, fontFamily: 'IBMPlexMono-Regular', color: colors.textTertiary, backgroundColor: colors.bgSecondary, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
})
