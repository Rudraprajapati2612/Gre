import postgres from 'postgres'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

const sql = postgres(DATABASE_URL)

function mapTone(tone: string): 'formal' | 'neutral' | 'negative' | 'positive' | 'informal' {
  const t = (tone ?? '').toLowerCase()
  if (t === 'positive')  return 'positive'
  if (t === 'negative')  return 'negative'
  if (t === 'formal')    return 'formal'
  if (t === 'informal')  return 'informal'
  return 'neutral' // handles: neutral / mixed / context-dependent
}

async function main() {
  console.log('Running schema...')
  const schema = readFileSync(join(import.meta.dir, '../src/db/schema.sql'), 'utf8')
  await sql.unsafe(schema)
  console.log('Schema applied.')

  // Run numbered migrations in order
  const migrationsDir = join(import.meta.dir, '../src/db/migrations')
  if (existsSync(migrationsDir)) {
    const migFiles = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    for (const f of migFiles) {
      console.log(`  Migration: ${f}`)
      await sql.unsafe(readFileSync(join(migrationsDir, f), 'utf8'))
    }
  }

  // ── Seed words from groups/ folder ──────────────────────────────────────
  // Resolve: apps/api/seed/ → 3 levels up → project root → groups/
  const groupsDir = join(import.meta.dir, '../../..', 'groups')

  if (!existsSync(groupsDir)) {
    console.error(`\nERROR: groups/ folder not found at: ${groupsDir}`)
    process.exit(1)
  }

  const groupFiles = readdirSync(groupsDir)
    .filter(f => /^group\d+\.json$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0], 10)
      const nb = parseInt(b.match(/\d+/)![0], 10)
      return na - nb
    })

  console.log(`\nSeeding ${groupFiles.length} word groups...`)

  let totalWords = 0

  for (const file of groupFiles) {
    const raw   = JSON.parse(readFileSync(join(groupsDir, file), 'utf8'))
    const grp   = raw.groups[0]
    const gNum  = grp.groupNumber as number
    const words = grp.words as any[]

    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      await sql`
        INSERT INTO words (
          word, meaning, tone,
          example_sentence, gre_context,
          synonyms, antonyms,
          group_number, word_order,
          tone_needs_review
        )
        VALUES (
          ${w.word},
          ${w.meaning},
          ${mapTone(w.tone)},
          ${w.gregmatSentence ?? w.meaning},
          ${w.memoryTrick    ?? null},
          ${w.synonyms?.length ? sql.array(w.synonyms) : null},
          ${w.antonyms?.length ? sql.array(w.antonyms) : null},
          ${gNum},
          ${i + 1},
          false
        )
        ON CONFLICT (word) DO UPDATE SET
          meaning           = EXCLUDED.meaning,
          tone              = EXCLUDED.tone,
          example_sentence  = EXCLUDED.example_sentence,
          gre_context       = EXCLUDED.gre_context,
          synonyms          = EXCLUDED.synonyms,
          antonyms          = EXCLUDED.antonyms,
          group_number      = EXCLUDED.group_number,
          word_order        = EXCLUDED.word_order,
          tone_needs_review = EXCLUDED.tone_needs_review
      `
      totalWords++
    }
    console.log(`  Group ${String(gNum).padStart(2, ' ')}: ${words.length} words`)
  }

  console.log(`\nWords seeded: ${totalWords}`)

  // Verify
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM words`
  const groupRows = await sql`
    SELECT group_number, COUNT(*)::int AS cnt
    FROM words WHERE group_number IS NOT NULL
    GROUP BY group_number ORDER BY group_number
  `
  console.log(`DB total:     ${n} words across ${groupRows.length} groups`)

  // ── Seed TC questions ────────────────────────────────────────────────────
  const tcFile = join(import.meta.dir, 'tc.json')
  if (existsSync(tcFile)) {
    const tc: any[] = JSON.parse(readFileSync(tcFile, 'utf8'))
    for (const q of tc) {
      await sql`
        INSERT INTO tc_questions (prompt, blank_count, options, answers, explanation, difficulty)
        VALUES (${q.prompt}, ${q.blank_count}, ${sql.json(q.options)}, ${sql.json(q.answers)}, ${q.explanation ?? null}, ${q.difficulty ?? null})
        ON CONFLICT DO NOTHING
      `
    }
    console.log(`TC questions: ${tc.length}`)
  }

  // ── Seed SE questions ────────────────────────────────────────────────────
  const seFile = join(import.meta.dir, 'se.json')
  if (existsSync(seFile)) {
    const se: any[] = JSON.parse(readFileSync(seFile, 'utf8'))
    for (const q of se) {
      await sql`
        INSERT INTO se_questions (prompt, options, answers, explanation, difficulty)
        VALUES (${q.prompt}, ${sql.json(q.options)}, ${sql.json(q.answers)}, ${q.explanation ?? null}, ${q.difficulty ?? null})
        ON CONFLICT DO NOTHING
      `
    }
    console.log(`SE questions: ${se.length}`)
  }

  // ── Seed RC passages ─────────────────────────────────────────────────────
  const rcFile = join(import.meta.dir, 'rc.json')
  if (existsSync(rcFile)) {
    const rc: any[] = JSON.parse(readFileSync(rcFile, 'utf8'))
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
    console.log(`RC passages:  ${rc.length}`)
  }

  await sql.end()
  console.log('\nSeed complete. DB is ready.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
