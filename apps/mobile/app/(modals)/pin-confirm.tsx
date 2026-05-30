import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  TextInput, FlatList, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import axios from 'axios'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

type State = 'processing' | 'confirm' | 'fallback'

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

interface PlaceData {
  placeId: string
  name: string
  city?: string | null
  state?: string | null
  country: string
  lat: number
  lng: number
  thumbnailUrl?: string | null
  category: string
  confidence: number
  sourceUrl: string
  osmType?: string | null
  osmId?: string | null
  locationType?: string | null
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: { city?: string; town?: string; village?: string; state?: string; country?: string }
}

export default function PinConfirmModal() {
  const { jobId, url } = useLocalSearchParams<{ jobId: string; url: string }>()
  const router = useRouter()
  const { fetchPins } = usePinsStore()

  const [state, setState] = useState<State>('processing')
  const [placeData, setPlaceData] = useState<PlaceData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fallback search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Poll job until done
  useEffect(() => {
    if (!jobId) return
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/pins/parse/${jobId}`)
        const { status, placeData: pd } = res.data.data
        if (status === 'done') {
          clearInterval(pollInterval)
          if (pd) {
            setPlaceData(pd)
            setState('confirm')
          } else {
            setState('fallback')
          }
        } else if (status === 'failed') {
          clearInterval(pollInterval)
          setState('fallback')
        }
      } catch {
        // keep polling
      }
    }, 2000)

    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      setState('fallback')
    }, 60000)

    return () => { clearInterval(pollInterval); clearTimeout(timeout) }
  }, [jobId])

  const handleSave = async () => {
    if (!placeData) return
    setIsSaving(true)
    try {
      const res = await api.post('/pins', {
        placeId: placeData.placeId,
        name: placeData.name,
        city: placeData.city,
        state: placeData.state,
        country: placeData.country,
        lat: placeData.lat,
        lng: placeData.lng,
        source: 'INSTAGRAM',
        sourceUrl: placeData.sourceUrl,
        sourceThumbnailUrl: placeData.thumbnailUrl,
        category: placeData.category,
        status: 'WISHLIST',
        osmType: placeData.osmType,
        osmId: placeData.osmId,
        locationType: placeData.locationType,
      })
      await fetchPins()
      const newPinId = res.data.data?.id
      router.replace(newPinId ? `/(tabs)?newPinId=${newPinId}` : '/(tabs)')
    } catch {
      Alert.alert('Error', 'Failed to save pin. Try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => router.replace('/(tabs)')

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
        params: { q: searchQuery, format: 'json', limit: 5, addressdetails: 1 },
        headers: { 'User-Agent': 'PinTrip/1.0' },
      })
      setSearchResults(res.data)
    } catch {}
    finally { setIsSearching(false) }
  }

  const handleSelectResult = async (result: NominatimResult) => {
    setIsSaving(true)
    try {
      const addr = result.address
      const city = addr.city || addr.town || addr.village || ''
      const nameParts = result.display_name.split(', ')
      const res = await api.post('/pins', {
        name: nameParts[0] || searchQuery,
        city,
        state: addr.state,
        country: addr.country || 'India',
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        source: 'INSTAGRAM',
        sourceUrl: url,
        status: 'WISHLIST',
        category: 'NATURE',
      })
      await fetchPins()
      const newPinId = res.data.data?.id
      router.replace(newPinId ? `/(tabs)?newPinId=${newPinId}` : '/(tabs)')
    } catch {
      Alert.alert('Error', 'Failed to save pin')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Processing ──────────────────────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accentGreen} style={{ marginBottom: spacing[5] }} />
        <Text style={styles.processingTitle}>Finding the location...</Text>
        <Text style={styles.processingUrl} numberOfLines={1}>{url}</Text>
        <Text style={styles.processingHint}>Usually under 10 seconds</Text>
      </View>
    )
  }

  // ── Confirm ─────────────────────────────────────────────────────────────────
  if (state === 'confirm' && placeData) {
    const location = [placeData.city, placeData.state, placeData.country].filter(Boolean).join(', ')
    return (
      <View style={styles.container}>
        <View style={styles.handle} />

        <Text style={styles.confirmHeading}>We found this place</Text>
        <Text style={styles.confirmSubtitle}>Save it to your map?</Text>

        <View style={styles.placeCard}>
          {placeData.thumbnailUrl ? (
            <Image source={{ uri: placeData.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[placeData.category] || '📍'}</Text>
            </View>
          )}
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{placeData.name}</Text>
            <Text style={styles.placeLocation}>{location}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {CATEGORY_ICONS[placeData.category]} {placeData.category}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save to my map</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Not this place — skip</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Fallback ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.fallbackTitle}>Couldn't identify the location</Text>
      <Text style={styles.fallbackSubtitle}>Search for the place manually:</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="e.g. Dawki River, Meghalaya"
          placeholderTextColor={colors.textTertiary}
          onSubmitEditing={handleSearch}
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>{isSearching ? '...' : 'Go'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.place_id.toString()}
        renderItem={({ item }) => {
          const parts = item.display_name.split(', ')
          return (
            <TouchableOpacity style={styles.resultRow} onPress={() => handleSelectResult(item)} disabled={isSaving}>
              <Text style={styles.resultName}>{parts[0]}</Text>
              <Text style={styles.resultSubtitle}>{parts.slice(1, 3).join(', ')}</Text>
            </TouchableOpacity>
          )
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing[5] },
  centered: {
    flex: 1, backgroundColor: colors.bgPrimary,
    alignItems: 'center', justifyContent: 'center', padding: spacing[6],
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderMedium,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing[5],
  },

  processingTitle: {
    fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Italic',
    color: colors.textPrimary, textAlign: 'center', marginBottom: spacing[3],
  },
  processingUrl: {
    fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary, marginBottom: spacing[3],
  },
  processingHint: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary },

  confirmHeading: {
    fontSize: fontSizes['2xl'], fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[1],
  },
  confirmSubtitle: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, marginBottom: spacing[5],
  },

  placeCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    overflow: 'hidden', marginBottom: spacing[5], ...shadows.card,
  },
  thumbnail: { width: '100%', height: 180 },
  thumbnailPlaceholder: {
    width: '100%', height: 120,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  categoryIcon: { fontSize: 48 },
  placeInfo: { padding: spacing[4], gap: spacing[2] },
  placeName: { fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },
  placeLocation: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  categoryTag: {
    alignSelf: 'flex-start', backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm, paddingHorizontal: spacing[2], paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  categoryTagText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.textSecondary },

  saveBtn: {
    backgroundColor: colors.accentGreen, borderRadius: radius.full,
    paddingVertical: spacing[4], alignItems: 'center', marginBottom: spacing[3],
  },
  saveBtnText: { color: '#FFFFFF', fontSize: fontSizes.md, fontFamily: 'DMSans-Medium' },

  skipBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  skipText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary },

  fallbackTitle: {
    fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[2],
  },
  fallbackSubtitle: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, marginBottom: spacing[5],
  },
  searchRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular', color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.accentGreen, borderRadius: radius.md,
    paddingHorizontal: spacing[4], justifyContent: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontFamily: 'DMSans-Medium', fontSize: fontSizes.base },
  resultRow: { paddingVertical: spacing[4] },
  resultName: { fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.textPrimary },
  resultSubtitle: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  separator: { height: 1, backgroundColor: colors.borderLight },
})
