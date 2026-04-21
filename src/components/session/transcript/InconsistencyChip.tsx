import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { InconsistencyFlag } from "@/types/session";
import { cn } from "@/lib/cn";

interface InconsistencyChipProps {
  flags: InconsistencyFlag[];
}

/**
 * M8 — Chip inline na transcrição quando paciente fala algo inconsistente.
 * Ataca um ângulo que nenhum concorrente cobre: confiabilidade do relato.
 */
export function InconsistencyChip({ flags }: InconsistencyChipProps) {
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

  if (flags.length === 0) return null;

  const critical = flags.some((f) => f.severity === "critical");

  return (
    <span ref={ref} className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className={cn(
          "inline-flex translate-y-[-1px] items-center gap-1 rounded-full border px-2 py-0 text-[10px] font-semibold leading-[1.4] align-middle transition-colors",
          critical
            ? "border-danger/25 bg-danger/[0.08] text-danger hover:bg-danger/[0.12]"
            : "border-peach-border bg-peach text-peach-text hover:bg-peach-border/60"
        )}
        title="Inconsistência detectada — clique pra detalhes"
      >
        <AlertTriangle size={9} />
        {flags.length > 1 ? `${flags.length} inconsistências` : "inconsistência"}
      </button>

      {open && (
        <div
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute left-0 top-full z-30 mt-1.5 w-[360px] overflow-hidden rounded-[20px] border text-left shadow-xl animate-pop-in",
            critical
              ? "border-danger/25 bg-surface"
              : "border-peach-border bg-surface"
          )}
        >
          <header
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b",
              critical
                ? "border-danger/20 bg-danger/[0.06]"
                : "border-peach-border bg-peach"
            )}
          >
            <AlertTriangle
              size={15}
              className={critical ? "text-danger" : "text-peach-text"}
            />
            <h4
              className={cn(
                "text-[10.5px] font-bold uppercase tracking-ultra",
                critical ? "text-danger" : "text-peach-text"
              )}
            >
              {critical ? "Reconciliar — crítico" : "Reconciliar com histórico"}
            </h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="ml-auto text-ink-400 hover:text-ink-900"
            >
              <X size={13} />
            </button>
          </header>

          <ul className="flex flex-col divide-y divide-black/[0.05]">
            {flags.map((f) => (
              <li key={f.id} className="px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <KindBadge kind={f.kind} />
                  {f.severity === "critical" && (
                    <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-danger">
                      crítico
                    </span>
                  )}
                </div>

                <p className="text-[12px] leading-snug text-ink-900">
                  <span className="font-medium italic text-ink-600">
                    Paciente disse:
                  </span>{" "}
                  &ldquo;{f.currentStatement}&rdquo;
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-900">
                  <span className="font-medium italic text-ink-600">
                    Mas o contexto diz:
                  </span>{" "}
                  {f.priorContext}
                </p>
                <p className="mt-2 rounded-[10px] bg-surface-raised px-3 py-2 text-[11.5px] leading-snug text-ink-900">
                  <span className="font-semibold text-clinical-700">
                    Sugestão:
                  </span>{" "}
                  {f.suggestion}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}

function KindBadge({ kind }: { kind: InconsistencyFlag["kind"] }) {
  const cfg: Record<
    InconsistencyFlag["kind"],
    { label: string; classes: string }
  > = {
    contradiction: {
      label: "Contradição",
      classes: "bg-danger/10 text-danger",
    },
    omission: {
      label: "Omissão",
      classes: "bg-warning/15 text-warning",
    },
    discrepancy: {
      label: "Discrepância",
      classes: "bg-peach text-peach-text",
    },
  };
  const c = cfg[kind];
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        c.classes
      )}
    >
      {c.label}
    </span>
  );
}
