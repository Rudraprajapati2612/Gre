# GRE Verbal Trainer — Backend Specification

This document is a complete, build-ready spec for the backend of a GRE Verbal preparation app (Vocabulary, Text Completion, Sentence Equivalence, Reading Comprehension, and progress tracking). It is written so an engineer (or an AI coding assistant) can implement it without further clarification.

The frontend is specified separately. This document covers only the backend: stack, data model, API surface, business logic (especially spaced repetition), auth, and deployment.

---

## 1. Scope

The backend must support:

- Multi-user accounts with per-user progress isolation.
- A **shared content bank**: words, TC questions, SE questions, RC passages + questions. Content is the same for all users; progress is per-user.
- **Vocabulary** with spaced repetition (forgetting-curve handling) and a New → Learning → Review → Mastered lifecycle.
- **Text Completion** (1–3 blanks) practice and scoring.
- **Sentence Equivalence** (pick exactly 2 of 6) practice and scoring.
- **Reading Comprehension** passages with typed questions and scoring.
- **Progress tracking**: daily streak, mastered count, weak-words list, quiz scores over time.
- A daily revision schedule the backend computes and serves (the user never decides what to review).

Explicitly **out of scope** for v1: LLM/AI question generation, speaking/writing/quant, payments, social features, native mobile. Content is hand-authored / seeded, not generated.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Framework | Elysia |
| Language | TypeScript |
| Database | PostgreSQL 15+ |
| DB access | `postgres` (porsager) or Drizzle ORM — spec assumes raw SQL via `postgres`; Drizzle is acceptable |
| Auth | JWT (access + refresh), email/password with bcrypt; Google OAuth optional, deferred |
| Validation | Elysia's built-in `t` (TypeBox) schemas on every route |
| Deploy | Render or Railway (backend), Neon or Railway Postgres (database) |

API style: REST, JSON, prefixed `/api`. All timestamps are stored and returned in UTC (ISO 8601). The server is the source of truth for "today" — see §6.1.

---

## 3. Data Model

Eight tables. Shared content: `words`, `tc_questions`, `se_questions`, `rc_passages`, `rc_questions`. Per-user: `users`, `user_word_progress`, `quiz_attempts`.

### 3.1 `users`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| email | text unique not null | lowercased before insert |
| password_hash | text not null | bcrypt |
| display_name | text | optional |
| timezone | text not null default 'Asia/Kolkata' | IANA tz; used to compute the user's local "day" for streaks/scheduling |
| created_at | timestamptz not null default now() | |
| updated_at | timestamptz not null default now() | |

### 3.2 `words` (shared content)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| word | text not null unique | |
| meaning | text not null | primary definition |
| tone | text not null | enum: `formal`, `neutral`, `negative`, `positive`, `informal` — CHECK constraint |
| example_sentence | text not null | real-life usage |
| gre_context | text | how/where it appears on the GRE |
| cluster | text | synonym-cluster tag (e.g. "sharp_critical"); nullable; indexed |
| created_at | timestamptz not null default now() | |

Index: `idx_words_word` on `word`, `idx_words_cluster` on `cluster`. For search, add a `tsvector` generated column over `word || meaning` with a GIN index (see §5.1).

### 3.3 `user_word_progress` (per-user)

Tracks one user's relationship to one word. This table drives spaced repetition.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid not null FK → users(id) ON DELETE CASCADE | |
| word_id | uuid not null FK → words(id) ON DELETE CASCADE | |
| status | text not null default 'new' | enum: `new`, `learning`, `review`, `mastered` — CHECK |
| ease | real not null default 2.5 | SM-2 ease factor |
| interval_days | integer not null default 0 | current SM-2 interval |
| repetitions | integer not null default 0 | consecutive correct count (SM-2 `n`) |
| due_date | date | next review date (user-local); null until first learned |
| marked_learning_on | date | the day the user tapped "learn today"; used for the Day-1/Day-2 schedule |
| last_reviewed_at | timestamptz | |
| times_seen | integer not null default 0 | |
| times_wrong | integer not null default 0 | powers the weak-words list |
| created_at | timestamptz not null default now() | |

Constraints: `UNIQUE(user_id, word_id)`. Indexes: `idx_uwp_due` on `(user_id, due_date)`, `idx_uwp_status` on `(user_id, status)`.

