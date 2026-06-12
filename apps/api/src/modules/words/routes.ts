import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import * as svc from './service'
import { getUserById } from '../auth/service'

export const wordsRoutes = new Elysia({ prefix: '/words' })
  .use(requireAuth)

  .get(
    '/',
    async ({ userId, query }) => {
      const words = await svc.listWords(userId, {
        q: query.q,
        tone: query.tone,
        cluster: query.cluster,
        status: query.status,
        limit: query.limit ? Number(query.limit) : 50,
        offset: query.offset ? Number(query.offset) : 0,
      })
      return { words }
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        tone: t.Optional(t.String()),
        cluster: t.Optional(t.String()),
        status: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )

  .get('/compare', async ({ userId, query, set }) => {
    if (!query.idA || !query.idB) {
      set.status = 400
      return { error: { code: 'BAD_REQUEST', message: 'idA and idB required' } }
    }
    const words = await svc.compareWords(userId, query.idA, query.idB)
    return { words }
  }, {
    query: t.Object({
      idA: t.Optional(t.String()),
      idB: t.Optional(t.String()),
    }),
  })

  .get('/:id', async ({ userId, params, set }) => {
    const word = await svc.getWord(userId, params.id)
    if (!word) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'Word not found' } }
    }
    return { word }
  })

  .post(
    '/:id/learn',
    async ({ userId, params, set }) => {
      const user = await getUserById(userId)
      if (!user) {
        set.status = 404
        return { error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      const progress = await svc.markLearning(userId, params.id, user.timezone)
      return { progress }
    },
  )

  .post(
    '/learn-batch',
    async ({ userId, body, set }) => {
      if (body.wordIds.length > 20) {
        set.status = 400
        return { error: { code: 'TOO_MANY', message: 'Max 20 words per batch' } }
      }
      const user = await getUserById(userId)
      if (!user) {
        set.status = 404
        return { error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      const results = await svc.markLearningBatch(userId, body.wordIds, user.timezone)
      return { results }
    },
    { body: t.Object({ wordIds: t.Array(t.String(), { maxItems: 20 }) }) },
  )
