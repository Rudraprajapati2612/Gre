'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Volume2, RotateCcw, Loader2,
  ChevronDown, Shuffle, CheckCircle2, XCircle, Circle,
  Keyboard, X, Mountain, RotateCw,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiMountainGroups, apiMountainGroup, apiMountainMark,
  apiMountainStartGroup, apiMountainResetGroup, apiMountainNote,
} from '@/lib/api'
import { ToneChip } from '@/components/ToneChip'
import type { Word, MountainGroup } from '@/lib/types'

type Filter = 'all' | 'forgotten' | 'unseen'
type Order  = 'default' | 'shuffle'

const MARK_DOT: Record<'knew' | 'forgot' | 'unseen', { cls: string; Icon: typeof Circle; label: string }> = {
  knew:   { cls: 'text-success',      Icon: CheckCircle2, label: 'Knew' },
  forgot: { cls: 'text-danger',       Icon: XCircle,      label: 'Forgot' },
  unseen: { cls: 'text-ink-soft/40',  Icon: Circle,       label: 'Unseen' },
}

export function MountainView() {
  const qc = useQueryClient()

  const { data: groupsData, isLoading: loadingGroups } = useQuery({
    queryKey: ['mountain-groups'],
    queryFn: apiMountainGroups,
    staleTime: 30_000,
  })

  const groups: MountainGroup[] = groupsData?.groups ?? []
  const totalGroups = groups.length

  const [currentGroup, setCurrentGroup] = useState(1)
  const [filter, setFilter]             = useState<Filter>('all')
  const [order, setOrder]               = useState<Order>('default')
  const [activeIdx, setActiveIdx]       = useState(0)
  const [revealedIds, setRevealedIds]   = useState<Set<string>>(new Set())
  const [showHints, setShowHints]       = useState(true)

  // ── Session queue (adds re-queued words to end) ─────────────────────────
  const [sessionQueue, setSessionQueue]         = useState<Word[]>([])
  const [requeuedIds, setRequeuedIds]           = useState<Set<string>>(new Set())
  const [originalQueueLength, setOriginalQueueLength] = useState(0)
  const sessionKeyRef = useRef('')

  // ── Personal notes ───────────────────────────────────────────────────────
  const [noteValues, setNoteValues] = useState<Record<string, string>>({})

  // Sync to most advanced started group on first load
  useEffect(() => {
    if (groups.length > 0 && currentGroup === 1) {
      const started = groups.find(g => g.knew_count > 0 || g.forgot_count > 0)
      if (started) setCurrentGroup(started.group_number)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length])

  const { data: groupData, isLoading: loadingWords } = useQuery({
    queryKey: ['mountain-group', currentGroup, filter, order],
    queryFn: () => apiMountainGroup(currentGroup, { filter, order }),
    staleTime: 10_000,
    enabled: totalGroups > 0 || !loadingGroups,
  })

  const words: Word[] = groupData?.words ?? []

  // Initialize (or reset) the session queue whenever group / filter / order changes.
  // Deliberately NOT reset when words refresh after a mark — that would wipe re-queued entries.
  const sessionKey = `${currentGroup}-${filter}-${order}`
  useEffect(() => {
    if (loadingWords || words.length === 0) return
    if (sessionKey === sessionKeyRef.current) return
    sessionKeyRef.current = sessionKey
    setSessionQueue([...words])
    setOriginalQueueLength(words.length)
    setRequeuedIds(new Set())
    setActiveIdx(0)
    setRevealedIds(new Set())
    const notes: Record<string, string> = {}
    words.forEach(w => { notes[w.id] = w.user_note ?? '' })
    setNoteValues(notes)
  }, [sessionKey, loadingWords, words])

  // Keep activeIdx in bounds if sessionQueue shrinks
  useEffect(() => {
    if (activeIdx >= sessionQueue.length && sessionQueue.length > 0) {
      setActiveIdx(sessionQueue.length - 1)
    }
  }, [sessionQueue.length, activeIdx])

  const startMutation = useMutation({
    mutationFn: (n: number) => apiMountainStartGroup(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mountain-groups'] })
      qc.invalidateQueries({ queryKey: ['mountain-group', currentGroup] })
    },
  })

  const markMutation = useMutation({
    mutationFn: ({ wordId, mark }: { wordId: string; mark: 'knew' | 'forgot' }) =>
      apiMountainMark(wordId, mark),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mountain-groups'] })
      qc.invalidateQueries({ queryKey: ['mountain-group', currentGroup] })
      qc.invalidateQueries({ queryKey: ['progress-summary'] })
    },
  })

  const noteMutation = useMutation({
    mutationFn: ({ wordId, note }: { wordId: string; note: string }) =>
      apiMountainNote(wordId, note),
  })

  const resetMutation = useMutation({
    mutationFn: (n: number) => apiMountainResetGroup(n),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mountain-groups'] })
      qc.invalidateQueries({ queryKey: ['mountain-group', currentGroup] })
      // Force session reset on next render
      sessionKeyRef.current = ''
    },
  })

  const activeWord = sessionQueue[activeIdx] ?? null

  const toggleReveal = useCallback((id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const speak = useCallback((text: string) => {
    const utter = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [])

  const handleMark = useCallback((wordId: string, mark: 'knew' | 'forgot') => {
    markMutation.mutate({ wordId, mark })

    const willRequeue = mark === 'forgot' && !requeuedIds.has(wordId)

    if (willRequeue) {
      const word = sessionQueue.find(w => w.id === wordId)
      if (word) {
        // Append a fresh copy at the end; update original mark in place
        setSessionQueue(q => [
          ...q.map(w => w.id === wordId ? { ...w, last_mark: mark } : w),
          { ...word, last_mark: null },
        ])
        setRequeuedIds(prev => new Set([...prev, wordId]))
      }
    } else {
      setSessionQueue(q => q.map(w => w.id === wordId ? { ...w, last_mark: mark } : w))
    }

    // Close revealed state — re-queued copy will appear fresh
    setRevealedIds(prev => { const n = new Set(prev); n.delete(wordId); return n })

    // Advance; allow landing on the newly appended re-queued slot
    setActiveIdx(i => Math.min(i + 1, sessionQueue.length - 1 + (willRequeue ? 1 : 0)))
  }, [markMutation, sessionQueue, requeuedIds])

  const handleNoteSave = useCallback((wordId: string, originalNote: string | null) => {
    const current = noteValues[wordId] ?? ''
    if (current !== (originalNote ?? '')) {
      noteMutation.mutate({ wordId, note: current })
    }
  }, [noteMutation, noteValues])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault()
          setActiveIdx(i => Math.min(i + 1, sessionQueue.length - 1))
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault()
          setActiveIdx(i => Math.max(i - 1, 0))
          break
        case 'd': case 'D':
          if (activeWord) toggleReveal(activeWord.id)
          break
        case 'g': case 'G':
          if (activeWord) handleMark(activeWord.id, 'knew')
          break
        case 'r': case 'R':
          if (activeWord) handleMark(activeWord.id, 'forgot')
          break
        case 's': case 'S':
          if (activeWord) speak(activeWord.word)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeWord, sessionQueue.length, toggleReveal, handleMark, speak])

  // Scroll active card into view
  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeIdx])

  const currentGroupMeta   = groups.find(g => g.group_number === currentGroup)
  const knewCount          = currentGroupMeta?.knew_count   ?? 0
  const forgotCount        = currentGroupMeta?.forgot_count ?? 0
  const totalCount         = currentGroupMeta?.word_count   ?? words.length
  const markedCount        = knewCount + forgotCount
  const progressPct        = totalCount > 0 ? (markedCount / totalCount) * 100 : 0
  const isGroupStarted     = (currentGroupMeta?.knew_count ?? 0) + (currentGroupMeta?.forgot_count ?? 0) > 0
  const requeueCount       = sessionQueue.length - originalQueueLength

  if (loadingGroups) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Mountain size={40} className="mx-auto text-ink-soft/40" />
        <p className="font-display text-xl text-ink">No groups yet</p>
        <p className="text-ink-soft text-sm">
          Run <code className="bg-surface-muted px-1.5 py-0.5 rounded text-xs">bun run seed</code> to load the 244-word Mountain.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300">

      {/* Day selector */}
      <div className="flex items-center justify-between gap-3 py-1">
        <button
          onClick={() => setCurrentGroup(g => Math.max(g - 1, 1))}
          disabled={currentGroup <= 1}
          className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <p className="font-display text-xl text-ink">
            Group {currentGroup}
            <span className="text-ink-soft text-base font-sans font-normal"> of {totalGroups}</span>
          </p>
          {currentGroupMeta && (
            <p className="text-xs text-ink-soft mt-0.5">
              {knewCount} knew · {forgotCount} forgot · {(currentGroupMeta.unseen_count ?? 0)} unseen
              {requeueCount > 0 && (
                <span className="ml-1.5 text-amber">· {requeueCount} retry</span>
              )}
            </p>
          )}
        </div>

        <button
          onClick={() => setCurrentGroup(g => Math.min(g + 1, totalGroups))}
          disabled={currentGroup >= totalGroups}
          className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
        <div className="relative flex-shrink-0">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as Filter)}
            className="appearance-none bg-surface-muted border border-border rounded-xl pl-3 pr-7 py-2 text-sm text-ink cursor-pointer outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="all">Show all</option>
            <option value="forgotten">Forgotten only</option>
            <option value="unseen">Unseen only</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
        </div>

        <button
          onClick={() => setOrder(o => o === 'default' ? 'shuffle' : 'default')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors flex-shrink-0 ${
            order === 'shuffle'
              ? 'bg-brand-wash text-brand border-brand/30'
              : 'bg-surface-muted text-ink-soft border-border hover:border-ink-soft'
          }`}
        >
          <Shuffle size={14} />
          {order === 'shuffle' ? 'Shuffled' : 'Ordered'}
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowHints(v => !v)}
          className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors flex-shrink-0 border border-border"
        >
          <Keyboard size={16} />
        </button>

        <button
          onClick={() => {
            if (window.confirm(`Reset all marks for Group ${currentGroup}?`)) {
              resetMutation.mutate(currentGroup)
            }
          }}
          disabled={resetMutation.isPending}
          className="p-2 rounded-xl text-ink-soft hover:text-danger hover:bg-danger-wash transition-colors flex-shrink-0 border border-border"
        >
          {resetMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
        </button>
      </div>

      {/* Keyboard shortcuts */}
      {showHints && (
        <div className="bg-surface-muted border border-border rounded-xl p-3 flex items-start gap-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1 text-xs text-ink-soft">
            <span><kbd className="bg-surface border border-border rounded px-1 font-mono">G</kbd> Knew + advance</span>
            <span><kbd className="bg-surface border border-border rounded px-1 font-mono">R</kbd> Forgot + re-queue</span>
            <span><kbd className="bg-surface border border-border rounded px-1 font-mono">D</kbd> Toggle definition</span>
            <span><kbd className="bg-surface border border-border rounded px-1 font-mono">S</kbd> Speak aloud</span>
            <span><kbd className="bg-surface border border-border rounded px-1 font-mono">↑↓</kbd> Navigate</span>
          </div>
          <button onClick={() => setShowHints(false)} className="text-ink-soft hover:text-ink flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Start group CTA */}
      {!isGroupStarted && !loadingWords && words.length > 0 && (
        <button
          onClick={() => startMutation.mutate(currentGroup)}
          disabled={startMutation.isPending}
          className="w-full py-3 bg-brand text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-brand-strong transition-colors disabled:opacity-70"
        >
          {startMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mountain size={16} />}
          Start climbing Group {currentGroup}
        </button>
      )}

      {loadingWords && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand" size={24} />
        </div>
      )}

      {!loadingWords && sessionQueue.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-success" />
          <p className="font-display text-lg text-ink">
            {filter === 'forgotten' ? 'No forgotten words — you know them all!' :
             filter === 'unseen'    ? 'No unseen words left — group complete!' :
             'No words in this group yet'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-brand text-sm hover:underline">
              Show all words
            </button>
          )}
        </div>
      )}

      {/* Word list (uses sessionQueue — includes re-queued entries at end) */}
      <div className="space-y-2 pb-24">
        {sessionQueue.map((w, idx) => {
          const isActive    = idx === activeIdx
          const isRevealed  = revealedIds.has(w.id + '-' + idx) || (revealedIds.has(w.id) && idx < originalQueueLength)
          const isRequeued  = idx >= originalQueueLength
          const markState   = isRequeued ? 'unseen' : (w.last_mark ?? 'unseen')
          const { cls: dotCls, Icon: DotIcon } = MARK_DOT[markState]

          // Use composite key so re-queued copy renders as a separate card
          const cardKey = `${w.id}-${idx}`

          return (
            <div
              key={cardKey}
              ref={isActive ? activeRef : undefined}
              onClick={() => {
                setActiveIdx(idx)
                // Use per-slot reveal tracking for re-queued words
                setRevealedIds(prev => {
                  const next = new Set(prev)
                  const key = isRequeued ? `${w.id}-${idx}` : w.id
                  next.has(key) ? next.delete(key) : next.add(key)
                  return next
                })
              }}
              className={`bg-surface border rounded-2xl transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? 'border-brand shadow-[0_0_0_2px_rgba(14,124,123,0.15)] ring-1 ring-brand/20'
                  : 'border-border hover:border-ink-soft/50'
              } ${isRequeued ? 'border-dashed' : ''}`}
            >
              {/* Word header */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                <DotIcon size={16} className={`flex-shrink-0 ${dotCls}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-[19px] text-ink">{w.word}</span>
                    {isRequeued && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber bg-amber-wash px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <RotateCw size={9} />
                        retry
                      </span>
                    )}
                    {w.synonyms && w.synonyms.length > 0 && (
                      <span className="text-xs text-ink-soft bg-surface-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                        +{w.synonyms.length}
                      </span>
                    )}
                  </div>
                  {!isRevealed && (
                    <p className="text-ink-soft text-sm truncate mt-0.5">{w.meaning}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <ToneChip tone={w.tone} />
                  <button
                    onClick={e => { e.stopPropagation(); speak(w.word) }}
                    className="p-1.5 rounded-lg text-ink-soft hover:text-brand hover:bg-brand-wash transition-colors"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>

              {/* Revealed definition */}
              {isRevealed && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-ink text-[16px] leading-relaxed font-medium">{w.meaning}</p>

                  <div className="bg-surface-muted rounded-xl p-3 space-y-2 border border-border/50">
                    <p className="text-ink-soft text-[14px] italic leading-relaxed">
                      &ldquo;{w.example_sentence}&rdquo;
                    </p>
                    {w.example_sentence_2 && (
                      <p className="text-ink-soft text-[14px] italic leading-relaxed border-t border-border/50 pt-2">
                        &ldquo;{w.example_sentence_2}&rdquo;
                      </p>
                    )}
                  </div>

                  {(w.synonyms?.length || w.antonyms?.length) && (
                    <div className="grid grid-cols-2 gap-2">
                      {w.synonyms && w.synonyms.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-ink-soft uppercase tracking-wide">Synonyms</p>
                          <div className="flex flex-wrap gap-1">
                            {w.synonyms.map(s => (
                              <span key={s} className="text-xs text-brand bg-brand-wash px-2 py-0.5 rounded-full">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {w.antonyms && w.antonyms.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-ink-soft uppercase tracking-wide">Antonyms</p>
                          <div className="flex flex-wrap gap-1">
                            {w.antonyms.map(a => (
                              <span key={a} className="text-xs text-danger bg-danger-wash px-2 py-0.5 rounded-full">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {w.gre_context && (
                    <div className="bg-surface-muted border border-border/50 rounded-lg px-3 py-2">
                      <p className="text-[10px] font-medium text-ink-soft uppercase tracking-wide mb-1">Memory trick</p>
                      <p className="text-xs text-ink leading-relaxed">{w.gre_context}</p>
                    </div>
                  )}

                  {/* Personal note */}
                  <div className="space-y-1.5" onClick={e => e.stopPropagation()}>
                    <p className="text-xs font-medium text-ink-soft">My note</p>
                    <textarea
                      value={noteValues[w.id] ?? ''}
                      onChange={e => setNoteValues(prev => ({ ...prev, [w.id]: e.target.value }))}
                      onBlur={() => handleNoteSave(w.id, w.user_note)}
                      placeholder="Your own sentence, Hindi meaning, memory trick…"
                      rows={2}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 resize-none outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
                    />
                  </div>

                  {/* Mark buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={e => { e.stopPropagation(); handleMark(w.id, 'knew') }}
                      disabled={markMutation.isPending}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-success-wash text-success border border-success/20 hover:bg-success hover:text-white transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      Knew <kbd className="text-[10px] opacity-60 font-mono">(G)</kbd>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleMark(w.id, 'forgot') }}
                      disabled={markMutation.isPending}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-danger-wash text-danger border border-danger/20 hover:bg-danger hover:text-white transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Forgot <kbd className="text-[10px] opacity-60 font-mono">(R)</kbd>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
