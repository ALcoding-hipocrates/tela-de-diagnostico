import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/10 bg-surface-raised/40 px-6 py-8 text-center",
        className
      )}
    >
      <div className="text-ink-400/70">{illustration}</div>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-ink-900">{title}</p>
        <p className="mx-auto max-w-[340px] text-[12px] leading-snug text-ink-600">
          {description}
        </p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function PrescriptionEmptyIllustration() {
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      fill="none"
      aria-hidden
      className="text-clinical/50"
    >
      <rect
        x="14"
        y="6"
        width="44"
        height="44"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M22 18h18M22 26h24M22 34h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="52" cy="40" r="10" fill="var(--color-surface)" />
      <circle
        cx="52"
        cy="40"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M48 40h8M52 36v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ExamsEmptyIllustration() {
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      fill="none"
      aria-hidden
      className="text-clinical/50"
    >
      <path
        d="M18 10h24l10 10v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M42 10v10h10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M22 30h20M22 36h14M22 42h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="52"
        cy="48"
        r="6"
        fill="var(--color-surface)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m56 52 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HypothesisEmptyIllustration() {
  return (
    <svg
      width="72"
      height="56"
      viewBox="0 0 72 56"
      fill="none"
      aria-hidden
      className="text-clinical/50"
    >
      <path
        d="M36 10c-9 0-16 7-16 16 0 5 2 9 6 12v6a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6c4-3 6-7 6-12 0-9-7-16-16-16Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M30 47h12M32 51h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M32 26a4 4 0 1 1 8 0M36 30v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="36" cy="38" r="1.25" fill="currentColor" />
    </svg>
  );
}
