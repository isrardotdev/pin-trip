import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import axios from 'axios'
import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius } from '../../src/constants/theme'

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

export default function ManualAddModal() {
  const router = useRouter()
  const { addPin } = usePinsStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const res = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 8, addressdetails: 1 },
        headers: { 'User-Agent': 'PinTrip/1.0' },
      })
      setResults(res.data)
    } catch {
      Alert.alert('Search failed', 'Please try again')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = async (result: NominatimResult) => {
    setIsSaving(true)
    try {
      const addr = result.address
      const city = addr.city || addr.town || addr.village || ''
      const nameParts = result.display_name.split(', ')
      const name = nameParts[0] || query

      await addPin({
        name,
        city,
        state: addr.state,
        country: addr.country || 'India',
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        source: 'MANUAL',
        status: 'WISHLIST',
        category: 'NATURE',
      })

      router.back()
    } catch {
      Alert.alert('Error', 'Failed to save pin. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>Add a Place</Text>
      <Text style={styles.subtitle}>Search for any location to pin on your map</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a place..."
          placeholderTextColor={colors.textTertiary}
          onSubmitEditing={search}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={search} disabled={isSearching}>
          <Text style={styles.searchBtnText}>{isSearching ? '...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <ActivityIndicator color={colors.accentGreen} style={{ marginTop: spacing[8] }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={({ item }) => {
            const parts = item.display_name.split(', ')
            const name = parts[0]
            const subtitle = parts.slice(1, 3).join(', ')
            return (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => handleSelect(item)}
                disabled={isSaving}
              >
                <Text style={styles.resultName} numberOfLines={1}>{name}</Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>{subtitle}</Text>
              </TouchableOpacity>
            )
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary, padding: spacing[5] },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: fontSizes.sm,
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
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
  },
  resultRow: {
    paddingVertical: spacing[4],
  },
  resultName: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  separator: { height: 1, backgroundColor: colors.borderLight },
})
