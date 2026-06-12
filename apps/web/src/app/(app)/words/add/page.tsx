'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Loader2, CheckCircle } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiCreateWord, apiAdminClusters } from '@/lib/api'
import Link from 'next/link'
import type { Tone } from '@/lib/types'

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Academic / professional' },
  { value: 'neutral', label: 'Neutral', description: 'Neither positive nor negative' },
  { value: 'positive', label: 'Positive', description: 'Favorable connotation' },
  { value: 'negative', label: 'Negative', description: 'Unfavorable connotation' },
  { value: 'informal', label: 'Informal', description: 'Casual / colloquial' },
]

export default function AddWordPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [tone, setTone] = useState<Tone>('neutral')
  const [example, setExample] = useState('')
  const [greContext, setGreContext] = useState('')
  const [cluster, setCluster] = useState('')
  const [clusterInput, setClusterInput] = useState('')
  const [showClusterSuggestions, setShowClusterSuggestions] = useState(false)
  const [success, setSuccess] = useState(false)

  const { data: clustersData } = useQuery({
    queryKey: ['admin-clusters'],
    queryFn: apiAdminClusters,
    staleTime: 60_000,
  })

  const clusters = clustersData?.clusters ?? []
  const filteredClusters = clusterInput
    ? clusters.filter(c => c.toLowerCase().includes(clusterInput.toLowerCase()))
    : clusters

  const mutation = useMutation({
    mutationFn: () =>
      apiCreateWord({
        word: word.trim(),
        meaning: meaning.trim(),
        tone,
        example_sentence: example.trim(),
        gre_context: greContext.trim() || undefined,
        cluster: cluster.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['words'] })
      qc.invalidateQueries({ queryKey: ['admin-clusters'] })
      setSuccess(true)
      setTimeout(() => {
        router.push('/words')
      }, 1500)
    },
  })

  const canSubmit = word.trim() && meaning.trim() && example.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || mutation.isPending) return
    mutation.mutate()
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-success-wash flex items-center justify-center">
          <CheckCircle size={32} className="text-success" />
        </div>
        <p className="font-display text-2xl text-ink">Word added!</p>
        <p className="text-ink-soft text-sm">Redirecting to words list…</p>
      </div>
    )
  }

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
        <h1 className="font-display text-2xl text-ink">Add new word</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Word */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            Word <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder="e.g. aberrant"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-ink font-display text-lg placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {/* Meaning */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            Meaning <span className="text-danger">*</span>
          </label>
          <textarea
            value={meaning}
            onChange={e => setMeaning(e.target.value)}
            placeholder="Define the word clearly and concisely…"
            rows={2}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-ink text-[15px] placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all resize-none"
          />
        </div>

        {/* Tone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            Tone <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TONES.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                  tone === value
                    ? 'bg-brand-wash border-brand text-brand'
                    : 'bg-surface border-border text-ink-soft hover:border-ink-soft hover:text-ink'
                }`}
              >
                <p className="text-sm font-medium">{label}</p>
                <p className="text-[11px] opacity-70 mt-0.5">{description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Example sentence */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            Example sentence <span className="text-danger">*</span>
          </label>
          <textarea
            value={example}
            onChange={e => setExample(e.target.value)}
            placeholder="Use the word in a natural sentence…"
            rows={2}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-ink text-[15px] placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all resize-none"
          />
        </div>

        {/* GRE Context (optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            GRE Context <span className="text-ink-soft/50 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={greContext}
            onChange={e => setGreContext(e.target.value)}
            placeholder="How does this word typically appear on the GRE?"
            rows={2}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-ink text-[15px] placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all resize-none"
          />
        </div>

        {/* Cluster (optional, with autocomplete) */}
        <div className="space-y-1.5 relative">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wider">
            Cluster <span className="text-ink-soft/50 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={clusterInput}
            onChange={e => {
              setClusterInput(e.target.value)
              setCluster(e.target.value)
              setShowClusterSuggestions(true)
            }}
            onFocus={() => setShowClusterSuggestions(true)}
            onBlur={() => setTimeout(() => setShowClusterSuggestions(false), 150)}
            placeholder="e.g. academic, behavior, ethics…"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-ink text-[15px] placeholder:text-ink-soft/50 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
          />
          {showClusterSuggestions && filteredClusters.length > 0 && (
            <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {filteredClusters.map(c => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={() => {
                    setCluster(c)
                    setClusterInput(c)
                    setShowClusterSuggestions(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-surface-muted transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {mutation.error && (
          <div className="bg-danger-wash border border-danger/20 rounded-xl p-3 text-danger text-sm">
            {(mutation.error as any)?.error?.message ?? 'Failed to add word. Please try again.'}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className="w-full bg-brand text-white py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-brand-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          {mutation.isPending ? 'Adding…' : 'Add word'}
        </button>
      </form>
    </div>
  )
}
