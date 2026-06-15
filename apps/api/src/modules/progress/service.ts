import { sql } from '../../db/client'
import { computeStreak, userLocalToday, normalizeTimezone } from '../../lib/dates'

export async function getSummary(userId: string, timezone: string) {
  const tz = normalizeTimezone(timezone)
  const today = userLocalToday(tz)

  const [counts] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'mastered')::int AS mastered_count,
      COUNT(*)::int AS total_words,
      COUNT(*) FILTER (WHERE status IN ('learning', 'review') OR (status = 'new' AND last_mark IS NOT NULL))::int AS learning_count,
      COUNT(*) FILTER (WHERE status = 'review')::int AS review_count
    FROM user_word_progress
    WHERE user_id = ${userId}
  `

  const [dueRow] = await sql`
    SELECT COUNT(*)::int AS due_today_count
    FROM user_word_progress
    WHERE user_id = ${userId}
      AND status != 'new'
      AND (
        -- spaced-repetition words due today (not learned today)
        (due_date <= ${today} AND (marked_learning_on IS NULL OR marked_learning_on != ${today}))
        OR
        -- words learned today that haven't had tonight's review yet
        (marked_learning_on = ${today} AND (last_reviewed_at IS NULL OR last_reviewed_at::date != ${today}::date))
      )
  `

  const activityRows = await sql`
    SELECT (answered_at AT TIME ZONE ${tz})::date::text AS day
    FROM quiz_attempts
    WHERE user_id = ${userId}
    ORDER BY day
  `
  const activityDates = activityRows.map((r: any) => r.day)
  const streakDays = computeStreak(activityDates, timezone)

  return {
    streakDays,
    masteredCount: counts?.mastered_count ?? 0,
    totalWords: counts?.total_words ?? 0,
    learningCount: counts?.learning_count ?? 0,
    reviewCount: counts?.review_count ?? 0,
    dueTodayCount: dueRow?.due_today_count ?? 0,
  }
}

export async function getWeakWords(userId: string) {
  return sql`
    SELECT w.id, w.word, w.meaning, w.tone, w.cluster,
           uwp.times_wrong, uwp.times_seen,
           CASE WHEN uwp.times_seen > 0
                THEN ROUND(1.0 - uwp.times_wrong::numeric / uwp.times_seen, 2)
                ELSE 0 END AS accuracy
    FROM user_word_progress uwp
    JOIN words w ON w.id = uwp.word_id
    WHERE uwp.user_id = ${userId} AND uwp.times_wrong > 0
    ORDER BY uwp.times_wrong DESC, accuracy ASC
    LIMIT 50
  `
}

export async function getScores(userId: string, { section, from, to, granularity = 'day' }: {
  section?: string; from?: string; to?: string; granularity?: 'day' | 'week'
}) {
  const dateTrunc = granularity === 'week' ? 'week' : 'day'
  const tz = 'UTC'

  let rows: any[]
  if (section && from && to) {
    rows = await sql`
      SELECT date_trunc(${dateTrunc}, answered_at AT TIME ZONE ${tz})::date::text AS period,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE is_correct)::int AS correct
      FROM quiz_attempts
      WHERE user_id = ${userId} AND section = ${section}
        AND answered_at >= ${from}::timestamptz AND answered_at <= ${to}::timestamptz
      GROUP BY period ORDER BY period
    `
  } else if (section) {
    rows = await sql`
      SELECT date_trunc(${dateTrunc}, answered_at AT TIME ZONE ${tz})::date::text AS period,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE is_correct)::int AS correct
      FROM quiz_attempts
      WHERE user_id = ${userId} AND section = ${section}
      GROUP BY period ORDER BY period
    `
  } else if (from && to) {
    rows = await sql`
      SELECT date_trunc(${dateTrunc}, answered_at AT TIME ZONE ${tz})::date::text AS period,
             section,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE is_correct)::int AS correct
      FROM quiz_attempts
      WHERE user_id = ${userId}
        AND answered_at >= ${from}::timestamptz AND answered_at <= ${to}::timestamptz
      GROUP BY period, section ORDER BY period
    `
  } else {
    rows = await sql`
      SELECT date_trunc(${dateTrunc}, answered_at AT TIME ZONE ${tz})::date::text AS period,
             section,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE is_correct)::int AS correct
      FROM quiz_attempts
      WHERE user_id = ${userId}
      GROUP BY period, section ORDER BY period
    `
  }

  return rows.map(r => ({
    ...r,
    accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) / 100 : 0,
  }))
}

export async function getByType(userId: string) {
  const rcByType = await sql`
    SELECT rcq.question_type, rcq.passage_id,
           rcp.subject,
           COUNT(qa.id)::int AS total,
           COUNT(qa.id) FILTER (WHERE qa.is_correct)::int AS correct
    FROM quiz_attempts qa
    JOIN rc_questions rcq ON rcq.id = qa.item_id
    JOIN rc_passages rcp ON rcp.id = rcq.passage_id
    WHERE qa.user_id = ${userId} AND qa.section = 'rc'
    GROUP BY rcq.question_type, rcq.passage_id, rcp.subject
  `

  const tcByBlanks = await sql`
    SELECT tcq.blank_count,
           COUNT(qa.id)::int AS total,
           COUNT(qa.id) FILTER (WHERE qa.is_correct)::int AS correct
    FROM quiz_attempts qa
    JOIN tc_questions tcq ON tcq.id = qa.item_id
    WHERE qa.user_id = ${userId} AND qa.section = 'tc'
    GROUP BY tcq.blank_count
  `

  return {
    rc_by_type: rcByType.map(r => ({
      ...r,
      accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) / 100 : 0,
    })),
    tc_by_blanks: tcByBlanks.map(r => ({
      ...r,
      accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) / 100 : 0,
    })),
  }
}
