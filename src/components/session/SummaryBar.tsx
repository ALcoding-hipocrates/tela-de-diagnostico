import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import type { Hypothesis } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import {
  getActiveRedFlag,
  getPendingChecklistCount,
  getPrincipalHypothesis,
  getUnknownHypothesesCount,
} from "@/lib/sessionSelectors";
import { detectCriticalMoments } from "@/lib/criticalMoments";
import { cn } from "@/lib/cn";
import { CriticalMomentsSummarySlot } from "./CriticalMomentsSummarySlot";
import { BillingLive } from "./BillingLive";

/**
 * SummaryBar estilo mockup Hipócrates: 4 pill cards com marcador colorido
 * e label uppercase pequeno, value destacado. Mostra BillingLive ao final.
 */
export function SummaryBar() {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const checklist = useSessionStore((s) => s.checklist);
  const transcript = useSessionStore((s) => s.transcript);
  const dismissedMoments = useSessionStore((s) => s.dismissedCriticalMomentIds);

  const redFlag = getActiveRedFlag(transcript);
  const principal = getPrincipalHypothesis(hypotheses);
  const unknown = getUnknownHypothesesCount(hypotheses);
  const pending = getPendingChecklistCount(checklist);

  const activeMoments = useMemo(() => {
    const all = detectCriticalMoments(transcript);
    return all.filter((m) => !dismissedMoments.includes(m.id));
  }, [transcript, dismissedMoments]);

  return (
    <header
      className="flex h-[72px] shrink-0 items-center gap-2 border-b border-black/[0.06] bg-surface-raised/40 px-5"
      aria-label="Resumo rápido da sessão"
      data-tour="summary"
    >
      {activeMoments.length > 0 ? (
        <CriticalMomentsSummarySlot moments={activeMoments} />
      ) : (
        <SummaryPill
          marker="danger"
          label="Red flag"
          value={redFlag ? `${redFlag.label}` : "—"}
          subtext={redFlag ? "crítico" : "sem alerta"}
          tone={redFlag ? "danger" : "muted"}
        />
      )}

      <SummaryPill
        marker="clinical"
        label="Hipótese principal"
        value={principal ? <HypothesisValue h={principal} /> : "coletando…"}
        subtext={principal && principal.delta !== 0 ? `Δ ${principal.delta > 0 ? "+" : ""}${principal.delta}` : undefined}
        tone="clinical"
        grow
      />

      <SummaryPill
        marker={unknown > 0 ? "warning" : "muted"}
        label="Cobertura"
        value={
          unknown > 0 ? (
            <span>
              <span className="font-mono font-bold tabular-nums text-ink-900">
                {unknown}
              </span>
              <span className="ml-1 text-[11.5px] font-medium text-ink-600">
                sem evid.
              </span>
            </span>
          ) : (
            "completa"
          )
        }
        tone={unknown > 0 ? "warning" : "muted"}
      />

      <SummaryPill
        marker="muted"
        label="Pendências"
        value={
          pending > 0 ? (
            <span>
              <span className="font-mono font-bold tabular-nums text-ink-900">
                {pending}
              </span>
              <span className="ml-1 text-[11.5px] font-medium text-ink-600">
                item{pending === 1 ? "" : "s"}
              </span>
            </span>
          ) : (
            "zerado"
          )
        }
        tone="muted"
      />

      <div className="ml-auto">
        <BillingLive />
      </div>
    </header>
  );
}

type PillTone = "danger" | "warning" | "clinical" | "muted";
type PillMarker = "danger" | "warning" | "clinical" | "muted";

interface SummaryPillProps {
  marker: PillMarker;
  label: string;
  value: ReactNode;
  subtext?: string;
  tone: PillTone;
  grow?: boolean;
}

function SummaryPill({ marker, label, value, subtext, tone, grow }: SummaryPillProps) {
  const markerColor = {
    danger: "bg-danger",
    warning: "bg-warning",
    clinical: "bg-clinical-glow",
    muted: "bg-ink-400/60",
  }[marker];

  const valueColor = {
    danger: "text-danger",
    warning: "text-warning",
    clinical: "text-ink-900",
    muted: "text-ink-900",
  }[tone];

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2.5 rounded-[14px] border border-black/[0.05] bg-surface px-3.5 py-2.5",
        grow && "min-w-0 flex-1"
      )}
    >
      <span
        aria-hidden
        className={cn("mt-1 h-2 w-2 shrink-0 rounded-[3px]", markerColor)}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-400">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 truncate text-[13px] font-semibold tracking-tight",
            valueColor
          )}
        >
          {value}
        </span>
        {subtext && (
          <span className="text-[10px] font-medium text-ink-400">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

function HypothesisValue({ h }: { h: Hypothesis }) {
  const up = h.delta > 0;
  const down = h.delta < 0;
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{h.label}</span>
      <span className="shrink-0 font-mono font-bold tabular-nums text-clinical-700">
        {h.confidence}%
      </span>
      {up && <ArrowUpRight size={11} className="shrink-0 text-clinical" />}
      {down && <ArrowDownRight size={11} className="shrink-0 text-danger" />}
    </span>
  );
}
