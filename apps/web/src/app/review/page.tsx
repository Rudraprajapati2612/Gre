'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { X, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiReviewDue, apiReviewToday, apiSubmitReview } from '@/lib/api'
import { ToneChip } from '@/components/ToneChip'
import { useAuth } from '@/lib/auth'
import type { Grade, Word } from '@/lib/types'

const GRADE_CONFIG: { grade: Grade; label: string; hint: string; cls: string; activeCls: string }[] = [
  { grade: 'again', label: 'Again', hint: '<1d', cls: 'bg-danger-wash text-danger border-transparent', activeCls: 'bg-danger text-white' },
  { grade: 'hard',  label: 'Hard',  hint: '2d',  cls: 'bg-surface-muted text-ink-soft border-border', activeCls: 'bg-brand-wash text-brand border-brand/30' },
  { grade: 'good',  label: 'Good',  hint: '4d',  cls: 'bg-brand-wash text-brand border-brand/20',     activeCls: 'bg-brand text-white' },
  { grade: 'easy',  label: 'Easy',  hint: '8d',  cls: 'bg-success-wash text-success border-transparent', activeCls: 'bg-success text-white' },
]

function ReviewContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') ?? 'due'
  const qc = useQueryClient()

  const { data: dueData, isLoading: loadingDue } = useQuery({
    queryKey: ['review-due'],
    queryFn: apiReviewDue,
    enabled: mode === 'due' && !!user,
  })

  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['review-today'],
    queryFn: apiReviewToday,
    enabled: mode === 'today' && !!user,
  })

  const isLoading = mode === 'due' ? loadingDue : loadingToday
  const words: Word[] = (mode === 'due' ? dueData?.words : todayData?.words) ?? []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [results, setResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 })

  const submitMutation = useMutation({
    mutationFn: ({ wordId, grade }: { wordId: string; grade: Grade }) =>
      apiSubmitReview(wordId, grade),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
      qc.invalidateQueries({ queryKey: ['review-due'] })
      qc.invalidateQueries({ queryKey: ['review-today'] })
    },
  })

  // Redirect to login if no auth
  useEffect(() => {
    if (!user && !isLoading) router.replace('/login')
  }, [user, isLoading, router])

  if (!user) return null

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-bg">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="h-[100dvh] bg-bg flex flex-col items-center justify-center p-6 gap-6">
        <div className="bg-surface rounded-2xl border border-border p-8 max-w-sm w-full text-center space-y-3">
          <p className="font-display text-2xl text-ink">Nothing to review</p>
          <p className="text-ink-soft text-sm">
            {mode === 'due'
              ? 'No words are due right now. Come back tomorrow!'
              : 'You haven\'t learned any words today yet.'}
          </p>
          <Link
            href="/today"
            className="block w-full py-3 bg-brand text-white rounded-[10px] font-medium hover:bg-brand-strong transition-colors mt-2"
          >
            Back to Today
          </Link>
        </div>
      </div>
    )
  }

  if (isDone) {
    const pct = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0
    return (
      <div className="h-[100dvh] bg-bg flex flex-col items-center justify-center p-6">
        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 max-w-sm w-full text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-success-wash flex items-center justify-center mx-auto">
            <span className="font-display text-2xl text-success">{pct}%</span>
          </div>
          <h1 className="font-display text-3xl text-ink">Session complete!</h1>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-surface-muted rounded-[10px] p-3">
              <div className="font-display text-xl text-ink">{results.total}</div>
              <div className="text-ink-soft text-xs mt-0.5">reviewed</div>
            </div>
            <div className="bg-success-wash rounded-[10px] p-3">
              <div className="font-display text-xl text-success">{results.correct}</div>
              <div className="text-ink-soft text-xs mt-0.5">correct</div>
            </div>
          </div>
          <Link
            href="/today"
            className="block w-full py-3 bg-brand text-white rounded-[10px] font-medium hover:bg-brand-strong transition-colors"
          >
            Back to Today
          </Link>
        </div>
      </div>
    )
  }

  const word = words[currentIndex]
  const progress = (currentIndex / words.length) * 100

  const handleReveal = () => setRevealed(true)

  const handleGrade = async (grade: Grade) => {
    const isCorrect = grade !== 'again'
    setResults(r => ({ correct: r.correct + (isCorrect ? 1 : 0), total: r.total + 1 }))

    submitMutation.mutate({ wordId: word.id, grade })

    if (currentIndex + 1 < words.length) {
      setRevealed(false)
      setCurrentIndex(i => i + 1)
    } else {
      setIsDone(true)
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <Link
          href="/today"
          className="p-2 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-full transition-colors"
        >
          <X size={24} />
        </Link>
        <span className="font-mono text-sm text-ink-soft">
          {currentIndex + 1} / {words.length}
        </span>
        <div className="w-10" />
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-surface-muted flex-none">
        <div
          className="h-full bg-brand transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-xl mx-auto">
        <div
          className="w-full bg-surface rounded-3xl shadow-[0_4px_16px_rgba(16,32,31,.06)] border border-border p-8 md:p-12 min-h-[300px] flex flex-col items-center justify-center text-center relative cursor-pointer"
          onClick={!revealed ? handleReveal : undefined}
        >
          {!revealed ? (
            <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center gap-4">
              <ToneChip tone={word.tone} />
              <h2 className="font-display text-[40px] md:text-[46px] leading-tight text-ink">
                {word.word}
              </h2>
              {word.cluster && (
                <span className="text-xs text-ink-soft bg-surface-muted px-2 py-1 rounded-full">
                  cluster: {word.cluster}
                </span>
              )}
              <p className="text-ink-soft mt-6 text-sm animate-pulse select-none">Tap to reveal</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col items-center w-full gap-4">
              <ToneChip tone={word.tone} />
              <h2 className="font-display text-[32px] leading-tight text-ink">{word.word}</h2>
              <div className="w-full h-px bg-border" />
              <p className="text-lg text-ink leading-relaxed font-medium">{word.meaning}</p>
              {word.example_sentence && (
                <div className="bg-surface-muted p-4 rounded-xl w-full text-left border border-border/50">
                  <p className="text-ink-soft italic text-[15px]">&ldquo;{word.example_sentence}&rdquo;</p>
                </div>
              )}
              {word.gre_context && (
                <p className="text-xs text-ink-soft text-center">{word.gre_context}</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Grade buttons */}
      <footer className="flex-none p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="max-w-xl mx-auto">
          {revealed ? (
            <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {GRADE_CONFIG.map(({ grade, label, hint, cls }) => (
                <button
                  key={grade}
                  onClick={() => handleGrade(grade)}
                  disabled={submitMutation.isPending}
                  className={`flex flex-col items-center justify-center py-3.5 rounded-[12px] border transition-colors disabled:opacity-50 ${cls} hover:opacity-90`}
                >
                  <span className="font-medium text-sm md:text-base">{label}</span>
                  <span className="text-[11px] opacity-70 mt-0.5">{hint}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-[68px]" />
          )}
        </div>
      </footer>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewContent />
    </Suspense>
  )
}
