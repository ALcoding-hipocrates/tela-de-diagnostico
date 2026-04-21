import { ArrowUp, ArrowDown } from "lucide-react";
import type { Hypothesis } from "@/types/session";
import { cn } from "@/lib/cn";

interface HypothesisListRowProps {
  hypothesis: Hypothesis;
  principal?: boolean;
  onClick?: () => void;
}

/**
 * Compact hypothesis row estilo mockup Hipócrates.
 * Mostra: marker colorido + nome + CID/evid + confiança + delta.
 */
export function HypothesisListRow({
  hypothesis,
  principal,
  onClick,
}: HypothesisListRowProps) {
  const { label, icd10, confidence, status, delta, citations } = hypothesis;
  const isDiscarded = status === "discarded";

  const markerColor =
    status === "active"
      ? "bg-clinical-glow"
      : status === "investigating"
        ? "bg-warning"
        : "bg-ink-400/50";

  const evidenceCount = citations?.length ?? 0;
  const needsDiscard = /descartar|descarte/i.test(label);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-[14px] border border-transparent px-3 py-3 text-left transition-colors hover:border-black/[0.06] hover:bg-surface",
        principal && "bg-clinical/[0.04]",
        isDiscarded && "opacity-70"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-[3px]",
          markerColor
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-[13px] font-semibold text-ink-900",
              needsDiscard && "text-ink-600"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "shrink-0 font-mono text-[15px] font-bold tabular-nums leading-none",
              status === "active"
                ? "text-clinical-700"
                : status === "investigating"
                  ? "text-warning"
                  : "text-ink-600"
            )}
          >
            {confidence}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10.5px] font-medium text-ink-400">
          <span className="font-mono tabular-nums">CID {icd10}</span>
          {evidenceCount > 0 && (
            <>
              <Separator />
              <span>{evidenceCount} evid.</span>
            </>
          )}
          {delta !== 0 && (
            <>
              <Separator />
              <span
                className={cn(
                  "flex items-center gap-0.5 font-mono font-semibold tabular-nums",
                  delta > 0 ? "text-clinical-700" : "text-danger"
                )}
              >
                {delta > 0 ? (
                  <ArrowUp size={10} />
                ) : (
                  <ArrowDown size={10} />
                )}
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

function Separator() {
  return <span className="h-0.5 w-0.5 rounded-full bg-ink-400/50" aria-hidden />;
}
