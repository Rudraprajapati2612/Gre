'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { Mountain, ArrowRight, BrainCircuit, Library, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  if (loading || user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
      <header className="px-4 md:px-6 h-20 md:h-24 flex flex-row items-center justify-between bg-transparent w-full z-50">
        <div className="flex items-center gap-2 text-[#E8743B]">
          <Mountain className="h-6 w-6 md:h-8 md:w-8" />
          <span className="font-serif italic font-bold text-2xl md:text-3xl text-[#1F2430]">Summit</span>
        </div>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-[#E8743B] transition-colors">Log In</Link>
          <Button asChild size="sm" className="md:px-5 md:py-2 md:h-11 font-bold text-xs md:text-sm">
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 pt-10">
        {/* Hero */}
        <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto flex flex-col items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-6xl md:text-8xl font-serif font-semibold tracking-tight text-[#1F2430] mb-8"
          >
            Master GRE Vocab <br/>
            <span className="text-[#E8743B] italic">The Smart Way</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-2xl text-[#1F2430]/60 max-w-2xl mb-12 leading-relaxed"
          >
            Stop staring at endless lists. Summit guides you through a curated Mountain of vocabulary and targeted practice, powered by spaced repetition.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button asChild size="lg" className="px-8 py-6 text-lg gap-2">
              <Link href="/register">Climb the Mountain <ArrowRight className="h-5 w-5" /></Link>
            </Button>
          </motion.div>
        </section>

        {/* Feature Grid / How it works */}
        <section id="how-it-works" className="bg-white py-32 px-6 border-t border-[#1F2430]/5 rounded-t-[3rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-serif italic font-semibold">A simple, obvious path.</h2>
              <p className="text-[#1F2430]/50 text-xl">No confusing navigation. Just three steps every day.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <BrainCircuit className="h-8 w-8 text-[#E8743B]" />,
                  title: '1. Learn',
                  desc: 'Discover new vocabulary in curated chunks. Link words with personal mnemonics to make them stick instantly.'
                },
                {
                  icon: <Library className="h-8 w-8 text-[#E8743B]" />,
                  title: '2. Review',
                  desc: 'Never forget a word. Our smart algorithm schedules your review precisely before the forgetting curve hits.'
                },
                {
                  icon: <TrendingUp className="h-8 w-8 text-[#E8743B]" />,
                  title: '3. Practice',
                  desc: 'Apply your vocabulary to real GRE Text Completion and Sentence Equivalence questions to lock in your score.'
                }
              ].map((ft, i) => (
                <div key={i} className="p-10 rounded-3xl bg-[#FAF7F2] border border-[#1F2430]/5 hover:border-[#E8743B]/30 hover:shadow-lg transition-all group">
                  <div className="mb-6 p-4 bg-white rounded-2xl inline-block shadow-sm group-hover:scale-110 transition-transform">
                    {ft.icon}
                  </div>
                  <h3 className="text-2xl font-serif italic mb-4">{ft.title}</h3>
                  <p className="text-[#1F2430]/60 leading-relaxed text-lg">{ft.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 text-center bg-white text-[#1F2430]/40 text-sm">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <Mountain className="h-5 w-5" />
            <span className="font-serif italic font-bold">Summit</span>
          </div>
          <p>© {new Date().getFullYear()} Summit GRE Prep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
