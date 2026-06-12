'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, BookOpen, RotateCcw, Loader2, Trash2, AlertCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWord, apiLearnWord, apiDeleteWord } from '@/lib/api'
import { ToneChip } from '@/components/ToneChip'
import Link from 'next/link'
import type { WordStatus } from '@/lib/types'

const STATUS_LABEL: Record<WordStatus, string> = {
  new: 'Not started',
  learning: 'Learning',
  review: 'In review',
  mastered: 'Mastered',
}

const STATUS_COLORS: Record<WordStatus, string> = {
  new: 'bg-surface-muted text-ink-soft border-border',
  learning: 'bg-amber-wash text-amber border-amber/20',
  review: 'bg-brand-wash text-brand border-brand/20',
  mastered: 'bg-success-wash text-success border-success/20',
}

function accuracy(seen: number | null, wrong: number | null): string {
  if (!seen || seen === 0) return '—'
  const acc = Math.round(((seen - (wrong ?? 0)) / seen) * 100)
  return `${acc}%`
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['word', id],
    queryFn: () => apiWord(id),
  })

  const learnMutation = useMutation({
    mutationFn: () => apiLearnWord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['word', id] })
      qc.invalidateQueries({ queryKey: ['words'] })
      qc.invalidateQueries({ queryKey: ['review-today'] })
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => apiDeleteWord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['words'] })
      router.replace('/words')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle size={40} className="mx-auto text-danger" />
        <p className="font-display text-xl text-ink">Word not found</p>
        <Link href="/words" className="text-brand text-sm hover:underline">
          Back to words
        </Link>
      </div>
    )
  }

  const w = data.word
  const isNew = w.user_status === 'new'

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-500 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 py-1">
        <Link
          href="/words"
          className="p-2 text-ink-soft hover:text-ink hover:bg-surface-muted rounded-full transition-colors"
        >
          <ChevronLeft size={22} />
        </Link>
        <h1 className="font-display text-2xl text-ink flex-1 truncate">{w.word}</h1>
        <ToneChip tone={w.tone} />
      </div>

      {/* Main info card */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {/* Meaning */}
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wider mb-1.5">Meaning</p>
          <p className="text-ink text-[17px] leading-relaxed">{w.meaning}</p>
        </div>

        {/* Example sentence */}
        <div>
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wider mb-1.5">Example</p>
          <p className="text-ink-soft text-[15px] leading-relaxed italic">{w.example_sentence}</p>
        </div>

        {/* GRE context */}
        {w.gre_context && (
          <div>
            <p className="text-xs font-medium text-ink-soft uppercase tracking-wider mb-1.5">GRE Context</p>
            <p className="text-ink text-[15px] leading-relaxed">{w.gre_context}</p>
          </div>
        )}

        {/* Cluster + tone row */}
        <div className="flex items-center gap-3 pt-1 border-t border-border">
          <ToneChip tone={w.tone} />
          {w.cluster && (
            <span className="text-sm text-ink-soft">
              Cluster: <span className="text-ink font-medium">{w.cluster}</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-soft uppercase tracking-wider">Your progress</p>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[w.user_status]}`}>
            {STATUS_LABEL[w.user_status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-ink">{w.times_seen ?? 0}</p>
            <p className="text-xs text-ink-soft mt-0.5">Reviews</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-ink">
              {accuracy(w.times_seen, w.times_wrong)}
            </p>
            <p className="text-xs text-ink-soft mt-0.5">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-semibold text-ink">
              {w.interval_days ?? 0}d
            </p>
            <p className="text-xs text-ink-soft mt-0.5">Interval</p>
          </div>
        </div>

        {!isNew && (
          <div className="pt-2 border-t border-border space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Due date</span>
              <span className="text-ink">{formatDate(w.due_date)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Last reviewed</span>
              <span className="text-ink">{formatDate(w.last_reviewed_at)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Started learning</span>
              <span className="text-ink">{formatDate(w.marked_learning_on)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isNew ? (
          <button
            onClick={() => learnMutation.mutate()}
            disabled={learnMutation.isPending}
            className="w-full bg-brand text-white py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-brand-strong transition-colors disabled:opacity-70"
          >
            {learnMutation.isPending
              ? <Loader2 size={18} className="animate-spin" />
              : <BookOpen size={18} />
            }
            Start learning this word
          </button>
        ) : (
          <Link
            href={`/review?mode=due`}
            className="w-full bg-brand text-white py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-brand-strong transition-colors"
          >
            <RotateCcw size={18} />
            Go to review session
          </Link>
        )}

        <button
          onClick={() => {
            if (confirm(`Delete "${w.word}"? This cannot be undone.`)) {
              deleteMutation.mutate()
            }
          }}
          disabled={deleteMutation.isPending}
          className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 text-danger border border-danger/20 bg-danger-wash hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
        >
          {deleteMutation.isPending
            ? <Loader2 size={16} className="animate-spin" />
            : <Trash2 size={16} />
          }
          Delete word
        </button>
      </div>
    </div>
  )
}
