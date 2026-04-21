import { useMemo, useState } from "react";
import { AlertCircle, Sparkles, Brain } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { HypothesisCard } from "./drawer/HypothesisCard";
import { HypothesisRow } from "./drawer/HypothesisRow";
import { HypothesisSkeleton } from "./drawer/HypothesisSkeleton";
import { PendingActionsSection } from "./drawer/PendingActionsSection";
import { NextQuestion } from "./drawer/NextQuestion";
import { AnalyzingIndicator } from "./shared/AnalyzingIndicator";
import { EmptyState, HypothesisEmptyIllustration } from "./shared/EmptyState";
import { ReasoningModal } from "./modals/ReasoningModal";
import { getActiveRedFlag } from "@/lib/sessionSelectors";
import { getRedFlagById } from "@/mocks/session";
import { cn } from "@/lib/cn";

/**
 * RightPanel — "COGNITIVE SUPPORT" (estilo Stitch mockup).
 * Sempre visível, 440px. Combina: Hipóteses + Alerts + Checklist + Insight.
 * Substitui o antigo Drawer colapsável.
 */
export function RightPanel() {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const transcript = useSessionStore((s) => s.transcript);
  const nextQuestion = useSessionStore((s) => s.nextQuestion);
  const dismissedId = useSessionStore((s) => s.dismissedNextQuestionId);
  const analysisState = useSessionStore((s) => s.analysisState);

  const [focusedIcd10, setFocusedIcd10] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const { focused, others } = useMemo(() => {
    if (hypotheses.length === 0) return { focused: null, others: [] };
    const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence);
    const nonDiscarded = sorted.filter((h) => h.status !== "discarded");
    const principal = nonDiscarded[0] ?? sorted[0];
    const focusedH = focusedIcd10
      ? hypotheses.find((h) => h.icd10 === focusedIcd10) ?? principal
      : principal;
    const rest = sorted.filter((h) => h.icd10 !== focusedH.icd10);
    return { focused: focusedH, others: rest };
  }, [hypotheses, focusedIcd10]);

  const redFlag = getActiveRedFlag(transcript);
  const redFlagDetails = redFlag ? getRedFlagById(redFlag.redFlagId) : null;

  const showNext =
    nextQuestion !== null && nextQuestion.id !== dismissedId;

  const lastRationale = focused?.rationale;

  return (
    <aside
      aria-label="Painel de apoio cognitivo"
      className="flex h-full w-[440px] shrink-0 flex-col overflow-y-auto border-l border-black/[0.04] bg-surface"
    >
      <div className="flex flex-col gap-8 px-8 py-8">
        {/* COGNITIVE SUPPORT */}
        <section>
          <header className="mb-5 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
              Cognitive support
            </h2>
            <AnalysisDot state={analysisState} />
          </header>

          {focused ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setReasoningOpen(true)}
                title="Ver raciocínio detalhado da IA"
                className="flex w-fit items-center gap-1.5 rounded-full bg-clinical/[0.08] px-2.5 py-1 text-[11px] font-semibold text-clinical-700 transition-colors hover:bg-clinical/[0.14]"
              >
                <Brain size={11} /> Ver raciocínio
              </button>
              <div key={focused.icd10} className="animate-slide-in">
                <HypothesisCard hypothesis={focused} forceExpanded />
              </div>
              {others.length > 0 && (
                <div className="mt-1 flex flex-col divide-y divide-black/[0.04] rounded-[20px] border border-black/[0.05] bg-surface">
                  {others.map((h) => (
                    <HypothesisRow
                      key={h.id}
                      hypothesis={h}
                      onFocus={() => setFocusedIcd10(h.icd10)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : analysisState === "analyzing" ? (
            <div className="flex flex-col gap-2">
              <AnalyzingIndicator />
              <HypothesisSkeleton />
            </div>
          ) : (
            <EmptyState
              illustration={<HypothesisEmptyIllustration />}
              title="Nenhuma hipótese ainda"
              description="Conforme a consulta avança, hipóteses com CID-10 aparecem aqui."
            />
          )}
        </section>

        {/* ALERTS */}
        {redFlagDetails && (
          <section>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-ultra text-ink-400">
              Alerts
            </h3>
            <div className="flex gap-4 rounded-[24px] border border-peach-border bg-peach p-5">
              <AlertCircle
                size={18}
                className="shrink-0 text-peach-text"
                strokeWidth={2}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-ultra text-peach-text">
                  Cardiovascular warning
                </p>
                <p className="text-[13px] font-light leading-relaxed text-ink-600">
                  {redFlagDetails.meaning}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* DIFFERENTIAL CHECKLIST + pendências */}
        <section>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-ultra text-ink-400">
            Differential checklist
          </h3>
          <PendingActionsSection />
        </section>

        {/* NEXT QUESTION */}
        {showNext && (
          <section>
            <NextQuestion />
          </section>
        )}

        {/* MEDICAL INSIGHT */}
        {lastRationale && (
          <section className="mt-auto">
            <div className="rounded-[28px] border border-black/[0.05] bg-gradient-to-br from-clinical/[0.04] to-transparent p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-clinical-700" />
                <span className="text-[10px] font-bold uppercase tracking-ultra text-clinical-700">
                  Medical insight
                </span>
              </div>
              <p className="text-[12.5px] font-light italic leading-relaxed text-ink-600">
                “{lastRationale}”
              </p>
            </div>
          </section>
        )}
      </div>

      <ReasoningModal
        open={reasoningOpen}
        onClose={() => setReasoningOpen(false)}
        hypothesis={focused}
      />
    </aside>
  );
}

function AnalysisDot({
  state,
}: {
  state: "idle" | "analyzing" | "error";
}) {
  const cfg =
    state === "analyzing"
      ? { dot: "bg-clinical-glow animate-pulse", label: "analisando" }
      : state === "error"
        ? { dot: "bg-danger", label: "erro" }
        : { dot: "bg-ink-400/60", label: "inativo" };
  return (
    <span
      className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-ultra text-ink-400"
      title={cfg.label}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden />
    </span>
  );
}
