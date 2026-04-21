import { useMemo, useState } from "react";
import { X, AlertCircle, Brain, FileText, Sparkles } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";
import { HypothesisCard } from "./drawer/HypothesisCard";
import { HypothesisListRow } from "./drawer/HypothesisListRow";
import { HypothesisSkeleton } from "./drawer/HypothesisSkeleton";
import { PendingActionsSection } from "./drawer/PendingActionsSection";
import { SymptomsTimeline } from "./drawer/SymptomsTimeline";
import {
  EmptyState,
  HypothesisEmptyIllustration,
} from "./shared/EmptyState";
import { AnalyzingIndicator } from "./shared/AnalyzingIndicator";
import { InfoPopover } from "./shared/InfoPopover";
import { NextQuestion } from "./drawer/NextQuestion";
import { SoapLivePanel } from "./drawer/SoapLivePanel";
import { ReasoningModal } from "./modals/ReasoningModal";

type DrawerTab = "cognitive" | "soap";

export function Drawer() {
  const open = useSessionStore((s) => s.drawerOpen);
  const close = useSessionStore((s) => s.closeDrawer);
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const nextQuestion = useSessionStore((s) => s.nextQuestion);
  const dismissedId = useSessionStore((s) => s.dismissedNextQuestionId);
  const analysisState = useSessionStore((s) => s.analysisState);

  const [tab, setTab] = useState<DrawerTab>("cognitive");
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

  const showNext =
    tab === "cognitive" &&
    nextQuestion !== null &&
    nextQuestion.id !== dismissedId;

  return (
    <aside
      aria-label="Painel de apoio cognitivo"
      aria-hidden={!open}
      className={cn(
        "shrink-0 overflow-hidden bg-surface-raised transition-[width] duration-200 ease-out",
        open ? "w-[420px]" : "w-0"
      )}
    >
      <div className="flex h-full w-[420px] flex-col border-l border-black/5">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-surface pl-2 pr-2">
          <div role="tablist" className="flex items-center gap-0.5">
            <TabButton
              active={tab === "cognitive"}
              onClick={() => setTab("cognitive")}
              icon={<Brain size={13} />}
              label="Apoio cognitivo"
            />
            <TabButton
              active={tab === "soap"}
              onClick={() => setTab("soap")}
              icon={<FileText size={13} />}
              label="Nota SOAP"
            />
          </div>
          <div className="flex items-center gap-2">
            <AnalysisIndicator state={analysisState} />
            <button
              type="button"
              onClick={close}
              aria-label="Fechar painel"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-surface-raised hover:text-ink-900"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {tab === "cognitive" ? (
            <div className="flex flex-col gap-6 px-5 py-5">
              {/* Header "Raciocínio clínico" estilo mockup */}
              <section>
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-clinical-700" />
                    <h3 className="text-[13px] font-semibold tracking-tight text-ink-900">
                      Raciocínio clínico
                    </h3>
                    <InfoPopover
                      align="left"
                      title="Raciocínio clínico"
                      description="Hipóteses diagnósticas ranqueadas por confiança bayesiana. Clique em uma pra ver o raciocínio detalhado (evidências +/-, premissas, citações)."
                    />
                  </div>
                  {focused && (
                    <button
                      type="button"
                      onClick={() => setReasoningOpen(true)}
                      title="Ver raciocínio detalhado da hipótese principal"
                      className="flex h-6 items-center gap-1 rounded-full border border-clinical/25 bg-clinical/[0.06] px-2.5 text-[10.5px] font-semibold text-clinical-700 hover:bg-clinical/10"
                    >
                      <Brain size={11} /> Ver raciocínio
                    </button>
                  )}
                </header>

                {hypotheses.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-ultra text-ink-400">
                      Hipóteses diagnósticas
                    </h4>
                    <div className="flex flex-col gap-0.5">
                      {[...hypotheses]
                        .sort((a, b) => b.confidence - a.confidence)
                        .map((h, i) => (
                          <HypothesisListRow
                            key={h.id}
                            hypothesis={h}
                            principal={i === 0 && h.icd10 === focused?.icd10}
                            onClick={() => setFocusedIcd10(h.icd10)}
                          />
                        ))}
                    </div>
                  </div>
                ) : analysisState === "analyzing" ? (
                  <div className="flex flex-col gap-2">
                    <AnalyzingIndicator />
                    <HypothesisSkeleton />
                  </div>
                ) : (
                  <EmptyHypothesesState />
                )}

                {focusedIcd10 && focused && (
                  <details className="mt-3 rounded-[14px] border border-black/[0.05] bg-surface">
                    <summary className="cursor-pointer list-none px-4 py-2.5 text-[11px] font-semibold text-ink-600 hover:text-ink-900">
                      Detalhes de {focused.label} ▾
                    </summary>
                    <div className="border-t border-black/[0.04] p-3">
                      <HypothesisCard hypothesis={focused} forceExpanded />
                    </div>
                  </details>
                )}
              </section>

              {/* Próximas ações */}
              <PendingActionsSection />

              {/* Próxima pergunta / nudge */}
              {showNext && <NextQuestion />}

              {/* Timeline dos sintomas */}
              <SymptomsTimeline />
            </div>
          ) : (
            <SoapLivePanel />
          )}
        </div>
      </div>
      <ReasoningModal
        open={reasoningOpen}
        onClose={() => setReasoningOpen(false)}
        hypothesis={focused}
      />
    </aside>
  );
}

function EmptyHypothesesState() {
  return (
    <EmptyState
      illustration={<HypothesisEmptyIllustration />}
      title="Nenhuma hipótese ainda"
      description="Comece a consulta e fale naturalmente. Hipóteses com CID-10 aparecem aqui conforme a IA processa a transcrição."
    />
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex h-14 items-center gap-1.5 px-3 text-[12px] font-semibold transition-colors",
        active ? "text-ink-900" : "text-ink-400 hover:text-ink-900"
      )}
    >
      {icon}
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t bg-clinical"
        />
      )}
    </button>
  );
}

function AnalysisIndicator({ state }: { state: "idle" | "analyzing" | "error" }) {
  if (state === "analyzing") {
    return <AnalyzingIndicator />;
  }
  if (state === "error") {
    return (
      <span
        className="flex items-center gap-1 text-label font-medium text-danger"
        title="Falha na análise por LLM — continua funcionando com últimas hipóteses"
      >
        <AlertCircle size={12} />
        análise offline
      </span>
    );
  }
  return null;
}