### 3.4 `tc_questions` (shared content)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| prompt | text not null | sentence/paragraph with blanks marked `___` |
| blank_count | integer not null | 1, 2, or 3 — CHECK between 1 and 3 |
| options | jsonb not null | array of arrays: one option-set per blank, e.g. `[["stern","casual","rigid"],["lenient","generous","harsh"]]` |
| answers | jsonb not null | array of correct strings, one per blank, in order, e.g. `["stern","lenient"]` |
| explanation | text | why the answer is right / sentence direction |
| difficulty | text | enum `easy`,`medium`,`hard`; nullable |
| created_at | timestamptz not null default now() | |

### 3.5 `se_questions` (shared content)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| prompt | text not null | single-blank sentence with `___` |
| options | jsonb not null | array of exactly 6 strings |
| answers | jsonb not null | array of exactly 2 correct strings |
| explanation | text | why those two are equivalent |
| difficulty | text | nullable |
| created_at | timestamptz not null default now() | |

CHECK: `jsonb_array_length(options) = 6` and `jsonb_array_length(answers) = 2`.

### 3.6 `rc_passages` (shared content)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | optional |
| body | text not null | the passage |
| subject | text | enum-ish: `science`, `humanities`, `social_science`, `business`; nullable; used for per-subject analytics |
| paragraph_count | integer | |
| created_at | timestamptz not null default now() | |

### 3.7 `rc_questions` (shared content)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| passage_id | uuid not null FK → rc_passages(id) ON DELETE CASCADE | |
| question | text not null | |
| question_type | text not null | enum: `main_idea`, `tone`, `inference`, `detail`, `strengthen`, `weaken` — CHECK |
| options | jsonb not null | array of 5 strings (A–E) |
| answer_index | integer not null | 0-based index of correct option |
| explanation | text | includes why wrong options are traps |
| trap_types | jsonb | optional array mapping each wrong option to a trap label: `out_of_scope`,`distortion`,`contradiction`,`too_extreme`,`half_right` |
| created_at | timestamptz not null default now() | |

### 3.8 `quiz_attempts` (per-user)

One row per question answered, across all sections. This is the analytics backbone.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid not null FK → users(id) ON DELETE CASCADE | |
| section | text not null | enum: `vocab`, `tc`, `se`, `rc` — CHECK |
| item_id | uuid not null | id of the word/tc/se/rc_question answered (no FK — polymorphic) |
| is_correct | boolean not null | |
| user_answer | jsonb | what the user submitted (string, array, or index) |
| answered_at | timestamptz not null default now() | |

Indexes: `idx_qa_user_time` on `(user_id, answered_at)`, `idx_qa_user_section` on `(user_id, section)`.

---

## 4. Spaced Repetition Logic (core business rule)

This is the most important part of the backend. Vocab retention uses a **modified SM-2** algorithm operating on `user_word_progress`.

### 4.1 Grades

Review submission grades each word on a 4-point scale (sent from frontend): `again` (0), `hard` (1), `good` (2), `easy` (3). Internally map to SM-2 quality `q`: again→1, hard→3, good→4, easy→5. (Anything < 3 counts as a lapse / incorrect.)

### 4.2 Update rule (run per word on review submit)

```
On review with quality q:

if q < 3:                       # lapse / wrong
    repetitions = 0
    interval_days = 1
    status = 'learning'
    times_wrong += 1
else:                           # correct
    repetitions += 1
    if repetitions == 1:  interval_days = 1
    elif repetitions == 2: interval_days = 6
    else: interval_days = round(interval_days * ease)

    # ease update (SM-2)
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if ease < 1.3: ease = 1.3

# status transitions
if repetitions == 0:                  status = 'learning'
elif interval_days < 21:              status = 'review'
else:                                 status = 'mastered'

times_seen += 1
last_reviewed_at = now()
due_date = user_local_today + interval_days
```

Words never get deleted or hidden — they only move between `new`, `learning`, `review`, `mastered`. A mastered word that later gets a lapse drops back to `learning`. This satisfies "words never disappear, they just move between states."

### 4.3 The daily schedule (what to revise tonight / tomorrow)

The user's requested schedule (Day 1 learn, Day 2 review Day 1 + learn new, etc.) emerges naturally from SM-2 because a freshly-learned word gets `interval_days = 1` → due tomorrow. Two endpoints serve it:

