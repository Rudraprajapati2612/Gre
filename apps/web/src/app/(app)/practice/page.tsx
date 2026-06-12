'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiTC, apiSE, apiSubmitTC, apiSubmitSE } from '@/lib/api'
import { Check, ChevronRight, Loader2 } from 'lucide-react'
import type { TCQuestion, SEQuestion, SubmitTCResult, SubmitSEResult } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'tc' | 'se'

function PracticeContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>((searchParams.get('type') as Tab) ?? 'tc')
  const [tcIndex, setTcIndex] = useState(0)
  const [seIndex, setSeIndex] = useState(0)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Segmented control */}
      <div className="bg-surface-muted rounded-[12px] p-1 flex">
        {(['tc', 'se'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all',
              tab === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
            )}
          >
            {t === 'tc' ? 'Text Completion' : 'Sentence Equivalence'}
          </button>
        ))}
      </div>

      {tab === 'tc' ? (
        <TCPractice index={tcIndex} onNext={() => setTcIndex(i => i + 1)} />
      ) : (
        <SEPractice index={seIndex} onNext={() => setSeIndex(i => i + 1)} />
      )}
    </div>
  )
}

// ─── Text Completion ─────────────────────────────────────────────────────────

function TCPractice({ index, onNext }: { index: number; onNext: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tc-questions'],
    queryFn: () => apiTC({ limit: 50 }),
    staleTime: 60_000,
  })

  const questions = data?.questions ?? []
  const q: TCQuestion | undefined = questions[index % Math.max(questions.length, 1)]

  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<SubmitTCResult | null>(null)

  const submitMutation = useMutation({
    mutationFn: (ans: string[]) => apiSubmitTC(q!.id, ans),
    onSuccess: (data) => setResult(data),
  })

  if (isLoading || !q) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand" size={28} /></div>
  }

  const setAnswer = (blankIdx: number, val: string) => {
    const next = [...answers]
    next[blankIdx] = val
    setAnswers(next)
  }

  const allFilled = answers.filter(Boolean).length === q.blank_count
  const promptParts = q.prompt.split('___')

  const handleNext = () => {
    setResult(null)
    setAnswers([])
    onNext()
  }

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="bg-surface border border-border rounded-[16px] p-6 space-y-4">
        <p className="text-base text-ink leading-relaxed">
          {promptParts.map((part, i) => (
            <span key={i}>
              {part}
              {i < promptParts.length - 1 && (
                <span className={cn(
                  'inline-block min-w-[80px] border-b-2 px-1 mx-1 text-center font-medium text-sm',
                  result
                    ? answers[i] === result.correctAnswers[i]
                      ? 'border-success text-success'
                      : 'border-danger text-danger'
                    : answers[i]
                      ? 'border-brand text-brand'
                      : 'border-ink-soft/40 text-ink-soft'
                )}>
                  {answers[i] || '      '}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Option groups */}
      {!result && q.options.map((opts, blankIdx) => (
        <div key={blankIdx} className="space-y-2">
          <p className="text-xs text-ink-soft font-medium uppercase tracking-wider">
            Blank {q.blank_count > 1 ? blankIdx + 1 : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {opts.map((opt) => (
              <button
                key={opt}
                onClick={() => setAnswer(blankIdx, opt)}
                className={cn(
                  'px-4 py-2 rounded-full border text-sm font-medium transition-all',
                  answers[blankIdx] === opt
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface border-border text-ink hover:border-brand hover:text-brand'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Result */}
      {result && (
        <div className={cn(
          'border rounded-[14px] p-5 space-y-3',
          result.isCorrect ? 'bg-success-wash border-success/30' : 'bg-danger-wash border-danger/30'
        )}>
          <div className="flex items-center gap-2 font-medium">
            {result.isCorrect ? (
              <><Check size={18} className="text-success" /><span className="text-success">Correct!</span></>
            ) : (
              <><span className="text-danger">Not quite.</span><span className="text-ink-soft text-sm">Correct: {result.correctAnswers.join(', ')}</span></>
            )}
          </div>
          {result.explanation && (
            <p className="text-ink-soft text-sm leading-relaxed">{result.explanation}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!result ? (
          <button
            disabled={!allFilled || submitMutation.isPending}
            onClick={() => submitMutation.mutate(answers)}
            className="px-6 py-2.5 bg-brand text-white rounded-[10px] font-medium text-sm hover:bg-brand-strong transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {submitMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Check answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-brand text-white rounded-[10px] font-medium text-sm hover:bg-brand-strong transition-colors flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sentence Equivalence ────────────────────────────────────────────────────

function SEPractice({ index, onNext }: { index: number; onNext: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['se-questions'],
    queryFn: () => apiSE({ limit: 50 }),
    staleTime: 60_000,
  })

  const questions = data?.questions ?? []
  const q: SEQuestion | undefined = questions[index % Math.max(questions.length, 1)]

  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<SubmitSEResult | null>(null)

  const submitMutation = useMutation({
    mutationFn: (ans: string[]) => apiSubmitSE(q!.id, ans),
    onSuccess: (data) => setResult(data),
  })

  if (isLoading || !q) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand" size={28} /></div>
  }

  const toggleOption = (opt: string) => {
    setSelected(prev => {
      if (prev.includes(opt)) return prev.filter(o => o !== opt)
      if (prev.length >= 2) return [prev[1], opt] // deselect oldest
      return [...prev, opt]
    })
  }

  const handleNext = () => {
    setResult(null)
    setSelected([])
    onNext()
  }

  const getChipVariant = (opt: string): string => {
    if (!result) {
      return selected.includes(opt)
        ? 'bg-brand text-white border-brand'
        : 'bg-surface border-border text-ink hover:border-brand hover:text-brand'
    }
    const isCorrect = result.correctAnswers.includes(opt)
    const isSelected = selected.includes(opt)
    if (isSelected && isCorrect) return 'bg-success text-white border-success'
    if (isSelected && !isCorrect) return 'bg-danger text-white border-danger'
    if (!isSelected && isCorrect) return 'bg-surface-muted border-success text-success'
    return 'bg-surface border-border text-ink-soft opacity-60'
  }

  return (
    <div className="space-y-5">
      {/* Prompt */}
      <div className="bg-surface border border-border rounded-[16px] p-6">
        <p className="text-base text-ink leading-relaxed">
          {q.prompt.replace('___', (selected.length > 0 ? selected.join(' / ') : '______'))}
        </p>
        <p className="text-xs text-ink-soft mt-3">Pick exactly 2 words that produce equivalent sentences.</p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => !result && toggleOption(opt)}
            disabled={!!result}
            className={cn(
              'px-4 py-3 rounded-[12px] border text-sm font-medium transition-all text-left',
              getChipVariant(opt)
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className={cn(
          'border rounded-[14px] p-5 space-y-3',
          result.isCorrect ? 'bg-success-wash border-success/30' : 'bg-danger-wash border-danger/30'
        )}>
          <div className="flex items-center gap-2 font-medium">
            {result.isCorrect ? (
              <><Check size={18} className="text-success" /><span className="text-success">Correct!</span></>
            ) : (
              <><span className="text-danger">Not quite.</span><span className="text-ink-soft text-sm">Correct pair: {result.correctAnswers.join(' + ')}</span></>
            )}
          </div>
          {result.explanation && (
            <p className="text-ink-soft text-sm leading-relaxed">{result.explanation}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!result ? (
          <button
            disabled={selected.length !== 2 || submitMutation.isPending}
            onClick={() => submitMutation.mutate(selected)}
            className="px-6 py-2.5 bg-brand text-white rounded-[10px] font-medium text-sm hover:bg-brand-strong transition-colors disabled:opacity-40 flex items-center gap-2"
          >
            {submitMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Check answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-brand text-white rounded-[10px] font-medium text-sm hover:bg-brand-strong transition-colors flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function PracticePage() {
  return (
    <Suspense>
      <PracticeContent />
    </Suspense>
  )
}
