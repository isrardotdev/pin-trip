import { Response, NextFunction } from 'express'
import { prisma } from '../db'
import { AuthRequest } from './auth'

// Binary gate — user must be on PRO plan.
// Apply to any route that should be fully unavailable on FREE.
// Usage: router.post('/route', authenticate, requirePro, handler)
export async function requirePro(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { plan: true },
  })

  if (!user || user.plan !== 'PRO') {
    res.status(403).json({
      success: false,
      error: 'This feature requires PinTrip Pro',
      code: 'SUBSCRIPTION_REQUIRED',
    })
    return
  }

  next()
}
