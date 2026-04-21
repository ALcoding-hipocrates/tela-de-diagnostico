import { Plus, Minus, HelpCircle, BookOpen } from "lucide-react";
import type { Evidence, Hypothesis } from "@/types/session";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";

interface EvidenceFlowTreeProps {
  hypothesis: Hypothesis;
}

/**
 * M3 — Evidence Flow Tree.
 * Mostra POR QUÊ a confiança está no valor atual. Separa evidências em
 * positivas (+), negativas (−) e faltantes (?). Cada item tem peso visual
 * proporcional. Diferencial único — ninguém no mercado faz isso visualmente.
 */
export function EvidenceFlowTree({ hypothesis }: EvidenceFlowTreeProps) {
  const { confidence, evidence = [] } = hypothesis;

  if (evidence.length === 0) {
    return (
      <p className="rounded-[12px] bg-surface-raised px-4 py-6 text-center text-[12px] italic text-ink-400">
        A IA ainda não discriminou evidências pra esta hipótese. Aparecem
        após algumas mensagens de transcrição.
      </p>
    );
  }

  const positive = evidence.filter((e) => e.kind === "positive");
  const negative = evidence.filter((e) => e.kind === "negative");
  const missing = evidence.filter((e) => e.kind === "missing");

  const maxWeight = Math.max(...evidence.map((e) => Math.abs(e.weight)), 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Header meta */}
      <div className="flex items-baseline justify-between rounded-[12px] bg-surface-raised px-3 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
          Confiança atual
        </span>
        <span className="font-mono text-[24px] font-bold tabular-nums leading-none tracking-tight text-ink-900">
          {confidence}%
        </span>
      </div>

      {/* Positive evidence */}
      {positive.length > 0 && (
        <EvidenceGroup
          title="Evidências a favor"
          count={positive.length}
          sum={positive.reduce((acc, e) => acc + e.weight, 0)}
          tone="positive"
          icon={<Plus size={11} strokeWidth={3} />}
        >
          {positive.map((e) => (
            <EvidenceRow key={e.id} evidence={e} maxWeight={maxWeight} />
          ))}
        </EvidenceGroup>
      )}

      {/* Negative evidence */}
      {negative.length > 0 && (
        <EvidenceGroup
          title="Evidências contra"
          count={negative.length}
          sum={negative.reduce((acc, e) => acc + e.weight, 0)}
          tone="negative"
          icon={<Minus size={11} strokeWidth={3} />}
        >
          {negative.map((e) => (
            <EvidenceRow key={e.id} evidence={e} maxWeight={maxWeight} />
          ))}
        </EvidenceGroup>
      )}

      {/* Missing evidence */}
      {missing.length > 0 && (
        <EvidenceGroup
          title="Ainda falta"
          count={missing.length}
          sum={missing.reduce((acc, e) => acc + Math.abs(e.weight), 0)}
          tone="missing"
          icon={<HelpCircle size={11} strokeWidth={2.5} />}
          sumPrefix="até ±"
        >
          {missing.map((e) => (
            <EvidenceRow key={e.id} evidence={e} maxWeight={maxWeight} />
          ))}
        </EvidenceGroup>
      )}

      <p className="text-[10.5px] italic leading-snug text-ink-400">
        Cada evidência pesa independentemente. O modelo bayesiano combina pesos
        considerando razões de verossimilhança das diretrizes citadas.
      </p>
    </div>
  );
}

interface GroupProps {
  title: string;
  count: number;
  sum: number;
  tone: "positive" | "negative" | "missing";
  icon: React.ReactNode;
  children: React.ReactNode;
  sumPrefix?: string;
}

function EvidenceGroup({
  title,
  count,
  sum,
  tone,
  icon,
  children,
  sumPrefix,
}: GroupProps) {
  const toneClass =
    tone === "positive"
      ? "bg-clinical-glow/10 text-clinical-700"
      : tone === "negative"
        ? "bg-danger/10 text-danger"
        : "bg-ink-900/[0.05] text-ink-600";

  const sumFormatted =
    tone === "negative"
      ? `${sum}`
      : `${sumPrefix ?? "+"}${Math.abs(sum)}`;

  return (
    <section className="flex flex-col gap-1.5">
      <header className="flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-ultra",
            toneClass
          )}
        >
          {icon}
          {title} · {count}
        </span>
        <span
          className={cn(
            "font-mono text-[12px] font-semibold tabular-nums",
            tone === "positive"
              ? "text-clinical-700"
              : tone === "negative"
                ? "text-danger"
                : "text-ink-600"
          )}
        >
          {sumFormatted} pts
        </span>
      </header>
      <ul className="flex flex-col gap-1">{children}</ul>
    </section>
  );
}

interface RowProps {
  evidence: Evidence;
  maxWeight: number;
}

function EvidenceRow({ evidence, maxWeight }: RowProps) {
  const { kind, text, weight, source } = evidence;
  const absW = Math.abs(weight);
  const widthPct = (absW / maxWeight) * 100;
  const g = source ? getGuidelineById(source) : null;

  const barClass =
    kind === "positive"
      ? "bg-clinical-glow/70"
      : kind === "negative"
        ? "bg-danger/60"
        : "bg-ink-400/40";

  const weightClass =
    kind === "positive"
      ? "text-clinical-700"
      : kind === "negative"
        ? "text-danger"
        : "text-ink-600";

  const weightText =
    kind === "positive"
      ? `+${absW}`
      : kind === "negative"
        ? `−${absW}`
        : `~${absW}`;

  return (
    <li className="flex items-start gap-2 rounded-[10px] bg-surface px-3 py-2">
      <span
        className={cn(
          "mt-0.5 w-9 shrink-0 font-mono text-[11px] font-bold tabular-nums",
          weightClass
        )}
      >
        {weightText}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.05]">
            <div
              className={cn("h-full rounded-full", barClass)}
              style={{ width: `${widthPct}%` }}
            />
          </div>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-ink-900">{text}</p>
        {g && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-400">
            <BookOpen size={8} className="text-clinical" />
            <span className="font-mono font-semibold text-clinical-700">
              {formatGuidelineHeader(g)}
            </span>
            <span>· {g.title}</span>
          </p>
        )}
      </div>
    </li>
  );
}
