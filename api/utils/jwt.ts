import jwt from 'jsonwebtoken'
import type { AuthUser } from '../../shared/types.js'
import { env } from '../config/env.js'

export function signSession(user: AuthUser) {
  return jwt.sign(user, env.jwtSecret, { expiresIn: '7d' })
}

export function verifySession(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthUser & {
    iat: number
    exp: number
  }
}
