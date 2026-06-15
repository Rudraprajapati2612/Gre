-- Personal mnemonic note per user per word
ALTER TABLE user_word_progress
  ADD COLUMN IF NOT EXISTS user_note text;
