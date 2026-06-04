import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  TextInput, ScrollView, Linking, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Pin, PinStatus } from '@wanderpin/shared'
import { usePinsStore } from '../../stores/pinsStore'
import { colors, fontSizes, spacing, radius } from '../../constants/theme'

const STATUS_OPTIONS: PinStatus[] = ['WISHLIST', 'PLANNING', 'VISITED']
const STATUS_LABELS: Record<PinStatus, string> = {
  WISHLIST: 'Wishlist',
  PLANNING: 'Planning',
  VISITED: 'Visited',
}

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

interface Props {
  pin: Pin
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onBeforeDelete: () => void
  insetBottom: number
}

export default function PinDetailInline({ pin, index, total, onClose, onPrev, onNext, onBeforeDelete, insetBottom }: Props) {
  const { updatePin, deletePin } = usePinsStore()
  const [notes, setNotes] = useState(pin.notes || '')
  const notesRef = useRef(notes)
  const pinIdRef = useRef(pin.id)

  const handleNotesChange = (text: string) => {
    setNotes(text)
    notesRef.current = text
  }

  // Flush any unsaved notes before switching to another pin
  const flushNotes = () => {
    if (notesRef.current !== (pin.notes || '')) {
      updatePin(pinIdRef.current, { notes: notesRef.current })
    }
  }

  // Reset notes state and refs when the displayed pin changes
  useEffect(() => {
    setNotes(pin.notes || '')
    notesRef.current = pin.notes || ''
    pinIdRef.current = pin.id
  }, [pin.id])

  const handleStatusChange = (status: PinStatus) => updatePin(pin.id, { status })

  // onBlur is a secondary save — primary save happens via flushNotes on navigate/close
  const handleNotesBlur = () => {
    if (notesRef.current !== (pin.notes || '')) updatePin(pin.id, { notes: notesRef.current })
  }

  const handleDelete = () => {
    Alert.alert('Delete Pin', `Remove "${pin.name}" from your map?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        onBeforeDelete() // remount map before marker disappears (prevents Fabric nil crash)
        onClose()
        deletePin(pin.id)
      }},
    ])
  }

  const handleOpenMaps = () => {
    Linking.openURL(`https://maps.google.com/?q=${pin.lat},${pin.lng}`)
  }

  return (
    <View style={styles.container}>
      {/* ── Nav header ── */}
      <View style={styles.header}>
        <View style={styles.navGroup}>
          <TouchableOpacity
            style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
            onPress={() => { flushNotes(); onPrev() }}
            disabled={index === 0}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={index === 0 ? colors.borderMedium : colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navCount}>{index + 1} / {total}</Text>
          <TouchableOpacity
            style={[styles.navBtn, index === total - 1 && styles.navBtnDisabled]}
            onPress={() => { flushNotes(); onNext() }}
            disabled={index === total - 1}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={index === total - 1 ? colors.borderMedium : colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={() => { flushNotes(); onClose() }} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insetBottom + spacing[4] }]}
        keyboardShouldPersistTaps="handled"
      >
        {pin.sourceThumbnailUrl ? (
          <Image source={{ uri: pin.sourceThumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : null}

        <Text style={styles.name}>{pin.name}</Text>
        <Text style={styles.location}>
          {[pin.city, pin.state, pin.country].filter(Boolean).join(', ')}
        </Text>

        {pin.sourceUrl ? (
          <TouchableOpacity onPress={() => Linking.openURL(pin.sourceUrl!)}>
            <Text style={styles.sourceUrl} numberOfLines={1}>
              {pin.source === 'INSTAGRAM' ? '📸 Instagram' : '🔗'} {pin.sourceUrl}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Status chips */}
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusChip, pin.status === s && styles.statusChipActive]}
              onPress={() => handleStatusChange(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusChipText, pin.status === s && styles.statusChipTextActive]}>
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>
            {CATEGORY_ICONS[pin.category]} {pin.category}
          </Text>
        </View>

        {/* Google Maps */}
        <TouchableOpacity style={styles.mapsBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
          <Text style={styles.mapsBtnText}>View on Google Maps</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TextInput
          style={styles.notes}
          value={notes}
          onChangeText={handleNotesChange}
          onBlur={handleNotesBlur}
          placeholder="Add a personal note..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete pin</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  navGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  navBtn: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.35 },
  navCount: { fontSize: fontSizes.sm, fontFamily: 'IBMPlexMono-Regular', color: colors.textSecondary, minWidth: 36, textAlign: 'center' },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center',
  },

  // Content
  content: { padding: spacing[4], gap: spacing[3] },
  thumbnail: {
    width: '100%', height: 160,
    borderRadius: radius.md,
  },
  name: { fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },
  location: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textSecondary },
  sourceUrl: {
    fontSize: fontSizes.xs, fontFamily: 'IBMPlexMono-Regular',
    color: colors.accentGreen, textDecorationLine: 'underline',
  },
  statusRow: { flexDirection: 'row', gap: spacing[2] },
  statusChip: {
    flex: 1, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.full, paddingVertical: spacing[2], alignItems: 'center',
  },
  statusChipActive: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  statusChipText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: colors.textSecondary },
  statusChipTextActive: { color: '#FFFFFF' },
  categoryTag: {
    alignSelf: 'flex-start', backgroundColor: colors.bgSecondary,
    borderRadius: radius.sm, paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderWidth: 1, borderColor: colors.borderLight,
  },
  categoryTagText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: colors.textSecondary },
  mapsBtn: {
    borderWidth: 1, borderColor: colors.accentGreen,
    borderRadius: radius.md, paddingVertical: spacing[3], alignItems: 'center',
  },
  mapsBtnText: { fontSize: fontSizes.base, fontFamily: 'DMSans-Medium', color: colors.accentGreen },
  notes: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },
  deleteBtn: { paddingVertical: spacing[2], alignItems: 'center' },
  deleteBtnText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.accentRed },
})
