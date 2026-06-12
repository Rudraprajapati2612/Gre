'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Check, ListChecks, Loader2, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiWords, apiLearnBatch } from '@/lib/api'
import { ToneChip } from '@/components/ToneChip'
import type { WordStatus } from '@/lib/types'
import { Suspense } from 'react'
import Link from 'next/link'

const STATUS_FILTERS: { label: string; value: WordStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Learning', value: 'learning' },
  { label: 'Review', value: 'review' },
  { label: 'Mastered', value: 'mastered' },
]

const STATUS_DOT: Record<WordStatus, string> = {
  new: 'bg-ink-soft/40',
  learning: 'bg-amber',
  review: 'bg-brand',
  mastered: 'bg-success',
}

function WordsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>(
    (searchParams.get('status') as WordStatus) ?? 'all'
  )
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['words', search, statusFilter],
    queryFn: () =>
      apiWords({
        q: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      }),
    staleTime: 30_000,
  })

  const learnMutation = useMutation({
    mutationFn: (ids: string[]) => apiLearnBatch(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['words'] })
      qc.invalidateQueries({ queryKey: ['review-today'] })
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
      setSelected(new Set())
      setIsSelectMode(false)
    },
  })

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 20) next.add(id)
      return next
    })
  }, [])

  const words = data?.words ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500 pb-28">
      {/* Search + select toggle */}
      <div className="sticky top-0 z-10 bg-bg pt-1 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={18} />
            <input
              type="text"
              placeholder="Search words…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-base text-ink placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
            />
          </div>
          <button
            onClick={() => { setIsSelectMode(v => !v); setSelected(new Set()) }}
            className={`p-2.5 rounded-xl transition-colors border ${
              isSelectMode ? 'bg-brand-wash text-brand border-brand/30' : 'bg-surface-muted text-ink-soft border-border hover:bg-border'
            }`}
            aria-label="Toggle select mode"
          >
            <ListChecks size={20} />
          </button>
          <Link
            href="/words/add"
            className="p-2.5 rounded-xl bg-brand text-white border border-brand hover:bg-brand-strong transition-colors"
            aria-label="Add new word"
          >
            <Plus size={20} />
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 gap-2 scrollbar-none">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex-shrink-0 ${
                statusFilter === value
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface border-border text-ink-soft hover:border-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand" size={28} />
        </div>
      )}

      {/* Empty */}
      {!isLoading && words.length === 0 && (
        <div className="text-center py-12 text-ink-soft space-y-2">
          <p className="font-display text-lg text-ink">No words found</p>
          <p className="text-sm">Try a different filter or search term.</p>
        </div>
      )}

      {/* Word list */}
      <div className="space-y-2">
        {words.map((w) => (
          <div
            key={w.id}
            onClick={() => isSelectMode ? toggleSelect(w.id) : router.push(`/words/${w.id}`)}
            className={`bg-surface p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
              isSelectMode && selected.has(w.id)
                ? 'border-brand bg-brand-wash shadow-sm'
                : 'border-border hover:border-ink-soft hover:shadow-sm'
            }`}
          >
            {isSelectMode && (
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selected.has(w.id) ? 'bg-brand border-brand text-white' : 'border-border bg-surface'
              }`}>
                {selected.has(w.id) && <Check size={14} strokeWidth={3} />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="font-display text-xl text-ink truncate">{w.word}</h3>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <ToneChip tone={w.tone} />
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[w.user_status]}`}
                    title={w.user_status}
                  />
                </div>
              </div>
              <p className="text-ink-soft text-[15px] truncate">{w.meaning}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Learn FAB */}
      {isSelectMode && selected.size > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] lg:bottom-12 left-0 right-0 px-4 flex justify-center z-20">
          <button
            onClick={() => learnMutation.mutate(Array.from(selected))}
            disabled={learnMutation.isPending}
            className="bg-brand text-white px-6 py-3.5 rounded-full shadow-lg font-medium flex items-center gap-2 hover:bg-brand-strong transition-colors disabled:opacity-70"
          >
            {learnMutation.isPending
              ? <Loader2 size={18} className="animate-spin" />
              : <Check size={18} />
            }
            Learn today ({selected.size})
          </button>
        </div>
      )}
    </div>
  )
}

export default function WordsPage() {
  return (
    <Suspense>
      <WordsContent />
    </Suspense>
  )
}
