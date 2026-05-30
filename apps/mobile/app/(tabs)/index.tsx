import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions, ScrollView,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedScrollHandler,
  useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'
import Constants from 'expo-constants'
import { Pin, PinStatus, Category } from '@pintrip/shared'
import MapNative, { MapNativeRef } from '../../src/components/map/MapNative'
import PinDetailInline from '../../src/components/map/PinDetailInline'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAP_HEIGHT_FULL = SCREEN_HEIGHT * 0.52
const MAP_HEIGHT_COLLAPSED = 120
const COLLAPSE_SCROLL_DISTANCE = 140
const FLY_TO_DEBOUNCE_MS = 350

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

// Zoom level by category — specific venues zoom in tight, broad areas stay wider
const CATEGORY_ZOOM: Record<string, number> = {
  FOOD:      16,  // restaurant / café — street level, building visible
  STAY:      16,  // hotel / guesthouse — property level
  CULTURE:   15,  // temple / museum — block level, landmark clear
  OFFBEAT:   14,  // quirky specific spot — neighbourhood level
  ADVENTURE: 13,  // trek start, campsite — trail/area visible
  NATURE:    12,  // valley / forest / river — broad landscape visible
}

const STATUS_COLORS: Record<PinStatus, string> = {
  WISHLIST: colors.textTertiary,
  PLANNING: colors.accentAmber,
  VISITED: colors.accentGreen,
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ─── Pin card ─────────────────────────────────────────────────────────────────

function PinCard({ pin, onPress, selected, isNew }: { pin: Pin; onPress: () => void; selected: boolean; isNew?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.pinCard, selected && styles.pinCardSelected, isNew && styles.pinCardNew]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
          <Text style={styles.sourceBadge}>{pin.source === 'INSTAGRAM' ? 'IG' : pin.source}</Text>
        )}
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[pin.status] }]} />
      </View>
    </TouchableOpacity>
  )
}


