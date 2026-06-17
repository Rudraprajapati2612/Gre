-- User's own definition for a word
ALTER TABLE user_word_progress
  ADD COLUMN IF NOT EXISTS user_meaning text;
