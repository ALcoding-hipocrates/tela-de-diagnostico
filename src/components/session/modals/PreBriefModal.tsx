import { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Activity,
  HelpCircle,
  Pill,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import {
  generatePreBrief,
  isBriefConfigured,
  type PreBriefOutput,
} from "@/lib/preConsultationBrief";
import { Modal } from "../shared/Modal";

interface PreBriefModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * M2 — Pre-Consultation Brief Modal
 * Médico cola notas prévias/exames/recepção e IA gera brief em segundos.
 */
export function PreBriefModal({ open, onClose }: PreBriefModalProps) {
  const setPreBrief = useSessionStore((s) => s.setPreBrief);
  const pushToast = useSessionStore((s) => s.pushToast);

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreBriefOutput | null>(null);

  const apiOn = isBriefConfigured();

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const out = await generatePreBrief({
        patientName: mockPatient.name,
        patientAge: mockPatient.age,
        patientSex: mockPatient.sex,
        rawNotes: notes,
      });
      setResult(out);
      setPreBrief(out.raw);
      pushToast({
        tone: "success",
        title: "Brief gerado",
        description: `${out.suspectedHypotheses.length} hipótese${out.suspectedHypotheses.length > 1 ? "s" : ""} levantada${out.suspectedHypotheses.length > 1 ? "s" : ""}`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na geração");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    pushToast({
      tone: "info",
      title: "Brief salvo na sessão",
      description: "Clique no microfone pra iniciar a consulta.",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Brief pré-consulta"
      description="Cole notas da recepção, exames recentes, histórico — a IA prepara o caso em segundos."
    >
      <div className="flex flex-col gap-4">
        {!apiOn && (
          <div className="rounded-[12px] border border-warning/30 bg-warning/[0.06] px-3 py-2.5 text-[12px] text-warning">
            API Claude não configurada. Defina VITE_ANTHROPIC_API_KEY no
            .env.local para usar esta feature.
          </div>
        )}

        <section className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-ultra text-ink-600">
            Notas prévias (histórico, exames recentes, nota da recepção)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={7}
            placeholder={`Ex.:\n- Maria, 58a, hipertensa em uso de Losartana 50mg\n- Última consulta há 2 meses por cefaleia\n- Hemograma recente: normal\n- Recepção: paciente reagendou 2x, comenta ansiedade\n- Hoje vem com cefaleia persistente + formigamento braço esquerdo`}
            className="w-full resize-none rounded-[12px] border border-black/[0.1] bg-surface px-3 py-2.5 text-[13px] font-medium leading-relaxed text-ink-900 placeholder:italic placeholder:text-ink-400 focus:border-clinical focus:outline-none focus:ring-2 focus:ring-clinical/25"
            disabled={loading}
          />
          <p className="text-[10.5px] italic text-ink-400">
            Suporta texto livre. PDFs/imagens em versão futura.
          </p>
        </section>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !notes.trim() || !apiOn}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-clinical px-5 text-[13px] font-semibold text-white transition-colors hover:bg-clinical-700 disabled:cursor-not-allowed disabled:bg-ink-400/40"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {loading ? "Gerando brief..." : "Gerar brief"}
        </button>

        {error && (
          <div className="rounded-[12px] border border-danger/25 bg-danger/[0.05] px-3 py-2 text-[12px] text-danger">
            {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3 rounded-[16px] border border-clinical/15 bg-clinical/[0.03] p-4">
            <header className="flex items-center gap-2">
              <Sparkles size={14} className="text-clinical-700" />
              <h4 className="text-[10px] font-bold uppercase tracking-ultra text-clinical-700">
                Brief gerado
              </h4>
            </header>

            <p className="text-[13px] leading-relaxed text-ink-900">
              {result.summary}
            </p>

            {result.suspectedHypotheses.length > 0 && (
              <section>
                <h5 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
                  Hipóteses possíveis
                </h5>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {result.suspectedHypotheses.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-[10px] bg-surface px-3 py-2 text-[12px]"
                    >
                      <Activity
                        size={11}
                        className="mt-0.5 shrink-0 text-clinical"
                      />
                      <div>
                        <span className="font-semibold text-ink-900">
                          {h.label}
                        </span>
                        {h.icd10 && (
                          <span className="ml-1 font-mono text-[10px] text-ink-400">
                            {h.icd10}
                          </span>
                        )}
                        <p className="mt-0.5 leading-snug text-ink-600">
                          {h.rationale}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.historicalRedFlags.length > 0 && (
              <section>
                <h5 className="text-[10px] font-bold uppercase tracking-ultra text-peach-text">
                  Red flags históricas
                </h5>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {result.historicalRedFlags.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-[10px] bg-peach px-3 py-2 text-[12px] text-peach-text"
                    >
                      <AlertTriangle
                        size={11}
                        className="mt-0.5 shrink-0 text-peach-text"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.keyQuestions.length > 0 && (
              <section>
                <h5 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
                  Perguntas-chave iniciais
                </h5>
                <ol className="mt-1.5 flex flex-col gap-1 pl-1 text-[12px] text-ink-900">
                  {result.keyQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <HelpCircle
                        size={11}
                        className="mt-0.5 shrink-0 text-clinical-700"
                      />
                      <span className="leading-snug">{q}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {result.reconcileMedications.length > 0 && (
              <section>
                <h5 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
                  Medicações a reconciliar
                </h5>
                <ul className="mt-1.5 flex flex-col gap-1 text-[12px]">
                  {result.reconcileMedications.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-ink-900"
                    >
                      <Pill
                        size={11}
                        className="mt-0.5 shrink-0 text-clinical"
                      />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-clinical/10 pt-3">
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ink-900/90"
              >
                Começar consulta
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
