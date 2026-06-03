import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useMemo } from 'react'
import { api } from '../../src/lib/api'
import { usePinsStore } from '../../src/stores/pinsStore'
import { SavePinModal } from '../../src/components/SavePinModal'
import { ItineraryDocument } from '../../src/components/ItineraryDocument'
import { TripDocument, DayItem, PinStatus } from '@wanderpin/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'


export default function ItineraryScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { addPin, pins } = usePinsStore()
  const existingPinNames = useMemo(
    () => new Set(pins.map(p => p.name.toLowerCase())),
    [pins],
  )

  const [tripDocument, setTripDocument] = useState<TripDocument | null>(null)
  const [destination, setDestination] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addToMapTarget, setAddToMapTarget] = useState<DayItem | null>(null)

  useEffect(() => {
    api.get('/plan/conversation')
      .then((res) => {
        const conv = res.data.data
        setTripDocument(conv.tripDocument ?? null)
        setDestination(conv.destination ?? null)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleAddToMap = (item: DayItem) => {
    if (!item.lat || !item.lng) return
    setAddToMapTarget(item)
  }

  const doAddToMap = async (status: PinStatus) => {
    const item = addToMapTarget
    if (!item) return
    setAddToMapTarget(null)
    try {
      await addPin({
        name: item.name,
        lat: item.lat!,
        lng: item.lng!,
        category: item.category,
        source: 'PLANNER',
        status,
        country: 'India',
      })
    } catch (err: any) {
      Alert.alert('Could not save pin', err?.message ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <View style={styles.container}>
      {/* Header — shared element with the banner in plan.tsx */}
      <Animated.View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={18} color={colors.accentGreen} />
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {destination ?? tripDocument?.destination ?? 'My Itinerary'}
            </Text>
            {tripDocument && (
              <Text style={styles.headerSub}>{tripDocument.days.length} days</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accentGreen} />
        </View>
      ) : tripDocument ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing[6] }]}
          showsVerticalScrollIndicator={false}
          // When user scrolls to top and pulls down, the modal dismisses (iOS native behaviour)
          bounces
          scrollEventThrottle={16}
        >
          <Animated.View entering={FadeInDown.duration(280).springify()}>
            <ItineraryDocument document={tripDocument} onAddToMap={handleAddToMap} addedNames={existingPinNames} />
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>No active itinerary.</Text>
        </View>
      )}

      {/* Save to map confirmation */}
      <SavePinModal
        visible={!!addToMapTarget}
        name={addToMapTarget?.name ?? ''}
        category={addToMapTarget?.category ?? 'NATURE'}
        onSave={doAddToMap}
        onCancel={() => setAddToMapTarget(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
    // This is the shared element — matches the banner style
    borderLeftWidth: 3,
    borderLeftColor: colors.accentGreen,
    ...shadows.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.md,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4] },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
})
