import { Response, NextFunction } from 'express'
import { prisma } from '../db'
import { AuthRequest } from './auth'

const FREE_MESSAGE_LIMIT = 5

// Metered gate for the AI planner.
// PRO users pass through immediately.
// FREE users get FREE_MESSAGE_LIMIT messages lifetime, then are blocked.
// Does NOT increment here — increment happens only after a successful AI response.
export async function requirePlannerAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { plan: true, aiMessagesUsed: true },
  })

  if (!user) {
    res.status(401).json({ success: false, error: 'User not found' })
    return
  }

  if (user.plan === 'PRO') {
    next()
    return
  }

  if (user.aiMessagesUsed >= FREE_MESSAGE_LIMIT) {
    res.status(403).json({
      success: false,
      error: 'You have used all your free planning sessions',
      code: 'PLANNER_LIMIT_REACHED',
      data: { used: user.aiMessagesUsed, limit: FREE_MESSAGE_LIMIT },
    })
    return
  }

  next()
}
