import type {
  AuthResponse, User, Word, UserWordProgress, TCQuestion, SEQuestion,
  RCPassage, RCPassageDetail, ProgressSummary, WeakWord, ScorePoint,
  SubmitTCResult, SubmitSEResult, SubmitRCResult, MountainGroup,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Module-level token store — updated by AuthProvider
let _accessToken: string | null = null
let _refreshFn: (() => Promise<string | null>) | null = null
let _logoutFn: (() => void) | null = null

export const tokenStore = {
  set(token: string | null) { _accessToken = token },
  get() { return _accessToken },
  setRefreshFn(fn: () => Promise<string | null>) { _refreshFn = fn },
  setLogoutFn(fn: () => void) { _logoutFn = fn },
}

async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status === 401 && retry && _refreshFn) {
    const newToken = await _refreshFn()
    if (newToken) {
      return apiFetch(path, init, false)
    }
    _logoutFn?.()
    throw new Error('Session expired')
  }

  return res
}

async function json<T>(res: Response): Promise<T> {
  const data = await res.json()
  if (!res.ok) throw data
  return data as T
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function apiRegister(email: string, password: string, displayName?: string, timezone?: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, timezone }),
  })
  return json<AuthResponse>(res)
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return json<AuthResponse>(res)
}

export async function apiRefresh(refreshToken: string) {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return null
  const data = await res.json() as { accessToken: string; refreshToken: string }
  return data
}

