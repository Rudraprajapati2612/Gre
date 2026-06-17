import { sql } from '../../db/client'
import { applyReview } from '../../lib/srs'
import { userLocalToday } from '../../lib/dates'

export async function listGroups(userId: string) {
  // One row per group_number with per-user counts
  const rows = await sql`
    SELECT
      w.group_number,
      COUNT(*)::int                                                         AS word_count,
      COUNT(*) FILTER (WHERE uwp.last_mark = 'knew')::int                  AS knew_count,
      COUNT(*) FILTER (WHERE uwp.last_mark = 'forgot')::int                AS forgot_count,
      COUNT(*) FILTER (WHERE uwp.last_mark IS NULL)::int                   AS unseen_count,
      BOOL_AND(uwp.last_mark = 'knew')                                     AS is_complete
    FROM words w
    LEFT JOIN user_word_progress uwp
      ON uwp.word_id = w.id AND uwp.user_id = ${userId}
    WHERE w.group_number IS NOT NULL
    GROUP BY w.group_number
    ORDER BY w.group_number
  `
  return rows
}

export async function getGroup(
  userId: string,
  groupNum: number,
  filter: 'all' | 'forgotten' | 'unseen',
  order: 'default' | 'shuffle',
) {
  let words: any[]

  if (filter === 'forgotten') {
    words = await sql`
      SELECT w.*, uwp.status AS user_status, uwp.ease, uwp.interval_days,
             uwp.repetitions, uwp.due_date, uwp.times_seen, uwp.times_wrong,
             uwp.marked_learning_on, uwp.last_reviewed_at, uwp.last_mark,
             uwp.user_note, uwp.user_meaning, w.antonyms
      FROM words w
      JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ${userId}
      WHERE w.group_number = ${groupNum} AND uwp.last_mark = 'forgot'
      ORDER BY w.word_order
    `
  } else if (filter === 'unseen') {
    words = await sql`
      SELECT w.*, COALESCE(uwp.status,'new') AS user_status,
             uwp.ease, uwp.interval_days, uwp.repetitions, uwp.due_date,
             uwp.times_seen, uwp.times_wrong, uwp.marked_learning_on,
             uwp.last_reviewed_at, uwp.last_mark, uwp.user_note, uwp.user_meaning
      FROM words w
      LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ${userId}
      WHERE w.group_number = ${groupNum}
        AND (uwp.last_mark IS NULL)
      ORDER BY w.word_order
    `
  } else {
    words = await sql`
      SELECT w.*, COALESCE(uwp.status,'new') AS user_status,
             uwp.ease, uwp.interval_days, uwp.repetitions, uwp.due_date,
             uwp.times_seen, uwp.times_wrong, uwp.marked_learning_on,
             uwp.last_reviewed_at, uwp.last_mark, uwp.user_note, uwp.user_meaning
      FROM words w
      LEFT JOIN user_word_progress uwp ON uwp.word_id = w.id AND uwp.user_id = ${userId}
      WHERE w.group_number = ${groupNum}
      ORDER BY w.word_order
    `
  }

  if (order === 'shuffle') {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }
  }

  return words
}

