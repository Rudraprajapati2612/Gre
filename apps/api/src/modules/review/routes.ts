import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import { getUserById } from '../auth/service'
import * as svc from './service'

export const reviewRoutes = new Elysia({ prefix: '/review' })
  .use(requireAuth)

  .get('/today', async ({ userId, set }) => {
    const user = await getUserById(userId)
    if (!user) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'User not found' } }
    }
    const words = await svc.getTodayWords(userId, user.timezone)
    return { words }
  })

  .get('/due', async ({ userId, set }) => {
    const user = await getUserById(userId)
    if (!user) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'User not found' } }
    }
    const words = await svc.getDueWords(userId, user.timezone)
    return { words }
  })

  .post(
    '/submit',
    async ({ userId, body, set }) => {
      const user = await getUserById(userId)
      if (!user) {
        set.status = 404
        return { error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      const progress = await svc.submitReview(userId, body.wordId, body.grade as any, user.timezone)
      return { progress }
    },
    {
      body: t.Object({
        wordId: t.String(),
        grade: t.Union([t.Literal('again'), t.Literal('hard'), t.Literal('good'), t.Literal('easy')]),
      }),
    },
  )
