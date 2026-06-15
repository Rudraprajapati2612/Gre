'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PenTool, Target, AlignLeft, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PracticePage() {
  const sections = [
    {
      id: 'tc',
      name: 'Text Completion',
      desc: 'Fill in 1 to 3 blanks in a sentence or short paragraph.',
      icon: <Scissors className="h-6 w-6 text-[#E8743B]" />,
      path: '/practice/tc'
    },
    {
      id: 'se',
      name: 'Sentence Equivalence',
      desc: 'Pick exactly 2 words that complete the sentence to mean the same thing.',
      icon: <Target className="h-6 w-6 text-[#E8743B]" />,
      path: '/practice/se'
    },
    {
      id: 'rc',
      name: 'Reading Comprehension',
      desc: 'Read passages and answer questions based on the text.',
      icon: <AlignLeft className="h-6 w-6 text-[#E8743B]" />,
      path: '/practice/rc'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#1F2430]">Practice Area</h1>
        <p className="text-[#1F2430]/70 mt-1">Apply your knowledge to real GRE question formats.</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {sections.map((sec, i) => (
          <motion.div 
            key={sec.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link href={sec.path}>
              <Card className="h-full hover:border-[#E8743B]/50 transition-all hover:shadow-md cursor-pointer group">
                <CardHeader>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl inline-flex mb-4 group-hover:scale-110 transition-transform">
                    {sec.icon}
                  </div>
                  <CardTitle className="text-xl">{sec.name}</CardTitle>
                  <CardDescription>{sec.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
