import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  TextInput, ScrollView, Linking, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { usePinsStore } from '../../src/stores/pinsStore'
import { Pin, PinStatus, Category } from '@pintrip/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const STATUS_OPTIONS: PinStatus[] = ['WISHLIST', 'PLANNING', 'VISITED']
const STATUS_LABELS: Record<PinStatus, string> = {
  WISHLIST: 'Wishlist',
  PLANNING: 'Planning',
  VISITED: 'Visited',
}

export default function PinDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { pins, updatePin, deletePin } = usePinsStore()

  const pin = pins.find((p) => p.id === id)
  const [notes, setNotes] = useState(pin?.notes || '')

  useEffect(() => {
    if (!pin) router.back()
  }, [pin])

  if (!pin) return null

  const handleStatusChange = (status: PinStatus) => {
    updatePin(pin.id, { status })
  }

  const handleNotesBlur = () => {
    if (notes !== pin.notes) {
      updatePin(pin.id, { notes })
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Pin', `Remove "${pin.name}" from your map?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePin(pin.id)
          router.back()
        },
      },
    ])
  }

  const handleOpenMaps = () => {
    const url = `https://maps.google.com/?q=${pin.lat},${pin.lng}`
    Linking.openURL(url)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />

      {pin.sourceThumbnailUrl ? (
        <Image source={{ uri: pin.sourceThumbnailUrl }} style={styles.thumbnail} />
      ) : null}

      <View style={styles.content}>
        <Text style={styles.name}>{pin.name}</Text>
        <Text style={styles.location}>
          {[pin.city, pin.state, pin.country].filter(Boolean).join(', ')}
        </Text>

        {pin.sourceUrl && (
          <TouchableOpacity onPress={() => pin.sourceUrl && Linking.openURL(pin.sourceUrl)}>
            <Text style={styles.sourceUrl} numberOfLines={1}>
              {pin.source === 'INSTAGRAM' ? '📸 Instagram' : '🔗'} {pin.sourceUrl}
            </Text>
          </TouchableOpacity>
        )}

        {/* Status selector */}
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusChip, pin.status === s && styles.statusChipActive]}
              onPress={() => handleStatusChange(s)}
            >
              <Text style={[styles.statusChipText, pin.status === s && styles.statusChipTextActive]}>
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{pin.category}</Text>
        </View>

        {/* Google Maps button */}
        <TouchableOpacity style={styles.mapsBtn} onPress={handleOpenMaps}>
          <Text style={styles.mapsBtnText}>View on Google Maps</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TextInput
          style={styles.notes}
          value={notes}
          onChangeText={setNotes}
          onBlur={handleNotesBlur}
          placeholder="Add a personal note..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />

        {/* Delete */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete pin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  thumbnail: {
    height: 200,
    borderRadius: radius.md,
    marginLeft: spacing[4],
    marginRight: spacing[4],
  },
  content: { padding: spacing[5], gap: spacing[4] },
  name: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  location: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  sourceUrl: {
    fontSize: fontSizes.xs,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.accentGreen,
    textDecorationLine: 'underline',
  },
  statusRow: { flexDirection: 'row', gap: spacing[2] },
  statusChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  statusChipActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  statusChipText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  statusChipTextActive: { color: '#FFFFFF' },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryTagText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  mapsBtn: {
    borderWidth: 1,
    borderColor: colors.accentGreen,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  mapsBtnText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.accentGreen,
  },
  notes: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  deleteBtn: { paddingVertical: spacing[3], alignItems: 'center' },
  deleteBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.accentRed,
  },
})
