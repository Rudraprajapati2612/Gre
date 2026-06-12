import { sql } from '../../db/client'

export async function listPassages(filters: { limit?: number; offset?: number }) {
  const { limit = 20, offset = 0 } = filters
  return sql`
    SELECT p.id, p.title, p.subject, p.paragraph_count, p.created_at,
           COUNT(q.id)::int AS question_count
    FROM rc_passages p
    LEFT JOIN rc_questions q ON q.passage_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
}

export async function getPassage(passageId: string) {
  const [passage] = await sql`SELECT * FROM rc_passages WHERE id = ${passageId}`
  if (!passage) return null

  const questions = await sql`
    SELECT id, question, question_type, options, created_at
    FROM rc_questions WHERE passage_id = ${passageId}
    ORDER BY created_at
  `
  return { ...passage, questions }
}

export async function submitRCQuestion(userId: string, questionId: string, answerIndex: number, trapTags?: any) {
  const [q] = await sql`SELECT * FROM rc_questions WHERE id = ${questionId}`
  if (!q) throw { status: 404, code: 'NOT_FOUND', message: 'Question not found' }
  if (answerIndex < 0 || answerIndex > 4) {
    throw { status: 400, code: 'BAD_ANSWER', message: 'answerIndex must be 0–4' }
  }

  const isCorrect = answerIndex === q.answer_index

  await sql`
    INSERT INTO quiz_attempts (user_id, section, item_id, is_correct, user_answer)
    VALUES (${userId}, 'rc', ${questionId}, ${isCorrect}, ${JSON.stringify({ answerIndex, trapTags })})
  `

  return {
    isCorrect,
    correctIndex: q.answer_index,
    explanation: q.explanation,
    trap_types: q.trap_types,
  }
}
