export type Tone = 'formal' | 'neutral' | 'positive' | 'negative' | 'informal'
export type WordStatus = 'new' | 'learning' | 'review' | 'mastered'
export type Grade = 'again' | 'hard' | 'good' | 'easy'
export type Section = 'vocab' | 'tc' | 'se' | 'rc'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionType = 'main_idea' | 'tone' | 'inference' | 'detail' | 'strengthen' | 'weaken'

export interface User {
  id: string
  email: string
  display_name: string | null
  timezone: string
  created_at: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface Word {
  id: string
  word: string
  meaning: string
  tone: Tone
  example_sentence: string
  example_sentence_2: string | null
  gre_context: string | null
  cluster: string | null
  synonyms: string[] | null
  antonyms: string[] | null
  group_number: number | null
  word_order: number | null
  tone_needs_review: boolean
  created_at: string
  // merged user progress
  user_status: WordStatus
  ease: number | null
  interval_days: number | null
  repetitions: number | null
  due_date: string | null
  times_seen: number | null
  times_wrong: number | null
  last_reviewed_at: string | null
  marked_learning_on: string | null
  // Mountain mark
  last_mark: 'knew' | 'forgot' | null
  // Personal mnemonic note
  user_note: string | null
}

export interface MountainGroup {
  group_number: number
  word_count: number
  knew_count: number
  forgot_count: number
  unseen_count: number
  is_complete: boolean
}

export interface UserWordProgress {
  id: string
  user_id: string
  word_id: string
  status: WordStatus
  ease: number
  interval_days: number
  repetitions: number
  due_date: string | null
  marked_learning_on: string | null
  last_reviewed_at: string | null
  times_seen: number
  times_wrong: number
}

export interface TCQuestion {
  id: string
  prompt: string
  blank_count: number
  options: string[][]
  difficulty: Difficulty | null
  created_at: string
  // only on submit response:
  answers?: string[]
  explanation?: string
}

export interface SEQuestion {
  id: string
  prompt: string
  options: string[]
  difficulty: Difficulty | null
  created_at: string
  answers?: string[]
  explanation?: string
}

export interface RCPassage {
  id: string
  title: string | null
  subject: string | null
  paragraph_count: number | null
  question_count: number
  created_at: string
}

export interface RCQuestion {
  id: string
  question: string
  question_type: QuestionType
  options: string[]
  created_at: string
  // only on submit:
  answer_index?: number
  explanation?: string
  trap_types?: string[]
}

export interface RCPassageDetail extends RCPassage {
  body: string
  questions: RCQuestion[]
}

export interface ProgressSummary {
  streakDays: number
  masteredCount: number
  totalWords: number
  learningCount: number
  reviewCount: number
  dueTodayCount: number
}

export interface WeakWord {
  id: string
  word: string
  meaning: string
  tone: Tone
  cluster: string | null
  times_wrong: number
  times_seen: number
  accuracy: number
}

export interface ScorePoint {
  period: string
  section?: Section
  total: number
  correct: number
  accuracy: number
}

export interface SubmitTCResult {
  isCorrect: boolean
  correctAnswers: string[]
  explanation: string | null
}

export interface SubmitSEResult {
  isCorrect: boolean
  correctAnswers: string[]
  explanation: string | null
}

export interface SubmitRCResult {
  isCorrect: boolean
  correctIndex: number
  explanation: string | null
  trap_types: string[] | null
}

export interface ApiError {
  error: { code: string; message: string }
}
