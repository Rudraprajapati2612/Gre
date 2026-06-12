"use client";

import { useEffect, useState } from "react";

export function ProgressRing({ due, done }: { due: number; done: number }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Add small delay to trigger animation after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const radius = 64;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Prevent division by zero
  const percentage = due === 0 ? 100 : (done / due) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-6">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 transition-transform duration-500"
      >
        {/* Track */}
        <circle
          stroke="var(--brand-wash)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="opacity-50"
        />
        {/* Fill */}
        <circle
          stroke="var(--brand)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ 
            strokeDashoffset: mounted ? strokeDashoffset : circumference,
            transition: 'stroke-dashoffset 1s ease-out'
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-display text-4xl text-ink tracking-tight mb-1">
          {done}<span className="text-2xl text-ink-soft">/{due}</span>
        </span>
        <span className="text-sm text-ink-soft font-medium uppercase tracking-wider">Words</span>
      </div>
    </div>
  );
}
