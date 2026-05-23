import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../src/lib/api'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

export default function ManualAddModal() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isValidUrl = url.trim().length > 0 && (
    url.includes('instagram.com') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('reel') ||
    url.startsWith('http')
  )

  const handlePin = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post('/pins/parse', { url: trimmed })
      const { jobId } = res.data.data
      router.replace({
        pathname: '/(modals)/pin-confirm',
        params: { jobId, url: trimmed },
      })
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Something went wrong'
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.handle} />

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="link" size={28} color={colors.accentGreen} />
        </View>

        <Text style={styles.title}>Paste a reel link</Text>
        <Text style={styles.subtitle}>
          Drop any Instagram reel URL and we'll find the location for you — same as sharing.
        </Text>

        {/* URL input */}
        <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
          <Text style={styles.inputPrefix}>🔗</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={(t) => { setUrl(t); setError('') }}
            placeholder="instagram.com/reel/..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handlePin}
            autoFocus
          />
          {url.length > 0 && (
            <TouchableOpacity onPress={() => { setUrl(''); setError('') }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.pinBtn, (!isValidUrl || isLoading) && styles.pinBtnDisabled]}
          onPress={handlePin}
          disabled={!isValidUrl || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="location" size={18} color="#FFFFFF" style={{ marginRight: spacing[2] }} />
              <Text style={styles.pinBtnText}>Pin it</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          AI extracts the location from the reel automatically — no typing needed.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.borderMedium,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing[6],
  },

  iconWrap: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
    ...shadows.card,
  },

  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing[6],
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderLight,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    marginBottom: spacing[2],
    ...shadows.card,
  },
  inputWrapError: {
    borderColor: colors.accentRed,
  },
  inputPrefix: { fontSize: 16, marginRight: spacing[2] },
  input: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontFamily: 'IBMPlexMono-Regular',
    color: colors.textPrimary,
  },

  errorText: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.accentRed,
    marginBottom: spacing[4],
    marginLeft: spacing[1],
  },

  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[4],
    ...shadows.pin,
  },
  pinBtnDisabled: { opacity: 0.45 },
  pinBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontFamily: 'DMSans-Medium',
  },

  hint: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
})
