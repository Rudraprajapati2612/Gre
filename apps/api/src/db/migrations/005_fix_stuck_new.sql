-- Fix words marked in Mountain mode (last_mark is set) but stuck at status='new'
-- This happens when a note is saved and the subsequent mark call hits a race condition.
UPDATE user_word_progress
SET
  status             = 'learning',
  due_date           = COALESCE(due_date, CURRENT_DATE),
  marked_learning_on = COALESCE(marked_learning_on, CURRENT_DATE),
  times_seen         = GREATEST(times_seen, 1)
WHERE status = 'new'
  AND last_mark IS NOT NULL;
