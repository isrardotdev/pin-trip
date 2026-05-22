import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import axios from 'axios'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'

type State = 'processing' | 'success' | 'fallback'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

export default function PinConfirmModal() {
  const { jobId, url } = useLocalSearchParams<{ jobId: string; url: string }>()
  const router = useRouter()
  const { fetchPins } = usePinsStore()

  const [state, setState] = useState<State>('processing')
  const [pinName, setPinName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!jobId) return
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/pins/parse/${jobId}`)
        const { status } = res.data.data
        if (status === 'done') {
          clearInterval(pollInterval)
          await fetchPins()
          setState('success')
          setPinName(res.data.data.pin?.name || 'New Pin')
        } else if (status === 'failed') {
          clearInterval(pollInterval)
          setState('fallback')
        }
      } catch {
        // keep polling
      }
    }, 2000)

    // Timeout after 60s → fallback
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
      setState('fallback')
    }, 60000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [jobId])

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
      await api.post('/pins', {
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
      router.replace('/(tabs)')
    } catch {
      Alert.alert('Error', 'Failed to save pin')
    } finally {
      setIsSaving(false)
    }
  }

  if (state === 'processing') {
    return (
      <View style={styles.centered}>
        <Text style={styles.processingIcon}>📍</Text>
        <Text style={styles.processingTitle}>Finding the location...</Text>
        <Text style={styles.processingUrl} numberOfLines={1}>{url}</Text>
        <Text style={styles.processingHint}>Usually under 10 seconds</Text>
      </View>
    )
  }

  if (state === 'success') {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Pinned!</Text>
        <Text style={styles.successName}>{pinName}</Text>
        <View style={styles.successActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>View on Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Fallback state
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.fallbackTitle}>Couldn't identify the location</Text>
      <Text style={styles.fallbackSubtitle}>Help us pin it by searching:</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for the place..."
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
            <TouchableOpacity style={styles.resultRow} onPress={() => handleSelectResult(item)}>
              <Text style={styles.resultName}>{parts[0]}</Text>
              <Text style={styles.resultSubtitle}>{parts.slice(1, 3).join(', ')}</Text>
            </TouchableOpacity>
          )
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing[5] },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  processingIcon: { fontSize: 48, marginBottom: spacing[4] },
  processingTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Italic',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  processingUrl: {
    fontSize: fontSizes.xs,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary,
    marginBottom: spacing[3],
  },
  processingHint: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },
  successIcon: { fontSize: 64, marginBottom: spacing[4] },
  successTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.accentGreen,
    marginBottom: spacing[2],
  },
  successName: {
    fontSize: fontSizes.lg,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: spacing[8],
  },
  successActions: { gap: spacing[3], width: '100%' },
  primaryBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: fontSizes.md, fontFamily: 'DMSans-Medium' },
  secondaryBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  secondaryBtnText: { fontSize: fontSizes.base, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderMedium,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing[5],
  },
  fallbackTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  fallbackSubtitle: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: spacing[5],
  },
  searchRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4] },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontFamily: 'DMSans-Medium', fontSize: fontSizes.base },
  resultRow: { paddingVertical: spacing[4] },
  resultName: { fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.textPrimary },
  resultSubtitle: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  separator: { height: 1, backgroundColor: colors.borderLight },
  skipBtn: { marginTop: spacing[6], alignItems: 'center' },
  skipText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary },
})
