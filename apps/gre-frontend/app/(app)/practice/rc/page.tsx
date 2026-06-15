'use client';

import { useState, useEffect } from 'react';
import { listRCPassages, getRCPassage, submitRCAnswer } from '@/lib/api';
import type { RCPassage } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const TRAP_OPTIONS = ['Extreme', 'Out of Scope', 'Half Right / Half Wrong', 'True but Irrelevant'];

export default function RCPage() {
  const [passages, setPassages] = useState<any[]>([]);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [passage, setPassage] = useState<RCPassage | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [selectedTrap, setSelectedTrap] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    trap_types?: any[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listRCPassages({ limit: 20 })
      .then(setPassages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPassage = async (id: string) => {
    setSelectedPassageId(id);
    setLoadingPassage(true);
    setQuestionIndex(0);
    setSelected(-1);
    setSelectedTrap('');
    setSubmitted(false);
    setResult(null);
    try {
      const p = await getRCPassage(id);
      setPassage(p);
    } catch {
      // ignore
    } finally {
      setLoadingPassage(false);
    }
  };

  const handleSubmit = async () => {
    if (!passage || selected === -1) return;
    const question = passage.questions[questionIndex];
    if (!question) return;
    setSubmitting(true);
    try {
      const res = await submitRCAnswer(
        question.id,
        selected,
        selectedTrap ? [selectedTrap] : undefined,
      );
      setResult(res);
      setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!passage) return;
    if (questionIndex < passage.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      setSelectedPassageId(null);
      setPassage(null);
      setQuestionIndex(0);
    }
    setSelected(-1);
    setSelectedTrap('');
    setSubmitted(false);
    setResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  // Passage list view
  if (!selectedPassageId && !passage) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/practice"
            className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Practice Hub
          </Link>
          <div className="font-serif font-bold text-[#1F2430]">Reading Comprehension</div>
          <div />
        </header>

        {passages.length === 0 ? (
          <div className="text-center py-20 text-[#1F2430]/50">
            No passages available yet.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[#1F2430]/60 text-sm">Select a passage to begin:</p>
            {passages.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPassage(p.id)}
                className="w-full text-left p-6 rounded-2xl border border-[#D6CFC4]/50 bg-white hover:border-[#E8743B]/30 hover:shadow-sm transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="font-serif font-bold text-[#1F2430] text-lg group-hover:text-[#E8743B] transition-colors">
                    {p.title ?? 'Untitled Passage'}
                  </div>
                  {p.subject && (
                    <div className="text-xs uppercase tracking-wider text-[#1F2430]/40 mt-1 font-bold">
                      {p.subject.replace('_', ' ')}
                    </div>
                  )}
                  <div className="text-sm text-[#1F2430]/50 mt-1">
                    {p.question_count ?? 0} {(p.question_count ?? 0) === 1 ? 'question' : 'questions'}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-[#1F2430]/30 group-hover:text-[#E8743B] transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loadingPassage || !passage) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  const question = passage.questions[questionIndex];
  if (!question) return null;

  // Split body into paragraphs
  const paragraphs = passage.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setSelectedPassageId(null);
            setPassage(null);
          }}
          className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Passages
        </button>
        <div className="font-serif font-bold text-[#1F2430]">Reading Comprehension</div>
        <div className="text-sm text-[#1F2430]/50">
          Q {questionIndex + 1} / {passage.questions.length}
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Passage */}
        <Card className="h-[600px] flex flex-col bg-[#FAF7F2] border-[#D6CFC4] shadow-none">
          <div className="p-4 border-b border-[#D6CFC4]/50 font-serif font-bold text-lg text-center bg-white/50 backdrop-blur rounded-t-xl">
            {passage.title ?? 'Passage'}
          </div>
          <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 text-justify font-serif text-lg leading-relaxed text-[#1F2430]">
            {paragraphs.map((para, i) => (
              <p key={i} className="indent-8">
                {para}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Right: Question */}
        <div className="space-y-6">
          <Card className="p-6 md:p-8 border-[#D6CFC4]/50 shadow-sm">
            <h3 className="text-xl font-bold mb-6 font-serif leading-relaxed text-[#1F2430]">
              {question.question}
            </h3>

            <div className="space-y-3">
              {question.options.map((choice, i) => {
                const isSelectedOption = selected === i;
                const isCorrect = result?.correctIndex === i;

                let stateClass = 'border-[#D6CFC4] hover:bg-[#FAF7F2]';
                if (isSelectedOption && !submitted)
                  stateClass = 'border-[#E8743B] bg-[#E8743B]/10';
                else if (submitted) {
                  if (isCorrect) stateClass = 'border-green-500 bg-green-50';
                  else if (isSelectedOption && !isCorrect) stateClass = 'border-red-500 bg-red-50';
                }

                const trapType = result?.trap_types?.[i];

                return (
                  <div key={i} className="space-y-2">
                    <button
                      onClick={() => !submitted && setSelected(i)}
                      disabled={submitted}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${stateClass} ${
                        submitted ? 'cursor-default' : 'cursor-pointer'
                      } flex items-start gap-3`}
                    >
                      <div
                        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                          isSelectedOption
                            ? submitted && !isCorrect
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-[#E8743B] bg-[#E8743B] text-white'
                            : submitted && isCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-[#1F2430]/30'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span
                        className={`text-base leading-relaxed ${
                          isSelectedOption ? 'font-medium text-[#1F2430]' : 'text-[#1F2430]/80'
                        }`}
                      >
                        {choice}
                      </span>
                    </button>

                    {submitted && !isCorrect && isSelectedOption && trapType && (
                      <div className="pl-10 text-sm text-red-600 font-medium flex items-center gap-1.5 animate-in slide-in-from-top-1">
                        <AlertTriangle className="h-4 w-4" /> This was a {trapType} trap.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trap identification */}
            {!submitted && selected !== -1 && (
              <div className="mt-8 p-4 bg-[#FAF7F2] rounded-xl border border-[#D6CFC4]/50 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm font-bold text-[#1F2430]/60 mb-3 uppercase tracking-wider">
                  Before you submit: Flag a trap (Optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRAP_OPTIONS.map((trap) => (
                    <button
                      key={trap}
                      onClick={() => setSelectedTrap(trap === selectedTrap ? '' : trap)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        selectedTrap === trap
                          ? 'bg-[#1F2430] text-white border-[#1F2430]'
                          : 'bg-white text-[#1F2430]/70 border-[#D6CFC4] hover:border-[#1F2430]/30'
                      } transition-colors`}
                    >
                      {trap}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              {!submitted ? (
                <Button
                  className="w-full h-12 text-lg rounded-xl"
                  disabled={selected === -1 || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Checking…' : 'Submit Answer'}
                </Button>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  <div
                    className={`p-5 rounded-2xl mb-4 flex items-start gap-3 border ${
                      result?.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {result?.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3
                        className={`text-lg font-bold mb-1 ${
                          result?.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {result?.isCorrect ? 'Correct!' : 'Incorrect'}
                      </h3>
                      <p className="text-sm text-[#1F2430]/80 leading-relaxed">
                        {result?.explanation}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg rounded-xl"
                    onClick={handleNextQuestion}
                  >
                    {questionIndex < passage.questions.length - 1
                      ? 'Next Question'
                      : 'Back to Passages'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
