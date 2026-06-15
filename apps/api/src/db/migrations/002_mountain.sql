-- Mountain Mode columns (idempotent)

-- words: group membership and Mountain-specific content
ALTER TABLE words
  ADD COLUMN IF NOT EXISTS group_number       integer,
  ADD COLUMN IF NOT EXISTS word_order         integer,
  ADD COLUMN IF NOT EXISTS synonyms           text[],
  ADD COLUMN IF NOT EXISTS example_sentence_2 text,
  ADD COLUMN IF NOT EXISTS tone_needs_review  boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_words_group ON words(group_number);

-- user_word_progress: last keyboard mark from Mountain session
ALTER TABLE user_word_progress
  ADD COLUMN IF NOT EXISTS last_mark text CHECK (last_mark IN ('knew','forgot'));
