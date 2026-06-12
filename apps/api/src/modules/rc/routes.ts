import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import * as svc from './service'

export const rcRoutes = new Elysia({ prefix: '/rc' })
  .use(requireAuth)

  .get('/', async ({ query }) => {
    const passages = await svc.listPassages({
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    })
    return { passages }
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String()),
    }),
  })

  .get('/:passageId', async ({ params, set }) => {
    const passage = await svc.getPassage(params.passageId)
    if (!passage) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'Passage not found' } }
    }
    return { passage }
  })

  .post('/questions/:id/submit', async ({ userId, params, body, set }) => {
    try {
      const result = await svc.submitRCQuestion(userId, params.id, body.answerIndex, body.trapTags)
      return result
    } catch (e: any) {
      if (e.status) {
        set.status = e.status
        return { error: { code: e.code, message: e.message } }
      }
      throw e
    }
  }, {
    body: t.Object({
      answerIndex: t.Integer({ minimum: 0, maximum: 4 }),
      trapTags: t.Optional(t.Any()),
    }),
  })
