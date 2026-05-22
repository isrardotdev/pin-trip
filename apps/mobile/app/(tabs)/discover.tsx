import { useEffect, useState, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Dimensions, Animated,
} from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { DiscoverPlace } from '@pintrip/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAP_HEIGHT_FULL = SCREEN_HEIGHT * 0.42
const MAP_HEIGHT_COLLAPSED = 120
const COLLAPSE_SCROLL_DISTANCE = 80
const FLY_DEBOUNCE_MS = 300

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

// ─── Place card ───────────────────────────────────────────────────────────────

function PlaceCard({
  place, selected, onPress, onSave,
}: {
  place: DiscoverPlace; selected: boolean; onPress: () => void; onSave: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={styles.cardPhoto} resizeMode="cover" />
      ) : (
        <View style={styles.cardPhotoPlaceholder}>
          <Text style={styles.cardPhotoIcon}>{CATEGORY_ICONS[place.category]}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{place.name}</Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{CATEGORY_ICONS[place.category]} {place.category}</Text>
          </View>
        </View>
        <Text style={styles.cardLocation}>{place.city}, {place.state}</Text>
        {place.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{place.description}</Text>
        ) : null}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>+ Save to my map</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

// ─── Discover screen ──────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { addPin } = usePinsStore()

  const mapRef = useRef<MapView>(null)
  const listRef = useRef<FlatList<DiscoverPlace>>(null)
  const flyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollY = useRef(new Animated.Value(0)).current

  const mapHeight = scrollY.interpolate({
    inputRange: [0, COLLAPSE_SCROLL_DISTANCE],
    outputRange: [MAP_HEIGHT_FULL, MAP_HEIGHT_COLLAPSED],
    extrapolate: 'clamp',
  })

  useEffect(() => {
    api.get('/discover')
      .then((res) => setPlaces(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const flyTo = (place: DiscoverPlace) => {
    if (flyTimer.current) clearTimeout(flyTimer.current)
    flyTimer.current = setTimeout(() => {
      mapRef.current?.animateToRegion({
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6,
      }, 800)
    }, FLY_DEBOUNCE_MS)
  }

  const selectPlace = (place: DiscoverPlace) => {
    setSelectedId(place.id)
    flyTo(place)
    const index = places.findIndex(p => p.id === place.id)
    if (index >= 0) {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.1 })
    }
  }

  const handleSave = async (place: DiscoverPlace) => {
    try {
      await addPin({
        name: place.name,
        city: place.city,
        state: place.state,
        country: place.country,
        lat: place.lat,
        lng: place.lng,
        source: 'DISCOVER',
        category: place.category,
        status: 'WISHLIST',
      })
    } catch {}
  }

  const initialRegion = places.length > 0
    ? { latitude: places[0].lat, longitude: places[0].lng, latitudeDelta: 20, longitudeDelta: 20 }
    : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 35, longitudeDelta: 35 }

  return (
    <View style={styles.container}>

      {/* ── Map ── */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          showsUserLocation
          showsCompass={false}
          rotateEnabled={false}
        >
          {places.map((place) => {
            const isSelected = place.id === selectedId
            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                onPress={() => selectPlace(place)}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={isSelected ? 1 : 0}
              >
                <View style={[styles.pin, isSelected && styles.pinSelected]} />
              </Marker>
            )
          })}
        </MapView>
      </Animated.View>

      {/* ── List ── */}
      {isLoading ? (
        <ActivityIndicator color={colors.accentGreen} style={{ marginTop: spacing[10] }} />
      ) : (
        <Animated.FlatList
          ref={listRef}
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              selected={item.id === selectedId}
              onPress={() => selectPlace(item)}
              onSave={() => handleSave(item)}
            />
          )}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Discover</Text>
              <Text style={styles.listSubtitle}>Curated places for Indian wanderers</Text>
            </View>
          }
          contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: 100 + insets.bottom }}
          ItemSeparatorComponent={() => <View style={{ height: spacing[4] }} />}
          onScrollToIndexFailed={() => {}}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  mapContainer: { width: '100%', overflow: 'hidden', backgroundColor: colors.darkSurface },

  pin: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.accentGreenLight,
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4,
  },
  pinSelected: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.accentGreen,
    borderWidth: 3,
  },

  listHeader: {
    paddingTop: spacing[4], paddingBottom: spacing[3],
  },
  listTitle: { fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },
  listSubtitle: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.card,
  },
  cardSelected: { borderColor: colors.accentGreen },
  cardPhoto: { width: '100%', height: 180 },
  cardPhotoPlaceholder: {
    width: '100%', height: 180,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  cardPhotoIcon: { fontSize: 48 },
  cardBody: { padding: spacing[4] },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: spacing[2], marginBottom: spacing[1],
  },
  cardName: { flex: 1, fontSize: fontSizes.lg, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },
  categoryTag: {
    backgroundColor: colors.bgSecondary, borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  categoryTagText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.textSecondary },
  cardLocation: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary, marginBottom: spacing[2] },
  cardDesc: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary, lineHeight: 19, marginBottom: spacing[3] },
  saveBtn: {
    backgroundColor: colors.accentGreen, borderRadius: radius.full,
    paddingVertical: spacing[3], alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },
})
