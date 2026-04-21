import { useMemo } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { getRedFlagById } from "@/mocks/session";

/**
 * Timeline dos Sintomas — resumo cronológico de eventos importantes
 * capturados na transcrição (red flags + hipóteses-shift + checklist checked).
 * Estilo mockup Hipócrates — renderiza com "d-N" (dias atrás).
 */
export function SymptomsTimeline() {
  const transcript = useSessionStore((s) => s.transcript);
  const checklist = useSessionStore((s) => s.checklist);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  const events = useMemo(() => {
    const list: Array<{
      label: string;
      detail?: string;
      offset: string;
      tone: "danger" | "clinical" | "muted";
    }> = [];

    // Eventos prévios (mock — seriam do histórico real)
    list.push({
      label: "Parou Losartana",
      detail: "Adesão baixa",
      offset: "d-7",
      tone: "danger",
    });

    // Red flags + messages da consulta atual viram eventos "hoje"
    const seenFlags = new Set<string>();
    for (const item of transcript) {
      if (item.kind !== "message") continue;
      if (item.redFlags) {
        for (const rf of item.redFlags) {
          if (seenFlags.has(rf.redFlagId)) continue;
          seenFlags.add(rf.redFlagId);
          const rflag = getRedFlagById(rf.redFlagId);
          if (!rflag) continue;
          list.push({
            label: rflag.label,
            detail: `"${rf.trigger}"`,
            offset: "hoje",
            tone: "danger",
          });
        }
      }
    }

    // Checklist recente marcado = sintoma confirmado
    const checkedRecent = checklist.filter((c) => c.status === "checked").slice(0, 2);
    for (const c of checkedRecent) {
      list.push({
        label: c.label,
        detail: c.result ? `${c.result}${c.resultUnit ? ` ${c.resultUnit}` : ""}` : undefined,
        offset: "hoje",
        tone: "clinical",
      });
    }

    return list;
  }, [transcript, checklist, sessionStartedAt]);

  if (events.length === 0) return null;

  return (
    <section>
      <header className="mb-2 flex items-center gap-1.5">
        <h3 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
          Timeline dos sintomas
        </h3>
      </header>
      <ul className="flex flex-col gap-0">
        {events.map((e, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 border-b border-black/[0.04] py-2 last:border-b-0"
          >
            <span
              aria-hidden
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                e.tone === "danger"
                  ? "bg-danger"
                  : e.tone === "clinical"
                    ? "bg-clinical-glow"
                    : "bg-ink-400/60"
              }`}
            />
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] font-medium text-ink-900">
                  {e.label}
                </span>
                <span className="font-mono text-[10px] font-medium tabular-nums text-ink-400">
                  {e.offset}
                </span>
              </div>
              {e.detail && (
                <p className="mt-0.5 text-[11px] italic text-ink-600">
                  {e.detail}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
