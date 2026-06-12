'use client'

import { useQuery } from '@tanstack/react-query'
import { apiProgressSummary, apiReviewDue, apiReviewToday } from '@/lib/api'
import { ProgressRing } from '@/components/ProgressRing'
import { ChevronRight, Zap, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TodayPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: apiProgressSummary,
    staleTime: 30_000,
  })

  const { data: dueData } = useQuery({
    queryKey: ['review-due'],
    queryFn: apiReviewDue,
    staleTime: 30_000,
  })

  const { data: todayData } = useQuery({
    queryKey: ['review-today'],
    queryFn: apiReviewToday,
    staleTime: 30_000,
  })

  const dueCount = dueData?.words?.length ?? 0
  const todayCount = todayData?.words?.length ?? 0
  const totalDue = dueCount + todayCount
  const doneSoFar = (summary?.masteredCount ?? 0) > 0 ? Math.min(totalDue, summary?.reviewCount ?? 0) : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    )
  }

  const hasAnything = dueCount > 0 || todayCount > 0

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Progress ring */}
      <section className="bg-surface rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center">
        <h2 className="font-display text-lg text-ink text-center mb-1">Today&apos;s Progress</h2>
        <ProgressRing
          due={totalDue > 0 ? totalDue : 20}
          done={doneSoFar}
        />
        {totalDue > 0 ? (
          <p className="text-ink-soft text-sm text-center">
            {totalDue - doneSoFar} word{totalDue - doneSoFar !== 1 ? 's' : ''} left to review
          </p>
        ) : (
          <p className="text-ink-soft text-sm text-center">
            {summary?.masteredCount ?? 0} words mastered so far
          </p>
        )}
      </section>

      {/* Action cards */}
      <section className="space-y-3">
        {!hasAnything ? (
          <div className="bg-surface border border-border rounded-[12px] p-6 text-center space-y-3">
            <p className="font-display text-xl text-ink">You&apos;re clear for today!</p>
            <p className="text-ink-soft text-sm">Learn 20 new words to stay ahead of the forgetting curve.</p>
            <Link
              href="/words?status=new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-[10px] text-sm font-medium hover:bg-brand-strong transition-colors mt-1"
            >
              <BookOpen size={16} />
              Learn new words
            </Link>
          </div>
        ) : (
          <>
            {dueCount > 0 && (
              <Link
                href="/review?mode=due"
                className="group block bg-surface border border-border hover:border-brand rounded-[12px] p-4 md:p-5 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg text-ink mb-1 group-hover:text-brand transition-colors">
                      Review due ({dueCount})
                    </h3>
                    <p className="text-sm text-ink-soft">Words scheduled for today</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-brand-wash flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            )}

            {todayCount > 0 && (
              <Link
                href="/review?mode=today"
                className="group block bg-surface border border-border hover:border-amber rounded-[12px] p-4 md:p-5 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber" />
                <div className="flex items-center justify-between pl-1">
                  <div>
                    <h3 className="font-display text-lg text-ink mb-1 group-hover:text-amber transition-colors">
                      Tonight&apos;s quiz ({todayCount})
                    </h3>
                    <p className="text-sm text-ink-soft">Words you learned today</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-wash flex items-center justify-center text-amber group-hover:bg-amber group-hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </Link>
            )}

            <Link
              href="/words?status=new"
              className="group block bg-surface border border-border hover:border-ink-soft rounded-[12px] p-4 md:p-5 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg text-ink mb-1">Learn new words</h3>
                  <p className="text-sm text-ink-soft">Expand your vocabulary</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-surface-muted flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </div>
              </div>
            </Link>
          </>
        )}
      </section>

      {/* Stats row */}
      {summary && (
        <section className="grid grid-cols-3 gap-3">
          {[
            { label: 'Mastered', value: summary.masteredCount },
            { label: 'Learning', value: summary.learningCount },
            { label: 'In review', value: summary.reviewCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-[12px] p-3 text-center">
              <div className="font-display text-2xl text-ink">{value}</div>
              <div className="text-xs text-ink-soft mt-0.5">{label}</div>
            </div>
          ))}
        </section>
      )}

      {/* Quick practice */}
      <section className="space-y-4">
        <h3 className="font-display text-lg text-ink flex items-center gap-2">
          <Zap size={18} className="text-brand" />
          Quick Practice
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['tc', 'se', 'rc'] as const).map((type) => (
            <Link
              key={type}
              href={`/practice?type=${type}`}
              className="bg-surface border border-border rounded-xl py-4 flex flex-col items-center justify-center gap-1.5 hover:bg-brand-wash hover:border-brand hover:text-brand transition-colors shadow-sm"
            >
              <span className="font-medium text-ink text-sm uppercase tracking-wide">{type}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
