import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import { getUserById } from '../auth/service'
import * as svc from './service'

export const progressRoutes = new Elysia({ prefix: '/progress' })
  .use(requireAuth)

  .get('/summary', async ({ userId, set }) => {
    const user = await getUserById(userId)
    if (!user) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'User not found' } }
    }
    return svc.getSummary(userId, user.timezone)
  })

  .get('/weak-words', async ({ userId }) => {
    const words = await svc.getWeakWords(userId)
    return { words }
  })

  .get('/scores', async ({ userId, query }) => {
    const scores = await svc.getScores(userId, {
      section: query.section,
      from: query.from,
      to: query.to,
      granularity: query.granularity as any,
    })
    return { scores }
  }, {
    query: t.Object({
      section: t.Optional(t.String()),
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      granularity: t.Optional(t.Union([t.Literal('day'), t.Literal('week')])),
    }),
  })

  .get('/by-type', async ({ userId }) => {
    return svc.getByType(userId)
  })
