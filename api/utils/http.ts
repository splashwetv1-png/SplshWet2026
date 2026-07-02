import type { Response } from 'express'

export function sendError(res: Response, error: unknown, fallbackMessage: string, status = 400) {
  const message = error instanceof Error ? error.message : fallbackMessage

  res.status(status).json({
    success: false,
    error: message || fallbackMessage,
  })
}

export function parsePaginationParam(value: unknown, defaultValue: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(String(value ?? defaultValue), 10)

  if (!Number.isFinite(parsed)) {
    return defaultValue
  }

  return Math.min(Math.max(parsed, minimum), maximum)
}
