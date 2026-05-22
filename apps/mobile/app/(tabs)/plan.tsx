import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native'
import { api } from '../../src/lib/api'
import { ChatMessage, Itinerary } from '@pintrip/shared'
import { colors, fontSizes, spacing, radius, shadows } from '../../src/constants/theme'

const SUGGESTIONS = [
  "Plan a 5-day trip to Himachal",
  "What can I do with my Northeast pins?",
  "Build a weekend trip from my wishlist",
]

function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <View style={styles.itineraryCard}>
      <Text style={styles.itinerarySummary}>{itinerary.summary}</Text>
      {itinerary.days.map((day) => (
        <View key={day.day} style={styles.dayCard}>
          <Text style={styles.dayLabel}>Day {day.day}</Text>
          <Text style={styles.dayTitle}>{day.title}</Text>
          <Text style={styles.dayDesc}>{day.description}</Text>
          {day.travelNote && (
            <Text style={styles.travelNote}>🚗 {day.travelNote}</Text>
          )}
        </View>
      ))}
    </View>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {message.itinerary ? (
          <ItineraryCard itinerary={message.itinerary} />
        ) : (
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  )
}

export default function PlanScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsSending(true)

    try {
      const res = await api.post('/plan', {
        message: text.trim(),
        conversationHistory: messages,
      })

      const reply = res.data.data
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: reply.type === 'message' ? reply.content : '',
        timestamp: new Date().toISOString(),
        itinerary: reply.type === 'itinerary' ? reply : undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={84}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.subtitle}>AI itineraries from your pins</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start planning your trip</Text>
            <Text style={styles.emptySubtitle}>
              Ask me anything about your saved pins
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
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your pins..."
          placeholderTextColor={colors.textTertiary}
          multiline
          onSubmitEditing={() => sendMessage(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isSending}
        >
          <Text style={styles.sendBtnText}>{isSending ? '...' : '→'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: 60,
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  messageList: { padding: spacing[4], gap: spacing[3], flexGrow: 1 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  messageRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: fontSizes.sm,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    padding: spacing[4],
    ...shadows.card,
  },
  bubbleUser: {
    backgroundColor: colors.textPrimary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: { color: '#FFFFFF' },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing[10],
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  suggestions: { gap: spacing[2], width: '100%' },
  suggestionChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
  },
  itineraryCard: { gap: spacing[3] },
  itinerarySummary: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: spacing[3],
    gap: 4,
  },
  dayLabel: {
    fontSize: fontSizes.xs,
    fontFamily: 'DMSans-Medium',
    color: colors.accentGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTitle: {
    fontSize: fontSizes.base,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
  },
  dayDesc: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  travelNote: {
    fontSize: fontSizes.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    padding: spacing[3],
    paddingBottom: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bgPrimary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSizes.base,
    fontFamily: 'DMSans-Regular',
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontFamily: 'DMSans-Medium',
  },
})
