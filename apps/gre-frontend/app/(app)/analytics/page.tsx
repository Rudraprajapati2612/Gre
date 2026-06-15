'use client';

import { useEffect, useState } from 'react';
import { getProgressSummary, getWeakWords } from '@/lib/api';
import type { ProgressSummary, WeakWord } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProgressSummary(), getWeakWords()])
      .then(([s, w]) => {
        setSummary(s);
        setWeakWords(w.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mastered = summary?.masteredCount ?? 0;
  const learning = summary?.learningCount ?? 0;
  const review = summary?.reviewCount ?? 0;
  const total = summary?.totalWords ?? 0;
  const streak = summary?.streakDays ?? 0;
  const unseen = Math.max(0, total - mastered - learning - review);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#1F2430]">Analytics</h1>
        <p className="text-[#1F2430]/70 mt-1">Track your progress and identify weak spots.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#FAF7F2]">
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
              Current Streak
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-serif font-bold text-[#1F2430]">{streak}</span>
              <Flame className="h-6 w-6 text-[#E8743B] mb-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
              Mastered
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-serif font-bold text-green-600">{mastered}</span>
              <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
              Learning
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-serif font-bold text-yellow-600">{learning}</span>
              <BookOpen className="h-6 w-6 text-yellow-500 mb-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
              In Review
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-serif font-bold text-orange-600">{review}</span>
              <Layers className="h-6 w-6 text-orange-500 mb-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vocabulary Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Unseen', val: unseen, color: 'bg-[#D6CFC4]' },
                { label: 'Learning', val: learning, color: 'bg-yellow-400' },
                { label: 'Review', val: review, color: 'bg-orange-400' },
                { label: 'Mastered', val: mastered, color: 'bg-green-500' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-[#1F2430]/80">{stat.label}</span>
                    <span className="font-bold">{stat.val}</span>
                  </div>
                  <div className="h-3 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#D6CFC4]/50">
                    <div
                      className={`h-full ${stat.color} transition-all duration-1000`}
                      style={{ width: `${total > 0 ? (stat.val / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weakWords.length === 0 ? (
                <p className="text-sm text-[#1F2430]/50">No weak words yet. Keep practicing!</p>
              ) : (
                weakWords.map((w) => {
                  const errorRate = Math.round((1 - w.accuracy) * 100);
                  return (
                    <div
                      key={w.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                    >
                      <div>
                        <div className="font-bold font-serif text-[#1F2430]">{w.word}</div>
                        <div className="text-xs text-red-600 mt-1">{w.timesWrong} mistakes</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-700">{errorRate}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-red-500">
                          Error Rate
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
