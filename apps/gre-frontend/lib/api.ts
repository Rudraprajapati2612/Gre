const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// In-memory access token (per tab)
let _accessToken: string | null = null;

// ── Token helpers ──────────────────────────────────────────────────────────

export function setTokens(access: string, refresh: string) {
  _accessToken = access;
  if (typeof window !== 'undefined') {
    localStorage.setItem('summit_refresh', refresh);
  }
}

export function clearTokens() {
  _accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('summit_refresh');
    localStorage.removeItem('summit_user');
  }
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined' ? localStorage.getItem('summit_refresh') : null;
  if (!refreshToken) return null;

  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  _accessToken = data.accessToken;
  if (typeof window !== 'undefined') {
    localStorage.setItem('summit_refresh', data.refreshToken);
  }
  return _accessToken;
}

// ── Error types ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends Error {
  constructor() {
    super('Not authenticated');
    this.name = 'AuthError';
  }
}

// ── Core fetch ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const makeReq = (token: string | null) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

  let res = await makeReq(_accessToken);

  if (res.status === 401) {
    const newToken = await tryRefreshAccessToken();
    if (!newToken) throw new AuthError();
    res = await makeReq(newToken);
    if (res.status === 401) {
      clearTokens();
      throw new AuthError();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Request failed',
    );
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type WordStatus = 'new' | 'learning' | 'review' | 'mastered';
export type Tone = 'formal' | 'neutral' | 'positive' | 'negative' | 'informal';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  tone: Tone;
  examples: string[];
  greContext: string;
  cluster: string;
  synonyms: string[];
  antonyms: string[];
  groupNumber: number;
  ease: number;
  intervalDays: number;
  dueDate: string | null;
  repetitions: number;
  timesSeen: number;
  timesWrong: number;
  status: WordStatus;
  userNote?: string;
  lastMark?: 'knew' | 'forgot';
}

export interface MountainGroup {
  id: number;
  title: string;
  totalWords: number;
  knew: number;
  forgot: number;
  unseen: number;
  isComplete: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  display_name?: string;
  timezone?: string;
}

export interface ProgressSummary {
  streakDays: number;
  masteredCount: number;
  totalWords: number;
  learningCount: number;
  reviewCount: number;
  dueTodayCount: number;
}

export interface WeakWord {
  id: string;
  word: string;
  meaning: string;
  tone: string;
  cluster: string;
  timesWrong: number;
  timesSeen: number;
  accuracy: number;
}

export interface TCQuestion {
  id: string;
  prompt: string;
  blankCount: number;
  options: string[][];
  difficulty?: string;
}

export interface SEQuestion {
  id: string;
  prompt: string;
  options: string[];
  difficulty?: string;
}

export interface RCQuestion {
  id: string;
  question: string;
  questionType: string;
  options: string[];
}

export interface RCPassage {
  id: string;
  title?: string;
  body: string;
  subject?: string;
  paragraphCount?: number;
  questions: RCQuestion[];
}

// ── Data normalizers ───────────────────────────────────────────────────────

function normalizeWord(w: any): Word {
  const examples: string[] = [];
  if (w.example_sentence) examples.push(w.example_sentence);
  if (w.example_sentence_2) examples.push(w.example_sentence_2);

  return {
    id: String(w.id),
    word: w.word ?? '',
    meaning: w.meaning ?? '',
    tone: w.tone ?? 'neutral',
    examples,
    greContext: w.gre_context ?? '',
    cluster: w.cluster ?? '',
    synonyms: w.synonyms ?? [],
    antonyms: w.antonyms ?? [],
    groupNumber: w.group_number ?? 0,
    status: w.user_status ?? w.status ?? 'new',
    ease: w.ease ?? 2.5,
    intervalDays: w.interval_days ?? 0,
    repetitions: w.repetitions ?? 0,
    dueDate: w.due_date ?? null,
    timesSeen: w.times_seen ?? 0,
    timesWrong: w.times_wrong ?? 0,
    userNote: w.user_note ?? undefined,
    lastMark: w.last_mark ?? undefined,
  };
}

