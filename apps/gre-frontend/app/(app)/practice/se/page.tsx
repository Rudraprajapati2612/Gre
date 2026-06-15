'use client';

import { useState, useEffect } from 'react';
import { listSEQuestions, submitSEAnswer } from '@/lib/api';
import type { SEQuestion } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function SEPage() {
  const [questions, setQuestions] = useState<SEQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswers: string[];
    explanation: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listSEQuestions({ limit: 20 })
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const question = questions[questionIndex];

  const handleSelect = (choice: string) => {
    if (submitted) return;
    if (selected.includes(choice)) {
      setSelected(selected.filter((s) => s !== choice));
    } else if (selected.length < 2) {
      setSelected([...selected, choice]);
    }
  };

  const handleSubmit = async () => {
    if (!question || selected.length !== 2) return;
    setSubmitting(true);
    try {
      const res = await submitSEAnswer(question.id, selected);
      setResult(res);
      setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    const nextIndex = (questionIndex + 1) % questions.length;
    setQuestionIndex(nextIndex);
    setSubmitted(false);
    setResult(null);
    setSelected([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-32">
        <h2 className="text-2xl font-serif font-bold mb-4 text-[#1F2430]">No questions available</h2>
        <p className="text-[#1F2430]/60 mb-8">
          Sentence Equivalence questions haven't been added yet.
        </p>
        <Button asChild variant="outline">
          <Link href="/practice">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Practice
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/practice"
          className="text-[#1F2430]/60 hover:text-[#1F2430] flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Practice Hub
        </Link>
        <div className="font-serif font-bold text-[#1F2430]">Sentence Equivalence</div>
        <div className="text-sm text-[#1F2430]/50">
          {questionIndex + 1} / {questions.length}
        </div>
      </header>

      <Card className="p-8 md:p-12 text-lg md:text-xl leading-relaxed text-[#1F2430] border-[#D6CFC4]/50 shadow-sm bg-white">
        {question.prompt.replace(/_+/, '_________________')}
      </Card>

      <div className="text-center text-sm font-bold uppercase tracking-wider text-[#1F2430]/40 mt-12 mb-4">
        Select Exactly Two Choices
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {question.options.map((choice) => {
          const isSelected = selected.includes(choice);
          const isCorrectAnswer = result?.correctAnswers.includes(choice);

          let stateClass = 'border-[#D6CFC4] hover:bg-[#FAF7F2] text-[#1F2430]';
          if (isSelected && !submitted)
            stateClass = 'border-[#E8743B] bg-[#E8743B]/10 text-[#E8743B] font-medium';
          else if (submitted) {
            if (isCorrectAnswer)
              stateClass = 'border-green-500 bg-green-50 text-green-700 font-medium';
            else if (isSelected && !isCorrectAnswer)
              stateClass = 'border-red-500 bg-red-50 text-red-700';
          }

          return (
            <button
              key={choice}
              onClick={() => handleSelect(choice)}
              disabled={submitted || (!isSelected && selected.length >= 2)}
              className={`w-full text-center py-4 px-6 rounded-xl border transition-all text-lg ${stateClass} ${
                submitted ? 'cursor-default' : 'cursor-pointer'
              } shadow-sm disabled:opacity-50`}
            >
              {choice}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center mt-12">
        {!submitted ? (
          <Button
            size="lg"
            disabled={selected.length !== 2 || submitting}
            onClick={handleSubmit}
            className="px-12 py-6 text-lg rounded-xl"
          >
            {submitting ? 'Checking…' : 'Submit Answers'}
          </Button>
        ) : (
          <div className="w-full">
            <div
              className={`p-6 rounded-2xl mb-6 flex items-start gap-4 border ${
                result?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              {result?.isCorrect ? (
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 shrink-0" />
              )}
              <div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    result?.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {result?.isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className="text-[#1F2430]/80 leading-relaxed">{result?.explanation}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button size="lg" onClick={handleNext} className="px-8">
                Next Question
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