// ─── Home screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { pins, fetchPins, fetchPolygon } = usePinsStore()
  const { newPinId } = useLocalSearchParams<{ newPinId?: string }>()

  const [statusFilter, setStatusFilter] = useState<PinStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'ALL'>('ALL')
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [newlyAddedPinId, setNewlyAddedPinId] = useState<string | null>(null)
  const [selectedBoundary, setSelectedBoundary] = useState<GeoJSON.FeatureCollection | null>(null)

  const mapRef = useRef<MapNativeRef>(null)
  const flyToTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollY = useSharedValue(0)
  const [mapKey, setMapKey] = useState(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y },
  })

  const mapAnimStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, COLLAPSE_SCROLL_DISTANCE], [MAP_HEIGHT_FULL, MAP_HEIGHT_COLLAPSED], Extrapolation.CLAMP),
  }))

  const fabAnimStyle = useAnimatedStyle(() => ({
    top: interpolate(scrollY.value, [0, COLLAPSE_SCROLL_DISTANCE], [MAP_HEIGHT_FULL - 68, MAP_HEIGHT_COLLAPSED - 68], Extrapolation.CLAMP),
  }))

  useEffect(() => { fetchPins() }, [])

  // Auto-select newly added pin from share flow and clear highlight after 4s
  useEffect(() => {
    if (newPinId) {
      setNewlyAddedPinId(newPinId)
      selectPin(newPinId)
      const t = setTimeout(() => setNewlyAddedPinId(null), 4000)
      return () => clearTimeout(t)
    }
  }, [newPinId])

  const filteredPins = pins.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false
    return true
  })

  const selectedIndex = selectedPinId ? filteredPins.findIndex(p => p.id === selectedPinId) : -1
  const selectedPin = selectedIndex >= 0 ? filteredPins[selectedIndex] : null

  const selectPin = (pinId: string) => {
    setSelectedPinId(pinId)
    setSelectedBoundary(null)
    const pin = pins.find(p => p.id === pinId)
    if (!pin) return

    if (flyToTimer.current) clearTimeout(flyToTimer.current)

    if (pin.locationType === 'AREA' && pin.osmType && pin.osmId) {
      // Fetch polygon then fitBounds
      flyToTimer.current = setTimeout(async () => {
        const boundary = await fetchPolygon(pin.osmType!, pin.osmId!)
        if (boundary) {
          setSelectedBoundary(boundary)
          // Compute bbox from polygon coordinates and fitBounds
          const coords = boundary.features.flatMap(f => {
            const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon
            if (geom.type === 'Polygon') return geom.coordinates.flat()
            if (geom.type === 'MultiPolygon') return geom.coordinates.flat(2)
            return []
          }) as [number, number][]
          if (coords.length > 0) {
            const lngs = coords.map((c: [number, number]) => c[0])
            const lats = coords.map((c: [number, number]) => c[1])
            mapRef.current?.fitBounds(
              [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
              { padding: 40, duration: 800 },
            )
          }
        } else {
          // Fallback to flyTo if polygon unavailable
          mapRef.current?.flyTo(pin.lng, pin.lat, CATEGORY_ZOOM[pin.category] ?? 13)
        }
      }, FLY_TO_DEBOUNCE_MS)
    } else {
      const zoom = CATEGORY_ZOOM[pin.category] ?? 13
      flyToTimer.current = setTimeout(() => {
        mapRef.current?.flyTo(pin.lng, pin.lat, zoom)
      }, FLY_TO_DEBOUNCE_MS)
    }
  }

  const clearSelection = () => {
    setSelectedPinId(null)
    setSelectedBoundary(null)
    if (flyToTimer.current) clearTimeout(flyToTimer.current)
    mapRef.current?.fitAllPins()
  }

  const goToPrev = () => {
    if (selectedIndex > 0) selectPin(filteredPins[selectedIndex - 1].id)
  }

  const goToNext = () => {
    if (selectedIndex < filteredPins.length - 1) selectPin(filteredPins[selectedIndex + 1].id)
  }

  return (
    <View style={styles.container}>

      {/* ── Map ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.mapContainer, mapAnimStyle]}>
        <MapNative
          key={mapKey}
          ref={mapRef}
          pins={filteredPins}
          selectedPinId={selectedPinId}
          onPinPress={selectPin}
          mapStyle={Constants.expoConfig?.extra?.maptilerStyleUrl ?? process.env.EXPO_PUBLIC_MAPTILER_STYLE_URL}
          selectedBoundary={selectedBoundary}
        />
      </Animated.View>

      {/* ── FAB ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.fabContainer, fabAnimStyle]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(modals)/manual-add')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom section: list OR detail panel ─────────────── */}
      {selectedPin ? (
        <PinDetailInline
          pin={selectedPin}
          index={selectedIndex}
          total={filteredPins.length}
          onClose={clearSelection}
          onPrev={goToPrev}
          onNext={goToNext}
          onBeforeDelete={() => setMapKey(k => k + 1)}
          insetBottom={insets.bottom}
        />
      ) : (
        <Animated.ScrollView
          style={styles.listSection}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          decelerationRate={0.92}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        >
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Your Pins</Text>
            <View style={styles.pinCountBadge}>
              <Text style={styles.pinCount}>{filteredPins.length}</Text>
            </View>
          </View>

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
                selected={pin.id === selectedPinId}
                isNew={pin.id === newlyAddedPinId}
                onPress={() => selectPin(pin.id)}
              />
            ))
          )}
        </Animated.ScrollView>
      )}
    </View>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  mapContainer: { width: '100%', overflow: 'hidden', backgroundColor: colors.darkSurface },

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
  pinCardSelected: {
    borderWidth: 1.5, borderColor: colors.accentGreen,
  },
  pinCardNew: {
    borderWidth: 1.5, borderColor: colors.accentGreen,
    backgroundColor: '#F0FAF5',
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