export async function markWord(
  userId: string,
  wordId: string,
  mark: 'knew' | 'forgot',
  timezone: string,
) {
  const today = userLocalToday(timezone)
  const grade = mark === 'knew' ? 'good' : 'again'

  const [existing] = await sql`
    SELECT * FROM user_word_progress WHERE user_id = ${userId} AND word_id = ${wordId}
  `

  const base = existing ?? {
    status: 'new',
    ease: 2.5,
    interval_days: 0,
    repetitions: 0,
    times_seen: 0,
    times_wrong: 0,
  }

  const updated = applyReview(base, grade, today)

  // A note-only row (times_seen = 0) is still a first exposure — the user
  // hasn't actually recalled the word yet, they just saved a note.
  // For first exposure: cap interval at 1 day and skip last_reviewed_at so
  // the word lands in Tonight's quiz instead of being silently filed away.
  const isFirstExposure = !existing || existing.times_seen === 0
  if (isFirstExposure) {
    updated.interval_days = 1
    updated.due_date = today
    updated.status = 'learning'
  }

  let progress: any
  if (!existing) {
    // Brand-new word — INSERT, no last_reviewed_at.
    // ON CONFLICT handles the race where saveMountainNote inserted a note-only
    // row between our SELECT and this INSERT.
    const [row] = await sql`
      INSERT INTO user_word_progress
        (user_id, word_id, status, ease, interval_days, repetitions,
         due_date, times_seen, times_wrong, last_mark, marked_learning_on)
      VALUES (
        ${userId}, ${wordId}, ${updated.status}, ${updated.ease},
        ${updated.interval_days}, ${updated.repetitions},
        ${updated.due_date}, ${updated.times_seen}, ${updated.times_wrong},
        ${mark}, ${today}
      )
      ON CONFLICT (user_id, word_id) DO UPDATE SET
        status             = EXCLUDED.status,
        ease               = EXCLUDED.ease,
        interval_days      = EXCLUDED.interval_days,
        repetitions        = EXCLUDED.repetitions,
        due_date           = EXCLUDED.due_date,
        times_seen         = EXCLUDED.times_seen,
        times_wrong        = EXCLUDED.times_wrong,
        last_mark          = EXCLUDED.last_mark,
        marked_learning_on = EXCLUDED.marked_learning_on
      RETURNING *
    `
    progress = row
  } else if (isFirstExposure) {
    // Note-only row exists (times_seen = 0) — UPDATE but keep last_reviewed_at
    // NULL so the word still appears in Tonight's quiz
    const [row] = await sql`
      UPDATE user_word_progress SET
        status             = ${updated.status},
        ease               = ${updated.ease},
        interval_days      = ${updated.interval_days},
        repetitions        = ${updated.repetitions},
        due_date           = ${updated.due_date},
        times_seen         = ${updated.times_seen},
        times_wrong        = ${updated.times_wrong},
        last_mark          = ${mark},
        marked_learning_on = ${today}
      WHERE user_id = ${userId} AND word_id = ${wordId}
      RETURNING *
    `
    progress = row
  } else {
    // Returning review — full UPDATE including last_reviewed_at
    const [row] = await sql`
      UPDATE user_word_progress SET
        status             = ${updated.status},
        ease               = ${updated.ease},
        interval_days      = ${updated.interval_days},
        repetitions        = ${updated.repetitions},
        due_date           = ${updated.due_date},
        times_seen         = ${updated.times_seen},
        times_wrong        = ${updated.times_wrong},
        last_reviewed_at   = ${updated.last_reviewed_at},
        last_mark          = ${mark},
        marked_learning_on = ${today}
      WHERE user_id = ${userId} AND word_id = ${wordId}
      RETURNING *
    `
    progress = row
  }

  await sql`
    INSERT INTO quiz_attempts (user_id, section, item_id, is_correct, user_answer)
    VALUES (${userId}, 'vocab', ${wordId}, ${mark === 'knew'}, ${mark})
  `

  return progress
}

export async function startGroup(userId: string, groupNum: number, timezone: string) {
  const today = userLocalToday(timezone)

  // Upsert progress for all new words in the group
  const wordsInGroup = await sql`
    SELECT id FROM words WHERE group_number = ${groupNum}
  `

  const results = await Promise.all(
    wordsInGroup.map(async (w: any) => {
      const [existing] = await sql`
        SELECT id, status FROM user_word_progress WHERE user_id = ${userId} AND word_id = ${w.id}
      `
      if (!existing) {
        const [row] = await sql`
          INSERT INTO user_word_progress (user_id, word_id, status, marked_learning_on, due_date)
          VALUES (${userId}, ${w.id}, 'learning', ${today}, ${today})
          RETURNING *
        `
        return row
      }
      if (existing.status === 'new') {
        const [row] = await sql`
          UPDATE user_word_progress
          SET status = 'learning', marked_learning_on = ${today}, due_date = ${today}
          WHERE user_id = ${userId} AND word_id = ${w.id}
          RETURNING *
        `
        return row
      }
      return existing
    }),
  )

  return results
}

export async function updateNote(userId: string, wordId: string, note: string) {
  const [row] = await sql`
    INSERT INTO user_word_progress (user_id, word_id, user_note, status)
    VALUES (${userId}, ${wordId}, ${note}, 'new')
    ON CONFLICT (user_id, word_id) DO UPDATE SET user_note = EXCLUDED.user_note
    RETURNING *
  `
  return row
}

export async function updateMeaning(userId: string, wordId: string, meaning: string) {
  const [row] = await sql`
    INSERT INTO user_word_progress (user_id, word_id, user_meaning, status)
    VALUES (${userId}, ${wordId}, ${meaning}, 'new')
    ON CONFLICT (user_id, word_id) DO UPDATE SET user_meaning = EXCLUDED.user_meaning
    RETURNING *
  `
  return row
}

export async function resetGroup(userId: string, groupNum: number) {
  await sql`
    UPDATE user_word_progress
    SET last_mark = NULL
    WHERE user_id = ${userId}
      AND word_id IN (SELECT id FROM words WHERE group_number = ${groupNum})
  `
  return { ok: true }
}
