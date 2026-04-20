import { ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import type { HypothesisShift } from "@/types/session";
import { cn } from "@/lib/cn";
import { ShiftImpactPopover } from "./ShiftImpactPopover";

interface HypothesisShiftChipProps {
  shifts: HypothesisShift[];
  timestampSec: number;
}

export function HypothesisShiftChip({
  shifts,
  timestampSec,
}: HypothesisShiftChipProps) {
  return (
    <div
      className="my-1.5 flex justify-center animate-pop-in"
      role="note"
      aria-label="Mudança de hipóteses"
    >
      <ShiftImpactPopover shifts={shifts} label="Ver detalhes do impacto">
        <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 transition-colors hover:bg-black/[0.04]">
          <Sparkles size={11} className="text-clinical" aria-hidden />
          {shifts.map((s, i) => {
            const up = s.to > s.from;
            const delta = s.to - s.from;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-medium"
              >
                {i > 0 && <span className="text-ink-400/60">·</span>}
                <span className="font-sans font-semibold text-ink-900">
                  {s.hypothesisLabel}
                </span>
                <span className="text-ink-400 tabular-nums">{s.from}%</span>
                {up ? (
                  <ArrowUpRight size={10} className="text-clinical-700" />
                ) : (
                  <ArrowDownRight size={10} className="text-danger" />
                )}
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    up ? "text-clinical-700" : "text-danger"
                  )}
                >
                  {s.to}%
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tabular-nums",
                    up ? "text-clinical-700/70" : "text-danger/70"
                  )}
                >
                  ({up ? "+" : ""}
                  {delta})
                </span>
              </span>
            );
          })}
          <span className="ml-1 font-mono text-[11px] tabular-nums text-ink-400">
            {formatTime(timestampSec)}
          </span>
        </span>
      </ShiftImpactPopover>
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
