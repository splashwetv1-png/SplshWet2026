import type { NextFunction, Request, Response } from 'express'

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
  message?: string
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function getClientKey(req: Request) {
  const forwarded = req.headers['x-forwarded-for']
  const ip =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.ip

  return ip || 'unknown'
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'global',
    message = 'too many requests, please try again in a moment',
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = `${keyPrefix}:${req.path}:${getClientKey(req)}`
    const current = buckets.get(key)

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      next()
      return
    }

    if (current.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))

      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({
        success: false,
        error: message,
      })
      return
    }

    current.count += 1
    buckets.set(key, current)
    next()
  }
}
