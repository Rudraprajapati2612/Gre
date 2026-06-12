import Elysia from 'elysia'
import jwt from '@elysiajs/jwt'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
const ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL ?? 900)
const REFRESH_TTL = Number(process.env.REFRESH_TOKEN_TTL ?? 2592000)

export class UnauthorizedError extends Error {
  readonly status = 401
  readonly code: string
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message)
    this.code = code
  }
}

export const accessJwt = new Elysia({ name: 'accessJwt' }).use(
  jwt({ name: 'accessJwt', secret: ACCESS_SECRET, exp: `${ACCESS_TTL}s` }),
)

export const refreshJwt = new Elysia({ name: 'refreshJwt' }).use(
  jwt({ name: 'refreshJwt', secret: REFRESH_SECRET, exp: `${REFRESH_TTL}s` }),
)

export const REFRESH_TTL_SECONDS = REFRESH_TTL
export const ACCESS_TTL_SECONDS = ACCESS_TTL

/** Resolve plugin: adds `userId: string` to context or throws UnauthorizedError. */
export const requireAuth = new Elysia({ name: 'requireAuth' })
  .use(accessJwt)
  .resolve({ as: 'scoped' }, async ({ accessJwt, headers }) => {
    const auth = headers['authorization']
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedError('Missing token')
    const token = auth.slice(7)
    const payload = await accessJwt.verify(token)
    if (!payload || typeof payload.sub !== 'string') throw new UnauthorizedError('Invalid token')
    return { userId: payload.sub }
  })
