import { sql } from '../../db/client'
import { userLocalToday } from '../../lib/dates'

export async function listWords(
  userId: string,
  { q, tone, cluster, status, limit = 50, offset = 0 }: {
    q?: string; tone?: string; cluster?: string; status?: string; limit?: number; offset?: number
  },
) {
  const conditions: string[] = []
  const params: any[] = [userId]
  let pi = 2

  if (q) { conditions.push(`w.search_vector @@ websearch_to_tsquery('english', $${pi++})`); params.push(q) }
  if (tone) { conditions.push(`w.tone = $${pi++}`); params.push(tone) }
  if (cluster) { conditions.push(`w.cluster = $${pi++}`); params.push(cluster) }
  if (status) { conditions.push(`COALESCE(uwp.status, 'new') = $${pi++}`); params.push(status) }

  const where = conditions.length ? 'AND ' + conditions.join(' AND ') : ''

  params.push(limit, offset)
  const limitPi = pi++
  const offsetPi = pi++

  return sql.unsafe(`
    SELECT w.*, COALESCE(uwp.status,'new') AS user_status,
           uwp.ease, uwp.interval_days, uwp.repetitions, uwp.due_date,
           uwp.times_seen, uwp.times_wrong, uwp.last_reviewed_at, uwp.marked_learning_on
    FROM words w
    LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = $1
    WHERE 1=1 ${where}
    ORDER BY w.word
    LIMIT $${limitPi} OFFSET $${offsetPi}
  `, params)
}

export async function getWord(userId: string, wordId: string) {
  const [row] = await sql`
    SELECT w.*, COALESCE(uwp.status,'new') AS user_status,
           uwp.ease, uwp.interval_days, uwp.repetitions, uwp.due_date,
           uwp.times_seen, uwp.times_wrong, uwp.last_reviewed_at, uwp.marked_learning_on
    FROM words w
    LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ${userId}
    WHERE w.id = ${wordId}
  `
  return row ?? null
}

export async function compareWords(userId: string, idA: string, idB: string) {
  return sql`
    SELECT w.*, COALESCE(uwp.status,'new') AS user_status,
           uwp.times_seen, uwp.times_wrong
    FROM words w
    LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ${userId}
    WHERE w.id = ANY(ARRAY[${idA}::uuid, ${idB}::uuid])
  `
}

export async function markLearning(userId: string, wordId: string, timezone: string) {
  const today = userLocalToday(timezone)
  const [existing] = await sql`SELECT id, status FROM user_word_progress WHERE user_id = ${userId} AND word_id = ${wordId}`

  if (!existing) {
    const [row] = await sql`
      INSERT INTO user_word_progress (user_id, word_id, status, marked_learning_on, due_date)
      VALUES (${userId}, ${wordId}, 'learning', ${today}, ${today})
      RETURNING *
    `
    return row
  }

  const [row] = await sql`
    UPDATE user_word_progress
    SET marked_learning_on = ${today},
        status = CASE WHEN status = 'new' THEN 'learning' ELSE status END,
        due_date = ${today}
    WHERE user_id = ${userId} AND word_id = ${wordId}
    RETURNING *
  `
  return row
}

export async function markLearningBatch(userId: string, wordIds: string[], timezone: string) {
  return Promise.all(wordIds.map(id => markLearning(userId, id, timezone)))
}
