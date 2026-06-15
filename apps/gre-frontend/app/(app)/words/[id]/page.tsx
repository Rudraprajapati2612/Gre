'use client';

import { use, useState, useEffect } from 'react';
import { getWord, saveMountainNote } from '@/lib/api';
import type { Word } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Activity, CalendarDays, Edit3, Save } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWord(resolvedParams.id)
      .then((w) => {
        setWord(w);
        setNoteVal(w?.userNote ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const handleSaveNote = async () => {
    if (!word) return;
    setSaving(true);
    try {
      await saveMountainNote(word.id, noteVal);
      setWord((prev) => (prev ? { ...prev, userNote: noteVal } : prev));
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
      setIsEditingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold mb-4 text-[#1F2430]">Word not found</h2>
        <Button asChild>
          <Link href="/words">Back to Library</Link>
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-[#1F2430]/10 text-[#1F2430]/70';
      case 'learning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex items-center justify-between mb-2">
        <Link
          href="/words"
          className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Library
        </Link>
      </header>

      <Card className="border-[#D6CFC4] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-[#FAF7F2] p-8 md:p-10 border-b border-[#D6CFC4]/50">
            <div className="flex justify-between items-start mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#1F2430]/50">
                {word.tone} tone
              </span>
              <span
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase border ${getStatusColor(word.status)}`}
              >
                {word.status}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#1F2430] mb-6">
              {word.word}
            </h1>
            <p className="text-xl md:text-2xl text-[#1F2430]/80 leading-relaxed font-serif">
              {word.meaning}
            </p>
          </div>

          <div className="p-8 md:p-10 space-y-10">
            <div className="space-y-6">
              {word.examples.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Examples
                  </h3>
                  <ul className="space-y-3 pl-4 border-l-2 border-[#E8743B]/30">
                    {word.examples.map((ex, i) => (
                      <li key={i} className="text-[#1F2430]/90 italic">
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {word.greContext && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
                    GRE Context
                  </h3>
                  <div className="bg-[#FAF7F2] p-4 rounded-xl text-sm text-[#1F2430]/80">
                    {word.greContext}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {word.synonyms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
                      Synonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms.map((syn) => (
                        <span
                          key={syn}
                          className="px-3 py-1 bg-white border border-[#D6CFC4] rounded-lg text-sm"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {word.antonyms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mb-2">
                      Antonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {word.antonyms.map((ant) => (
                        <span
                          key={ant}
                          className="px-3 py-1 bg-white border border-[#D6CFC4] rounded-lg text-sm text-[#1F2430]/60"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mnemonic / Notes */}
            <div className="border-t border-[#D6CFC4]/50 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> My Note & Mnemonic
                </h3>
                {!isEditingNote && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNote(true)}
                    className="h-8 text-[#E8743B]"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {isEditingNote ? (
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#D6CFC4] flex flex-col gap-3">
                  <textarea
                    className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[#1F2430] resize-none outline-none"
                    rows={3}
                    value={noteVal}
                    onChange={(e) => setNoteVal(e.target.value)}
                    placeholder="Add a personal mnemonic to remember this word..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingNote(false);
                        setNoteVal(word.userNote ?? '');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleSaveNote} disabled={saving}>
                      <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FAF7F2] p-4 rounded-xl text-[#1F2430]/80">
                  {word.userNote ? (
                    word.userNote
                  ) : (
                    <span className="opacity-50 italic">
                      No notes yet. Add one to help it stick!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* SM-2 Analytics */}
            <div className="border-t border-[#D6CFC4]/50 pt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Learning Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#D6CFC4] rounded-xl p-3">
                  <div className="text-[10px] uppercase text-[#1F2430]/50 font-bold mb-1">
                    Times Seen
                  </div>
                  <div className="font-mono text-xl">{word.timesSeen}</div>
                </div>
                <div className="bg-white border border-[#D6CFC4] rounded-xl p-3">
                  <div className="text-[10px] uppercase text-red-500 font-bold mb-1">Times Wrong</div>
                  <div className="font-mono text-xl text-red-600">{word.timesWrong}</div>
                </div>
                <div className="bg-white border border-[#D6CFC4] rounded-xl p-3">
                  <div className="text-[10px] uppercase text-[#1F2430]/50 font-bold mb-1">Interval</div>
                  <div className="font-mono text-xl">
                    {word.intervalDays} {word.intervalDays === 1 ? 'day' : 'days'}
                  </div>
                </div>
                <div className="bg-white border border-[#D6CFC4] rounded-xl p-3">
                  <div className="text-[10px] uppercase text-[#1F2430]/50 font-bold mb-1 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Due
                  </div>
                  <div className="font-mono text-sm mt-1">
                    {word.dueDate ? new Date(word.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
