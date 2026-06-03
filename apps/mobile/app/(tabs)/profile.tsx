import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Switch, ScrollView, Linking,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/stores/authStore'
import { usePinsStore } from '../../src/stores/pinsStore'
import { api } from '../../src/lib/api'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const APP_VERSION = '1.0.0'
const BUILD_NUMBER = '1'

// Placeholder URLs — replace before App Store submission
const PRIVACY_POLICY_URL = 'https://pintrip.app/privacy'
const TERMS_URL = 'https://pintrip.app/terms'
const SUPPORT_EMAIL = 'support@pintrip.app'
const APP_STORE_URL = 'https://apps.apple.com/app/pintrip'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  rightElement,
  showChevron = true,
  border = true,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
  rightElement?: React.ReactNode
  showChevron?: boolean
  border?: boolean
}) {
  const content = (
    <View style={[s.row, border && s.rowBorder]}>
      <View style={s.rowLeft}>
        <View style={[s.rowIconWrap, destructive && { backgroundColor: '#FEF2F2' }]}>
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? colors.accentRed : colors.accentGreen}
          />
        </View>
        <Text style={[s.rowLabel, destructive && { color: colors.accentRed }]}>{label}</Text>
      </View>
      <View style={s.rowRight}>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
        {rightElement ?? null}
        {showChevron && !rightElement && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </View>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }
  return content
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const { pins, deletePin } = usePinsStore()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'PT'

  const visitedCount = pins.filter((p) => p.status === 'VISITED').length
  const planningCount = pins.filter((p) => p.status === 'PLANNING').length
  const countries = [...new Set(pins.map((p) => p.country).filter(Boolean))].length

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your pins. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your pins, saved places, and trip plans will be gone forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.delete('/auth/account')
                    } catch {
                      // Even if the call fails, clear local state
                    }
                    logout()
                  },
                },
              ]
            )
          },
        },
      ]
    )
  }

  const handleClearPins = () => {
    Alert.alert(
      'Clear All Pins',
      `This will permanently delete all ${pins.length} pins. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            for (const pin of pins) {
              await deletePin(pin.id)
            }
          },
        },
      ]
    )
  }

  const handleSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=PinTrip Support`)
  }

  const handlePrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL)
  }

  const handleTerms = () => {
    Linking.openURL(TERMS_URL)
  }

  const handleRateApp = () => {
    Linking.openURL(APP_STORE_URL)
  }

  const handleUpgrade = () => {
    Alert.alert('Coming Soon', 'PinTrip Pro is launching soon. Stay tuned!')
  }

  const handleExportData = () => {
    Alert.alert('Export Data', 'We\'ll email you a copy of all your pins and trip data within 24 hours.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request Export',
        onPress: () => {
          Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Data Export Request&body=Please send me a copy of my data. My account email is: ${user?.email}`)
        },
      },
    ])
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar + identity ── */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.name}>{user?.name || 'Traveler'}</Text>
        <Text style={s.email}>{user?.email}</Text>
        {memberSince && (
          <Text style={s.memberSince}>Member since {memberSince}</Text>
        )}
      </View>

      {/* ── Plan status ── */}
      <View style={s.planCard}>
        <View style={s.planLeft}>
          <View style={s.planBadge}>
            <Ionicons name="flash-outline" size={12} color="#FFFFFF" />
            <Text style={s.planBadgeText}>FREE</Text>
          </View>
          <View>
            <Text style={s.planTitle}>Free Plan</Text>
            <Text style={s.planSubtitle}>5 AI planner messages / month</Text>
          </View>
        </View>
        <TouchableOpacity style={s.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.85}>
          <Text style={s.upgradeBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats ── */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{pins.length}</Text>
          <Text style={s.statLabel}>Pins</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{countries}</Text>
          <Text style={s.statLabel}>Countries</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{visitedCount}</Text>
          <Text style={s.statLabel}>Visited</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{planningCount}</Text>
          <Text style={s.statLabel}>Planning</Text>
        </View>
      </View>

      {/* ── Account ── */}
      <SectionHeader title="Account" />
      <View style={s.card}>
        <SettingsRow
          icon="person-outline"
          label="Edit Profile"
          onPress={() => Alert.alert('Coming Soon', 'Edit profile will be available in the next update.')}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => Alert.alert('Coming Soon', 'Password change will be available in the next update.')}
          border={false}
        />
      </View>

      {/* ── Preferences ── */}
      <SectionHeader title="Preferences" />
      <View style={s.card}>
        <SettingsRow
          icon="notifications-outline"
          label="Push Notifications"
          showChevron={false}
          border={false}
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.borderLight, true: colors.accentGreenLight }}
              thumbColor={colors.surface}
            />
          }
        />
      </View>

      {/* ── Support ── */}
      <SectionHeader title="Support" />
      <View style={s.card}>
        <SettingsRow
          icon="help-circle-outline"
          label="Help & Support"
          onPress={handleSupport}
        />
        <SettingsRow
          icon="star-outline"
          label="Rate PinTrip"
          onPress={handleRateApp}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={handlePrivacyPolicy}
        />
        <SettingsRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={handleTerms}
          border={false}
        />
      </View>

      {/* ── Data ── */}
      <SectionHeader title="Data" />
      <View style={s.card}>
        <SettingsRow
          icon="download-outline"
          label="Export My Data"
          onPress={handleExportData}
        />
        <SettingsRow
          icon="trash-outline"
          label="Clear All Pins"
          destructive
          onPress={handleClearPins}
          showChevron={false}
          border={false}
        />
      </View>

      {/* ── Sign out + Delete ── */}
      <View style={s.dangerZone}>
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.accentRed} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
          <Text style={s.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* ── Version ── */}
      <Text style={s.version}>PinTrip v{APP_VERSION} ({BUILD_NUMBER})</Text>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingBottom: 48 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[6],
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: fontSizes.xs,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary,
  },

  // ── Plan card ───────────────────────────────────────────────────────────────
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentAmber,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  planBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
  },
  planSubtitle: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: 1,
  },
  upgradeBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  upgradeBtnText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Medium',
    color: '#FFFFFF',
  },

  // ── Stats ───────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    marginBottom: spacing[6],
    ...shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.accentGreen,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: colors.borderLight },

  // ── Section ─────────────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: spacing[5],
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing[5],
    marginBottom: spacing[5],
    borderRadius: radius.md,
    ...shadows.card,
  },

  // ── Row ─────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  rowIconWrap: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  rowValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary,
  },

  // ── Danger zone ─────────────────────────────────────────────────────────────
  dangerZone: {
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  signOutText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.accentRed,
  },
  deleteAccountBtn: {
    paddingVertical: spacing[2],
  },
  deleteAccountText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
    textDecorationLine: 'underline',
  },

  // ── Version ─────────────────────────────────────────────────────────────────
  version: {
    fontSize: fontSizes.xs,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
})
