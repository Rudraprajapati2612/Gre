import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import * as svc from './service'

export const tcRoutes = new Elysia({ prefix: '/tc' })
  .use(requireAuth)

  .get('/', async ({ query }) => {
    const questions = await svc.listTC({
      difficulty: query.difficulty,
      blankCount: query.blankCount ? Number(query.blankCount) : undefined,
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    })
    return { questions }
  }, {
    query: t.Object({
      difficulty: t.Optional(t.String()),
      blankCount: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
    }),
  })

  .get('/:id', async ({ params, set }) => {
    const question = await svc.getTC(params.id)
    if (!question) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'Question not found' } }
    }
    return { question }
  })

  .post('/:id/submit', async ({ userId, params, body, set }) => {
    try {
      const result = await svc.submitTC(userId, params.id, body.answers)
      return result
    } catch (e: any) {
      if (e.status) {
        set.status = e.status
        return { error: { code: e.code, message: e.message } }
      }
      throw e
    }
  }, {
    body: t.Object({ answers: t.Array(t.String()) }),
  })
