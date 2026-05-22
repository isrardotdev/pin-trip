import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { DiscoverPlace } from '@pintrip/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿',
  FOOD: '🍜',
  ADVENTURE: '⛰️',
  CULTURE: '🏛️',
  STAY: '🏡',
  OFFBEAT: '🧭',
}

function DiscoverCard({ place, onSave }: { place: DiscoverPlace; onSave: () => void }) {
  return (
    <View style={styles.card}>
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={styles.cardPhoto} />
      ) : (
        <View style={styles.cardPhotoPlaceholder}>
          <Text style={{ fontSize: 40 }}>{CATEGORY_ICONS[place.category]}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{place.name}</Text>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{place.category}</Text>
          </View>
        </View>
        <Text style={styles.cardLocation}>{place.city}, {place.state}</Text>
        {place.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{place.description}</Text>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save to my map</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function DiscoverScreen() {
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addPin } = usePinsStore()

  useEffect(() => {
    api.get('/discover')
      .then((res) => setPlaces(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Curated places for Indian wanderers</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accentGreen} style={{ marginTop: spacing[10] }} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiscoverCard place={item} onSave={() => handleSave(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: 60,
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  list: { padding: spacing[4], gap: spacing[4] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardPhoto: { width: '100%', height: 180 },
  cardPhotoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: spacing[4] },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  cardName: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  categoryTag: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryTagText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  cardLocation: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: spacing[2],
  },
  cardDesc: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
    lineHeight: 19,
    marginBottom: spacing[4],
  },
  saveBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
  },
})
