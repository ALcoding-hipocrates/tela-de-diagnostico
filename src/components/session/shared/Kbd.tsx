import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface KbdProps {
  children: ReactNode;
  className?: string;
  tone?: "default" | "muted";
}

export function Kbd({ children, className, tone = "default" }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border px-1.5 font-mono text-[10.5px] font-semibold tabular-nums leading-none",
        tone === "default"
          ? "border-black/10 bg-surface text-ink-600 shadow-[inset_0_-1px_0_rgba(15,20,25,0.05)]"
          : "border-black/[0.06] bg-surface-raised text-ink-400",
        className
      )}
    >
      {children}
    </kbd>
  );
}
