import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSizes, spacing, radius, shadows } from '../constants/theme'

interface Props {
  icon: string
  title: string
  description: string
  perks: string[]
  onUpgrade: () => void
  onDismiss?: () => void
}

// Full-screen feature pitch shown when a FREE user taps into a hard-gated Pro feature
// (e.g. Shared Trips, Export). Framing: aspiration, not apology.
// Each feature passes its own copy — layout is shared.
export function ProFeatureScreen({ icon, title, description, perks, onUpgrade, onDismiss }: Props) {
  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      bounces={false}
    >
      {/* Pro badge */}
      <View style={styles.proBadge}>
        <Ionicons name="star" size={12} color={colors.accentAmber} />
        <Text style={styles.proBadgeText}>Pro Feature</Text>
      </View>

      {/* Feature icon */}
      <View style={styles.iconWrap}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={36} color={colors.accentGreen} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {/* Perks list */}
      <View style={styles.perksCard}>
        <Text style={styles.perksHeader}>Everything in Pro</Text>
        {[
          'Unlimited AI planning sessions',
          'Unlimited pins',
          ...perks,
        ].map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accentGreenLight} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.pricingRow}>
        <TouchableOpacity style={styles.planBtn} onPress={onUpgrade} activeOpacity={0.85}>
          <Text style={styles.planBtnLabel}>Monthly</Text>
          <Text style={styles.planBtnPrice}>₹199</Text>
          <Text style={styles.planBtnPer}>/mo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.planBtn, styles.planBtnFeatured]} onPress={onUpgrade} activeOpacity={0.85}>
          <View style={styles.bestValueBadge}>
            <Text style={styles.bestValueText}>Best value</Text>
          </View>
          <Text style={[styles.planBtnLabel, { color: '#fff' }]}>Annual</Text>
          <Text style={[styles.planBtnPrice, { color: '#fff' }]}>₹999</Text>
          <Text style={[styles.planBtnPer, { color: 'rgba(255,255,255,0.7)' }]}>/yr</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Billed through the App Store · Cancel anytime
      </Text>

      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismissText}>Not now</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bgPrimary },
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[8],
    paddingBottom: spacing[10],
  },

  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    marginBottom: spacing[6],
  },
  proBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.accentAmber,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  iconWrap: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[5],
    ...shadows.card,
  },

  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },

  perksCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    padding: spacing[5],
    marginBottom: spacing[6],
    gap: spacing[3],
    ...shadows.card,
  },
  perksHeader: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
  },
  perkText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },

  pricingRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  planBtn: {
    flex: 1, alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderLight,
    paddingVertical: spacing[4],
    ...shadows.card,
  },
  planBtnFeatured: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
    ...shadows.pin,
  },
  bestValueBadge: {
    backgroundColor: colors.accentAmber,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2], paddingVertical: 2,
    marginBottom: spacing[1],
  },
  bestValueText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: '#fff',
  },
  planBtnLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  planBtnPrice: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  planBtnPer: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },

  disclaimer: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing[5],
  },
  dismissText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
  },
})
