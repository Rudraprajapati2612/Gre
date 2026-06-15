'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

function ScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return null;
}

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/today')
  }, [user, loading, router])

  useEffect(() => {
    const nav = document.querySelector('.navbar-scroll');
    if (!nav) return;
    const handleScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-orange border-t-transparent animate-spin" />
      </div>
    )
  }
  if (user) return null

  return (
    <div className="min-h-screen bg-cream text-primary overflow-x-hidden">
      <ScrollReveal />

      {/* Navbar wrapper — add scroll-blur via JS */}
      <nav className="fixed top-0 left-0 right-0 z-50 navbar-scroll">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <span className="font-serif text-xl text-warm-900 tracking-tight">
            GRE Verbal
          </span>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-warm-600 hover:text-warm-900 transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2.5">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="min-h-screen pt-24 pb-14 sm:pb-20 sm:pt-24 px-6 bg-cream relative overflow-hidden">
        {/* Background texture blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full 
                        bg-brand-orange/5 blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full 
                        bg-brand-amber/8 blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          {/* LEFT: Content */}
          <div className="flex-1 space-y-7 text-center lg:text-left">
            {/* Badge */}
            <div className="anim-fade-up flex justify-center lg:justify-start">
              <span className="badge">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange inline-block"></span>
                Science-backed spaced repetition
              </span>
            </div>

            {/* Headline */}
            <div className="anim-fade-up anim-d1 space-y-1">
              <h1 className="display-xl font-serif text-[clamp(2rem,8vw,4.5rem)]">
                Conquer the GRE<br/>Verbal.
              </h1>
              <h1 className="display-xl font-serif text-[clamp(2rem,8vw,4.5rem)] text-brand-orange" style={{ color: 'var(--brand-orange)' }}>
                Word by word.
              </h1>
            </div>

            {/* Subtext */}
            <p className="anim-fade-up anim-d2 body-lg max-w-[480px] mx-auto lg:mx-0">
              A focused daily study tool for GRE vocabulary, Text Completion, 
              Sentence Equivalence, and Reading Comprehension — built around 
              the forgetting curve so every minute of study counts.
            </p>

            {/* CTAs */}
            <div className="anim-fade-up anim-d3 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register" className="btn-primary w-full sm:w-auto justify-center">
                Start for free
                <span>→</span>
              </Link>
              <Link href="/login" className="btn-secondary w-full sm:w-auto justify-center">
                Sign in
              </Link>
            </div>

            {/* Stats pills */}
            <div className="anim-fade-up anim-d4 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-sm text-warm-500">
              <span className="flex items-center gap-1.5">
                <span className="text-brand-orange">✓</span> 20 new words/day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-orange">↺</span> SM-2 spaced repetition
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-orange">⊕</span> All 4 verbal sections
              </span>
            </div>
          </div>

          {/* RIGHT: Mockup Card */}
          <div className="flex-shrink-0 w-full max-w-[340px] md:max-w-[400px] lg:max-w-[420px] mx-auto anim-fade-up anim-d5 anim-float">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-warm-100 bg-cream-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-warm-100">
          {[
            { value: '3,700+', label: 'High-frequency GRE words' },
            { value: '90 days', label: 'Average time to mastery' },
            { value: '4 sections', label: 'Vocab, TC, SE & RC' },
          ].map((stat, i) => (
            <div key={i} className="reveal px-8 py-10 text-center">
              <div className="text-3xl font-serif font-bold text-warm-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-warm-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-14 sm:py-24 px-6 bg-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3 reveal">
            <h2 className="display-lg">Everything the GRE Verbal demands</h2>
            <p className="body-lg max-w-md mx-auto">
              One app, all four verbal sections, one scientific system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                icon: '🧠',
                title: 'Vocabulary + Spaced Repetition',
                desc: 'The SM-2 algorithm schedules every word individually. Words you struggle with come back tomorrow. Words you know stay out of the way until maintenance review.',
                featured: true,
              },
              {
                icon: '📖',
                title: 'Text Completion',
                desc: '1–3 blank questions where you select the word that completes the passage. Inline blank slots let you read the completed sentence before you commit.',
                featured: false,
              },
              {
                icon: '↔️',
                title: 'Sentence Equivalence',
                desc: 'Pick exactly two words that produce sentences with the same meaning. The system enforces the pick-two rule and teaches you why the pair works as a unit.',
                featured: false,
              },
              {
                icon: '📊',
                title: 'Reading Comprehension',
                desc: 'Full passages with multiple questions. The trap-tagging drill teaches you to identify exactly why wrong options fail — out-of-scope, distortion, too extreme.',
                featured: false,
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`reveal rd${i} card-premium p-8 space-y-4 ${
                  card.featured
                    ? 'border-brand-orange/30 bg-gradient-to-br from-[#FFFDF9] to-[#FEF5F0]'
                    : ''
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                  card.featured ? 'bg-brand-orange/10' : 'bg-warm-100'
                }`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-warm-900 leading-snug">
                  {card.title}
                </h3>
                <p className="text-warm-500 text-sm leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-14 sm:py-24 px-6 bg-cream-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="display-lg">How your daily session works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] 
                            h-px bg-gradient-to-r from-transparent via-warm-200 to-transparent" />

            {[
              {
                n: '1',
                title: 'Morning: learn 20 new words',
                desc: 'Browse the word library, select 20 words, and tap "Learn today." They enter your review queue immediately.',
              },
              {
                n: '2',
                title: 'Evening: review what you learned',
                desc: 'Run tonight\'s quiz. For each word, recall the meaning before revealing it, then grade yourself honestly.',
              },
              {
                n: '3',
                title: 'Daily: due words served automatically',
                desc: 'The algorithm spaces everything. You never decide what to review — just show up.',
              },
            ].map((step, i) => (
              <div key={i} className={`reveal rd${i} text-center md:text-left space-y-4`}>
                <div className="w-14 h-14 rounded-2xl bg-brand-orange text-white font-bold text-lg 
                                flex items-center justify-center mx-auto md:mx-0
                                shadow-[0_4px_16px_rgba(196,98,45,0.35)]">
                  {step.n}
                </div>
                <h3 className="font-semibold text-warm-900 text-base leading-snug">{step.title}</h3>
                <p className="text-warm-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ACTIVE RECALL SECTION */}
      <section className="py-14 sm:py-24 px-6 bg-cream">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left: text */}
          <div className="flex-1 space-y-6 reveal">
            <h2 className="display-lg">Active recall,<br/>not passive reading</h2>
            <p className="body-lg">
              Every word is presented as a test. You see the word, retrieve the meaning, 
              then grade yourself. The SM-2 algorithm adjusts the next review based on how 
              easily you recalled it — hard words come back sooner, easy ones later.
            </p>
            <ul className="space-y-3">
              {[
                'One word at a time — no distractions',
                'Four grades: Again / Hard / Good / Easy',
                'Words you struggle with come back the next day',
                'Mastered words return every few weeks for maintenance',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-warm-600">
                  <span className="w-5 h-5 rounded-full bg-brand-orange/15 text-brand-orange 
                                   flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: flashcard mockup */}
          <div className="flex-shrink-0 w-full max-w-[360px] reveal rd1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-1.5 rounded-full bg-warm-100">
                <div className="h-full w-2/5 rounded-full bg-brand-orange transition-all" />
              </div>
              <span className="text-xs text-warm-400 font-medium">4 / 10</span>
            </div>
            
            <div className="card-premium p-8 text-center space-y-4">
              <span className="word-tag-negative">NEGATIVE</span>
              <div className="text-4xl font-serif text-warm-900 py-2">acrimony</div>
              <div className="text-warm-600 text-base font-medium">
                bitterness or ill feeling in speech or manner
              </div>
              <div className="text-warm-400 text-sm italic">
                &quot;the divorce was marked by acrimony&quot;
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: 'Again', sub: '<1d', color: 'bg-red-50 text-red-500 border-red-100' },
                { label: 'Hard',  sub: '2d',  color: 'bg-warm-50 text-warm-500 border-warm-100' },
                { label: 'Good',  sub: '4d',  color: 'bg-[#FEF5F0] text-brand-orange border-brand-orange/20' },
                { label: 'Easy',  sub: '8d',  color: 'bg-green-50 text-green-600 border-green-100' },
              ].map((btn) => (
                <button key={btn.label} className={`rounded-xl py-2.5 text-xs font-semibold border ${btn.color} transition-all hover:-translate-y-0.5`}>
                  {btn.label}
                  <div className="text-[10px] font-normal opacity-70 mt-0.5">{btn.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-14 sm:py-24 px-6 bg-warm-800 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-orange/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-amber/10 blur-[80px] pointer-events-none" />

        <div className="max-w-lg mx-auto text-center space-y-7 relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange mx-auto flex items-center justify-center
                          shadow-[0_8px_24px_rgba(196,98,45,0.40)] anim-float">
            <span className="text-2xl">📖</span>
          </div>

          <div className="space-y-3">
            <h2 className="display-lg text-cream-white">Ready to start your streak?</h2>
            <p className="text-warm-300 text-base leading-relaxed">
              20 words a day. A few TC and SE questions. One RC passage. That&apos;s the routine.
            </p>
          </div>

          <Link href="/register" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center block sm:inline-flex">
            Create your account — it&apos;s free →
          </Link>
          
          <p className="text-warm-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-orange-light hover:text-brand-amber transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-warm-100 bg-cream py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-warm-500 text-sm">
          <span className="font-serif text-base text-warm-900">GRE Verbal</span>
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
    <div className="relative w-full">
      <div className="bg-[#FFFDF9] rounded-[32px] border border-warm-200/50 p-4 space-y-3" style={{ boxShadow: '0 20px 60px rgba(196, 98, 45, 0.12)' }}>
        <div className="flex items-center justify-between px-1">
          <span className="font-serif text-base text-warm-900">Today</span>
          <div className="flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange px-2.5 py-1 rounded-full text-xs font-medium">
            <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-brand-orange" aria-hidden="true" />
            <span aria-hidden="true">🔥</span>
            7 streak
          </div>
        </div>

        <div className="bg-cream-dark rounded-[20px] p-4 flex flex-col items-center border border-warm-200/50">
          <p className="text-xs text-warm-500 font-medium mb-2">Today&apos;s Progress</p>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg width={radius * 2} height={radius * 2} className="-rotate-90" aria-hidden="true">
              <circle stroke="var(--border-soft)" fill="transparent" strokeWidth={stroke} r={nr} cx={radius} cy={radius} />
              <circle stroke="var(--brand-orange)" fill="transparent" strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} r={nr} cx={radius} cy={radius} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-serif text-2xl text-warm-900 leading-none">7</span>
              <span className="text-[10px] text-warm-500">/ 20</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-[14px] border border-brand-orange/20 bg-[#FEF5F0]">
          <div>
            <p className="text-sm font-medium text-brand-orange">Review due</p>
            <p className="text-[11px] text-warm-500">8 words</p>
          </div>
          <span aria-hidden="true" className="text-brand-orange">→</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-[14px] border border-brand-orange/20 bg-[#FEF5F0]">
          <div>
            <p className="text-sm font-medium text-brand-orange">Tonight&apos;s quiz</p>
            <p className="text-[11px] text-warm-500">20 words</p>
          </div>
          <span aria-hidden="true" className="text-brand-orange">→</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['TC', 'SE', 'RC'].map((t) => (
            <div key={t} className="bg-warm-100 rounded-[10px] py-2.5 flex items-center justify-center border border-warm-200 text-xs font-medium text-warm-600">{t}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
