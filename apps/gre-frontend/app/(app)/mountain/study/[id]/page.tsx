'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMountainGroup, markMountainWord, saveMountainNote, saveMountainMeaning } from '@/lib/api';
import type { Word } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Edit3, Volume2 } from 'lucide-react';
import Link from 'next/link';

export default function StudyGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const groupId = parseInt(resolvedParams.id, 10);

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [editingMeaning, setEditingMeaning] = useState(false);
  const [meaningValue, setMeaningValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMountainGroup(groupId, 'all', 'default')
      .then(setWords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [groupId]);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (currentWord) {
      setNoteValue(currentWord.userNote ?? '');
      setMeaningValue(currentWord.userMeaning ?? '');
    }
  }, [currentWord]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-serif font-bold mb-4">Group not found or empty</h2>
        <Button asChild>
          <Link href="/mountain">Back to Mountain</Link>
        </Button>
      </div>
    );
  }

  const handleNext = async (result: 'knew' | 'forgot') => {
    if (currentWord) {
      markMountainWord(currentWord.id, result).catch(() => {});
    }

    if (currentIndex < words.length - 1) {
      setIsFlipped(false);
      setEditingNote(false);
      setEditingMeaning(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150);
    } else {
      router.push('/mountain');
    }
  };

  const handleSaveNote = async () => {
    if (!currentWord) return;
    setSaving(true);
    try {
      await saveMountainNote(currentWord.id, noteValue);
      setWords((prev) =>
        prev.map((w) => (w.id === currentWord.id ? { ...w, userNote: noteValue } : w)),
      );
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
      setEditingNote(false);
    }
  };

  const handleSaveMeaning = async () => {
    if (!currentWord) return;
    setSaving(true);
    try {
      await saveMountainMeaning(currentWord.id, meaningValue);
      setWords((prev) =>
        prev.map((w) => (w.id === currentWord.id ? { ...w, userMeaning: meaningValue } : w)),
      );
    } catch {
      // silently ignore
    } finally {
      setSaving(false);
      setEditingMeaning(false);
    }
  };

  const progressLine = (currentIndex / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/mountain"
          className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Exit
        </Link>
        <div className="font-serif font-bold">Group {groupId}</div>
        <div className="text-sm font-medium text-[#1F2430]/60">
          {currentIndex + 1} / {words.length}
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
            className="w-full h-full min-h-[400px] absolute inset-0 cursor-pointer"
            onClick={() => !isFlipped && !editingNote && !editingMeaning && setIsFlipped(true)}
          >
            <Card
              className={`w-full h-full flex flex-col items-center justify-center p-8 lg:p-12 text-center bg-white border-${
                isFlipped ? '[#E8743B]/30' : '[#D6CFC4]/50'
              } shadow-sm`}
            >
              {!isFlipped ? (
                <div
                  className="w-full flex flex-col items-center h-full"
                  onClick={(e) => editingMeaning && e.stopPropagation()}
                >
                  <p className="text-xs font-bold tracking-widest uppercase text-[#1F2430]/40 mb-6">
                    {currentWord.tone} tone
                  </p>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#1F2430] mb-6">
                    {currentWord.word}
                  </h2>

                  {/* My Meaning — front face */}
                  <div
                    className="w-full bg-[#FAF7F2] rounded-xl p-4 border border-[#D6CFC4]/50 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold tracking-wider uppercase text-[#1F2430]/40">
                        My Meaning
                      </h4>
                      {!editingMeaning && (
                        <button
                          onClick={() => setEditingMeaning(true)}
                          className="text-[#1F2430]/50 hover:text-[#E8743B]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {editingMeaning ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="w-full bg-white border border-[#D6CFC4] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8743B]/50"
                          rows={2}
                          placeholder="Write what you think this word means..."
                          value={meaningValue}
                          onChange={(e) => setMeaningValue(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMeaning(false);
                              setMeaningValue(currentWord.userMeaning ?? '');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveMeaning} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#1F2430]/80">
                        {currentWord.userMeaning ? (
                          currentWord.userMeaning
                        ) : (
                          <span className="text-[#1F2430]/40 italic">
                            Add your own meaning before flipping...
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {!editingMeaning && (
                    <p className="text-[#1F2430]/50 text-sm mt-6 animate-pulse">
                      Tap to reveal meaning
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className="w-full text-left flex flex-col h-full cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-[#D6CFC4]/30 pb-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-3xl font-serif font-bold text-[#1F2430]">
                        {currentWord.word}
                      </h2>
                      <button className="p-2 text-[#1F2430]/40 hover:text-[#E8743B] transition-colors">
                        <Volume2 className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-lg text-[#1F2430]/90 leading-relaxed">{currentWord.meaning}</p>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-2">
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

                    {/* My Meaning — back face (editable) */}
                    <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#D6CFC4]/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold tracking-wider uppercase text-[#1F2430]/40">
                          My Meaning
                        </h4>
                        {!editingMeaning && (
                          <button
                            onClick={() => setEditingMeaning(true)}
                            className="text-[#1F2430]/50 hover:text-[#E8743B]"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {editingMeaning ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="w-full bg-white border border-[#D6CFC4] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8743B]/50"
                            rows={2}
                            placeholder="Write what you think this word means..."
                            value={meaningValue}
                            onChange={(e) => setMeaningValue(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMeaning(false);
                                setMeaningValue(currentWord.userMeaning ?? '');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveMeaning} disabled={saving}>
                              {saving ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#1F2430]/80">
                          {currentWord.userMeaning ? (
                            currentWord.userMeaning
                          ) : (
                            <span className="text-[#1F2430]/40 italic">
                              Add your own meaning...
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#D6CFC4]/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold tracking-wider uppercase text-[#1F2430]/40">
                          My Mnemonic
                        </h4>
                        {!editingNote && (
                          <button
                            onClick={() => setEditingNote(true)}
                            className="text-[#1F2430]/50 hover:text-[#E8743B]"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {editingNote ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="w-full bg-white border border-[#D6CFC4] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8743B]/50"
                            rows={3}
                            placeholder="How will you remember this?"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingNote(false);
                                setNoteValue(currentWord.userNote ?? '');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveNote} disabled={saving}>
                              {saving ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#1F2430]/80">
                          {currentWord.userNote ? (
                            currentWord.userNote
                          ) : (
                            <span className="text-[#1F2430]/40 italic">
                              Add a note to help you remember...
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {isFlipped && !editingNote && !editingMeaning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid grid-cols-2 gap-4"
        >
          <Button
            size="lg"
            variant="secondary"
            onClick={() => handleNext('forgot')}
            className="py-6 text-lg rounded-2xl gap-2 font-bold group"
          >
            <X className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" /> Forgot
          </Button>
          <Button
            size="lg"
            onClick={() => handleNext('knew')}
            className="py-6 text-lg rounded-2xl gap-2 font-bold group bg-[#1F2430] hover:bg-[#1F2430]/90 text-white"
          >
            <Check className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" /> Knew
            it
          </Button>
        </motion.div>
      )}
    </div>
  );
}
