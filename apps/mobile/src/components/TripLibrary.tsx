import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes, spacing, radius, shadows } from '../constants/theme'

export interface SavedItinerarySummary {
  id: string
  title: string
  destination: string
  createdAt: string
}

interface Props {
  itineraries: SavedItinerarySummary[]
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onNewTrip: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TripLibrary({ itineraries, onLoad, onDelete, onNewTrip }: Props) {
  if (itineraries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="map-outline" size={32} color={colors.textTertiary} />
        </View>
        <Text style={styles.emptyTitle}>No saved trips yet</Text>
        <Text style={styles.emptySubtitle}>
          Start planning and save your itineraries to find them here.
        </Text>
        <TouchableOpacity style={styles.newTripBtn} onPress={onNewTrip} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newTripBtnText}>Start planning</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <FlatList
      data={itineraries}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <TouchableOpacity style={styles.newTripCard} onPress={onNewTrip} activeOpacity={0.85}>
          <View style={styles.newTripIconWrap}>
            <Ionicons name="add" size={22} color={colors.accentGreen} />
          </View>
          <Text style={styles.newTripCardText}>Plan a new trip</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.tripCard} onPress={() => onLoad(item.id)} activeOpacity={0.85}>
          <View style={styles.tripIconWrap}>
            <Ionicons name="document-text-outline" size={22} color={colors.accentGreen} />
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.tripMeta}>{item.destination} · {formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing[4], paddingVertical: spacing[4], gap: 0 },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSizes.lg, fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[2], textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing[6],
  },
  newTripBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accentGreen, borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[6],
  },
  newTripBtnText: { color: '#fff', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },

  newTripCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.accentGreen,
    padding: spacing[4], marginBottom: spacing[3],
    ...shadows.card,
  },
  newTripIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: `${colors.accentGreen}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  newTripCardText: {
    flex: 1, fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.accentGreen,
  },

  tripCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.surface,
    padding: spacing[4],
  },
  tripIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  tripInfo: { flex: 1 },
  tripTitle: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.textPrimary, marginBottom: 2,
  },
  tripMeta: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular', color: colors.textSecondary,
  },
  deleteBtn: { padding: spacing[1] },

  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: 36 + spacing[3] + spacing[4] },
})
