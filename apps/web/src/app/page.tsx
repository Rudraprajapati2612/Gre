'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import {
  BookOpen, Brain, BarChart2, CheckCircle2, ArrowRight,
  Flame, Repeat2, Target, BookMarked, Sparkles,
} from 'lucide-react'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/today')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-bg text-ink overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <span className="font-display text-xl text-ink tracking-tight">GRE Verbal</span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink transition-colors rounded-[10px] hover:bg-surface-muted"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-[10px] hover:bg-brand-strong transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-wash opacity-40 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-wash opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-brand-wash text-brand px-3 py-1.5 rounded-full text-sm font-medium">
              <Sparkles size={14} />
              Science-backed spaced repetition
            </div>

            <h1 className="font-display text-[2.75rem] md:text-[3.5rem] leading-[1.1] text-ink tracking-tight">
              Conquer the GRE Verbal.<br />
              <span className="text-brand">Word by word.</span>
            </h1>

            <p className="text-lg text-ink-soft leading-relaxed max-w-md">
              A focused daily study tool for GRE vocabulary, Text Completion, Sentence
              Equivalence, and Reading Comprehension — built around the forgetting curve
              so every minute of study counts.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand text-white font-medium rounded-[12px] hover:bg-brand-strong transition-colors shadow-md text-base"
              >
                Start for free
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface text-ink font-medium rounded-[12px] border border-border hover:border-ink-soft hover:bg-surface-muted transition-colors text-base"
              >
                Sign in
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {[
                { icon: CheckCircle2, text: '20 new words/day' },
                { icon: Repeat2, text: 'SM-2 spaced repetition' },
                { icon: Target, text: 'All 4 verbal sections' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-ink-soft text-sm">
                  <Icon size={14} className="text-brand flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────── */}
      <section className="border-y border-border bg-surface py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-3 gap-4 text-center">
          {[
            { num: '3,700+', label: 'High-frequency GRE words' },
            { num: '90 days', label: 'Average time to mastery' },
            { num: '4 sections', label: 'Vocab, TC, SE & RC' },
          ].map(({ num, label }) => (
            <div key={label}>
              <div className="font-display text-3xl text-ink mb-1">{num}</div>
              <div className="text-sm text-ink-soft">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-ink">
              Everything the GRE Verbal demands
            </h2>
            <p className="text-ink-soft text-lg">
              One app, all four verbal sections, one scientific system.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-surface border border-border rounded-[16px] p-6 hover:border-brand/40 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-brand-wash flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                  <f.icon size={20} className="text-brand group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-display text-lg text-ink mb-2">{f.title}</h3>
                <p className="text-ink-soft text-[15px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="bg-surface border-y border-border py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl text-ink">
              How your daily session works
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title} className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-mono text-sm font-medium">
                  {i + 1}
                </div>
                <h3 className="font-display text-lg text-ink">{s.title}</h3>
                <p className="text-ink-soft text-[15px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Review card spotlight ───────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-display text-3xl md:text-4xl text-ink leading-tight">
              Active recall, not passive reading
            </h2>
            <p className="text-ink-soft text-lg leading-relaxed">
              Every word is presented as a test. You see the word, retrieve the
              meaning, then grade yourself. The SM-2 algorithm adjusts the next review
              based on how easily you recalled it — hard words come back sooner, easy ones later.
            </p>
            <ul className="space-y-3">
              {[
                'One word at a time — no distractions',
                'Four grades: Again / Hard / Good / Easy',
                'Words you struggle with come back the next day',
                'Mastered words return every few weeks for maintenance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px]">
                  <CheckCircle2 size={18} className="text-success flex-shrink-0 mt-0.5" />
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <ReviewCardMockup />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="bg-brand/5 border-t border-brand/10 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-4 md:px-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-brand mx-auto flex items-center justify-center">
            <BookMarked size={28} className="text-white" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-ink">
            Ready to start your streak?
          </h2>
          <p className="text-ink-soft text-lg">
            20 words a day. A few TC and SE questions. One RC passage. That&apos;s the routine.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand text-white font-medium rounded-[14px] hover:bg-brand-strong transition-colors text-base"
          >
            Create your account — it&apos;s free
            <ArrowRight size={18} />
          </Link>
          <p className="text-ink-soft text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-ink-soft text-sm">
          <span className="font-display text-base text-ink">GRE Verbal</span>
          <span>Built for serious GRE prep. No fluff.</span>
        </div>
      </footer>
    </div>
  )
}

function AppMockup() {
  const radius = 52
  const stroke = 10
  const nr = radius - stroke * 2
  const circ = nr * 2 * Math.PI
  const pct = 0.35
  const offset = circ - pct * circ

  return (
    <div className="relative w-[280px] md:w-[320px]">
      <div className="bg-surface rounded-[32px] border border-border shadow-2xl p-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-display text-base text-ink">Today</span>
          <div className="flex items-center gap-1.5 bg-amber-wash text-amber px-2.5 py-1 rounded-full text-xs font-medium">
            <Flame size={12} fill="currentColor" />7 streak
          </div>
        </div>

        <div className="bg-bg rounded-[20px] p-4 flex flex-col items-center border border-border/50">
          <p className="text-xs text-ink-soft font-medium mb-2">Today&apos;s Progress</p>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg width={radius * 2} height={radius * 2} className="-rotate-90">
              <circle stroke="var(--brand-wash)" fill="transparent" strokeWidth={stroke} r={nr} cx={radius} cy={radius} />
              <circle stroke="var(--brand)" fill="transparent" strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} r={nr} cx={radius} cy={radius} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display text-2xl text-ink leading-none">7</span>
              <span className="text-[10px] text-ink-soft">/ 20</span>
            </div>
          </div>
        </div>

        {[{ label: 'Review due', count: 8, c: 'brand' }, { label: "Tonight's quiz", count: 20, c: 'amber' }].map(({ label, count, c }) => (
          <div key={label} className={`flex items-center justify-between p-3 rounded-[14px] border ${c === 'amber' ? 'border-amber/20 bg-amber-wash/50' : 'border-brand/20 bg-brand-wash/50'}`}>
            <div>
              <p className={`text-sm font-medium ${c === 'amber' ? 'text-amber' : 'text-brand'}`}>{label}</p>
              <p className="text-[11px] text-ink-soft">{count} words</p>
            </div>
            <ArrowRight size={16} className={c === 'amber' ? 'text-amber' : 'text-brand'} />
          </div>
        ))}

        <div className="grid grid-cols-3 gap-2">
          {['TC', 'SE', 'RC'].map((t) => (
            <div key={t} className="bg-surface-muted rounded-[10px] py-2.5 flex items-center justify-center border border-border text-xs font-medium text-ink-soft">{t}</div>
          ))}
        </div>
      </div>

      <div className="absolute -right-4 top-20 bg-surface rounded-[20px] border border-border shadow-xl p-4 w-36">
        <span className="text-[10px] text-ink-soft font-medium uppercase tracking-wider block mb-1">NEGATIVE</span>
        <p className="font-display text-lg text-ink">aberrant</p>
        <p className="text-[11px] text-ink-soft mt-1 leading-snug">departing from the norm</p>
        <div className="flex gap-1.5 mt-3">
          {['Again', 'Good'].map((g) => (
            <div key={g} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium text-center ${g === 'Again' ? 'bg-danger-wash text-danger' : 'bg-success-wash text-success'}`}>{g}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewCardMockup() {
  return (
    <div className="w-full max-w-[300px] space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-surface-muted rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full" style={{ width: '40%' }} />
        </div>
        <span className="text-xs text-ink-soft font-mono">4 / 10</span>
      </div>

      <div className="bg-surface rounded-[24px] border border-border shadow-lg p-8 flex flex-col items-center text-center space-y-4">
        <span className="inline-flex px-2 py-0.5 rounded-full bg-danger-wash text-danger text-[11px] font-medium uppercase tracking-wider">negative</span>
        <p className="font-display text-4xl text-ink">acrimony</p>
        <div className="w-full h-px bg-border" />
        <p className="text-ink text-base font-medium leading-snug">bitterness or ill feeling in speech or manner</p>
        <p className="text-ink-soft text-sm italic">&ldquo;the divorce was marked by acrimony&rdquo;</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Again', hint: '<1d', cls: 'bg-danger-wash text-danger' },
          { label: 'Hard', hint: '2d', cls: 'bg-surface-muted text-ink-soft' },
          { label: 'Good', hint: '4d', cls: 'bg-brand-wash text-brand' },
          { label: 'Easy', hint: '8d', cls: 'bg-success-wash text-success' },
        ].map(({ label, hint, cls }) => (
          <div key={label} className={`py-3 rounded-[12px] flex flex-col items-center ${cls}`}>
            <span className="text-xs font-medium">{label}</span>
            <span className="text-[10px] opacity-70 mt-0.5">{hint}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: Brain,
    title: 'Vocabulary + Spaced Repetition',
    desc: 'The SM-2 algorithm schedules every word individually. Words you struggle with come back tomorrow. Words you know stay out of the way until maintenance review.',
  },
  {
    icon: BookOpen,
    title: 'Text Completion',
    desc: '1–3 blank questions where you select the word that completes the passage. Inline blank slots let you read the completed sentence before you commit.',
  },
  {
    icon: Repeat2,
    title: 'Sentence Equivalence',
    desc: 'Pick exactly two words that produce sentences with the same meaning. The system enforces the pick-two rule and teaches you why the pair works as a unit.',
  },
  {
    icon: BarChart2,
    title: 'Reading Comprehension',
    desc: 'Full passages with multiple questions. The trap-tagging drill teaches you to identify exactly why wrong options fail — out-of-scope, distortion, too extreme.',
  },
]

const STEPS = [
  {
    title: 'Morning: learn 20 new words',
    desc: 'Browse the word library, select 20 words, and tap "Learn today." They enter your review queue immediately.',
  },
  {
    title: 'Evening: review what you learned',
    desc: 'Run tonight\'s quiz. For each word, recall the meaning before revealing it, then grade yourself honestly.',
  },
  {
    title: 'Daily: due words served automatically',
    desc: 'The algorithm spaces everything. You never decide what to review — just show up.',
  },
]
