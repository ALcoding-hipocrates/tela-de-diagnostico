import { Fragment, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, Search } from "lucide-react";
import type { Hypothesis, HypothesisStatus, SparklinePoint } from "@/types/session";
import { cn } from "@/lib/cn";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { CidCode } from "../shared/CidCode";
import { Sparkline } from "./Sparkline";
import { AssumptionsList } from "./AssumptionsList";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  forceExpanded?: boolean;
}

export function HypothesisCard({ hypothesis, forceExpanded = false }: HypothesisCardProps) {
  const { label, icd10, confidence, status, delta, trigger, sparkline } = hypothesis;
  const [cardExpanded, setCardExpanded] = useState(false);
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const isDiscarded = status === "discarded";
  const canBreakdown = sparkline.length >= 2;
  const expanded = forceExpanded || cardExpanded;

  // D7: micro-feedback — pulsa o card + número quando a confiança muda
  const prevConfidence = useRef(confidence);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (prevConfidence.current !== confidence) {
      prevConfidence.current = confidence;
      setPulseKey((k) => k + 1);
    }
  }, [confidence]);

  const confLabel = confidenceLabel(confidence, status);
  const confColor = confidenceColor(confidence, status);

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h4
          className={cn(
            "truncate text-ink-900",
            forceExpanded
              ? "text-[15px] font-medium tracking-tight"
              : "text-[14px] font-medium tracking-tight"
          )}
        >
          {label}
        </h4>
        <span
          className={cn(
            "text-[9px] font-semibold uppercase tracking-ultra",
            confColor.label
          )}
        >
          {confLabel}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <CidCode
          code={icd10}
          className="text-[10px] font-medium tracking-[0.04em] text-ink-400"
        />
        {!forceExpanded && (
          <ChevronDown
            size={14}
            className={cn(
              "mt-0.5 shrink-0 text-ink-400 transition-transform",
              cardExpanded && "rotate-180"
            )}
            aria-hidden
          />
        )}
      </div>
    </div>
  );

  const progressBar = (
    <div className="mt-5 h-[2px] w-full overflow-hidden rounded-full bg-black/[0.06]">
      <div
        key={`bar-${pulseKey}`}
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          confColor.bar,
          pulseKey > 0 && "animate-number-bump"
        )}
        style={{ width: `${confidence}%` }}
      />
    </div>
  );

  return (
    <article
      key={`card-${pulseKey}`}
      className={cn(
        "overflow-hidden border bg-surface transition-all",
        forceExpanded ? "rounded-[28px]" : "rounded-[20px]",
        isDiscarded
          ? "border-black/5 opacity-70"
          : "border-black/[0.05]",
        pulseKey > 0 && "animate-success-pulse"
      )}
    >
      {forceExpanded ? (
        <div className="px-6 py-5">
          {header}
          {progressBar}
          {hypothesis.assumptions && hypothesis.assumptions.length > 0 && (
            <AssumptionsList
              icd10={icd10}
              assumptions={hypothesis.assumptions}
            />
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCardExpanded((v) => !v)}
          aria-expanded={cardExpanded}
          className="w-full px-5 py-4 text-left transition-colors hover:bg-black/[0.015]"
        >
          {header}
          {progressBar}
        </button>
      )}

      {expanded && (
        <div
          className={cn(
            "px-3 py-3",
            forceExpanded
              ? "border-t border-black/[0.06]"
              : "border-t border-black/[0.06] bg-surface-raised/40"
          )}
        >
          <div className={cn(getSparklineTone(status))}>
            <Sparkline points={sparkline} width={260} height={32} />
          </div>

          {trigger && (
            <p className="mt-2 text-[13px] font-medium text-ink-600">
              <span className="text-ink-400">
                {delta > 0 ? "Subiu após" : delta < 0 ? "Caiu após" : "Último evento:"}
              </span>{" "}
              {trigger}
            </p>
          )}

          {hypothesis.citations && hypothesis.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hypothesis.citations.map((id) => {
                const g = getGuidelineById(id);
                if (!g) return null;
                return (
                  <span
                    key={id}
                    title={`${g.title} — ${g.excerpt}`}
                    className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-600"
                  >
                    <BookOpen size={9} className="text-clinical" />
                    {formatGuidelineHeader(g)}
                  </span>
                );
              })}
            </div>
          )}

          {canBreakdown && (
            <>
              <button
                type="button"
                onClick={() => setBreakdownExpanded((v) => !v)}
                aria-expanded={breakdownExpanded}
                className="mt-3 flex w-full items-center justify-between rounded-md bg-surface px-2.5 py-1.5 text-label font-semibold text-ink-600 transition-colors hover:bg-black/[0.04] hover:text-ink-900"
              >
                <span className="flex items-center gap-1.5">
                  <Search size={10} />
                  {breakdownExpanded ? "Ocultar" : "Por que"} {confidence}%?
                </span>
                <ChevronDown
                  size={12}
                  className={cn(
                    "transition-transform",
                    breakdownExpanded && "rotate-180"
                  )}
                />
              </button>

              {breakdownExpanded && (
                <ConfidenceBreakdown sparkline={sparkline} hypothesis={hypothesis} />
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

function ConfidenceBreakdown({
  sparkline,
  hypothesis,
}: {
  sparkline: SparklinePoint[];
  hypothesis: Hypothesis;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1 rounded-md border border-black/[0.06] bg-clinical/[0.02] p-3">
      <p className="mb-1 text-[11px] italic leading-snug text-ink-600">
        Evolução da confiança ponto a ponto, calculada a partir dos eventos da
        consulta. Cada fator cita a diretriz que o justifica.
      </p>

      <ol className="flex flex-col gap-0">
        {sparkline.map((point, i) => {
          const isFirst = i === 0;
          const isLast = i === sparkline.length - 1;
          const prev = !isFirst ? sparkline[i - 1] : null;
          const d = prev ? point.value - prev.value : null;

          return (
            <Fragment key={i}>
              {!isFirst && d !== null && (
                <div className="flex items-start gap-2 py-0.5 pl-2">
                  <span
                    className={cn(
                      "mt-0.5 font-mono text-[11px] font-semibold tabular-nums",
                      d > 0
                        ? "text-clinical-700"
                        : d < 0
                          ? "text-danger"
                          : "text-ink-400"
                    )}
                  >
                    {d > 0 ? "↑ +" : d < 0 ? "↓ " : "→ "}
                    {d}%
                  </span>
                  <span className="flex-1 text-[12px] italic leading-snug text-ink-600">
                    {point.label ?? "ajuste automático"}
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-2 py-0.5">
                <span
                  className={cn(
                    "font-mono font-semibold tabular-nums",
                    isLast
                      ? "text-[17px] text-clinical-700"
                      : "text-[13px] text-ink-900"
                  )}
                >
                  {point.value}%
                </span>
                {isFirst && point.label && (
                  <span className="text-[11px] italic text-ink-400">
                    {point.label}
                  </span>
                )}
                {isLast && (
                  <span className="rounded-full bg-clinical/10 px-1.5 py-0.5 text-[10px] font-semibold text-clinical-700">
                    atual
                  </span>
                )}
              </div>
            </Fragment>
          );
        })}
      </ol>

      {hypothesis.citations && hypothesis.citations.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 border-t border-black/5 pt-2">
          <span className="text-label font-semibold text-ink-400">
            Fundamentação clínica
          </span>
          <ul className="flex flex-col gap-1.5">
            {hypothesis.citations.map((id) => {
              const g = getGuidelineById(id);
              if (!g) return null;
              return (
                <li
                  key={id}
                  className="flex items-start gap-2 text-[11px] leading-snug"
                >
                  <BookOpen
                    size={10}
                    className="mt-0.5 shrink-0 text-clinical"
                  />
                  <span>
                    <span className="font-mono font-semibold text-clinical-700">
                      {formatGuidelineHeader(g)}
                    </span>{" "}
                    <span className="text-ink-900">— {g.title}</span>
                    <span className="block text-ink-600">{g.excerpt}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function confidenceLabel(confidence: number, status: HypothesisStatus): string {
  if (status === "discarded") return "Descartada";
  if (status === "investigating") return "Moderate risk";
  if (confidence >= 70) return "High confidence";
  if (confidence >= 40) return "Moderate confidence";
  return "Low confidence";
}

function confidenceColor(
  confidence: number,
  status: HypothesisStatus
): { label: string; bar: string } {
  if (status === "discarded") {
    return {
      label: "text-ink-400",
      bar: "bg-ink-400/50",
    };
  }
  if (status === "investigating" || confidence < 50) {
    return {
      label: "text-warning",
      bar: "bg-warning shadow-[0_0_8px_rgba(184,116,7,0.35)]",
    };
  }
  return {
    label: "text-clinical-glow",
    bar: "bg-clinical-glow shadow-[0_0_8px_rgba(52,211,153,0.5)]",
  };
}

function getSparklineTone(status: HypothesisStatus): string {
  if (status === "active") return "text-clinical";
  if (status === "investigating") return "text-warning";
  return "text-ink-400";
}
