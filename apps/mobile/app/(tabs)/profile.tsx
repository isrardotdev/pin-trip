import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useAuthStore } from '../../src/stores/authStore'
import { usePinsStore } from '../../src/stores/pinsStore'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const { pins, deletePin } = usePinsStore()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'PT'

  const visitedCount = pins.filter((p) => p.status === 'VISITED').length
  const countries = [...new Set(pins.map((p) => p.country))].length

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  const handleClearPins = () => {
    Alert.alert(
      'Clear All Pins',
      'This will permanently delete all your pins. This cannot be undone.',
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Traveler'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pins.length}</Text>
          <Text style={styles.statLabel}>Pins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{countries}</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{visitedCount}</Text>
          <Text style={styles.statLabel}>Visited</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={[styles.settingsRow, styles.settingsRowBorder]} onPress={handleClearPins}>
            <Text style={[styles.settingsLabel, { color: colors.accentRed }]}>Clear All Pins</Text>
          </TouchableOpacity>

          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Version</Text>
            <Text style={styles.settingsValue}>1.0.0</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[6],
  },
  avatar: {
    width: 80,
    height: 80,
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
    marginBottom: spacing[1],
  },
  email: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
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
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: colors.borderLight },
  section: { paddingHorizontal: spacing[5] },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.card,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingsLabel: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },
  settingsValue: {
    fontSize: fontSizes.sm,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textTertiary,
  },
  signOutBtn: {
    margin: spacing[5],
    marginTop: spacing[8],
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  signOutText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Medium',
    color: colors.accentRed,
  },
})
