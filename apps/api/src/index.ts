import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { UnauthorizedError } from './plugins/auth'
import { authRoutes } from './modules/auth/routes'
import { wordsRoutes } from './modules/words/routes'
import { reviewRoutes } from './modules/review/routes'
import { tcRoutes } from './modules/tc/routes'
import { seRoutes } from './modules/se/routes'
import { rcRoutes } from './modules/rc/routes'
import { progressRoutes } from './modules/progress/routes'
import { adminRoutes } from './modules/admin/routes'
import { mountainRoutes } from './modules/mountain/routes'

const PORT = Number(process.env.PORT ?? 3001)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

const app = new Elysia()
  .use(cors({ origin: CORS_ORIGIN, credentials: true }))
  .onError(({ code, error, set }) => {
    if (error instanceof UnauthorizedError) {
      set.status = 401
      return { error: { code: error.code, message: error.message } }
    }
    if (code === 'VALIDATION') {
      set.status = 400
      return { error: { code: 'VALIDATION_ERROR', message: error.message } }
    }
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'Route not found' } }
    }
    set.status = 500
    console.error(error)
    return { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }
  })
  .group('/api', app =>
    app
      .use(authRoutes)
      .use(wordsRoutes)
      .use(reviewRoutes)
      .use(tcRoutes)
      .use(seRoutes)
      .use(rcRoutes)
      .use(progressRoutes)
      .use(adminRoutes)
      .use(mountainRoutes)
  )
  .get('/', () => ({ ok: true, service: 'GRE Verbal Trainer API' }))
  .listen(PORT)

console.log(`GRE backend running on http://localhost:${PORT}`)