export async function apiLogout(refreshToken: string) {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export async function apiMe() {
  const res = await apiFetch('/api/auth/me')
  return json<{ user: User }>(res)
}

// ─── Words ────────────────────────────────────────────────────────────────

export async function apiWords(params: {
  q?: string; tone?: string; cluster?: string; status?: string; limit?: number; offset?: number
}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
  const res = await apiFetch(`/api/words?${qs}`)
  return json<{ words: Word[] }>(res)
}

export async function apiWord(id: string) {
  const res = await apiFetch(`/api/words/${id}`)
  return json<{ word: Word }>(res)
}

export async function apiLearnWord(id: string) {
  const res = await apiFetch(`/api/words/${id}/learn`, { method: 'POST' })
  return json<{ progress: UserWordProgress }>(res)
}

export async function apiLearnBatch(wordIds: string[]) {
  const res = await apiFetch('/api/words/learn-batch', {
    method: 'POST',
    body: JSON.stringify({ wordIds }),
  })
  return json<{ results: UserWordProgress[] }>(res)
}

export async function apiCompareWords(idA: string, idB: string) {
  const res = await apiFetch(`/api/words/compare?idA=${idA}&idB=${idB}`)
  return json<{ words: Word[] }>(res)
}

// ─── Review ────────────────────────────────────────────────────────────────

export async function apiReviewToday() {
  const res = await apiFetch('/api/review/today')
  return json<{ words: Word[] }>(res)
}

export async function apiReviewDue() {
  const res = await apiFetch('/api/review/due')
  return json<{ words: Word[] }>(res)
}

export async function apiSubmitReview(wordId: string, grade: string) {
  const res = await apiFetch('/api/review/submit', {
    method: 'POST',
    body: JSON.stringify({ wordId, grade }),
  })
  return json<{ progress: UserWordProgress }>(res)
}

// ─── TC ────────────────────────────────────────────────────────────────────

export async function apiTC(params?: { difficulty?: string; blankCount?: number; limit?: number; offset?: number }) {
  const qs = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
  const res = await apiFetch(`/api/tc?${qs}`)
  return json<{ questions: TCQuestion[] }>(res)
}

export async function apiTCQuestion(id: string) {
  const res = await apiFetch(`/api/tc/${id}`)
  return json<{ question: TCQuestion }>(res)
}

export async function apiSubmitTC(id: string, answers: string[]) {
  const res = await apiFetch(`/api/tc/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
  return json<SubmitTCResult>(res)
}

// ─── SE ────────────────────────────────────────────────────────────────────

export async function apiSE(params?: { difficulty?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
  const res = await apiFetch(`/api/se?${qs}`)
  return json<{ questions: SEQuestion[] }>(res)
}

export async function apiSubmitSE(id: string, answers: string[]) {
  const res = await apiFetch(`/api/se/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
  return json<SubmitSEResult>(res)
}

// ─── RC ────────────────────────────────────────────────────────────────────

export async function apiRC(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
  const res = await apiFetch(`/api/rc?${qs}`)
  return json<{ passages: RCPassage[] }>(res)
}

export async function apiRCPassage(passageId: string) {
  const res = await apiFetch(`/api/rc/${passageId}`)
  return json<{ passage: RCPassageDetail }>(res)
}

export async function apiSubmitRC(questionId: string, answerIndex: number, trapTags?: any) {
  const res = await apiFetch(`/api/rc/questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answerIndex, trapTags }),
  })
  return json<SubmitRCResult>(res)
}

// ─── Progress ─────────────────────────────────────────────────────────────

export async function apiProgressSummary() {
  const res = await apiFetch('/api/progress/summary')
  return json<ProgressSummary>(res)
}

export async function apiWeakWords() {
  const res = await apiFetch('/api/progress/weak-words')
  return json<{ words: WeakWord[] }>(res)
}

export async function apiScores(params?: { section?: string; from?: string; to?: string; granularity?: 'day' | 'week' }) {
  const qs = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
  const res = await apiFetch(`/api/progress/scores?${qs}`)
  return json<{ scores: ScorePoint[] }>(res)
}

export async function apiByType() {
  const res = await apiFetch('/api/progress/by-type')
  return json<any>(res)
}

// ─── Mountain ─────────────────────────────────────────────────────────────

export async function apiMountainGroups() {
  const res = await apiFetch('/api/mountain/groups')
  return json<{ groups: MountainGroup[] }>(res)
}

export async function apiMountainGroup(
  n: number,
  params?: { filter?: 'all' | 'forgotten' | 'unseen'; order?: 'default' | 'shuffle' },
) {
  const qs = new URLSearchParams()
  if (params?.filter) qs.set('filter', params.filter)
  if (params?.order)  qs.set('order', params.order)
  const res = await apiFetch(`/api/mountain/groups/${n}?${qs}`)
  return json<{ group: number; words: Word[] }>(res)
}

export async function apiMountainMark(wordId: string, mark: 'knew' | 'forgot') {
  const res = await apiFetch('/api/mountain/mark', {
    method: 'POST',
    body: JSON.stringify({ wordId, mark }),
  })
  return json<{ progress: UserWordProgress }>(res)
}

export async function apiMountainStartGroup(n: number) {
  const res = await apiFetch(`/api/mountain/groups/${n}/start`, { method: 'POST' })
  return json<{ started: number; group: number }>(res)
}

export async function apiMountainResetGroup(n: number) {
  const res = await apiFetch(`/api/mountain/groups/${n}/reset`, { method: 'POST' })
  return json<{ ok: boolean; group: number }>(res)
}

export async function apiMountainNote(wordId: string, note: string) {
  const res = await apiFetch('/api/mountain/note', {
    method: 'PATCH',
    body: JSON.stringify({ wordId, note }),
  })
  return json<{ progress: UserWordProgress }>(res)
}

// ─── Admin ────────────────────────────────────────────────────────────────

export async function apiAdminClusters() {
  const res = await apiFetch('/api/admin/clusters')
  return json<{ clusters: string[] }>(res)
}

export async function apiCreateWord(data: {
  word: string
  meaning: string
  tone: 'formal' | 'neutral' | 'positive' | 'negative' | 'informal'
  example_sentence: string
  gre_context?: string
  cluster?: string
}) {
  const res = await apiFetch('/api/admin/words', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return json<{ word: Word }>(res)
}

export async function apiDeleteWord(id: string) {
  const res = await apiFetch(`/api/admin/${id}`, { method: 'DELETE' })
  return json<{ deleted: { id: string; word: string } }>(res)
}
