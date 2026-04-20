import { Sparkles, X } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";

export function NextQuestion() {
  const q = useSessionStore((s) => s.nextQuestion);
  const dismiss = useSessionStore((s) => s.dismissNextQuestion);
  const use = useSessionStore((s) => s.useNextQuestion);

  if (!q) return null;

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
        <dt className="text-label font-semibold text-ink-600">
          Razão
        </dt>
        <dd className="text-[13px] font-medium text-ink-600">{q.reason}</dd>
        <dt className="text-label font-semibold text-ink-600">
          Impacto
        </dt>
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
