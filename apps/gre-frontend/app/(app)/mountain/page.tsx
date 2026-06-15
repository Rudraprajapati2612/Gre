'use client';

import { useEffect, useState } from 'react';
import { listMountainGroups } from '@/lib/api';
import type { MountainGroup } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, PlayCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MountainPage() {
  const [groups, setGroups] = useState<MountainGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMountainGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-4 border-[#E8743B]/30 border-t-[#E8743B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-serif font-bold text-[#1F2430]">The Mountain</h1>
        <p className="text-[#1F2430]/70 mt-1">Conquer vocabulary in manageable chunks.</p>
      </header>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-[#1F2430]/50">
          No word groups found. Add some words to the database first.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`h-full flex flex-col ${group.isComplete ? 'border-[#E8743B]/30 bg-[#FAF7F2]' : ''}`}
              >
                <CardHeader className="pb-3 border-b border-[#D6CFC4]/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">Group {group.id}</CardTitle>
                    {group.isComplete && <CheckCircle2 className="h-5 w-5 text-[#E8743B]" />}
                  </div>
                </CardHeader>
                <CardContent className="py-4 flex-1">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-[#1F2430]/60">Total Words</span>
                    <span className="font-semibold">{group.totalWords}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#EBE5DA] rounded-lg py-2">
                      <div className="font-bold text-[#1F2430]">{group.unseen}</div>
                      <div className="text-[#1F2430]/60">Unseen</div>
                    </div>
                    <div className="bg-[#E8743B]/10 rounded-lg py-2">
                      <div className="font-bold text-[#E8743B]">{group.knew}</div>
                      <div className="text-[#E8743B]/60">Knew</div>
                    </div>
                    <div className="bg-[#1F2430]/5 rounded-lg py-2">
                      <div className="font-bold text-[#1F2430]">{group.forgot}</div>
                      <div className="text-[#1F2430]/60">Forgot</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    asChild
                    className="w-full gap-2"
                    variant={group.isComplete ? 'outline' : 'default'}
                  >
                    <Link href={`/mountain/study/${group.id}`}>
                      {group.isComplete ? (
                        <>
                          <RotateCcw className="h-4 w-4" /> Re-climb
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4" /> Start
                        </>
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
