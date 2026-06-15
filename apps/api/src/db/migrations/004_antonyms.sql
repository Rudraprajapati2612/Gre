-- Antonyms array for GRE words
ALTER TABLE words ADD COLUMN IF NOT EXISTS antonyms text[];
