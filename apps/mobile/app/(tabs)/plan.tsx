import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, Alert, Animated, ScrollView,
} from 'react-native'
import ReAnimated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { api } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/authStore'
import { usePinsStore } from '../../src/stores/pinsStore'
import { useEntitlements } from '../../src/hooks/useEntitlements'
import { TripLibrary, SavedItinerarySummary } from '../../src/components/TripLibrary'
import { PlannerLimitScreen } from '../../src/components/PlannerLimitScreen'
import { SavePinModal } from '../../src/components/SavePinModal'
import { ChatMessage, TripDocument, DayItem, PlannerResponse, PinStatus } from '@wanderpin/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const SUGGESTIONS = [
  "Plan a 5-day trip to Himachal",
  "What can I do with my Northeast pins?",
  "Build a weekend trip from my wishlist",
  "Plan a quick Goa getaway",
]

type ActiveView = 'chat' | 'library'

// ─── Conflict prompt ──────────────────────────────────────────────────────────

function ConflictModal({
  visible, currentDest, newDest,
  onSaveAndSwitch, onDiscard, onCancel,
}: {
  visible: boolean
  currentDest: string
  newDest: string
  onSaveAndSwitch: () => void
  onDiscard: () => void
  onCancel: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.conflictOverlay}>
        <View style={styles.conflictCard}>
          <Text style={styles.conflictTitle}>Start a new trip?</Text>
          <Text style={styles.conflictBody}>
            You have a <Text style={styles.conflictBold}>{currentDest}</Text> itinerary in progress.
            Starting <Text style={styles.conflictBold}>{newDest}</Text> will replace it.
          </Text>
          <TouchableOpacity style={styles.conflictBtnPrimary} onPress={onSaveAndSwitch} activeOpacity={0.85}>
            <Ionicons name="bookmark-outline" size={16} color="#fff" />
            <Text style={styles.conflictBtnPrimaryText}>Save {currentDest} trip first</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.conflictBtnSecondary} onPress={onDiscard} activeOpacity={0.85}>
            <Text style={styles.conflictBtnSecondaryText}>Discard and start fresh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.conflictCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, onSuggestion }: {
  message: ChatMessage
  onSuggestion?: (text: string) => void
}) {
  const isUser = message.role === 'user'
  const hasSuggestions = !isUser && !!message.suggestions?.length && !!onSuggestion

  return (
    <View style={[styles.messageOuter, isUser && styles.messageOuterUser]}>
      {/* Bubble row */}
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>P</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        </View>
      </View>

      {/* Suggestion chips — horizontal scroll, indented under the bubble */}
      {hasSuggestions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {message.suggestions!.map(s => (
            <TouchableOpacity
              key={s}
              style={styles.suggestionChip}
              onPress={() => onSuggestion!(s)}
              activeOpacity={0.7}
            >
              <Ionicons name="return-down-forward-outline" size={11} color={colors.accentGreen} />
              <Text style={styles.suggestionChipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

// ─── Question bubble (preference gathering) ───────────────────────────────────

function QuestionBubble({ message, selectedOption, planNowSent, isLastMessage, onOptionSelect, onPlanNow }: {
  message: ChatMessage
  selectedOption?: string
  planNowSent: boolean
  isLastMessage: boolean
  onOptionSelect: (opt: string) => void
  onPlanNow: () => void
}) {
  const chipsLocked = message.readyToPlan ? planNowSent : !!selectedOption
  const showOptions = isLastMessage  // hide options on past messages — user already replied

  return (
    <View style={styles.messageOuter}>
      <View style={styles.messageRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
        <View style={styles.questionWrap}>
          <View style={[styles.bubble, styles.bubbleAI]}>
            <Text style={styles.bubbleText}>{message.content}</Text>
          </View>
        </View>
      </View>

      {showOptions && (
        <View style={styles.optionsWrap}>
          <View style={styles.optionsList}>
            {message.questionOptions!.map(opt => {
              const isSelected = selectedOption === opt
              const isDisabled = chipsLocked && !isSelected
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    isDisabled && styles.optionItemDisabled,
                  ]}
                  onPress={() => !chipsLocked && onOptionSelect(opt)}
                  activeOpacity={0.75}
                  disabled={chipsLocked && !isSelected}
                >
                  <View style={[styles.optionDot, isSelected && styles.optionDotSelected]}>
                    {isSelected && <View style={styles.optionDotInner} />}
                  </View>
                  <Text style={[styles.optionItemText, isSelected && styles.optionItemTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {message.readyToPlan && !planNowSent && (
            <TouchableOpacity style={styles.planNowBtn} onPress={onPlanNow} activeOpacity={0.85}>
              <Ionicons name="map-outline" size={15} color="#fff" />
              <Text style={styles.planNowBtnText}>Plan now</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ]

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((dots.length - i) * 160),
        ])
      )
    )
    animations.forEach(a => a.start())
    return () => animations.forEach(a => a.stop())
  }, [])

  return (
    <View style={styles.messageRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>P</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  )
}

// ─── Plan screen ──────────────────────────────────────────────────────────────


export default function PlanScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const refreshUser = useAuthStore(s => s.refreshUser)
  const { canSendPlannerMessage, plannerMessagesRemaining, isPro } = useEntitlements()
  const { addPin, pins } = usePinsStore()

  const [activeView, setActiveView] = useState<ActiveView>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tripDocument, setTripDocument] = useState<TripDocument | null>(null)
  const [currentDestination, setCurrentDestination] = useState<string | null>(null)
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerarySummary[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingConv, setIsLoadingConv] = useState(true)
  const [pendingMessage, setPendingMessage] = useState('')

  // Conflict state
  const [conflictVisible, setConflictVisible] = useState(false)
  const [conflictDest, setConflictDest] = useState({ current: '', incoming: '' })

  // Question bubble state
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [planNowSent, setPlanNowSent] = useState<Set<number>>(new Set())

  // Save-to-map confirmation
  const [addToMapTarget, setAddToMapTarget] = useState<DayItem | null>(null)


  const listRef = useRef<FlatList>(null)
  const pinWarningShown = useRef(false)

  // Load existing conversation + saved itineraries on mount
  useEffect(() => {
    Promise.all([
      api.get('/plan/conversation'),
      api.get('/plan/saved'),
    ]).then(([convRes, savedRes]) => {
      const conv = convRes.data.data
      setMessages(conv.messages ?? [])
      setTripDocument(conv.tripDocument ?? null)
      setCurrentDestination(conv.destination ?? null)
      setSavedItineraries(savedRes.data.data ?? [])
    }).catch(() => {}).finally(() => setIsLoadingConv(false))
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }, [])

  const sendMessage = async (text: string, confirmedReset = false) => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    // One-time warning on very first message when user has no pins
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0
    if (isFirstMessage && pins.length === 0 && !pinWarningShown.current) {
      pinWarningShown.current = true
      Alert.alert(
        'No pins yet',
        `Your itinerary will be built from general suggestions — not places you've personally saved.\n\nAdd some pins to your map first for a personalised trip. You have ${plannerMessagesRemaining} free message${plannerMessagesRemaining !== 1 ? 's' : ''} left.`,
        [
          {
            text: 'Add pins first',
            onPress: () => router.push('/(tabs)/'),
          },
          {
            text: 'Continue anyway',
            style: 'default',
            onPress: () => sendMessage(trimmed, confirmedReset),
          },
        ]
      )
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsSending(true)
    scrollToBottom()

    try {
      const res = await api.post('/plan', { message: trimmed, confirmedReset })
      const response = res.data.data as PlannerResponse

      if (response.type === 'conflict') {
        // Remove the optimistic user message — we need them to confirm first
        setMessages(prev => prev.slice(0, -1))
        setPendingMessage(trimmed)
        setConflictDest({ current: response.currentDestination, incoming: response.newDestination })
        setConflictVisible(true)
        return
      }

      if (response.type === 'itinerary_new' || response.type === 'itinerary_update') {
        setTripDocument(response.document)
        if (response.type === 'itinerary_new') {
          setCurrentDestination(response.destination)
        }
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: `Here's your ${response.type === 'itinerary_new' ? response.destination + ' itinerary' : 'updated itinerary'} ↑`,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMsg])
      } else if (response.type === 'question') {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
          questionOptions: response.options,
          readyToPlan: response.readyToPlan,
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMsg])
      }

      await refreshUser() // update aiMessagesUsed counter
      scrollToBottom()
    } catch (e: any) {
      const code = e?.response?.data?.code
      if (code !== 'PLANNER_LIMIT_REACHED') {
        const content = code === 'PLANNER_RATE_LIMITED'
          ? "The AI planner is busy right now. Please wait a moment and try again."
          : "I'm having trouble connecting right now. Please try again."
        const errMsg: ChatMessage = {
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errMsg])
      }
      await refreshUser()
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveTrip = async () => {
    try {
      const res = await api.post('/plan/save', {})
      setSavedItineraries(prev => [res.data.data, ...prev])
      Alert.alert('Saved!', 'Your itinerary has been saved to My Trips.')
    } catch {
      Alert.alert('Error', 'Could not save trip. Please try again.')
    }
  }

  const handleLoadTrip = async (id: string) => {
    try {
      const res = await api.post(`/plan/load/${id}`)
      const conv = res.data.data
      setTripDocument(conv.tripDocument)
      setCurrentDestination(conv.destination)
      setMessages([])
      setSelectedOptions({})
      setPlanNowSent(new Set())
      setActiveView('chat')
    } catch {
      Alert.alert('Error', 'Could not load trip.')
    }
  }

  const handleDeleteTrip = async (id: string) => {
    Alert.alert('Delete trip?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/plan/saved/${id}`)
            setSavedItineraries(prev => prev.filter(t => t.id !== id))
          } catch {}
        },
      },
    ])
  }

  const handleOptionSelect = (messageIdx: number, option: string, readyToPlan: boolean) => {
    setSelectedOptions(prev => ({ ...prev, [messageIdx]: option }))
    // For non-readyToPlan questions, selecting immediately sends the answer
    if (!readyToPlan) {
      sendMessage(option)
    }
  }

  const handlePlanNow = (messageIdx: number) => {
    setPlanNowSent(prev => new Set([...prev, messageIdx]))
    const selected = selectedOptions[messageIdx]
    const text = selected
      ? `${selected}. Create my itinerary now.`
      : 'Create my itinerary now.'
    sendMessage(text)
  }

  const handleAddToMap = (item: DayItem) => {
    if (!item.lat || !item.lng) return
    setAddToMapTarget(item)
  }

  const doAddToMap = async (status: PinStatus) => {
    const item = addToMapTarget
    if (!item) return
    setAddToMapTarget(null)
    try {
      await addPin({
        name: item.name,
        lat: item.lat!,
        lng: item.lng!,
        category: item.category,
        source: 'PLANNER',
        status,
        country: 'India',
      })
    } catch {}
  }

  const handleConflictSaveAndSwitch = async () => {
    setConflictVisible(false)
    await handleSaveTrip()
    await sendMessage(pendingMessage, true)
    setPendingMessage('')
  }

  const handleConflictDiscard = async () => {
    setConflictVisible(false)
    setTripDocument(null)
    setCurrentDestination(null)
    await sendMessage(pendingMessage, true)
    setPendingMessage('')
  }

  if (isLoadingConv) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accentGreen} />
      </View>
    )
  }

  const hasSavedTrips = savedItineraries.length > 0

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={84}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Plan</Text>
          {!isPro && canSendPlannerMessage && (
            <View style={styles.messagesBadge}>
              <Text style={styles.messagesBadgeText}>{plannerMessagesRemaining} free left</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {tripDocument && (
            <TouchableOpacity style={styles.headerIconBtn} onPress={handleSaveTrip}>
              <Ionicons name="bookmark-outline" size={20} color={colors.accentGreen} />
            </TouchableOpacity>
          )}
          {hasSavedTrips && (
            <TouchableOpacity
              style={styles.tabToggle}
              onPress={() => setActiveView(v => v === 'chat' ? 'library' : 'chat')}
            >
              <Ionicons
                name={activeView === 'chat' ? 'library-outline' : 'chatbubble-outline'}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.tabToggleText}>
                {activeView === 'chat' ? 'My Trips' : 'Chat'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Itinerary banner (shared element origin) ── */}
      {activeView === 'chat' && tripDocument && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(modals)/itinerary')}>
          <ReAnimated.View style={styles.itineraryBanner}>
            <View style={styles.itineraryBannerLeft}>
              <Ionicons name="map" size={16} color={colors.accentGreen} />
              <View style={styles.itineraryBannerText}>
                <Text style={styles.itineraryBannerTitle} numberOfLines={1}>
                  {currentDestination ?? tripDocument.destination}
                </Text>
                <Text style={styles.itineraryBannerSub}>
                  {tripDocument.days.length} days · tap to view itinerary
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </ReAnimated.View>
        </TouchableOpacity>
      )}

      {/* ── Library view ── */}
      {activeView === 'library' ? (
        <TripLibrary
          itineraries={savedItineraries}
          onLoad={handleLoadTrip}
          onDelete={handleDeleteTrip}
          onNewTrip={() => setActiveView('chat')}
        />
      ) : (
        <>
          {/* ── Chat messages ── */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const isLastMessage = index === messages.length - 1
              if (item.role === 'assistant' && item.questionOptions) {
                return (
                  <QuestionBubble
                    message={item}
                    selectedOption={selectedOptions[index]}
                    planNowSent={planNowSent.has(index)}
                    isLastMessage={isLastMessage}
                    onOptionSelect={(opt) => handleOptionSelect(index, opt, !!item.readyToPlan)}
                    onPlanNow={() => handlePlanNow(index)}
                  />
                )
              }
              return (
                <MessageBubble
                  message={item}
                  onSuggestion={isLastMessage && item.role === 'assistant' ? sendMessage : undefined}
                />
              )
            }}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isSending ? <TypingIndicator /> : null}
            ListEmptyComponent={
              !tripDocument ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="map-outline" size={32} color={colors.textTertiary} />
                  </View>
                  <Text style={styles.emptyTitle}>Plan your next trip</Text>
                  <Text style={styles.emptySubtitle}>
                    Tell me where you want to go. I'll build an itinerary from your saved pins.
                  </Text>
                  <View style={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={styles.suggestionChip}
                        onPress={() => sendMessage(s)}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null
            }
          />

          {/* ── Paywall (inline) ── */}
          {!canSendPlannerMessage && (
            <PlannerLimitScreen
              onUpgrade={() => { /* Phase 7: open RevenueCat */ }}
              onDismiss={() => {}}
            />
          )}

          {/* ── Input bar ── */}
          {canSendPlannerMessage && (
            <View style={[styles.inputBar, { paddingBottom: spacing[3] + insets.bottom / 2 }]}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your pins..."
                placeholderTextColor={colors.textTertiary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isSending}
                activeOpacity={0.85}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ── Conflict modal ── */}
      <ConflictModal
        visible={conflictVisible}
        currentDest={conflictDest.current}
        newDest={conflictDest.incoming}
        onSaveAndSwitch={handleConflictSaveAndSwitch}
        onDiscard={handleConflictDiscard}
        onCancel={() => { setConflictVisible(false); setPendingMessage('') }}
      />

      {/* ── Add to map confirmation ── */}
      <SavePinModal
        visible={!!addToMapTarget}
        name={addToMapTarget?.name ?? ''}
        location={addToMapTarget?.description ? undefined : undefined}
        category={addToMapTarget?.category ?? 'NATURE'}
        onSave={doAddToMap}
        onCancel={() => setAddToMapTarget(null)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  title: { fontSize: fontSizes['2xl'], fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary },

  messagesBadge: {
    backgroundColor: `${colors.accentAmber}20`,
    borderRadius: radius.full, paddingHorizontal: spacing[2], paddingVertical: 3,
    borderWidth: 1, borderColor: `${colors.accentAmber}40`,
  },
  messagesBadgeText: { fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium', color: colors.accentAmber },

  headerIconBtn: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  tabToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[1],
    backgroundColor: colors.bgSecondary, borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
  },
  tabToggleText: { fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: colors.textSecondary },

  messageList: { padding: spacing[4], flexGrow: 1 },

  itineraryBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing[4], marginTop: spacing[3], marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    borderLeftWidth: 3, borderLeftColor: colors.accentGreen,
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
    ...shadows.card,
  },
  itineraryBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  itineraryBannerText: { flex: 1 },
  itineraryBannerTitle: {
    fontSize: fontSizes.sm, fontFamily: 'PlayfairDisplay-Bold', color: colors.textPrimary,
  },
  itineraryBannerSub: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Regular', color: colors.textSecondary,
  },

  typingBubble: { flexDirection: 'row', gap: 5, paddingVertical: spacing[4], paddingHorizontal: spacing[4] },
  typingDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textTertiary,
  },

  // Question bubble
  questionWrap: { maxWidth: '88%' },

  // Options block indented under the bubble (36px = avatar 28px + gap 8px)
  optionsWrap: { marginLeft: 36, marginTop: spacing[2], gap: spacing[2] },
  optionsList: { gap: spacing[2] },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
  },
  optionItemSelected: {
    backgroundColor: `${colors.accentGreen}10`,
    borderColor: colors.accentGreen,
  },
  optionItemDisabled: { opacity: 0.4 },
  optionItemText: {
    flex: 1, fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textPrimary,
  },
  optionItemTextSelected: {
    fontFamily: 'DMSans-Medium', color: colors.accentGreen,
  },
  optionDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: colors.borderMedium,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  optionDotSelected: { borderColor: colors.accentGreen },
  optionDotInner: {
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: colors.accentGreen,
  },
  planNowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
    alignSelf: 'flex-start',
    marginTop: spacing[1],
  },
  planNowBtnText: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Medium', color: '#fff',
  },

  messageOuter: { marginBottom: spacing[3] },
  messageOuterUser: {},
  messageRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2],
  },
  messageRowUser: { flexDirection: 'row-reverse' },

  // Suggestion chips — horizontal scroll under the AI bubble
  suggestionsScroll: { marginTop: spacing[2], marginLeft: 36 }, // 28px avatar + 8px gap
  suggestionsContent: { gap: spacing[2], paddingHorizontal: spacing[1] },
  suggestionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: colors.accentGreen,
    borderRadius: radius.full,
    paddingVertical: 5, paddingHorizontal: spacing[3],
    backgroundColor: `${colors.accentGreen}08`,
  },
  suggestionChipText: {
    fontSize: fontSizes.xs, fontFamily: 'DMSans-Medium',
    color: colors.accentGreen, flexShrink: 1,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: fontSizes.xs, fontFamily: 'PlayfairDisplay-Bold' },
  bubble: {
    maxWidth: '78%', borderRadius: radius.lg, padding: spacing[3], ...shadows.card,
  },
  bubbleUser: { backgroundColor: colors.textPrimary, borderBottomRightRadius: 4, alignSelf: 'flex-end' },
  bubbleAI: {
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.borderLight, borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textPrimary, lineHeight: 20,
  },
  bubbleTextUser: { color: '#fff' },

  emptyState: {
    alignItems: 'center', paddingTop: spacing[8], paddingHorizontal: spacing[6],
  },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: fontSizes.xl, fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[2], textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing[6],
  },
  suggestions: { gap: spacing[2], width: '100%' },
  suggestionChip: {
    backgroundColor: colors.surface, borderRadius: radius.full,
    paddingVertical: spacing[3], paddingHorizontal: spacing[5],
    borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center',
  },
  suggestionText: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textPrimary,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2],
    paddingHorizontal: spacing[3], paddingTop: spacing[3],
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.bgPrimary,
  },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular',
    color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderLight, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.pin,
  },
  sendBtnDisabled: { opacity: 0.45 },

  // Conflict modal
  conflictOverlay: {
    flex: 1, backgroundColor: 'rgba(28,28,26,0.6)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  conflictCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing[6], marginHorizontal: spacing[4],
    alignItems: 'center', width: '100%',
    ...shadows.sheet,
  },
  conflictTitle: {
    fontSize: fontSizes.lg, fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary, marginBottom: spacing[3],
  },
  conflictBody: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular',
    color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing[5],
  },
  conflictBold: { fontFamily: 'DMSans-Medium', color: colors.textPrimary },
  conflictBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    backgroundColor: colors.accentGreen, borderRadius: radius.full,
    paddingVertical: spacing[4], paddingHorizontal: spacing[5],
    alignSelf: 'stretch', justifyContent: 'center', marginBottom: spacing[3],
  },
  conflictBtnPrimaryText: { color: '#fff', fontSize: fontSizes.base, fontFamily: 'DMSans-Medium' },
  conflictBtnSecondary: {
    alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.borderMedium, borderRadius: radius.full,
    paddingVertical: spacing[4], marginBottom: spacing[4],
  },
  conflictBtnSecondaryText: {
    fontSize: fontSizes.base, fontFamily: 'DMSans-Regular', color: colors.textSecondary,
  },
  conflictCancel: {
    fontSize: fontSizes.sm, fontFamily: 'DMSans-Regular', color: colors.textTertiary,
  },
})
