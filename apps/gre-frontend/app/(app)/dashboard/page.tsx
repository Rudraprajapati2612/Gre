'use client';

import { useAuth } from '@/lib/store';
import { getProgressSummary } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, ArrowRight, Flame, Layers, CheckCircle2, BookOpen, X, Play } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { ProgressSummary } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('summit_onboarding_dismissed');
      if (!dismissed) setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    getProgressSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('summit_onboarding_dismissed', 'true');
  };

  const dueToday = summary?.dueTodayCount ?? 0;
  const mastered = summary?.masteredCount ?? 0;
  const learning = summary?.learningCount ?? 0;
  const total = summary?.totalWords ?? 0;
  const streak = summary?.streakDays ?? 0;

  const totalKnown = mastered + learning;
  const progressPercent = total > 0 ? ((mastered + learning) / total) * 100 : 0;
  const strokeDashoffset = 552 - (552 * progressPercent) / 100;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="font-serif italic text-4xl font-semibold leading-tight">
            Morning, {user?.name || 'Climber'}.
          </h1>
          <p className="text-[#1F2430]/60 text-lg">
            Your daily climb awaits.{' '}
            {streak > 0 && (
              <>
                You're{' '}
                <span className="text-[#E8743B] font-bold">
                  {streak} {streak === 1 ? 'day' : 'days'}
                </span>{' '}
                strong.
              </>
            )}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-white rounded-full border border-[#1F2430]/5 shadow-sm text-sm font-medium">
            Words due: {dueToday}
          </div>
          <div className="px-4 py-2 bg-white rounded-full border border-[#1F2430]/5 shadow-sm text-sm font-medium italic font-serif">
            Mastery: {total > 0 ? Math.round((mastered / total) * 100) : 0}%
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-[#1F2430] text-white border-none shadow-lg relative mb-10">
              <button
                onClick={dismissOnboarding}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="p-6 pb-2">
                <h2 className="text-2xl font-serif italic mb-1">Welcome to Summit</h2>
                <p className="text-white/70 text-sm">A quick guide to mastering your vocabulary.</p>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mt-4">
                  <div>
                    <h4 className="font-bold text-[#E8743B] mb-2 flex items-center gap-2">
                      <Mountain className="h-4 w-4" /> 1. Learn
                    </h4>
                    <p className="text-sm text-white/80">
                      Explore the Mountain to learn new word groups. Add a mnemonic note to lock them in.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#E8743B] mb-2 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> 2. Review
                    </h4>
                    <p className="text-sm text-white/80">
                      Every day, we'll tell you exactly which words need review before you forget them.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#E8743B] mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> 3. Practice
                    </h4>
                    <p className="text-sm text-white/80">
                      Apply words to real GRE format questions in the Practice Hub.
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    onClick={dismissOnboarding}
                    variant="secondary"
                    className="bg-white text-[#1F2430] hover:bg-white/90"
                  >
                    Got it, let's start
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start content-start">
        <section className="lg:col-span-7 space-y-8">
          {/* Main Action Banner */}
          <div className="relative bg-[#E8743B] rounded-3xl p-10 text-white overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <span className="uppercase tracking-[0.2em] text-[10px] font-bold opacity-80">
                  Current Phase
                </span>
                <h2 className="font-serif italic text-3xl font-medium leading-tight">The Mountain</h2>
                <p className="opacity-90 max-w-[280px] leading-relaxed">
                  Learn vocabulary in focused groups and climb your way to mastery.
                </p>
              </div>
              <Button
                asChild
                className="bg-white text-[#E8743B] px-8 py-6 rounded-xl font-bold flex items-center gap-3 hover:translate-y-[-2px] hover:bg-white transition-transform shadow-lg shadow-[#E8743B]/20 w-fit"
              >
                <Link href="/mountain">
                  Continue the Climb
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] font-serif text-[240px] italic font-bold opacity-10 pointer-events-none select-none">
              ∧
            </div>
          </div>

          {/* Spaced Review Mini-Card */}
          <div className="bg-white border border-[#1F2430]/5 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-serif italic text-xl">Spaced Review</h3>
              <p className="text-[#1F2430]/50 text-sm">
                Review {dueToday} {dueToday === 1 ? 'word' : 'words'} before they slip your memory.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#FDF1E9] flex items-center justify-center text-[10px] font-bold text-[#E8743B]">
                  REV
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#E8743B] flex items-center justify-center text-[10px] font-bold text-white">
                  I
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#1F2430] flex items-center justify-center text-[10px] font-bold text-white">
                  EW
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                disabled={dueToday === 0}
                className="border-[#1F2430] px-5 py-4 h-auto rounded-xl text-sm font-bold"
              >
                <Link href="/review">Review Now</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 space-y-8">
          {/* Progress Ring */}
          <div className="bg-white border border-[#1F2430]/5 rounded-3xl p-8 shadow-sm h-full flex flex-col min-h-[360px]">
            <h3 className="uppercase tracking-[0.2em] text-[10px] font-bold text-[#1F2430]/40 mb-8">
              Your Progress
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 text-transparent">
                  <circle cx="96" cy="96" r="88" stroke="#FDF1E9" strokeWidth="12" fill="transparent" />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E8743B"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="552"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-serif italic font-bold">{totalKnown}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#1F2430]/40 font-bold">
                    Words Known
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 w-full gap-4 pt-4 mt-auto">
                <div className="p-4 rounded-2xl bg-[#FDF1E9]/50 border border-[#E8743B]/10">
                  <div className="text-lg font-serif italic flex items-center gap-1">
                    {streak} <Flame className="h-4 w-4 text-[#E8743B]" />
                  </div>
                  <div className="text-[10px] uppercase font-bold opacity-50">Day Streak</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF1E9]/50 border border-[#E8743B]/10">
                  <div className="text-lg font-serif italic">{mastered}</div>
                  <div className="text-[10px] uppercase font-bold opacity-50">Mastered</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Nav */}
          <Link href="/practice">
            <div className="p-6 rounded-2xl border border-[#1F2430]/5 bg-white hover:bg-[#FDF1E9]/30 transition-colors flex items-center justify-between group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Sentence Equivalence</span>
              </div>
              <span className="text-sm italic font-serif text-[#E8743B] group-hover:translate-x-1 transition-transform">
                Practice next →
              </span>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
