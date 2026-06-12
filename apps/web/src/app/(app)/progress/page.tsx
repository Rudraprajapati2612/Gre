'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiProgressSummary, apiWeakWords, apiScores } from '@/lib/api'
import { Flame, Loader2, TrendingUp } from 'lucide-react'
import { ToneChip } from '@/components/ToneChip'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { Section } from '@/lib/types'

const SECTION_TABS: { label: string; value: Section | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Vocab', value: 'vocab' },
  { label: 'TC', value: 'tc' },
  { label: 'SE', value: 'se' },
  { label: 'RC', value: 'rc' },
]

export default function ProgressPage() {
  const [scoreSection, setScoreSection] = useState<Section | 'all'>('all')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: apiProgressSummary,
    staleTime: 30_000,
  })

  const { data: weakData } = useQuery({
    queryKey: ['weak-words'],
    queryFn: apiWeakWords,
    staleTime: 60_000,
  })

  const { data: scoresData } = useQuery({
    queryKey: ['scores', scoreSection],
    queryFn: () => apiScores({
      section: scoreSection === 'all' ? undefined : scoreSection,
      granularity: 'day',
    }),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    )
  }

  const scores = scoresData?.scores ?? []
  const chartData = scores.map(s => ({
    period: s.period.slice(5), // MM-DD
    accuracy: Math.round(s.accuracy * 100),
  }))

  const weakWords = weakData?.words ?? []
  const masteredPct = summary && summary.totalWords > 0
    ? Math.round((summary.masteredCount / summary.totalWords) * 100)
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Streak */}
        <div className="bg-surface border border-border rounded-[16px] p-4 flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-1 text-amber">
            <Flame size={18} fill="currentColor" />
          </div>
          <span className="font-display text-3xl text-ink">{summary?.streakDays ?? 0}</span>
          <span className="text-xs text-ink-soft">day streak</span>
        </div>

        {/* Mastered */}
        <div className="bg-surface border border-border rounded-[16px] p-4 flex flex-col items-center text-center gap-1.5">
          <span className="font-display text-3xl text-ink">{summary?.masteredCount ?? 0}</span>
          <span className="text-xs text-ink-soft">mastered</span>
          <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${masteredPct}%` }} />
          </div>
          <span className="text-[11px] text-ink-soft">{masteredPct}% of {summary?.totalWords ?? 0}</span>
        </div>

        {/* Due today */}
        <div className="bg-surface border border-border rounded-[16px] p-4 flex flex-col items-center text-center gap-1.5">
          <span className="font-display text-3xl text-ink">{summary?.dueTodayCount ?? 0}</span>
          <span className="text-xs text-ink-soft">due today</span>
        </div>
      </div>

      {/* Scores chart */}
      <div className="bg-surface border border-border rounded-[16px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink flex items-center gap-2">
            <TrendingUp size={18} className="text-brand" />
            Accuracy over time
          </h3>
        </div>

        {/* Section filter */}
        <div className="flex gap-1.5 flex-wrap">
          {SECTION_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setScoreSection(value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                scoreSection === value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-muted border-border text-ink-soft hover:border-brand hover:text-brand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Accuracy']}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="var(--brand)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-ink-soft text-sm">
            No data yet — complete some practice sessions to see trends.
          </div>
        )}
      </div>

      {/* Weak words */}
      {weakWords.length > 0 && (
        <div className="bg-surface border border-border rounded-[16px] p-5 space-y-4">
          <h3 className="font-display text-lg text-ink">Weak words</h3>
          <div className="space-y-2">
            {weakWords.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base text-ink">{w.word}</span>
                    <ToneChip tone={w.tone} />
                  </div>
                  <p className="text-ink-soft text-sm truncate">{w.meaning}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    w.accuracy < 0.5 ? 'text-danger' : w.accuracy < 0.75 ? 'text-amber' : 'text-success'
                  }`}>
                    {Math.round(w.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-ink-soft">{w.times_wrong} wrong</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
