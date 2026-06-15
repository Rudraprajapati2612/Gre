'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const words = [
  { word: 'acrimony',   tag: 'NEGATIVE', tagClass: 'word-tag-negative', def: 'bitterness or ill feeling in speech or manner',          example: '"the debate was marked by acrimony"' },
  { word: 'ephemeral',  tag: 'NEUTRAL',  tagClass: 'word-tag-neutral',  def: 'lasting for a very short time',                          example: '"fame is ephemeral"' },
  { word: 'sagacious',  tag: 'POSITIVE', tagClass: 'word-tag-positive', def: 'having or showing keen mental discernment and judgement', example: '"a sagacious investor"' },
  { word: 'aberrant',   tag: 'NEGATIVE', tagClass: 'word-tag-negative', def: 'departing from an accepted standard',                    example: '"aberrant market behavior"' },
  { word: 'loquacious', tag: 'NEUTRAL',  tagClass: 'word-tag-neutral',  def: 'tending to talk a great deal',                          example: '"a loquacious tour guide"' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [wordIndex, setWordIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length)
        setFade(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const w = words[wordIndex]

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-warm-800 p-12 relative overflow-hidden auth-left-panel">
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-brand-orange/12 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-brand-amber/10 blur-[60px]" />

        {/* Logo */}
        <Link href="/" className="font-serif text-xl text-cream-white relative hover:text-brand-orange-light transition-colors inline-block w-fit">
          GRE Verbal
        </Link>

        {/* Cycling word card */}
        <div className="relative space-y-5">
          <p className="text-warm-400 text-xs uppercase tracking-[0.15em] font-medium">
            Word of the moment
          </p>
          
          <div className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-7 space-y-3 transition-opacity duration-400" style={{ opacity: fade ? 1 : 0 }}>
            <span className={w.tagClass}>{w.tag}</span>
            <div className="text-4xl font-serif text-cream-white mt-2">{w.word}</div>
            <div className="text-warm-300 text-base leading-relaxed">
              {w.def}
            </div>
            <div className="text-warm-500 text-sm italic">
              {w.example}
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex gap-7 pt-2">
            <div>
              <div className="text-2xl font-bold text-cream-white">3,700+</div>
              <div className="text-warm-400 text-xs mt-0.5">GRE words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cream-white">90 days</div>
              <div className="text-warm-400 text-xs mt-0.5">to mastery</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cream-white">SM-2</div>
              <div className="text-warm-400 text-xs mt-0.5">algorithm</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-warm-500 text-sm relative">
          Built for serious GRE prep. No fluff.
        </p>
      </div>

      {/* RIGHT PANEL — form */}
      <div className="flex-1 flex items-center justify-center bg-cream px-6 py-12">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="font-serif text-2xl text-warm-900">
              GRE Verbal
            </Link>
          </div>

          {/* Card */}
          <div className="bg-cream-white border border-warm-100 rounded-2xl p-8 space-y-6 shadow-[0_4px_24px_rgba(28,22,17,0.08)] anim-scale-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