function normalizeGroup(g: any): MountainGroup {
  return {
    id: g.group_number,
    title: `Group ${g.group_number}`,
    totalWords: g.word_count ?? 0,
    knew: g.knew_count ?? 0,
    forgot: g.forgot_count ?? 0,
    unseen: g.unseen_count ?? 0,
    isComplete: g.is_complete ?? false,
  };
}

function normalizeUser(u: any): User {
  return {
    id: String(u.id),
    email: u.email,
    name: u.display_name ?? u.email?.split('@')[0] ?? 'User',
    display_name: u.display_name,
    timezone: u.timezone,
  };
}

function normalizeTC(q: any): TCQuestion {
  return {
    id: String(q.id),
    prompt: q.prompt,
    blankCount: q.blank_count,
    options: q.options ?? [],
    difficulty: q.difficulty,
  };
}

function normalizeSE(q: any): SEQuestion {
  return {
    id: String(q.id),
    prompt: q.prompt,
    options: q.options ?? [],
    difficulty: q.difficulty,
  };
}

function normalizeRCPassage(p: any): RCPassage {
  return {
    id: String(p.id),
    title: p.title ?? undefined,
    body: p.body ?? '',
    subject: p.subject ?? undefined,
    paragraphCount: p.paragraph_count ?? undefined,
    questions: (p.questions ?? []).map((q: any) => ({
      id: String(q.id),
      question: q.question,
      questionType: q.question_type,
      options: q.options ?? [],
    })),
  };
}

function normalizeWeakWord(w: any): WeakWord {
  return {
    id: String(w.id),
    word: w.word,
    meaning: w.meaning,
    tone: w.tone,
    cluster: w.cluster ?? '',
    timesWrong: w.times_wrong ?? 0,
    timesSeen: w.times_seen ?? 0,
    accuracy: w.accuracy ?? 0,
  };
}

