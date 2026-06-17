import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import { getUserById } from '../auth/service'
import * as svc from './service'

export const mountainRoutes = new Elysia({ prefix: '/mountain' })
  .use(requireAuth)

  // GET /api/mountain/groups — list all groups with per-user status
  .get('/groups', async ({ userId }) => {
    const groups = await svc.listGroups(userId)
    return { groups }
  })

  // GET /api/mountain/groups/:n — words in a group with optional filter/order
  .get(
    '/groups/:n',
    async ({ userId, params, query, set }) => {
      const n = Number(params.n)
      if (!Number.isInteger(n) || n < 1) {
        set.status = 400
        return { error: { code: 'BAD_REQUEST', message: 'Group number must be a positive integer' } }
      }
      const filter = (query.filter ?? 'all') as 'all' | 'forgotten' | 'unseen'
      const order  = (query.order  ?? 'default') as 'default' | 'shuffle'
      const words  = await svc.getGroup(userId, n, filter, order)
      return { group: n, words }
    },
    {
      params: t.Object({ n: t.String() }),
      query: t.Object({
        filter: t.Optional(t.Union([t.Literal('all'), t.Literal('forgotten'), t.Literal('unseen')])),
        order:  t.Optional(t.Union([t.Literal('default'), t.Literal('shuffle')])),
      }),
    },
  )

  // POST /api/mountain/mark — mark a word knew/forgot, feeds SM-2
  .post(
    '/mark',
    async ({ userId, body, set }) => {
      const user = await getUserById(userId)
      if (!user) {
        set.status = 404
        return { error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      const progress = await svc.markWord(userId, body.wordId, body.mark, user.timezone)
      return { progress }
    },
    {
      body: t.Object({
        wordId: t.String(),
        mark:   t.Union([t.Literal('knew'), t.Literal('forgot')]),
      }),
    },
  )

  // POST /api/mountain/groups/:n/start — mark all new words in group as learning
  .post(
    '/groups/:n/start',
    async ({ userId, params, set }) => {
      const n = Number(params.n)
      if (!Number.isInteger(n) || n < 1) {
        set.status = 400
        return { error: { code: 'BAD_REQUEST', message: 'Group number must be a positive integer' } }
      }
      const user = await getUserById(userId)
      if (!user) {
        set.status = 404
        return { error: { code: 'NOT_FOUND', message: 'User not found' } }
      }
      const results = await svc.startGroup(userId, n, user.timezone)
      return { started: results.length, group: n }
    },
    { params: t.Object({ n: t.String() }) },
  )

  // PATCH /api/mountain/note — save personal mnemonic note for a word
  .patch(
    '/note',
    async ({ userId, body }) => {
      const progress = await svc.updateNote(userId, body.wordId, body.note)
      return { progress }
    },
    {
      body: t.Object({
        wordId: t.String(),
        note:   t.String(),
      }),
    },
  )

  // PATCH /api/mountain/meaning — save user's own definition for a word
  .patch(
    '/meaning',
    async ({ userId, body }) => {
      const progress = await svc.updateMeaning(userId, body.wordId, body.meaning)
      return { progress }
    },
    {
      body: t.Object({
        wordId:  t.String(),
        meaning: t.String(),
      }),
    },
  )

  // POST /api/mountain/groups/:n/reset — clear last_mark for re-climb
  .post(
    '/groups/:n/reset',
    async ({ userId, params, set }) => {
      const n = Number(params.n)
      if (!Number.isInteger(n) || n < 1) {
        set.status = 400
        return { error: { code: 'BAD_REQUEST', message: 'Group number must be a positive integer' } }
      }
      await svc.resetGroup(userId, n)
      return { ok: true, group: n }
    },
    { params: t.Object({ n: t.String() }) },
  )
