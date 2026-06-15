'use client';

import { useState, useEffect, useCallback } from 'react';
import { listWords } from '@/lib/api';
import type { Word, WordStatus } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_FILTERS: ('all' | WordStatus)[] = ['all', 'new', 'learning', 'review', 'mastered'];

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | WordStatus>('all');

  const fetchWords = useCallback(() => {
    setLoading(true);
    listWords({
      q: search || undefined,
      status: filter !== 'all' ? filter : undefined,
      limit: 100,
    })
      .then(setWords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filter]);

  useEffect(() => {
    const t = setTimeout(fetchWords, 300);
    return () => clearTimeout(t);
  }, [fetchWords]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-[#1F2430]/10 text-[#1F2430]/70';
      case 'learning':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-orange-100 text-orange-800';
      case 'mastered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#1F2430]">Vocabulary Library</h1>
        <p className="text-[#1F2430]/70 mt-1">Search and review your words.</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1F2430]/40" />
          <Input
            placeholder="Search words or meanings..."
            className="pl-10 h-12 rounded-xl border-[#D6CFC4] bg-white text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap ${
                filter === f ? 'bg-[#1F2430] text-white' : 'bg-white'
              }`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {words.length === 0 ? (
            <div className="text-center py-20 text-[#1F2430]/50">No words found.</div>
          ) : (
            words.map((word, i) => (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
              >
                <Link href={`/words/${word.id}`}>
                  <Card className="hover:border-[#E8743B]/50 transition-colors cursor-pointer group rounded-xl">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            word.status === 'mastered'
                              ? 'bg-green-500'
                              : word.status === 'review'
                                ? 'bg-[#E8743B]'
                                : word.status === 'learning'
                                  ? 'bg-yellow-500'
                                  : 'bg-[#D6CFC4]'
                          }`}
                        />
                        <div>
                          <h3 className="font-bold font-serif text-lg text-[#1F2430]">{word.word}</h3>
                          <p className="text-sm text-[#1F2430]/60 line-clamp-1">{word.meaning}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`hidden sm:inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusColor(word.status)}`}
                        >
                          {word.status}
                        </span>
                        <ChevronRight className="h-5 w-5 text-[#1F2430]/30 group-hover:text-[#E8743B] transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
