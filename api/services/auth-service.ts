import { env } from '../config/env.js'
import { supabase } from '../lib/supabase.js'
import { signSession } from '../utils/jwt.js'
import { comparePassword, hashPassword } from '../utils/password.js'

const ADMIN_ID = 'admin-splashwet-2026'

function normalizeCredentials(username: string, password: string) {
  return {
    username: username.trim().toLowerCase(),
    password: password.trim(),
  }
}

function validateCredentials(username: string, password: string) {
  if (username.length < 3) {
    throw new Error('username must be at least 3 characters long')
  }

  if (password.length < 6) {
    throw new Error('password must be at least 6 characters long')
  }
}

export async function registerUser(username: string, password: string) {
  const normalized = normalizeCredentials(username, password)
  validateCredentials(normalized.username, normalized.password)

  const { data: existingUser, error: existingUserError } = await supabase
    .from('utilizadores')
    .select('id')
    .eq('username', normalized.username)
    .maybeSingle()

  if (existingUserError) {
    throw new Error('failed to validate the username')
  }

  if (existingUser) {
    throw new Error('this username already exists')
  }

  const passwordHash = await hashPassword(normalized.password)

  const { data, error } = await supabase
    .from('utilizadores')
    .insert({
      username: normalized.username,
      password_hash: passwordHash,
    })
    .select('id, username')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'failed to create user')
  }

  return {
    token: signSession({
      id: data.id,
      username: data.username,
      role: 'user',
    }),
    user: {
      id: data.id,
      username: data.username,
      role: 'user',
    },
  }
}

export async function loginUser(username: string, password: string) {
  const normalized = normalizeCredentials(username, password)
  validateCredentials(normalized.username, normalized.password)

  const { data, error } = await supabase
    .from('utilizadores')
    .select('id, username, password_hash')
    .eq('username', normalized.username)
    .maybeSingle()

  if (error || !data) {
    throw new Error('invalid credentials')
  }

  const isValidPassword = await comparePassword(normalized.password, data.password_hash)

  if (!isValidPassword) {
    throw new Error('invalid credentials')
  }

  return {
    token: signSession({
      id: data.id,
      username: data.username,
      role: 'user',
    }),
    user: {
      id: data.id,
      username: data.username,
      role: 'user',
    },
  }
}

export async function loginAdmin(username: string, password: string) {
  const sanitizedUsername = username.trim()
  const sanitizedPassword = password.trim()

  if (sanitizedUsername !== env.adminUsername || sanitizedPassword !== env.adminPassword) {
    throw new Error('invalid admin credentials')
  }

  return {
    token: signSession({
      id: ADMIN_ID,
      username: env.adminUsername,
      role: 'admin',
    }),
    user: {
      id: ADMIN_ID,
      username: env.adminUsername,
      role: 'admin',
    },
  }
}
