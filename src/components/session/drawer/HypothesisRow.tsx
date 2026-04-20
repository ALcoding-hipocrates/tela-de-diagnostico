import { ArrowUpRight, ArrowDownRight, BookOpen } from "lucide-react";
import type { Hypothesis, HypothesisStatus } from "@/types/session";
import { cn } from "@/lib/cn";
import { CidCode } from "../shared/CidCode";
import { Sparkline } from "./Sparkline";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";

interface HypothesisRowProps {
  hypothesis: Hypothesis;
  onFocus: () => void;
}

export function HypothesisRow({ hypothesis, onFocus }: HypothesisRowProps) {
  const { label, icd10, confidence, status, delta } = hypothesis;
  const isDiscarded = status === "discarded";

  return (
    <div className="group/row relative">
      <button
        type="button"
        onClick={onFocus}
        title="Focar nesta hipótese"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]",
          isDiscarded && "opacity-70"
        )}
      >
        <StatusDot status={status} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-900">
          {label}
        </span>
        <CidCode
          code={icd10}
          className="shrink-0 text-[11px] font-semibold text-ink-400"
        />
        <span className="flex shrink-0 items-center gap-0.5">
          <span className="font-mono text-[13px] font-semibold text-ink-900 tabular-nums">
            {confidence}%
          </span>
          {delta > 0 && <ArrowUpRight size={11} className="text-clinical" />}
          {delta < 0 && <ArrowDownRight size={11} className="text-danger" />}
        </span>
      </button>

      <HoverPreview hypothesis={hypothesis} />
    </div>
  );
}

function HoverPreview({ hypothesis }: { hypothesis: Hypothesis }) {
  const { label, confidence, status, delta, trigger, sparkline } = hypothesis;
  const hasSparkline = sparkline.length >= 2;
  const citations = hypothesis.citations ?? [];
  const toneClass =
    status === "active"
      ? "text-clinical"
      : status === "investigating"
        ? "text-warning"
        : "text-ink-400";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-full top-1/2 z-20 mr-2 w-[280px] -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100"
    >
      <div className="rounded-lg border border-black/[0.08] bg-surface p-3 shadow-[var(--shadow-card-floating)] animate-fade-in">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold text-ink-900">
            {label}
          </span>
          <span className="flex items-baseline gap-1">
            <span className="font-mono text-[18px] font-bold leading-none tabular-nums text-ink-900">
              {confidence}
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-400">
              %
            </span>
          </span>
        </div>

        {hasSparkline && (
          <div className={cn("mt-2", toneClass)}>
            <Sparkline points={sparkline} width={256} height={30} />
          </div>
        )}

        {trigger && (
          <p className="mt-2 text-[11px] leading-snug text-ink-600">
            <span className="text-ink-400">
              {delta > 0 ? "Subiu após" : delta < 0 ? "Caiu após" : "Último:"}
            </span>{" "}
            {trigger}
          </p>
        )}

        {citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-black/[0.04] pt-2">
            {citations.slice(0, 3).map((id) => {
              const g = getGuidelineById(id);
              if (!g) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-surface-raised px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink-600"
                >
                  <BookOpen size={8} className="text-clinical" />
                  {formatGuidelineHeader(g)}
                </span>
              );
            })}
            {citations.length > 3 && (
              <span className="text-[10px] font-medium text-ink-400">
                +{citations.length - 3}
              </span>
            )}
          </div>
        )}

        <p className="mt-2 text-[10px] italic text-ink-400">
          Clique pra focar nesta hipótese
        </p>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: HypothesisStatus }) {
  const color =
    status === "active"
      ? "bg-clinical"
      : status === "investigating"
        ? "bg-warning"
        : "bg-ink-400/50";
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} />;
}
