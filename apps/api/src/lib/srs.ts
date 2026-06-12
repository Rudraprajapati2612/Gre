export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface SRSProgress {
  status: 'new' | 'learning' | 'review' | 'mastered'
  ease: number
  interval_days: number
  repetitions: number
  times_seen: number
  times_wrong: number
}

export interface SRSResult extends SRSProgress {
  due_date: string // YYYY-MM-DD
  last_reviewed_at: string // ISO timestamp
}

const GRADE_TO_QUALITY: Record<Grade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

export function applyReview(
  progress: SRSProgress,
  grade: Grade,
  today: string, // YYYY-MM-DD user-local
): SRSResult {
  const q = GRADE_TO_QUALITY[grade]
  let { ease, interval_days, repetitions, times_seen, times_wrong } = progress

  times_seen += 1

  if (q < 3) {
    // lapse
    repetitions = 0
    interval_days = 1
    times_wrong += 1
  } else {
    repetitions += 1
    if (repetitions === 1) {
      interval_days = 1
    } else if (repetitions === 2) {
      interval_days = 6
    } else {
      interval_days = Math.round(interval_days * ease)
    }

    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (ease < 1.3) ease = 1.3
  }

  let status: SRSProgress['status']
  if (repetitions === 0) {
    status = 'learning'
  } else if (interval_days < 21) {
    status = 'review'
  } else {
    status = 'mastered'
  }

  const due_date = addDays(today, interval_days)

  return {
    status,
    ease,
    interval_days,
    repetitions,
    times_seen,
    times_wrong,
    due_date,
    last_reviewed_at: new Date().toISOString(),
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
