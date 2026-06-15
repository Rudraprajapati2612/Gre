import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sql } from '../../db/client'
import { REFRESH_TTL_SECONDS } from '../../plugins/auth'
import { normalizeTimezone } from '../../lib/dates'

export async function registerUser(email: string, password: string, displayName?: string, timezone?: string) {
  const lowerEmail = email.toLowerCase()
  const existing = await sql`SELECT id FROM users WHERE email = ${lowerEmail}`
  if (existing.length > 0) throw { status: 409, code: 'EMAIL_TAKEN', message: 'Email already registered' }

  const password_hash = await bcrypt.hash(password, 12)
  const tz = normalizeTimezone(timezone ?? 'Asia/Kolkata')
  const [user] = await sql`
    INSERT INTO users (email, password_hash, display_name, timezone)
    VALUES (${lowerEmail}, ${password_hash}, ${displayName ?? null}, ${tz})
    RETURNING id, email, display_name, timezone, created_at
  `
  return user
}

export async function loginUser(email: string, password: string) {
  const lowerEmail = email.toLowerCase()
  const [user] = await sql`SELECT * FROM users WHERE email = ${lowerEmail}`
  if (!user) throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }

  return { id: user.id, email: user.email, display_name: user.display_name, timezone: user.timezone, created_at: user.created_at }
}

export async function storeRefreshToken(userId: string, token: string) {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000)
  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${hash}, ${expiresAt})
  `
}

export async function validateAndRevokeRefreshToken(token: string) {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const [row] = await sql`
    DELETE FROM refresh_tokens WHERE token_hash = ${hash} AND expires_at > now()
    RETURNING user_id
  `
  return row?.user_id ?? null
}

export async function revokeRefreshToken(token: string) {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  await sql`DELETE FROM refresh_tokens WHERE token_hash = ${hash}`
}

export async function getUserById(id: string) {
  const [user] = await sql`
    SELECT id, email, display_name, timezone, created_at FROM users WHERE id = ${id}
  `
  return user ?? null
}
