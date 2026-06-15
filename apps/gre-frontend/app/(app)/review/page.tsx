'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDueReviewWords, getTodayReviewWords, submitReview } from '@/lib/api';
import type { Word } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CalendarDays } from 'lucide-react';
import Link from 'next/link';

export default function ReviewPage() {
  const router = useRouter();
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    Promise.all([getTodayReviewWords(), getDueReviewWords()])
      .then(([todayWords, dueWords]) => {
        const seen = new Set<string>();
        const merged: Word[] = [];
        for (const w of [...todayWords, ...dueWords]) {
          if (!seen.has(w.id)) { seen.add(w.id); merged.push(w); }
        }
        setDueWords(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentWord = dueWords[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  if (dueWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CalendarDays className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold mb-4 text-[#1F2430]">All caught up!</h2>
        <p className="text-[#1F2430]/70 mb-8 max-w-md">
          You've completed all your scheduled reviews for today. Check back tomorrow or continue
          learning new words on the Mountain.
        </p>
        <Button asChild size="lg">
          <Link href="/mountain">Go to Mountain</Link>
        </Button>
      </div>
    );
  }

  const handleGrade = async (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (currentWord) {
      submitReview(currentWord.id, grade).catch(() => {});
    }

    if (currentIndex < dueWords.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    } else {
      router.push('/dashboard');
    }
  };

  const progressLine = (currentIndex / dueWords.length) * 100;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2 font-serif font-bold text-[#E8743B]">
          <Clock className="h-5 w-5" /> Daily Review
        </div>
        <div className="text-sm font-medium text-[#1F2430]/60">
          {currentIndex + 1} / {dueWords.length}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-[#D6CFC4]/30 h-1 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-[#E8743B]"
          initial={{ width: 0 }}
          animate={{ width: `${progressLine}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id + (isFlipped ? '-back' : '-front')}
            initial={{ opacity: 0, rotateX: isFlipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            exit={{ opacity: 0, rotateX: isFlipped ? 90 : -90 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full h-full min-h-[350px] absolute inset-0 cursor-pointer"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <Card
              className={`w-full h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center bg-white shadow-sm ${
                isFlipped ? 'border-[#E8743B]/30' : 'border-[#D6CFC4]/50'
              }`}
            >
              {!isFlipped ? (
                <>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1F2430] mb-4">
                    {currentWord.word}
                  </h2>
                  {currentWord.userNote && (
                    <p className="text-xs text-[#E8743B]/70 italic mt-2">
                      💡 You have a mnemonic — reveal to see it
                    </p>
                  )}
                  <p className="text-[#1F2430]/50 text-sm mt-8 animate-pulse">
                    Tap to reveal meaning
                  </p>
                </>
              ) : (
                <div
                  className="w-full text-left flex flex-col h-full cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-[#D6CFC4]/30 pb-6 mb-6">
                    <h2 className="text-3xl font-serif font-bold text-[#1F2430] mb-2">
                      {currentWord.word}
                    </h2>
                    <p className="text-lg text-[#1F2430]/90 leading-relaxed">{currentWord.meaning}</p>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {currentWord.userNote && (
                      <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8743B]/20">
                        <h4 className="text-xs font-bold tracking-wider uppercase text-[#E8743B]/70 mb-2">
                          My Mnemonic
                        </h4>
                        <p className="text-sm text-[#1F2430]/90 leading-relaxed">{currentWord.userNote}</p>
                      </div>
                    )}
                    {currentWord.examples.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold tracking-wider uppercase text-[#1F2430]/40 mb-2">
                          Example
                        </h4>
                        <p className="text-[#1F2430]/80 italic text-sm border-l-2 border-[#E8743B]/30 pl-3">
                          "{currentWord.examples[0]}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-4 gap-2 md:gap-4"
        >
          <Button
            variant="outline"
            onClick={() => handleGrade('again')}
            className="py-8 flex flex-col gap-1 items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <span className="font-bold text-base">Again</span>
            <span className="text-[10px] opacity-70">&lt; 1m</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade('hard')}
            className="py-8 flex flex-col gap-1 items-center justify-center hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
          >
            <span className="font-bold text-base">Hard</span>
            <span className="text-[10px] opacity-70">1d</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade('good')}
            className="py-8 flex flex-col gap-1 items-center justify-center border-[#E8743B]/30 hover:bg-[#E8743B] hover:text-white group transition-colors"
          >
            <span className="font-bold text-base">Good</span>
            <span className="text-[10px] opacity-70 group-hover:opacity-100">3d</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGrade('easy')}
            className="py-8 flex flex-col gap-1 items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-200"
          >
            <span className="font-bold text-base">Easy</span>
            <span className="text-[10px] opacity-70">5d</span>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
