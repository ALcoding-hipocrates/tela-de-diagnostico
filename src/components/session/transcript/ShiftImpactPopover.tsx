import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, TrendingUp, Sparkles } from "lucide-react";
import type { HypothesisShift } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";

interface ShiftImpactPopoverProps {
  shifts: HypothesisShift[];
  align?: "left" | "center" | "right";
  placement?: "top" | "bottom";
  children: ReactNode;
  label?: string;
}

export function ShiftImpactPopover({
  shifts,
  align = "center",
  placement = "bottom",
  children,
  label,
}: ShiftImpactPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const alignClass =
    align === "right"
      ? "right-0"
      : align === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";
  const placementClass =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={label ?? "Ver impacto no raciocínio"}
        className="inline-flex align-baseline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-clinical/40 rounded"
      >
        {children}
      </button>
      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute z-40 w-[320px] overflow-hidden rounded-lg border border-black/10 bg-surface text-left shadow-xl animate-pop-in",
            alignClass,
            placementClass
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <PopoverContent shifts={shifts} />
        </div>
      )}
    </span>
  );
}

function PopoverContent({ shifts }: { shifts: HypothesisShift[] }) {
  const hypotheses = useSessionStore((s) => s.hypotheses);

  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-2 border-b border-black/[0.06] bg-surface-raised px-3 py-2.5">
        <Sparkles size={13} className="text-clinical-700" />
        <h4 className="text-[13px] font-semibold text-ink-900">
          Impacto no raciocínio
        </h4>
        <span className="ml-auto font-mono text-[11px] font-semibold tabular-nums text-ink-600">
          {shifts.length} hipótese{shifts.length === 1 ? "" : "s"}
        </span>
      </header>

      <ul className="flex flex-col divide-y divide-black/5">
        {shifts.map((shift, i) => {
          const h = shift.icd10
            ? hypotheses.find((x) => x.icd10 === shift.icd10)
            : undefined;
          const hypothesisLabel = h?.label ?? shift.hypothesisLabel;
          const delta = shift.to - shift.from;
          const up = delta > 0;

          return (
            <li key={i} className="flex flex-col gap-1.5 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-ink-900">
                  {hypothesisLabel}
                </span>
                {h?.icd10 && (
                  <span className="font-mono text-label font-semibold text-ink-400">
                    {h.icd10}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[13px] tabular-nums text-ink-400">
                  {shift.from}%
                </span>
                <TrendingUp
                  size={12}
                  className={cn(up ? "text-clinical-700" : "text-danger", !up && "rotate-180")}
                />
                <span
                  className={cn(
                    "font-mono text-[18px] font-bold tabular-nums leading-none",
                    up ? "text-clinical-700" : "text-danger"
                  )}
                >
                  {shift.to}%
                </span>
                <span
                  className={cn(
                    "font-mono text-[12px] font-bold tabular-nums",
                    up ? "text-clinical-700/80" : "text-danger/80"
                  )}
                >
                  ({up ? "+" : ""}
                  {delta}%)
                </span>
              </div>

              {shift.rationale && (
                <p className="text-[12px] font-medium leading-snug text-ink-600">
                  {shift.rationale}
                </p>
              )}

              {h?.citations && h.citations.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {h.citations.map((cid) => {
                    const g = getGuidelineById(cid);
                    if (!g) return null;
                    return (
                      <span
                        key={cid}
                        title={g.excerpt}
                        className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-600"
                      >
                        <BookOpen size={8} className="text-clinical" />
                        {formatGuidelineHeader(g)}
                      </span>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
