import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
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

export default function PinConfirmModal() {
  const { jobId, url } = useLocalSearchParams<{ jobId: string; url: string }>()
  const router = useRouter()
  const { fetchPins } = usePinsStore()

  const [state, setState] = useState<State>('processing')
  const [placeData, setPlaceData] = useState<PlaceData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
    <View style={styles.centered}>
      <View style={styles.handle} />
      <Text style={styles.fallbackTitle}>Couldn't load this link</Text>
      <Text style={styles.fallbackSubtitle}>
        Please share a valid travel video — an Instagram Reel, YouTube Short, or TikTok video.
      </Text>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSkip}>
        <Text style={styles.saveBtnText}>Go back to my map</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing[5] },
  centered: {
    flex: 1, backgroundColor: colors.bgPrimary,
    alignItems: 'center', justifyContent: 'center', padding: spacing[6],
    paddingTop: spacing[5],
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
    color: colors.textPrimary, marginBottom: spacing[3], textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, marginBottom: spacing[8],
    textAlign: 'center', lineHeight: 22,
  },
})
