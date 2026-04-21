import {
  AlertTriangle,
  Activity,
  ShieldCheck,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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
      className="flex h-14 shrink-0 items-center gap-6 border-b border-black/[0.06] bg-surface px-6"
      aria-label="Resumo rápido da sessão"
      data-tour="summary"
    >
      {activeMoments.length > 0 ? (
        <CriticalMomentsSummarySlot moments={activeMoments} />
      ) : (
        <SummarySlot
          icon={<AlertTriangle size={16} />}
          label="Red flag"
          content={redFlag ? redFlag.label : "nenhum alerta"}
          tone={redFlag ? "danger" : "muted"}
          className="max-w-[240px]"
        />
      )}
      <Divider />
      <SummarySlot
        icon={<Activity size={16} />}
        label="Hipótese principal"
        content={
          principal ? <HypothesisContent h={principal} /> : "coletando dados…"
        }
        className="min-w-0 flex-1"
      />
      <Divider />
      <SummarySlot
        icon={<ShieldCheck size={16} />}
        label="Cobertura"
        content={
          unknown > 0 ? (
            <CounterContent value={unknown} suffix="sem evidência" />
          ) : (
            "completa"
          )
        }
        tone={unknown > 0 ? "warning" : "muted"}
      />
      <Divider />
      <SummarySlot
        icon={<ClipboardList size={16} />}
        label="Pendências"
        tone="muted"
        content={
          pending > 0 ? (
            <CounterContent value={pending} suffix={pending === 1 ? "pendente" : "pendentes"} />
          ) : (
            "zerado"
          )
        }
      />
      <Divider />
      <BillingLive />
    </header>
  );
}

interface SummarySlotProps {
  icon: ReactNode;
  label: string;
  content: ReactNode;
  tone?: "default" | "danger" | "warning" | "muted";
  className?: string;
}

function SummarySlot({
  icon,
  label,
  content,
  tone = "default",
  className,
}: SummarySlotProps) {
  const iconColor =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : tone === "default"
          ? "text-clinical-700"
          : "text-ink-600";
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className={cn("shrink-0", iconColor)}>{icon}</span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[11.5px] font-medium text-ink-400">
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 truncate text-[13.5px] font-semibold tracking-tight",
            tone === "danger" ? "text-danger" : "text-ink-900"
          )}
        >
          {content}
        </span>
      </div>
    </div>
  );
}

function HypothesisContent({ h }: { h: Hypothesis }) {
  const up = h.delta > 0;
  const down = h.delta < 0;
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-ink-900">
      <span className="truncate font-semibold">{h.label}</span>
      <span className="shrink-0 font-mono font-semibold">{h.confidence}%</span>
      {up && <ArrowUpRight size={12} className="shrink-0 text-clinical" />}
      {down && <ArrowDownRight size={12} className="shrink-0 text-danger" />}
      {h.trigger && (
        <span className="min-w-0 truncate text-ink-400">
          desde{" "}
          <span className="text-ink-600">{h.trigger}</span>
        </span>
      )}
    </span>
  );
}

function CounterContent({ value, suffix }: { value: number; suffix: string }) {
  return (
    <span className="text-ink-900">
      <span className="font-mono font-semibold">{value}</span>{" "}
      <span className="text-ink-600">{suffix}</span>
    </span>
  );
}

function Divider() {
  return <span className="h-7 w-px shrink-0 bg-black/[0.08]" aria-hidden />;
}
