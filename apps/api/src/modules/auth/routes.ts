import Elysia, { t } from 'elysia'
import { accessJwt, refreshJwt, requireAuth } from '../../plugins/auth'
import * as svc from './service'

// Public auth routes (no token required)
const publicAuthRoutes = new Elysia({ prefix: '/auth' })
  .use(accessJwt)
  .use(refreshJwt)

  .post(
    '/register',
    async ({ body, accessJwt, refreshJwt, set }) => {
      try {
        const user = await svc.registerUser(body.email, body.password, body.displayName, body.timezone)
        const accessToken = await accessJwt.sign({ sub: user.id })
        const refreshToken = await refreshJwt.sign({ sub: user.id })
        await svc.storeRefreshToken(user.id, refreshToken)
        return { user, accessToken, refreshToken }
      } catch (e: any) {
        if (e.status) { set.status = e.status; return { error: { code: e.code, message: e.message } } }
        throw e
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        displayName: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
      }),
    },
  )

  .post(
    '/login',
    async ({ body, accessJwt, refreshJwt, set }) => {
      try {
        const user = await svc.loginUser(body.email, body.password)
        const accessToken = await accessJwt.sign({ sub: user.id })
        const refreshToken = await refreshJwt.sign({ sub: user.id })
        await svc.storeRefreshToken(user.id, refreshToken)
        return { user, accessToken, refreshToken }
      } catch (e: any) {
        if (e.status) { set.status = e.status; return { error: { code: e.code, message: e.message } } }
        throw e
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    },
  )

  .post(
    '/refresh',
    async ({ body, accessJwt, refreshJwt, set }) => {
      const userId = await svc.validateAndRevokeRefreshToken(body.refreshToken)
      if (!userId) { set.status = 401; return { error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' } } }
      const newRefreshToken = await refreshJwt.sign({ sub: userId })
      await svc.storeRefreshToken(userId, newRefreshToken)
      const accessToken = await accessJwt.sign({ sub: userId })
      return { accessToken, refreshToken: newRefreshToken }
    },
    { body: t.Object({ refreshToken: t.String() }) },
  )

  .post(
    '/logout',
    async ({ body }) => {
      await svc.revokeRefreshToken(body.refreshToken)
      return { ok: true }
    },
    { body: t.Object({ refreshToken: t.String() }) },
  )

// Protected auth routes
const protectedAuthRoutes = new Elysia({ prefix: '/auth' })
  .use(requireAuth)
  .get('/me', async ({ userId }) => {
    const user = await svc.getUserById(userId)
    return { user }
  })

export const authRoutes = new Elysia()
  .use(publicAuthRoutes)
  .use(protectedAuthRoutes)
