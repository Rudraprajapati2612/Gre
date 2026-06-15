// PostgreSQL rejects deprecated IANA aliases — map them to canonical names.
const TZ_ALIASES: Record<string, string> = {
  'Asia/Calcutta':   'Asia/Kolkata',
  'Asia/Ulaanbaatar':'Asia/Ulaanbaatar',
  'America/Godthab': 'America/Nuuk',
  'Asia/Katmandu':   'Asia/Kathmandu',
  'Asia/Saigon':     'Asia/Ho_Chi_Minh',
  'Pacific/Truk':    'Pacific/Chuuk',
}

export function normalizeTimezone(tz: string): string {
  return TZ_ALIASES[tz] ?? tz
}

/** Returns the user's local date as a YYYY-MM-DD string. */
export function userLocalToday(timezone: string): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: normalizeTimezone(timezone) })
}

/**
 * Compute streak: consecutive user-local days (up to and including today)
 * with at least one quiz attempt.
 * `activityDates` is a sorted array of YYYY-MM-DD strings (may have duplicates).
 */
export function computeStreak(activityDates: string[], timezone: string): number {
  const today = userLocalToday(timezone)
  const unique = [...new Set(activityDates)].sort().reverse()
  if (unique.length === 0) return 0

  let streak = 0
  let cursor = today

  for (const d of unique) {
    if (d === cursor) {
      streak++
      cursor = prevDay(cursor)
    } else if (d < cursor) {
      // gap — stop (but if today has no activity yet, don't break streak on yesterday)
      if (streak === 0) {
        // today not yet active; check if yesterday matches
        const yesterday = prevDay(today)
        if (d === yesterday) {
          streak++
          cursor = prevDay(yesterday)
          continue
        }
      }
      break
    }
  }
  return streak
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}
