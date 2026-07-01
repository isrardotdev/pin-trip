import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Linking, Modal, ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { SavePinModal } from '../../src/components/SavePinModal'
import { DiscoverPlace, PinStatus } from '@wanderpin/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

// ─── Hero card (first item, full-width) ──────────────────────────────────────

function HeroCard({ place, onSave, onPress, saved }: {
  place: DiscoverPlace
  onSave: () => void
  onPress: () => void
  saved: boolean
}) {
  return (
    <TouchableOpacity style={styles.hero} activeOpacity={0.92} onPress={onPress}>
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]}>
          <Text style={styles.heroPlaceholderIcon}>{CATEGORY_ICONS[place.category]}</Text>
        </View>
      )}
      <View style={styles.heroTop}>
        <View style={styles.trendingBadge}>
          <Ionicons name="flame" size={12} color={colors.accentAmber} />
          <Text style={styles.trendingText}>Trending</Text>
        </View>
      </View>

      <View style={styles.heroBottom}>
        <View style={styles.heroCategoryTag}>
          <Text style={styles.heroCategoryText}>{CATEGORY_ICONS[place.category]} {place.category}</Text>
        </View>
        <Text style={styles.heroName}>{place.name}</Text>
        <Text style={styles.heroLocation}>{place.city}, {place.state}</Text>
        <TouchableOpacity
          style={[styles.heroSaveBtn, saved && styles.heroSaveBtnSaved]}
          onPress={onSave}
          activeOpacity={0.85}
        >
          <Ionicons name={saved ? 'checkmark' : 'add'} size={16} color={saved ? colors.accentGreen : '#fff'} />
          <Text style={[styles.heroSaveBtnText, saved && styles.heroSaveBtnTextSaved]}>
            {saved ? 'Saved' : 'Save to my map'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

// ─── Grid card (2-column) ─────────────────────────────────────────────────────

function GridCard({ place, onSave, onPress, saved }: {
  place: DiscoverPlace
  onSave: () => void
  onPress: () => void
  saved: boolean
}) {
  return (
    <TouchableOpacity style={styles.gridCard} activeOpacity={0.88} onPress={onPress}>
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={styles.gridPhoto} resizeMode="cover" />
      ) : (
        <View style={styles.gridPhotoPlaceholder}>
          <Text style={styles.gridPlaceholderIcon}>{CATEGORY_ICONS[place.category]}</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.gridSaveIcon, saved && styles.gridSaveIconSaved]}
        onPress={onSave}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name={saved ? 'checkmark' : 'add'} size={14} color={saved ? colors.accentGreen : '#fff'} />
      </TouchableOpacity>
      <View style={styles.gridBody}>
        <Text style={styles.gridName} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.gridLocation} numberOfLines={1}>{place.state}</Text>
        <View style={styles.gridCategoryTag}>
          <Text style={styles.gridCategoryText}>{CATEGORY_ICONS[place.category]} {place.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Detail bottom sheet ──────────────────────────────────────────────────────

function PlaceDetailModal({ place, visible, onClose, onSave, saved }: {
  place: DiscoverPlace | null
  visible: boolean
  onClose: () => void
  onSave: () => void
  saved: boolean
}) {
  if (!place) return null

  const openInMaps = () => {
    const query = encodeURIComponent(`${place.name} ${place.city} ${place.state}`)
    Linking.openURL(`https://maps.google.com/?q=${query}`)
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHandle} />

        {place.photoUrl ? (
          <Image source={{ uri: place.photoUrl }} style={styles.modalPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.modalPhotoPlaceholder}>
            <Text style={{ fontSize: 64 }}>{CATEGORY_ICONS[place.category]}</Text>
          </View>
        )}

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <View style={styles.modalCategoryRow}>
            <View style={styles.modalCategoryTag}>
              <Text style={styles.modalCategoryText}>{CATEGORY_ICONS[place.category]} {place.category}</Text>
            </View>
            {place.tags?.slice(0, 3).map(tag => (
              <View key={tag} style={styles.modalTag}>
                <Text style={styles.modalTagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.modalName}>{place.name}</Text>
          <Text style={styles.modalLocation}>{place.city}, {place.state}, {place.country}</Text>

          {place.description ? (
            <Text style={styles.modalDesc}>{place.description}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.modalSaveBtn, saved && styles.modalSaveBtnSaved]}
            onPress={onSave}
            activeOpacity={0.85}
          >
            <Ionicons name={saved ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={saved ? colors.accentGreen : '#fff'} />
            <Text style={[styles.modalSaveBtnText, saved && styles.modalSaveBtnTextSaved]}>
              {saved ? 'Saved to my map' : 'Save to my map'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalMapsBtn} onPress={openInMaps} activeOpacity={0.85}>
            <Ionicons name="map-outline" size={18} color={colors.accentGreen} />
            <Text style={styles.modalMapsBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null)
  const [saveTarget, setSaveTarget] = useState<DiscoverPlace | null>(null)
  const { addPin } = usePinsStore()

  useEffect(() => {
    api.get('/discover')
      .then((res) => setPlaces(res.data.data ?? []))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const doSave = async (place: DiscoverPlace, status: PinStatus) => {
    setSavedIds(prev => new Set([...prev, place.id]))
    setSaveTarget(null)
    setSelectedPlace(null)
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
        status,
      })
    } catch {
      setSavedIds(prev => { const n = new Set(prev); n.delete(place.id); return n })
    }
  }

  const handleSave = (place: DiscoverPlace) => {
    if (savedIds.has(place.id)) return
    setSaveTarget(place)
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accentGreen} />
      </View>
    )
  }

  if (hasError || places.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: spacing[6] }]}>
        <Text style={{ fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Italic', color: colors.textSecondary, textAlign: 'center' }}>
          Couldn't load places right now.
        </Text>
        <Text style={{ fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary, textAlign: 'center', marginTop: spacing[2] }}>
          Check your connection and try again.
        </Text>
      </View>
    )
  }

  const [hero, ...rest] = places
  // Pair remaining places into rows of 2
  const gridRows: DiscoverPlace[][] = []
  for (let i = 0; i < rest.length; i += 2) {
    gridRows.push(rest.slice(i, i + 2))
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={gridRows}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        ListHeaderComponent={
          <>
            <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
              <Text style={styles.headerTitle}>Discover</Text>
              <Text style={styles.headerSubtitle}>Curated places for Indian wanderers</Text>
            </View>

            {hero && (
              <HeroCard
                place={hero}
                saved={savedIds.has(hero.id)}
                onSave={() => handleSave(hero)}
                onPress={() => setSelectedPlace(hero)}
              />
            )}

            <Text style={styles.sectionLabel}>More places</Text>
          </>
        }
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map(place => (
              <GridCard
                key={place.id}
                place={place}
                saved={savedIds.has(place.id)}
                onSave={() => handleSave(place)}
                onPress={() => setSelectedPlace(place)}
              />
            ))}
            {/* Fill empty slot if odd number */}
            {row.length === 1 && <View style={styles.gridCard} />}
          </View>
        )}
      />

      <PlaceDetailModal
        place={selectedPlace}
        visible={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onSave={() => selectedPlace && handleSave(selectedPlace)}
        saved={selectedPlace ? savedIds.has(selectedPlace.id) : false}
      />

      <SavePinModal
        visible={!!saveTarget}
        name={saveTarget?.name ?? ''}
        location={[saveTarget?.city, saveTarget?.state].filter(Boolean).join(', ')}
        category={saveTarget?.category ?? 'NATURE'}
        onSave={(status) => saveTarget && doSave(saveTarget, status)}
        onCancel={() => setSaveTarget(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Hero
  hero: {
    height: 340,
    marginHorizontal: spacing[4],
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing[5],
    ...shadows.sheet,
  },
  heroPlaceholder: { backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderIcon: { fontSize: 72 },
  heroTop: {
    position: 'absolute', top: spacing[4], left: spacing[4], right: spacing[4],
    flexDirection: 'row',
  },
  trendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(28,28,26,0.7)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
  },
  trendingText: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium',
    color: colors.accentAmber,
  },
  heroBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing[5],
    backgroundColor: 'rgba(28,28,26,0.72)',
  },
  heroCategoryTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: spacing[2],
  },
  heroCategoryText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: '#fff' },
  heroName: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.75)', marginBottom: spacing[4],
  },
  heroSaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[5],
    alignSelf: 'flex-start',
  },
  heroSaveBtnSaved: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: colors.accentGreen },
  heroSaveBtnText: { color: '#fff', fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium' },
  heroSaveBtnTextSaved: { color: colors.accentGreen },

  sectionLabel: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium',
    color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: spacing[5], marginBottom: spacing[3],
  },

  // Grid
  gridRow: {
    flexDirection: 'row', gap: spacing[3],
    paddingHorizontal: spacing[4], marginBottom: spacing[3],
  },
  gridCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.md, overflow: 'hidden',
    ...shadows.card,
  },
  gridPhoto: { width: '100%', height: 130 },
  gridPhotoPlaceholder: {
    width: '100%', height: 130,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  gridPlaceholderIcon: { fontSize: 36 },
  gridSaveIcon: {
    position: 'absolute', top: spacing[2], right: spacing[2],
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(28,28,26,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  gridSaveIconSaved: { backgroundColor: 'rgba(255,255,255,0.9)' },
  gridBody: { padding: spacing[3] },
  gridName: { fontSize: fontSizes.sm, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary, marginBottom: 2 },
  gridLocation: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular', color: colors.textSecondary, marginBottom: spacing[2] },
  gridCategoryTag: {
    backgroundColor: colors.bgSecondary, borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 2, alignSelf: 'flex-start',
  },
  gridCategoryText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular', color: colors.textSecondary },

  // Detail modal
  modalContainer: { flex: 1, backgroundColor: colors.bgPrimary },
  modalHandle: {
    width: 40, height: 4, backgroundColor: colors.borderMedium,
    borderRadius: 2, alignSelf: 'center', marginTop: spacing[3], marginBottom: spacing[2],
  },
  modalPhoto: { width: '100%', height: 220 },
  modalPhotoPlaceholder: {
    width: '100%', height: 220,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { flex: 1, padding: spacing[5] },
  modalCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] },
  modalCategoryTag: {
    backgroundColor: colors.bgSecondary, borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  modalCategoryText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.textSecondary },
  modalTag: {
    backgroundColor: colors.bgSecondary, borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 3,
  },
  modalTagText: { fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular', color: colors.textTertiary },
  modalName: {
    fontSize: fontSizes['2xl'], fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[1],
  },
  modalLocation: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, marginBottom: spacing[4],
  },
  modalDesc: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, lineHeight: 22, marginBottom: spacing[5],
  },
  modalSaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full, paddingVertical: spacing[4],
    justifyContent: 'center', marginBottom: spacing[3],
    ...shadows.pin,
  },
  modalSaveBtnSaved: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accentGreen },
  modalSaveBtnText: { color: '#fff', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },
  modalSaveBtnTextSaved: { color: colors.accentGreen },
  modalMapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingVertical: spacing[4], justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.borderLight,
    marginBottom: spacing[8],
  },
  modalMapsBtnText: { color: colors.accentGreen, fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },
})
