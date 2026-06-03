import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PinStatus, Category } from '@wanderpin/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../constants/theme'

const STATUS_OPTIONS: { value: PinStatus; label: string; icon: string; color: string }[] = [
  { value: 'WISHLIST', label: 'Wishlist', icon: 'heart-outline', color: colors.textSecondary },
  { value: 'PLANNING', label: 'Planning', icon: 'calendar-outline', color: colors.accentAmber },
  { value: 'VISITED', label: 'Visited', icon: 'checkmark-circle-outline', color: colors.accentGreen },
]

const CATEGORY_ICONS: Record<string, string> = {
  NATURE: '🌿', FOOD: '🍜', ADVENTURE: '⛰️',
  CULTURE: '🏛️', STAY: '🏡', OFFBEAT: '🧭',
}

interface Props {
  visible: boolean
  name: string
  location?: string   // "City, State" or similar
  category: Category
  onSave: (status: PinStatus) => void
  onCancel: () => void
}

export function SavePinModal({ visible, name, location, category, onSave, onCancel }: Props) {
  const [status, setStatus] = useState<PinStatus>('WISHLIST')

  const handleSave = () => {
    onSave(status)
    setStatus('WISHLIST') // reset for next use
  }

  const handleCancel = () => {
    setStatus('WISHLIST')
    onCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.placeRow}>
            <View style={styles.categoryCircle}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category] ?? '📍'}</Text>
            </View>
            <View style={styles.placeInfo}>
              <Text style={styles.placeName} numberOfLines={2}>{name}</Text>
              {location ? <Text style={styles.placeLocation}>{location}</Text> : null}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Add as</Text>

          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusBtn, status === opt.value && styles.statusBtnActive]}
                onPress={() => setStatus(opt.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={18}
                  color={status === opt.value ? '#fff' : opt.color}
                />
                <Text style={[styles.statusBtnText, status === opt.value && styles.statusBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save to my map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,28,26,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    ...shadows.sheet,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[5],
  },

  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryCircle: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  categoryIcon: { fontSize: 22 },
  placeInfo: { flex: 1 },
  placeName: {
    fontSize: fontSizes.md,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  placeLocation: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },

  sectionLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },

  statusRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgSecondary,
  },
  statusBtnActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  statusBtnText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
  },
  statusBtnTextActive: {
    color: '#fff',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    marginBottom: spacing[3],
    ...shadows.pin,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  cancelBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },
})
