-- GRE Verbal Trainer — full DDL

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name  text,
  timezone      text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Refresh tokens (server-side revocation)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rt_user ON refresh_tokens(user_id);

-- Words (shared content)
CREATE TABLE IF NOT EXISTS words (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word            text NOT NULL UNIQUE,
  meaning         text NOT NULL,
  tone            text NOT NULL CHECK (tone IN ('formal','neutral','negative','positive','informal')),
  example_sentence text NOT NULL,
  gre_context     text,
  cluster         text,
  search_vector   tsvector GENERATED ALWAYS AS (
    to_tsvector('english', word || ' ' || meaning)
  ) STORED,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_words_word    ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_cluster ON words(cluster);
CREATE INDEX IF NOT EXISTS idx_words_fts     ON words USING GIN(search_vector);

-- Per-user word progress (drives SRS)
CREATE TABLE IF NOT EXISTS user_word_progress (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id           uuid NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'new' CHECK (status IN ('new','learning','review','mastered')),
  ease              real NOT NULL DEFAULT 2.5,
  interval_days     integer NOT NULL DEFAULT 0,
  repetitions       integer NOT NULL DEFAULT 0,
  due_date          date,
  marked_learning_on date,
  last_reviewed_at  timestamptz,
  times_seen        integer NOT NULL DEFAULT 0,
  times_wrong       integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, word_id)
);
CREATE INDEX IF NOT EXISTS idx_uwp_due    ON user_word_progress(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_uwp_status ON user_word_progress(user_id, status);

-- TC questions (shared content)
CREATE TABLE IF NOT EXISTS tc_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt      text NOT NULL,
  blank_count integer NOT NULL CHECK (blank_count BETWEEN 1 AND 3),
  options     jsonb NOT NULL,
  answers     jsonb NOT NULL,
  explanation text,
  difficulty  text CHECK (difficulty IN ('easy','medium','hard')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- SE questions (shared content)
CREATE TABLE IF NOT EXISTS se_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt      text NOT NULL,
  options     jsonb NOT NULL CHECK (jsonb_array_length(options) = 6),
  answers     jsonb NOT NULL CHECK (jsonb_array_length(answers) = 2),
  explanation text,
  difficulty  text CHECK (difficulty IN ('easy','medium','hard')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RC passages (shared content)
CREATE TABLE IF NOT EXISTS rc_passages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text,
  body            text NOT NULL,
  subject         text CHECK (subject IN ('science','humanities','social_science','business')),
  paragraph_count integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RC questions (shared content)
CREATE TABLE IF NOT EXISTS rc_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id    uuid NOT NULL REFERENCES rc_passages(id) ON DELETE CASCADE,
  question      text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('main_idea','tone','inference','detail','strengthen','weaken')),
  options       jsonb NOT NULL,
  answer_index  integer NOT NULL,
  explanation   text,
  trap_types    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rcq_passage ON rc_questions(passage_id);

-- Quiz attempts (analytics backbone)
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section     text NOT NULL CHECK (section IN ('vocab','tc','se','rc')),
  item_id     uuid NOT NULL,
  is_correct  boolean NOT NULL,
  user_answer jsonb,
  answered_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qa_user_time    ON quiz_attempts(user_id, answered_at);
CREATE INDEX IF NOT EXISTS idx_qa_user_section ON quiz_attempts(user_id, section);
