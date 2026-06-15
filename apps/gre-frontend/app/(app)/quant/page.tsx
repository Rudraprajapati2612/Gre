import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { QUANT_CHAPTERS } from '@/lib/quant-data';
import * as motion from 'framer-motion/client';

export default function QuantIndexPage() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-4xl mx-auto">
      <header className="mb-10 space-y-2">
        <h1 className="font-serif italic text-4xl font-semibold leading-tight">Quant Basecamp</h1>
        <p className="text-[#1F2430]/60 text-lg">Master the logic. Skip the arithmetic.</p>
      </header>

      <div className="flex flex-col gap-6">
        {QUANT_CHAPTERS.map((chapter, i) => (
          <motion.div 
            key={chapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:border-[#E8743B]/30 hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E8743B] opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="uppercase tracking-[0.2em] text-[10px] font-bold text-[#1F2430]/40">Chapter {i + 1}</span>
                    {chapter.isStudied && (
                      <span className="flex items-center gap-1 text-[10px] tracking-wider uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Reviewed
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif italic text-2xl font-medium text-[#1F2430] group-hover:text-[#E8743B] transition-colors">{chapter.title}</h2>
                  <p className="text-[#1F2430]/60 max-w-lg">{chapter.tagline}</p>
                </div>
                <div className="shrink-0 flex items-center justify-end">
                  <Button asChild variant="outline" className="border-[#1F2430] group-hover:bg-[#1F2430] group-hover:text-white transition-all h-12 px-6">
                    <Link href={`/quant/${chapter.id}`}>
                      Read Notes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
