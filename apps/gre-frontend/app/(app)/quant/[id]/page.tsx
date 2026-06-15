import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QUANT_CHAPTERS } from '@/lib/quant-data';
import { Card } from '@/components/ui/card';

export default async function QuantChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chapter = QUANT_CHAPTERS.find(c => c.id === id);

  if (!chapter) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/quant" className="inline-flex items-center gap-2 text-sm font-medium text-[#1F2430]/50 hover:text-[#E8743B] transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to Basecamp
      </Link>

      <div className="space-y-6 mb-16">
        <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-[#1F2430]/40">GRE Quant · Study Notes</p>
        <h1 className="font-serif italic text-4xl md:text-5xl font-semibold leading-tight text-[#1F2430]">{chapter.title}</h1>
        <p className="text-xl text-[#1F2430]/60">{chapter.tagline}</p>
      </div>

      <section className="mb-16 space-y-6">
        <h2 className="uppercase tracking-[0.2em] text-xs font-bold text-[#1F2430]/40 border-b border-[#1F2430]/10 pb-4 mb-8">1 · Chapter Overview</h2>
        <Card className="p-6 md:p-8 space-y-4 bg-white shadow-sm border-[#1F2430]/5">
          {chapter.overview.map((para, i) => (
            <p key={i} className="text-[#1F2430]/80 leading-relaxed text-base md:text-lg">{para}</p>
          ))}
        </Card>
      </section>

      <section className="mb-16">
        <h2 className="uppercase tracking-[0.2em] text-xs font-bold text-[#1F2430]/40 border-b border-[#1F2430]/10 pb-4 mb-8">2 · The Concepts</h2>
        <div className="space-y-8">
          {chapter.concepts.map((concept) => (
            <Card key={concept.id} className="p-6 md:p-8 bg-white shadow-sm border-[#1F2430]/5 overflow-hidden">
              <h3 className="font-serif italic text-2xl font-medium mb-2">{concept.name}</h3>
              <p className="text-[#1F2430]/60 mb-8">{concept.tagline}</p>
              
              <div className="space-y-6">
                {concept.trigger && (
                  <div className="bg-[#1F2430]/5 border-l-[3px] border-[#1F2430] p-4 md:p-5 rounded-r-xl">
                    <span className="block uppercase tracking-[0.15em] text-[10px] font-bold text-[#1F2430]/80 mb-3">Trigger & Move</span>
                    <div className="text-[#1F2430]/90 leading-relaxed text-[15px]">{concept.trigger}</div>
                  </div>
                )}
                {concept.shortcut && (
                  <div className="bg-emerald-50 border-l-[3px] border-emerald-500 p-4 md:p-5 rounded-r-xl">
                    <span className="block uppercase tracking-[0.15em] text-[10px] font-bold text-emerald-800 mb-3">Logical Shortcut</span>
                    <div className="text-emerald-950/80 leading-relaxed text-[15px]">{concept.shortcut}</div>
                  </div>
                )}
                {concept.trap && (
                  <div className="bg-rose-50 border-l-[3px] border-rose-500 p-4 md:p-5 rounded-r-xl">
                    <span className="block uppercase tracking-[0.15em] text-[10px] font-bold text-rose-800 mb-3">Classic Trap</span>
                    <div className="text-rose-950/80 leading-relaxed text-[15px]">{concept.trap}</div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="uppercase tracking-[0.2em] text-xs font-bold text-[#1F2430]/40 border-b border-[#1F2430]/10 pb-4 mb-8">3 · Frequency</h2>
        <Card className="p-6 md:p-8 bg-white shadow-sm border-[#1F2430]/5 space-y-6">
          {chapter.frequency.map((freq, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start pb-6 border-b border-[#1F2430]/5 last:border-0 last:pb-0">
              <span className={`shrink-0 flex items-center justify-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${i === 0 ? 'bg-[#1F2430] text-white' : 'bg-[#1F2430]/10 text-[#1F2430]'}`}>
                {freq.rank}
              </span>
              <div className="text-[#1F2430]/80 leading-relaxed text-[15px]">{freq.content}</div>
            </div>
          ))}
        </Card>
      </section>

      <section className="mb-16">
        <h2 className="uppercase tracking-[0.2em] text-xs font-bold text-[#1F2430]/40 border-b border-[#1F2430]/10 pb-4 mb-8">4 · Worked Examples</h2>
        <div className="space-y-8">
          {chapter.examples.map((ex) => (
            <Card key={ex.id} className="p-6 md:p-8 bg-white shadow-sm border-[#1F2430]/5 overflow-hidden">
              <span className="block uppercase tracking-[0.15em] text-[10px] font-bold text-[#1F2430]/40 mb-4">{ex.title}</span>
              
              <div className="bg-[#FAF7F2] p-5 rounded-xl border border-[#1F2430]/5 text-lg font-medium text-[#1F2430] mb-6 overflow-x-auto">
                {ex.question}
              </div>

              <div className="space-y-3 mb-8">
                {ex.steps.map((step, i) => (
                  <div key={i} className="text-[#1F2430]/80 leading-relaxed text-[15px]">{step}</div>
                ))}
              </div>

              <div className="bg-[#FDF1E9] border-l-[3px] border-[#E8743B] p-4 md:p-5 rounded-r-xl">
                <span className="block uppercase tracking-[0.15em] text-[10px] font-bold text-[#E8743B] mb-3">Takeaway</span>
                <div className="text-[#E8743B]/90 leading-relaxed text-[15px] font-medium">{ex.takeaway}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="uppercase tracking-[0.2em] text-xs font-bold text-[#1F2430]/40 border-b border-[#1F2430]/10 pb-4 mb-8">5 · How to Approach</h2>
        <Card className="p-6 md:p-8 bg-white shadow-sm border-[#1F2430]/5">
          <p className="text-lg font-medium text-[#1F2430] mb-6">{chapter.checklist.intro}</p>
          <ol className="list-decimal pl-5 space-y-4 mb-10 text-[#1F2430]/80 leading-relaxed text-[15px] marker:font-bold marker:text-[#1F2430]/40">
            {chapter.checklist.items.map((item, i) => (
              <li key={i} className="pl-2">{item}</li>
            ))}
          </ol>

          <div className="bg-[#FAF7F2] border border-[#1F2430]/10 p-5 md:p-6 rounded-xl text-[#1F2430]/80 text-[15px] leading-relaxed">
            {chapter.checklist.encouragement}
          </div>
        </Card>
      </section>

    </div>
  );
}
