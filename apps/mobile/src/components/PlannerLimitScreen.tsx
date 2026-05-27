import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes, spacing, radius, shadows } from '../constants/theme'
import { PLANNER_FREE_LIMIT } from '@pintrip/shared'

interface Props {
  onUpgrade: () => void
  onDismiss: () => void
}

// Shown inline in the Plan chat screen when a FREE user hits their message limit.
// Framing: they've experienced the feature — now continue with Pro.
export function PlannerLimitScreen({ onUpgrade, onDismiss }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="chatbubble-ellipses" size={28} color={colors.accentGreen} />
      </View>

      <Text style={styles.title}>You've used your {PLANNER_FREE_LIMIT} free sessions</Text>
      <Text style={styles.subtitle}>
        Upgrade to Pro to keep planning — unlimited AI conversations, forever.
      </Text>

      <View style={styles.perks}>
        {[
          'Unlimited AI planning sessions',
          'Unlimited pins (beyond 30)',
          'Export itineraries (coming soon)',
        ].map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accentGreenLight} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.85}>
        <Text style={styles.upgradeBtnText}>Upgrade to Pro — ₹199/mo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.dismissText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing[6],
    marginHorizontal: spacing[4],
    marginVertical: spacing[4],
    alignItems: 'center',
    ...shadows.sheet,
  },
  iconWrap: {
    width: 56, height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: fontSizes.lg,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  perks: {
    alignSelf: 'stretch',
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  perkText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },
  upgradeBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: spacing[3],
    ...shadows.pin,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
  },
  dismissText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },
})
