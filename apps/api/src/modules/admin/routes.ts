import Elysia, { t } from 'elysia'
import { requireAuth } from '../../plugins/auth'
import { sql } from '../../db/client'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(requireAuth)

  .post(
    '/words',
    async ({ body, set }) => {
      const existing = await sql`SELECT id FROM words WHERE LOWER(word) = LOWER(${body.word.trim()})`
      if (existing.length > 0) {
        set.status = 409
        return { error: { code: 'WORD_EXISTS', message: `"${body.word}" already exists` } }
      }
      const [word] = await sql`
        INSERT INTO words (word, meaning, tone, example_sentence, gre_context, cluster)
        VALUES (
          ${body.word.trim()},
          ${body.meaning.trim()},
          ${body.tone},
          ${body.example_sentence.trim()},
          ${body.gre_context?.trim() ?? null},
          ${body.cluster?.trim() ?? null}
        )
        RETURNING *
      `
      set.status = 201
      return { word }
    },
    {
      body: t.Object({
        word: t.String({ minLength: 1 }),
        meaning: t.String({ minLength: 1 }),
        tone: t.Union([
          t.Literal('formal'), t.Literal('neutral'), t.Literal('positive'),
          t.Literal('negative'), t.Literal('informal'),
        ]),
        example_sentence: t.String({ minLength: 1 }),
        gre_context: t.Optional(t.String()),
        cluster: t.Optional(t.String()),
      }),
    },
  )

  .get('/clusters', async () => {
    const rows = await sql`
      SELECT DISTINCT cluster FROM words WHERE cluster IS NOT NULL ORDER BY cluster
    `
    return { clusters: rows.map((r: any) => r.cluster) }
  })

  .delete('/:id', async ({ params, set }) => {
    const [deleted] = await sql`DELETE FROM words WHERE id = ${params.id} RETURNING id, word`
    if (!deleted) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'Word not found' } }
    }
    return { deleted }
  })
