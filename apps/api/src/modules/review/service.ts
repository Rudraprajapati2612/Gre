import { sql } from '../../db/client'
import { applyReview, Grade } from '../../lib/srs'
import { userLocalToday } from '../../lib/dates'

export async function getTodayWords(userId: string, timezone: string) {
  const today = userLocalToday(timezone)
  return sql`
    SELECT w.*, uwp.status AS user_status, uwp.ease, uwp.interval_days,
           uwp.repetitions, uwp.due_date, uwp.times_seen, uwp.times_wrong,
           uwp.marked_learning_on, uwp.last_reviewed_at
    FROM user_word_progress uwp
    JOIN words w ON w.id = uwp.word_id
    WHERE uwp.user_id = ${userId} AND uwp.marked_learning_on = ${today}
    ORDER BY w.word
  `
}

export async function getDueWords(userId: string, timezone: string) {
  const today = userLocalToday(timezone)
  return sql`
    SELECT w.*, uwp.status AS user_status, uwp.ease, uwp.interval_days,
           uwp.repetitions, uwp.due_date, uwp.times_seen, uwp.times_wrong,
           uwp.marked_learning_on, uwp.last_reviewed_at
    FROM user_word_progress uwp
    JOIN words w ON w.id = uwp.word_id
    WHERE uwp.user_id = ${userId}
      AND uwp.due_date <= ${today}
      AND uwp.status != 'new'
    ORDER BY uwp.due_date ASC, uwp.times_wrong DESC
  `
}

export async function submitReview(userId: string, wordId: string, grade: Grade, timezone: string) {
  const today = userLocalToday(timezone)

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

  let progress: any
  if (!existing) {
    const [row] = await sql`
      INSERT INTO user_word_progress
        (user_id, word_id, status, ease, interval_days, repetitions,
         due_date, times_seen, times_wrong, last_reviewed_at)
      VALUES (${userId}, ${wordId}, ${updated.status}, ${updated.ease},
              ${updated.interval_days}, ${updated.repetitions},
              ${updated.due_date}, ${updated.times_seen}, ${updated.times_wrong},
              ${updated.last_reviewed_at})
      RETURNING *
    `
    progress = row
  } else {
    const [row] = await sql`
      UPDATE user_word_progress SET
        status = ${updated.status},
        ease = ${updated.ease},
        interval_days = ${updated.interval_days},
        repetitions = ${updated.repetitions},
        due_date = ${updated.due_date},
        times_seen = ${updated.times_seen},
        times_wrong = ${updated.times_wrong},
        last_reviewed_at = ${updated.last_reviewed_at}
      WHERE user_id = ${userId} AND word_id = ${wordId}
      RETURNING *
    `
    progress = row
  }

  await sql`
    INSERT INTO quiz_attempts (user_id, section, item_id, is_correct, user_answer)
    VALUES (${userId}, 'vocab', ${wordId}, ${grade !== 'again'}, ${grade})
  `

  return progress
}
