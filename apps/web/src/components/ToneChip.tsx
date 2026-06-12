import { cn } from "@/lib/utils";

type Tone = "formal" | "neutral" | "positive" | "negative" | "informal";

const TONE_STYLES: Record<Tone, string> = {
  formal: "bg-surface-muted text-ink-soft",
  neutral: "bg-surface-muted text-ink-soft",
  positive: "bg-success-wash text-success",
  negative: "bg-danger-wash text-danger",
  informal: "bg-amber-wash text-amber",
};

export function ToneChip({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider",
        TONE_STYLES[tone],
        className
      )}
    >
      {tone}
    </span>
  );
}
