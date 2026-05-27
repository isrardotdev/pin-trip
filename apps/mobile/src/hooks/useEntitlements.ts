import { useAuthStore } from '../stores/authStore'
import { PLANNER_FREE_LIMIT } from '@pintrip/shared'

// Single source of truth for what the current user can access.
// Phase 7: update isPro to also check RevenueCat entitlements here —
// nothing that consumes this hook will need to change.
export function useEntitlements() {
  const user = useAuthStore((s) => s.user)

  const isPro = user?.plan === 'PRO'
  const used = user?.aiMessagesUsed ?? 0
  const remaining = isPro ? Infinity : Math.max(0, PLANNER_FREE_LIMIT - used)

  return {
    isPro,

    // AI Planner
    canSendPlannerMessage: isPro || used < PLANNER_FREE_LIMIT,
    plannerMessagesUsed: used,
    plannerMessagesRemaining: remaining,

    // Future gates — add here as one-liners when building the feature:
    // hasUnlimitedPins: isPro,
    // canExportItinerary: isPro,
    // canCreateSharedTrip: isPro,
  }
}
