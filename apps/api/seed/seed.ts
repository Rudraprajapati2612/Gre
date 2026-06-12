import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL)

async function main() {
  console.log('Running schema migrations...')
  const schema = readFileSync(join(import.meta.dir, '../src/db/schema.sql'), 'utf8')
  await sql.unsafe(schema)
  console.log('Schema applied.')

  console.log('Seeding words...')
  const words: any[] = JSON.parse(readFileSync(join(import.meta.dir, 'words.json'), 'utf8'))
  for (const w of words) {
    await sql`
      INSERT INTO words (word, meaning, tone, example_sentence, gre_context, cluster)
      VALUES (${w.word}, ${w.meaning}, ${w.tone}, ${w.example_sentence}, ${w.gre_context ?? null}, ${w.cluster ?? null})
      ON CONFLICT (word) DO NOTHING
    `
  }
  console.log(`Seeded ${words.length} words.`)

  console.log('Seeding TC questions...')
  const tc: any[] = JSON.parse(readFileSync(join(import.meta.dir, 'tc.json'), 'utf8'))
  for (const q of tc) {
    await sql`
      INSERT INTO tc_questions (prompt, blank_count, options, answers, explanation, difficulty)
      VALUES (${q.prompt}, ${q.blank_count}, ${sql.json(q.options)}, ${sql.json(q.answers)}, ${q.explanation ?? null}, ${q.difficulty ?? null})
      ON CONFLICT DO NOTHING
    `
  }
  console.log(`Seeded ${tc.length} TC questions.`)

  console.log('Seeding SE questions...')
  const se: any[] = JSON.parse(readFileSync(join(import.meta.dir, 'se.json'), 'utf8'))
  for (const q of se) {
    await sql`
      INSERT INTO se_questions (prompt, options, answers, explanation, difficulty)
      VALUES (${q.prompt}, ${sql.json(q.options)}, ${sql.json(q.answers)}, ${q.explanation ?? null}, ${q.difficulty ?? null})
      ON CONFLICT DO NOTHING
    `
  }
  console.log(`Seeded ${se.length} SE questions.`)

  console.log('Seeding RC passages and questions...')
  const rc: any[] = JSON.parse(readFileSync(join(import.meta.dir, 'rc.json'), 'utf8'))
  for (const passage of rc) {
    const [inserted] = await sql`
      INSERT INTO rc_passages (title, body, subject, paragraph_count)
      VALUES (${passage.title ?? null}, ${passage.body}, ${passage.subject ?? null}, ${passage.paragraph_count ?? null})
      RETURNING id
    `
    for (const q of passage.questions) {
      await sql`
        INSERT INTO rc_questions (passage_id, question, question_type, options, answer_index, explanation, trap_types)
        VALUES (
          ${inserted.id}, ${q.question}, ${q.question_type},
          ${sql.json(q.options)}, ${q.answer_index},
          ${q.explanation ?? null},
          ${q.trap_types ? sql.json(q.trap_types) : null}
        )
      `
    }
  }
  console.log(`Seeded ${rc.length} passages.`)

  console.log('Done! Database is ready.')
  await sql.end()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
