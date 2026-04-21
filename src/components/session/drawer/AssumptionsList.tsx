import { Check, X, HelpCircle } from "lucide-react";
import type { Assumption, AssumptionState } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";
import { InfoPopover } from "../shared/InfoPopover";

interface AssumptionsListProps {
  icd10: string;
  assumptions: Assumption[];
}

const NEXT_STATE: Record<AssumptionState, AssumptionState> = {
  assumed: "verified",
  verified: "false",
  false: "assumed",
};

/**
 * F1 — Assumptions visíveis por hipótese (padrão Expert AI / UpToDate).
 * Cada premissa é um chip clicável que cicla entre "assumida" → "verificada" →
 * "falsa" → "assumida". Alterar pra "falsa" sinaliza à IA pra recalibrar na
 * próxima análise.
 */
export function AssumptionsList({ icd10, assumptions }: AssumptionsListProps) {
  const setAssumptionState = useSessionStore((s) => s.setAssumptionState);

  if (assumptions.length === 0) return null;

  return (
    <section className="mt-5">
      <header className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <h4 className="text-[9px] font-bold uppercase tracking-ultra text-ink-400">
            Premissas assumidas
          </h4>
          <InfoPopover
            align="left"
            title="Premissas clínicas"
            description="A IA declara explicitamente o que está assumindo pra chegar nessa confiança (ex: paciente não gestante, sem AINE crônico). Clique pra cicla entre ? (assumida), ✓ (verificada) e ✗ (falsa). Marcar falsa faz a IA recalibrar."
          />
        </div>
        <span className="text-[10px] text-ink-400">
          Clique pra confirmar / contestar
        </span>
      </header>

      <ul className="flex flex-col gap-1">
        {assumptions.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() =>
                setAssumptionState(icd10, a.id, NEXT_STATE[a.state])
              }
              className={cn(
                "group flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]",
                a.state === "false" && "opacity-70"
              )}
              aria-label={`${a.text} — estado: ${labelFor(a.state)}. Clique pra alterar.`}
            >
              <StateIcon state={a.state} />
              <span
                className={cn(
                  "flex-1 text-[12.5px] leading-snug tracking-tight",
                  a.state === "false"
                    ? "text-ink-400 line-through decoration-ink-400/60"
                    : a.state === "verified"
                      ? "text-ink-900"
                      : "text-ink-600"
                )}
              >
                {a.text}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[9px] font-semibold uppercase tracking-[0.08em] opacity-0 transition-opacity group-hover:opacity-100",
                  stateColor(a.state)
                )}
              >
                {labelFor(a.state)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StateIcon({ state }: { state: AssumptionState }) {
  if (state === "verified") {
    return (
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-clinical-glow/20 text-clinical-700"
        aria-hidden
      >
        <Check size={10} strokeWidth={3} />
      </span>
    );
  }
  if (state === "false") {
    return (
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger"
        aria-hidden
      >
        <X size={10} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink-400/15 text-ink-400"
      aria-hidden
    >
      <HelpCircle size={10} strokeWidth={2} />
    </span>
  );
}

function labelFor(state: AssumptionState): string {
  if (state === "verified") return "Verificada";
  if (state === "false") return "Falsa";
  return "Assumida";
}

function stateColor(state: AssumptionState): string {
  if (state === "verified") return "text-clinical-700";
  if (state === "false") return "text-danger";
  return "text-ink-400";
}
