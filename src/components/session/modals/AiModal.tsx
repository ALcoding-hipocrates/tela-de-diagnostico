import { Sparkles, Loader2, AlertCircle, BookOpen, Brain } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { isApiConfigured } from "@/lib/clinicalAi";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface AiModalProps {
  open: boolean;
  onClose: () => void;
}

export function AiModal({ open, onClose }: AiModalProps) {
  const analysisState = useSessionStore((s) => s.analysisState);
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const nextQuestion = useSessionStore((s) => s.nextQuestion);
  const apiConfigured = isApiConfigured();

  const allCitations = new Set<string>();
  for (const h of hypotheses) {
    h.citations?.forEach((c) => allCitations.add(c));
  }
  const citedGuidelines = Array.from(allCitations)
    .map((id) => getGuidelineById(id))
    .filter((g): g is NonNullable<typeof g> => !!g);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assistente de IA · estado"
      description="Meta-informação sobre o raciocínio clínico automatizado desta sessão"
    >
      <div className="flex flex-col gap-5">
        <Block
          icon={<Brain size={14} />}
          label="Modelo em uso"
          value="Claude Opus 4.7 · adaptive thinking"
          hint={apiConfigured ? "Online" : "API não configurada — análise rodando com mocks"}
          hintTone={apiConfigured ? "ok" : "warn"}
        />

        <Block
          icon={<StateIcon state={analysisState} />}
          label="Estado da análise"
          value={stateLabel(analysisState)}
          hint={
            analysisState === "analyzing"
              ? "Claude está re-analisando transcrição"
              : analysisState === "error"
                ? "Última análise falhou — hipóteses anteriores preservadas"
                : "Pronto pra próxima atualização (a cada 2 mensagens novas + 8s)"
          }
          hintTone={
            analysisState === "analyzing" ? "info" : analysisState === "error" ? "danger" : "muted"
          }
        />

        <div>
          <h3 className="text-label font-semibold text-ink-400">
            Hipóteses atuais
          </h3>
          {hypotheses.length === 0 ? (
            <p className="mt-1 text-[13px] italic text-ink-400">Nenhuma hipótese formulada.</p>
          ) : (
            <ol className="mt-2 flex flex-col gap-1.5">
              {[...hypotheses]
                .sort((a, b) => b.confidence - a.confidence)
                .map((h, i) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded-md border border-black/[0.08] bg-surface px-3 py-2.5 transition-colors hover:border-black/[0.14] hover:bg-surface-raised"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold tabular-nums",
                        i === 0
                          ? "bg-clinical text-white"
                          : "bg-ink-900/[0.06] text-ink-600"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="font-mono text-label font-semibold tabular-nums text-ink-600">
                      {h.icd10}
                    </span>
                    <span className="flex-1 truncate text-[13px] font-semibold text-ink-900">
                      {h.label}
                    </span>
                    <span className="font-mono text-[14px] font-bold tabular-nums text-ink-900">
                      {h.confidence}%
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
            <BookOpen size={12} />
            Guidelines consultados
          </h3>
          {citedGuidelines.length === 0 ? (
            <p className="mt-1 text-[13px] italic text-ink-400">
              Nenhum guideline citado ainda. Os guidelines aparecem depois que o Claude analisa a transcrição.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {citedGuidelines.map((g) => (
                <li
                  key={g.id}
                  className="rounded-md border border-black/[0.06] bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-label font-semibold text-clinical-700">
                      {formatGuidelineHeader(g)}
                    </span>
                    <span className="text-label text-ink-400">·</span>
                    <span className="text-[13px] font-semibold text-ink-900">{g.title}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-ink-600">{g.excerpt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {nextQuestion && (
          <div>
            <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
              <Sparkles size={12} />
              Próxima pergunta pendente
            </h3>
            <p className="mt-1 text-[14px] font-semibold text-ink-900">{nextQuestion.question}</p>
            <p className="mt-0.5 text-[12px] text-ink-600">{nextQuestion.reason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Block({
  icon,
  label,
  value,
  hint,
  hintTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  hintTone?: "ok" | "warn" | "danger" | "info" | "muted";
}) {
  const hintColor =
    hintTone === "ok"
      ? "text-clinical-700"
      : hintTone === "warn"
        ? "text-warning"
        : hintTone === "danger"
          ? "text-danger"
          : hintTone === "info"
            ? "text-clinical-700"
            : "text-ink-400";
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-900/[0.04] text-ink-900">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-label font-semibold text-ink-600">
          {label}
        </span>
        <span className="text-[14px] font-semibold text-ink-900">{value}</span>
        {hint && <span className={`mt-0.5 text-label ${hintColor}`}>{hint}</span>}
      </div>
    </div>
  );
}

function StateIcon({ state }: { state: string }) {
  if (state === "analyzing") return <Loader2 size={14} className="animate-spin" />;
  if (state === "error") return <AlertCircle size={14} />;
  return <Sparkles size={14} />;
}

function stateLabel(s: string): string {
  if (s === "analyzing") return "Analisando";
  if (s === "error") return "Erro";
  return "Inativo";
}
