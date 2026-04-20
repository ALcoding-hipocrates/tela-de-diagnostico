import { Sparkles, X, Zap } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { describeCid } from "@/data/cidDictionary";
import { cn } from "@/lib/cn";

export function NextQuestion() {
  const q = useSessionStore((s) => s.nextQuestion);
  const dismiss = useSessionStore((s) => s.dismissNextQuestion);
  const use = useSessionStore((s) => s.useNextQuestion);

  if (!q) return null;

  const isNudge = q.kind === "nudge";

  if (isNudge) {
    return <NudgeVariant q={q} dismiss={dismiss} use={use} />;
  }

  return <SuggestionVariant q={q} dismiss={dismiss} use={use} />;
}

interface VariantProps {
  q: NonNullable<ReturnType<typeof useSessionStore.getState>["nextQuestion"]>;
  dismiss: () => void;
  use: () => void;
}

function SuggestionVariant({ q, dismiss, use }: VariantProps) {
  return (
    <section
      className="relative rounded-lg border border-black/[0.1] bg-surface p-4 shadow-[var(--shadow-card-raised)]"
      aria-label="Próxima pergunta sugerida"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink-900 text-white">
          <Sparkles size={13} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-ultra text-ink-900">
          Próxima pergunta
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar sugestão"
          className="ml-auto flex h-6 w-6 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-900/[0.06] hover:text-ink-900 active:scale-90"
        >
          <X size={14} />
        </button>
      </div>

      <p className="mt-2.5 text-[15px] font-semibold leading-snug text-ink-900">
        {q.question}
      </p>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-label font-semibold text-ink-600">Razão</dt>
        <dd className="text-[13px] font-medium text-ink-600">{q.reason}</dd>
        <dt className="text-label font-semibold text-ink-600">Impacto</dt>
        <dd className="font-mono text-[13px] font-semibold tabular-nums text-ink-900">
          {q.impact}
        </dd>
      </dl>

      <button
        type="button"
        onClick={use}
        className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-clinical px-4 text-[13px] font-semibold tracking-tight text-white transition-colors hover:bg-clinical-700"
      >
        Usar pergunta
      </button>
    </section>
  );
}

function NudgeVariant({ q, dismiss, use }: VariantProps) {
  const ctx = q.missingContext;
  const critical = ctx?.severity === "critical";
  const blockedCid = ctx?.blocksHypothesisIcd10;
  const blockedLabel = blockedCid ? describeCid(blockedCid) : undefined;

  return (
    <section
      className={cn(
        "relative rounded-lg border p-4",
        critical
          ? "border-peach-border bg-peach"
          : "border-warning/25 bg-warning/[0.06]"
      )}
      aria-label="Nudge de contexto faltante"
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full animate-pulse",
            critical
              ? "bg-peach-text/20 text-peach-text"
              : "bg-warning/25 text-warning"
          )}
          style={{ animationDuration: "2.4s" }}
        >
          <Zap size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <span
            className={cn(
              "text-[9px] font-bold uppercase tracking-ultra",
              critical ? "text-peach-text" : "text-warning"
            )}
          >
            {critical ? "Contexto crítico faltando" : "Atenção: contexto incompleto"}
          </span>
          {ctx && (
            <p
              className={cn(
                "mt-0.5 text-[11px] font-semibold tracking-tight",
                critical ? "text-peach-text" : "text-warning"
              )}
            >
              {ctx.field}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dispensar"
          className="flex h-6 w-6 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-900/[0.06] hover:text-ink-900 active:scale-90"
        >
          <X size={14} />
        </button>
      </div>

      <p className="mt-3 text-[15px] font-semibold leading-snug text-ink-900">
        {q.question}
      </p>

      <p className="mt-2 text-[12px] leading-snug text-ink-600">{q.reason}</p>

      {blockedCid && (
        <p className="mt-2 text-[11px] font-medium text-ink-600">
          <span className="text-ink-400">Bloqueia:</span>{" "}
          <span className="font-mono font-semibold text-ink-900">
            {blockedCid}
          </span>
          {blockedLabel && <span> · {blockedLabel}</span>}
        </p>
      )}

      <button
        type="button"
        onClick={use}
        className={cn(
          "mt-3 inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-semibold tracking-tight text-white transition-colors",
          critical
            ? "bg-peach-text hover:bg-peach-text/90"
            : "bg-warning hover:bg-warning/90"
        )}
      >
        Perguntar agora
      </button>
    </section>
  );
}