- **Night quiz (today's words):** words where `marked_learning_on = user_local_today`.
- **Morning review (due words):** words where `due_date <= user_local_today` AND `status != 'new'`, ordered by most-overdue first, then by `times_wrong` desc (shakiest first).

The "every 2 weeks, quiz all mastered" and "Day 7 full review" rules are derived views, not separate state — they're just queries over `status = 'mastered'` and `due_date`.

---

## 5. API Surface

All routes prefixed `/api`. All non-auth routes require `Authorization: Bearer <accessToken>`. All request/response bodies validated with TypeBox. Standard error shape: `{ "error": { "code": string, "message": string } }`.

### 5.1 Auth

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | /api/auth/register | `{ email, password, displayName?, timezone? }` | `{ user, accessToken, refreshToken }` |
| POST | /api/auth/login | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | /api/auth/refresh | `{ refreshToken }` | `{ accessToken }` |
| POST | /api/auth/logout | `{ refreshToken }` | `{ ok: true }` (invalidate refresh token) |
| GET | /api/auth/me | — | `{ user }` |

Passwords bcrypt-hashed (cost 12). Access token TTL 15 min, refresh 30 days. Refresh tokens stored server-side (a `refresh_tokens` table or Redis) so logout can revoke — if you skip storage in v1, document that logout is client-side only.

### 5.2 Vocabulary

| Method | Path | Notes |
|---|---|---|
| GET | /api/words | Searchable word library. Query params: `q` (full-text search over word+meaning), `tone`, `cluster`, `status` (joins user progress), `limit`, `offset`. Returns words with this user's progress merged in. |
| GET | /api/words/:id | Single word + this user's progress. |
| POST | /api/words/:id/learn | Mark word as "learning today": sets `marked_learning_on = today`, `status = 'learning'` if currently `new`, `due_date = today`. |
| POST | /api/words/learn-batch | `{ wordIds: string[] }` — mark up to 20 at once (the morning workflow). |
| GET | /api/review/today | Night quiz: words marked learning today. |
| GET | /api/review/due | Morning review: due words (see §4.3 ordering). |
| POST | /api/review/submit | `{ wordId, grade }` where grade ∈ `again|hard|good|easy`. Runs §4.2, writes a `quiz_attempts` row (section `vocab`, `is_correct = grade != 'again'`), returns updated progress. |
| GET | /api/words/compare | `{ idA, idB }` → both words side by side for the confusion-pair feature. Read-only. |

Full-text search: add to `words` a generated `search_vector tsvector` over `word` and `meaning`, GIN-indexed; `q` runs `search_vector @@ websearch_to_tsquery($1)`.

### 5.3 Text Completion

| Method | Path | Notes |
|---|---|---|
| GET | /api/tc | List/paginate TC questions. Filters: `difficulty`, `blankCount`. Does NOT return `answers` or `explanation`. |
| GET | /api/tc/:id | One question, answers/explanation withheld. |
| POST | /api/tc/:id/submit | `{ answers: string[] }` (one per blank, in order). Server checks against stored answers — all blanks must match. Returns `{ isCorrect, correctAnswers, explanation }` and writes a `quiz_attempts` row. |

### 5.4 Sentence Equivalence

| Method | Path | Notes |
|---|---|---|
| GET | /api/se | List/paginate; answers/explanation withheld. |
| GET | /api/se/:id | One question, answers withheld. |
| POST | /api/se/:id/submit | `{ answers: string[] }` (must be exactly 2). Correct only if both match the stored pair (set equality, order-independent). Returns `{ isCorrect, correctAnswers, explanation }`, writes attempt. |

### 5.5 Reading Comprehension

| Method | Path | Notes |
|---|---|---|
| GET | /api/rc | List passages (metadata: title, subject, paragraph_count, question count). |
| GET | /api/rc/:passageId | Passage body + its questions (options included, `answer_index`/`explanation`/`trap_types` withheld). |
| POST | /api/rc/questions/:id/submit | `{ answerIndex, trapTags? }` — `trapTags` optional map of wrong-option → trap label for the self-tagging drill. Returns `{ isCorrect, correctIndex, explanation, trap_types }`, writes attempt with `section = 'rc'`. |

### 5.6 Progress

| Method | Path | Returns |
|---|---|---|
| GET | /api/progress/summary | `{ streakDays, masteredCount, totalWords, learningCount, reviewCount, dueTodayCount }` |
| GET | /api/progress/weak-words | Words with highest `times_wrong` (and low accuracy), capped (e.g. top 50). |
| GET | /api/progress/scores | `{ section?, from?, to?, granularity: 'day'|'week' }` → time series of accuracy for the line chart. Aggregates `quiz_attempts`. |
| GET | /api/progress/by-type | RC accuracy by `question_type` and `subject`; TC accuracy by `blank_count`. Powers weak-spot analytics. |

---

## 6. Cross-Cutting Logic

### 6.1 "Today" and streaks

All day boundaries are computed in the **user's timezone** (from `users.timezone`), not server time. "Today" = `now() AT TIME ZONE users.timezone`, date part.

Streak: a day counts as studied if the user has ≥1 `quiz_attempts` row that day (any section). Streak = count of consecutive user-local days up to today with activity. If today has no activity yet, the streak is "preserved" until midnight (don't reset until a full day is missed). Compute on read from `quiz_attempts`; do not store a denormalized counter unless performance demands it.

### 6.2 Answer secrecy

`GET` endpoints for TC/SE/RC must never include correct answers, answer indices, or explanations in the payload. Answers are revealed only in the `POST .../submit` response. Enforce this at the serialization layer, not by trusting the frontend.

### 6.3 Idempotency / double-submit

`review/submit` and the question `submit` endpoints are not idempotent (each writes an attempt). That's intended — re-answering a question is a new attempt and should affect analytics. The frontend controls re-presentation; the backend records every submission.

### 6.4 Seeding

Provide a seed script (`bun run seed`) that loads an initial content bank: a starter word list (with tone, cluster, example, gre_context), plus a handful of TC, SE, and RC items so the app is usable on first deploy. Content lives in JSON/CSV files in the repo under `/seed`.

---

## 7. Project Structure (suggested)

```
backend/
  src/
    index.ts                 # Elysia app bootstrap, plugins, error handler
    db/
      client.ts              # postgres connection
      schema.sql             # DDL for all 8 tables + indexes
      migrations/            # numbered .sql migrations
    plugins/
      auth.ts                # JWT verify, requireAuth derive
    lib/
      srs.ts                 # SM-2 implementation (§4.2) — pure, unit-tested
      dates.ts               # user-local "today", streak helpers
    modules/
      auth/      routes.ts  service.ts
      words/     routes.ts  service.ts
      review/    routes.ts  service.ts
      tc/        routes.ts  service.ts
      se/        routes.ts  service.ts
      rc/        routes.ts  service.ts
      progress/  routes.ts  service.ts
  seed/
    words.json  tc.json  se.json  rc.json
    seed.ts
  package.json
  .env.example
```

`lib/srs.ts` must be a pure function `applyReview(progress, grade, today) -> newProgress` with unit tests covering: first correct (interval→1), second correct (→6), third (→interval*ease), a lapse (reset to learning), ease floor at 1.3, and the mastered threshold at interval ≥ 21.

---

## 8. Environment

`.env.example`:

```
DATABASE_URL=postgres://user:pass@host:5432/gre
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
ACCESS_TOKEN_TTL=900           # seconds
REFRESH_TOKEN_TTL=2592000      # seconds
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

CORS: allow the frontend origin only. Set `credentials: true` if refresh token is sent via cookie; otherwise bearer-in-header is fine and simpler.

---

## 9. Validation & Error Rules

- Every route validates input with TypeBox; reject with 400 + the error shape on failure.
- 401 for missing/invalid token; 403 for valid token but forbidden resource; 404 for missing resource; 409 for duplicate (e.g. email already registered).
- TC submit must receive exactly `blank_count` answers; SE submit exactly 2; RC submit a valid index 0–4. Reject otherwise.
- Never trust client-sent correctness — the server always re-checks against stored answers.

---

## 10. Build Order (for the implementer)

1. DB schema + migrations + connection.
2. Auth (register/login/refresh/me) + JWT plugin.
3. `lib/srs.ts` with unit tests.
4. Words + review endpoints (the core loop).
5. Seed script + starter content.
6. TC, then SE, then RC submit/scoring.
7. Progress endpoints (summary, weak-words, scores, by-type).
8. CORS, error handler, deploy to Render/Railway + Neon.

Ship after step 4 is testable end-to-end (register → learn words → review → progress updates); layer the rest on.
