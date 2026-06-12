import { sql } from '../../db/client'

export async function listSE(filters: { difficulty?: string; limit?: number; offset?: number }) {
  const { difficulty, limit = 20, offset = 0 } = filters
  if (difficulty) {
    return sql`
      SELECT id, prompt, options, difficulty, created_at
      FROM se_questions WHERE difficulty = ${difficulty}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `
  }
  return sql`
    SELECT id, prompt, options, difficulty, created_at
    FROM se_questions ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getSE(id: string) {
  const [row] = await sql`
    SELECT id, prompt, options, difficulty, created_at FROM se_questions WHERE id = ${id}
  `
  return row ?? null
}

export async function submitSE(userId: string, questionId: string, answers: string[]) {
  if (answers.length !== 2) {
    throw { status: 400, code: 'BAD_ANSWERS', message: 'SE requires exactly 2 answers' }
  }

  const [q] = await sql`SELECT * FROM se_questions WHERE id = ${questionId}`
  if (!q) throw { status: 404, code: 'NOT_FOUND', message: 'Question not found' }

  const correctSet = new Set<string>(q.answers)
  const submittedSet = new Set<string>(answers)
  const isCorrect = correctSet.size === submittedSet.size && [...correctSet].every(a => submittedSet.has(a))

  await sql`
    INSERT INTO quiz_attempts (user_id, section, item_id, is_correct, user_answer)
    VALUES (${userId}, 'se', ${questionId}, ${isCorrect}, ${JSON.stringify(answers)})
  `

  return { isCorrect, correctAnswers: q.answers, explanation: q.explanation }
}
