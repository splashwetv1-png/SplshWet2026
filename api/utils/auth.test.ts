import { describe, expect, it } from 'vitest'
import { comparePassword, hashPassword } from './password.js'
import { signSession, verifySession } from './jwt.js'

describe('password helpers', () => {
  it('hashes and validates passwords with bcrypt', async () => {
    const hash = await hashPassword('minha-senha-segura')

    await expect(comparePassword('minha-senha-segura', hash)).resolves.toBe(true)
    await expect(comparePassword('senha-errada', hash)).resolves.toBe(false)
  })
})

describe('jwt helpers', () => {
  it('creates and validates session payloads', () => {
    const token = signSession({
      id: 'user-1',
      username: 'admin',
      role: 'admin',
    })

    expect(verifySession(token)).toEqual({
      id: 'user-1',
      username: 'admin',
      role: 'admin',
      iat: expect.any(Number),
      exp: expect.any(Number),
    })
  })
})
