import type { NextFunction, Request, Response } from 'express'
import { verifySession } from '../utils/jwt.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string
      username: string
      role: 'admin' | 'user'
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'missing token',
    })
  }

  try {
    const session = verifySession(token)

    if (session.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'admin access required',
      })
    }

    req.user = {
      id: session.id,
      username: session.username,
      role: session.role,
    }

    return next()
  } catch {
    return res.status(401).json({
      success: false,
      error: 'invalid token',
    })
  }
}
