import { sql } from '../../db/client'

export async function listTC(filters: { difficulty?: string; blankCount?: number; limit?: number; offset?: number }) {
  const { difficulty, blankCount, limit = 20, offset = 0 } = filters

  if (difficulty && blankCount) {
    return sql`
      SELECT id, prompt, blank_count, options, difficulty, created_at
      FROM tc_questions
      WHERE difficulty = ${difficulty} AND blank_count = ${blankCount}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `
  } else if (difficulty) {
    return sql`
      SELECT id, prompt, blank_count, options, difficulty, created_at
      FROM tc_questions WHERE difficulty = ${difficulty}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `
  } else if (blankCount) {
    return sql`
      SELECT id, prompt, blank_count, options, difficulty, created_at
      FROM tc_questions WHERE blank_count = ${blankCount}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `
  }
  return sql`
    SELECT id, prompt, blank_count, options, difficulty, created_at
    FROM tc_questions ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getTC(id: string) {
  const [row] = await sql`
    SELECT id, prompt, blank_count, options, difficulty, created_at FROM tc_questions WHERE id = ${id}
  `
  return row ?? null
}

export async function submitTC(userId: string, questionId: string, answers: string[]) {
  const [q] = await sql`SELECT * FROM tc_questions WHERE id = ${questionId}`
  if (!q) throw { status: 404, code: 'NOT_FOUND', message: 'Question not found' }

  if (answers.length !== q.blank_count) {
    throw { status: 400, code: 'BAD_ANSWERS', message: `Expected ${q.blank_count} answers, got ${answers.length}` }
  }

  const correctAnswers: string[] = q.answers
  const isCorrect = correctAnswers.every((ans, i) => ans === answers[i])

  await sql`
    INSERT INTO quiz_attempts (user_id, section, item_id, is_correct, user_answer)
    VALUES (${userId}, 'tc', ${questionId}, ${isCorrect}, ${JSON.stringify(answers)})
  `

  return { isCorrect, correctAnswers, explanation: q.explanation }
}
