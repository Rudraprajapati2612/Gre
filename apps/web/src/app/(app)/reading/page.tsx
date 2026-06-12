'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRC, apiRCPassage, apiSubmitRC } from '@/lib/api'
import { Check, ChevronLeft, Loader2 } from 'lucide-react'
import type { RCPassageDetail, SubmitRCResult } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function ReadingPage() {
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null)

  if (selectedPassageId) {
    return (
      <PassageView
        passageId={selectedPassageId}
        onBack={() => setSelectedPassageId(null)}
      />
    )
  }

  return <PassageList onSelect={setSelectedPassageId} />
}

function PassageList({ onSelect }: { onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rc-passages'],
    queryFn: () => apiRC({ limit: 20 }),
    staleTime: 60_000,
  })

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand" size={28} /></div>
  }

  const passages = data?.passages ?? []

  const SUBJECT_CHIP: Record<string, string> = {
    science: 'bg-brand-wash text-brand',
    humanities: 'bg-amber-wash text-amber',
    social_science: 'bg-success-wash text-success',
    business: 'bg-surface-muted text-ink-soft',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
      <h2 className="font-display text-xl text-ink">Reading Passages</h2>

      {passages.length === 0 ? (
        <div className="text-center py-12 text-ink-soft">
          <p className="font-display text-lg text-ink">No passages yet</p>
          <p className="text-sm mt-1">Check back after seeding content.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {passages.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full bg-surface border border-border rounded-[16px] p-5 text-left hover:border-brand hover:shadow-md transition-all group space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg text-ink group-hover:text-brand transition-colors leading-tight">
                  {p.title ?? 'Untitled passage'}
                </h3>
                {p.subject && (
                  <span className={cn(
                    'flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize',
                    SUBJECT_CHIP[p.subject] ?? 'bg-surface-muted text-ink-soft'
                  )}>
                    {p.subject.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-soft">
                {p.question_count} question{p.question_count !== 1 ? 's' : ''}
                {p.paragraph_count ? ` · ${p.paragraph_count} paragraphs` : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PassageView({ passageId, onBack }: { passageId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rc-passage', passageId],
    queryFn: () => apiRCPassage(passageId),
    staleTime: 60_000,
  })

  const [results, setResults] = useState<Record<string, SubmitRCResult>>({})
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})

  const submitMutation = useMutation({
    mutationFn: ({ qId, idx }: { qId: string; idx: number }) => apiSubmitRC(qId, idx),
    onSuccess: (data, vars) => setResults(r => ({ ...r, [vars.qId]: data })),
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand" size={28} /></div>
  }

  const passage: RCPassageDetail = data.passage

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors text-sm mb-6"
      >
        <ChevronLeft size={18} />
        All passages
      </button>

      <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-8 space-y-8 lg:space-y-0">
        {/* Passage */}
        <div className="space-y-4">
          {passage.title && (
            <h2 className="font-display text-2xl text-ink">{passage.title}</h2>
          )}
          <div className="prose-reading text-[17px] leading-[1.75] text-ink whitespace-pre-wrap">
            {passage.body}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {passage.questions.map((q, qi) => {
            const result = results[q.id]
            const selected = selectedAnswers[q.id] ?? -1

            return (
              <div key={q.id} className="bg-surface border border-border rounded-[16px] p-5 space-y-4">
                <p className="text-sm font-medium text-ink leading-snug">
                  <span className="text-ink-soft mr-2">{qi + 1}.</span>
                  {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    let variant = 'bg-surface border-border text-ink hover:border-brand'
                    if (result) {
                      if (idx === result.correctIndex) variant = 'bg-success-wash border-success/30 text-ink'
                      else if (idx === selected && idx !== result.correctIndex) variant = 'bg-danger-wash border-danger/30 text-ink'
                      else variant = 'bg-surface border-border text-ink-soft opacity-60'
                    } else if (idx === selected) {
                      variant = 'bg-brand-wash border-brand text-ink'
                    }

                    return (
                      <button
                        key={idx}
                        disabled={!!result}
                        onClick={() => setSelectedAnswers(s => ({ ...s, [q.id]: idx }))}
                        className={cn('w-full text-left px-4 py-3 rounded-[10px] border text-sm transition-all', variant)}
                      >
                        <span className="font-medium text-ink-soft mr-2">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                        {result && idx === result.correctIndex && (
                          <Check size={14} className="inline ml-2 text-success" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Submit / result */}
                {!result ? (
                  <button
                    disabled={selected === -1 || submitMutation.isPending}
                    onClick={() => submitMutation.mutate({ qId: q.id, idx: selected })}
                    className="w-full py-2.5 bg-brand text-white rounded-[10px] text-sm font-medium hover:bg-brand-strong transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    Check
                  </button>
                ) : (
                  <div className={cn(
                    'text-sm rounded-[10px] px-4 py-3 leading-relaxed',
                    result.isCorrect ? 'bg-success-wash text-success' : 'bg-danger-wash text-danger'
                  )}>
                    {result.isCorrect ? '✓ Correct. ' : '✗ Incorrect. '}
                    {result.explanation && (
                      <span className="text-ink-soft">{result.explanation}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