// ── Auth ───────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const data = await apiFetch<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.accessToken, data.refreshToken);
  const user = normalizeUser(data.user);
  if (typeof window !== 'undefined') {
    localStorage.setItem('summit_user', JSON.stringify(user));
  }
  return { user, accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const data = await apiFetch<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
  setTokens(data.accessToken, data.refreshToken);
  const user = normalizeUser(data.user);
  if (typeof window !== 'undefined') {
    localStorage.setItem('summit_user', JSON.stringify(user));
  }
  return { user, accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiFetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
  clearTokens();
}

export async function getMe(): Promise<User> {
  const data = await apiFetch<{ user: any }>('/api/auth/me');
  return normalizeUser(data.user);
}

export async function restoreSession(): Promise<User | null> {
  if (typeof window === 'undefined') return null;
  const hasRefresh = !!localStorage.getItem('summit_refresh');
  if (!hasRefresh) return null;

  const newToken = await tryRefreshAccessToken();
  if (!newToken) return null;

  try {
    const user = await getMe();
    if (typeof window !== 'undefined') {
      localStorage.setItem('summit_user', JSON.stringify(user));
    }
    return user;
  } catch {
    clearTokens();
    return null;
  }
}

// ── Words ──────────────────────────────────────────────────────────────────

export async function listWords(params?: {
  q?: string;
  tone?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Word[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.tone) query.set('tone', params.tone);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const qs = query.toString();
  const data = await apiFetch<{ words: any[] }>(`/api/words${qs ? `?${qs}` : ''}`);
  return data.words.map(normalizeWord);
}

export async function getWord(id: string): Promise<Word | null> {
  try {
    const data = await apiFetch<{ word: any }>(`/api/words/${id}`);
    return normalizeWord(data.word);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ── Mountain ───────────────────────────────────────────────────────────────

export async function listMountainGroups(): Promise<MountainGroup[]> {
  const data = await apiFetch<{ groups: any[] }>('/api/mountain/groups');
  return data.groups.map(normalizeGroup);
}

export async function getMountainGroup(
  n: number,
  filter: 'all' | 'forgotten' | 'unseen' = 'all',
  order: 'default' | 'shuffle' = 'default',
): Promise<Word[]> {
  const data = await apiFetch<{ words: any[] }>(
    `/api/mountain/groups/${n}?filter=${filter}&order=${order}`,
  );
  return data.words.map(normalizeWord);
}

export async function markMountainWord(wordId: string, mark: 'knew' | 'forgot'): Promise<void> {
  await apiFetch('/api/mountain/mark', {
    method: 'POST',
    body: JSON.stringify({ wordId, mark }),
  });
}

export async function saveMountainNote(wordId: string, note: string): Promise<void> {
  await apiFetch('/api/mountain/note', {
    method: 'PATCH',
    body: JSON.stringify({ wordId, note }),
  });
}

export async function startMountainGroup(n: number): Promise<void> {
  await apiFetch(`/api/mountain/groups/${n}/start`, { method: 'POST' });
}

export async function resetMountainGroup(n: number): Promise<void> {
  await apiFetch(`/api/mountain/groups/${n}/reset`, { method: 'POST' });
}

// ── Review ─────────────────────────────────────────────────────────────────

export async function getDueReviewWords(): Promise<Word[]> {
  const data = await apiFetch<{ words: any[] }>('/api/review/due');
  return data.words.map(normalizeWord);
}

export async function getTodayReviewWords(): Promise<Word[]> {
  const data = await apiFetch<{ words: any[] }>('/api/review/today');
  return data.words.map(normalizeWord);
}

export async function submitReview(
  wordId: string,
  grade: 'again' | 'hard' | 'good' | 'easy',
): Promise<void> {
  await apiFetch('/api/review/submit', {
    method: 'POST',
    body: JSON.stringify({ wordId, grade }),
  });
}

// ── Progress ───────────────────────────────────────────────────────────────

export async function getProgressSummary(): Promise<ProgressSummary> {
  return apiFetch<ProgressSummary>('/api/progress/summary');
}

export async function getWeakWords(): Promise<WeakWord[]> {
  const data = await apiFetch<{ words: any[] }>('/api/progress/weak-words');
  return data.words.map(normalizeWeakWord);
}

// ── TC ─────────────────────────────────────────────────────────────────────

export async function listTCQuestions(params?: {
  difficulty?: string;
  blankCount?: number;
  limit?: number;
}): Promise<TCQuestion[]> {
  const query = new URLSearchParams();
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.blankCount) query.set('blankCount', String(params.blankCount));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const data = await apiFetch<{ questions: any[] }>(`/api/tc${qs ? `?${qs}` : ''}`);
  return data.questions.map(normalizeTC);
}

export async function submitTCAnswer(
  id: string,
  answers: string[],
): Promise<{ isCorrect: boolean; correctAnswers: string[]; explanation: string }> {
  return apiFetch(`/api/tc/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ── SE ─────────────────────────────────────────────────────────────────────

export async function listSEQuestions(params?: {
  difficulty?: string;
  limit?: number;
}): Promise<SEQuestion[]> {
  const query = new URLSearchParams();
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const data = await apiFetch<{ questions: any[] }>(`/api/se${qs ? `?${qs}` : ''}`);
  return data.questions.map(normalizeSE);
}

export async function submitSEAnswer(
  id: string,
  answers: string[],
): Promise<{ isCorrect: boolean; correctAnswers: string[]; explanation: string }> {
  return apiFetch(`/api/se/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ── RC ─────────────────────────────────────────────────────────────────────

export async function listRCPassages(params?: { limit?: number }): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const data = await apiFetch<{ passages: any[] }>(`/api/rc${qs ? `?${qs}` : ''}`);
  return data.passages;
}

export async function getRCPassage(passageId: string): Promise<RCPassage> {
  const data = await apiFetch<{ passage: any }>(`/api/rc/${passageId}`);
  return normalizeRCPassage(data.passage);
}

export async function submitRCAnswer(
  questionId: string,
  answerIndex: number,
  trapTags?: string[],
): Promise<{
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  trap_types?: any[];
}> {
  return apiFetch(`/api/rc/questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answerIndex, trapTags }),
  });
}
