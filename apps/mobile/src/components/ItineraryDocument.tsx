import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { TripDocument, DayItem } from '@wanderpin/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../constants/theme'

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

function DayItemRow({ item, onAddToMap, isAdded }: { item: DayItem; onAddToMap?: (item: DayItem) => void; isAdded?: boolean }) {
  const isPin = item.type === 'pin'
  return (
    <View style={styles.itemRow}>
      <View style={[styles.itemIconWrap, isPin ? styles.itemIconPin : styles.itemIconSuggestion]}>
        <Text style={styles.itemIcon}>{CATEGORY_ICONS[item.category] ?? '📍'}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {isPin ? (
            <View style={styles.pinBadge}>
              <Ionicons name="location" size={10} color={colors.accentGreen} />
              <Text style={styles.pinBadgeText}>Pinned</Text>
            </View>
          ) : (
            <View style={styles.suggestionBadge}>
              <Text style={styles.suggestionBadgeText}>Suggested</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        {item.isAddable && onAddToMap && (
          isAdded ? (
            <View style={styles.addedBadge}>
              <Ionicons name="checkmark" size={11} color={colors.accentGreen} />
              <Text style={styles.addedText}>Added to map</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.addToMapBtn} onPress={() => onAddToMap(item)}>
              <Ionicons name="add" size={12} color={colors.accentGreen} />
              <Text style={styles.addToMapText}>Add to my map</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  )
}

interface Props {
  document: TripDocument
  onAddToMap?: (item: DayItem) => void
  addedNames?: Set<string>
}

export function ItineraryDocument({ document: doc, onAddToMap, addedNames }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.docHeader}>
        <Text style={styles.docSummary}>{doc.summary}</Text>
        <View style={styles.docMeta}>
          <Ionicons name="calendar-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.docMetaText}>{doc.days.length} days · {doc.destination}</Text>
        </View>
      </View>

      <View style={styles.daysList}>
        {doc.days.map((day, idx) => (
          <View key={day.day} style={[styles.dayCard, idx < doc.days.length - 1 && styles.dayCardBorder]}>
            {/* Timeline dot + line */}
            <View style={styles.timelineWrap}>
              <View style={styles.timelineDot}>
                <Text style={styles.timelineDayNum}>{day.day}</Text>
              </View>
              {idx < doc.days.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.dayContent}>
              <Text style={styles.dayLabel}>Day {day.day}</Text>
              <Text style={styles.dayTitle}>{day.title}</Text>

              {day.travelNote ? (
                <View style={styles.travelNoteWrap}>
                  <Ionicons name="car-outline" size={12} color={colors.textTertiary} />
                  <Text style={styles.travelNote}>{day.travelNote}</Text>
                </View>
              ) : null}

              <Text style={styles.dayDesc}>{day.description}</Text>

              <View style={styles.itemsList}>
                {day.items.map((item, i) => (
                  <DayItemRow
                    key={i}
                    item={item}
                    onAddToMap={onAddToMap}
                    isAdded={addedNames?.has(item.name.toLowerCase())}
                  />
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.card,
  },

  docHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  docSummary: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, lineHeight: 19, marginBottom: spacing[2],
  },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  docMetaText: { fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular', color: colors.textTertiary },

  daysList: { padding: spacing[4] },

  dayCard: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingBottom: spacing[5],
  },
  dayCardBorder: {
    // no border needed — timeline line handles visual separation
  },

  // Timeline column
  timelineWrap: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDayNum: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: '#fff' },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.borderLight,
    marginTop: spacing[2],
    minHeight: 24,
  },

  // Day content
  dayContent: { flex: 1, paddingTop: spacing[1] },
  dayLabel: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium',
    color: colors.accentGreen, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  dayTitle: {
    fontSize: fontSizes.base, fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[2],
  },

  travelNoteWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[1],
    backgroundColor: colors.bgSecondary, borderRadius: radius.sm,
    padding: spacing[2], marginBottom: spacing[2],
  },
  travelNote: {
    flex: 1, fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular',
    color: colors.textTertiary, lineHeight: 16,
  },

  dayDesc: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, lineHeight: 19, marginBottom: spacing[3],
  },

  itemsList: { gap: spacing[3] },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  itemIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  itemIconPin: { backgroundColor: `${colors.accentGreen}18` },
  itemIconSuggestion: { backgroundColor: `${colors.accentAmber}18` },
  itemIcon: { fontSize: 16 },

  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: 2 },
  itemName: { flex: 1, fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: colors.textPrimary },

  pinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: `${colors.accentGreen}15`,
    borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 2,
  },
  pinBadgeText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.accentGreen },

  suggestionBadge: {
    backgroundColor: `${colors.accentAmber}15`,
    borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 2,
  },
  suggestionBadgeText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.accentAmber },

  itemDesc: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, lineHeight: 16,
  },

  addToMapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing[1],
  },
  addToMapText: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.accentGreen,
  },
  addedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing[1],
  },
  addedText: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.textTertiary,
  },
})
