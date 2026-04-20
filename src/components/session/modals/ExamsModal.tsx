import { useRef, useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  FlaskConical,
  Clock,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { examPanels, getExamPanelById } from "@/data/examPanels";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { analyzeExamFile, isExamAnalyzerConfigured } from "@/lib/examAnalyzer";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import {
  EmptyState,
  ExamsEmptyIllustration,
} from "../shared/EmptyState";

interface ExamsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExamsModal({ open, onClose }: ExamsModalProps) {
  const exams = useSessionStore((s) => s.exams);
  const addExam = useSessionStore((s) => s.addExam);
  const setExamResult = useSessionStore((s) => s.setExamResult);
  const removeExam = useSessionStore((s) => s.removeExam);
  const pushToast = useSessionStore((s) => s.pushToast);

  const [panelId, setPanelId] = useState(examPanels[0].id);
  const [observation, setObservation] = useState("");

  const handleAdd = () => {
    const panel = getExamPanelById(panelId);
    if (!panel) return;
    addExam({
      panelId,
      panelName: panel.name,
      observation: observation.trim() || undefined,
    });
    pushToast({
      tone: "success",
      title: "Exame solicitado",
      description: panel.name,
    });
    setObservation("");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Exames solicitados"
      description="Solicitações de exames e resultados — registre manualmente ou analise foto/PDF com IA"
    >
      <div className="flex flex-col gap-3 rounded-lg border border-black/[0.06] bg-surface-raised p-4">
        <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
          <Plus size={12} /> Solicitar exame
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-label font-semibold text-ink-400">
            Painel
          </label>
          <select
            value={panelId}
            onChange={(e) => setPanelId(e.target.value)}
            className={inputClass}
          >
            {examPanels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.category}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-label font-semibold text-ink-400">
            Observação (opcional)
          </label>
          <input
            type="text"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="ex: urgência, suspeita de SCA"
            className={inputClass}
          />
        </div>
        <Button
          variant="primary"
          onClick={handleAdd}
          leadingIcon={<Plus size={14} />}
          className="w-fit"
        >
          Solicitar
        </Button>
      </div>

      <div className="mt-5 border-t border-black/5 pt-4">
        <h3 className="text-label font-semibold text-ink-400">
          Solicitados nesta sessão
          <span className="ml-2 font-mono text-ink-600">{exams.length}</span>
        </h3>
        {exams.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              illustration={<ExamsEmptyIllustration />}
              title="Nenhum exame solicitado"
              description="Escolha um painel acima e solicite. Você pode fazer upload do laudo depois — a IA extrai valores e correlaciona com as hipóteses."
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {exams.map((exam) => (
              <ExamRow
                key={exam.id}
                panelName={exam.panelName}
                observation={exam.observation}
                status={exam.status}
                result={exam.result}
                onResult={(v) => setExamResult(exam.id, v)}
                onRemove={() => removeExam(exam.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

const inputClass =
  "w-full rounded-md border border-black/10 bg-surface px-2.5 py-1.5 text-[14px] font-medium text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:border-clinical/40 focus:outline-none focus:ring-2 focus:ring-clinical/25";

interface ExamRowProps {
  panelName: string;
  observation?: string;
  status: "requested" | "resulted";
  result?: string;
  onResult: (v: string) => void;
  onRemove: () => void;
}

function ExamRow({
  panelName,
  observation,
  status,
  result,
  onResult,
  onRemove,
}: ExamRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hypotheses = useSessionStore((s) => s.hypotheses);

  const confirm = () => {
    if (!value.trim()) return;
    onResult(value.trim());
    setEditing(false);
    setValue("");
  };

  const pickFile = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isExamAnalyzerConfigured()) {
      setError(
        "API não configurada. Defina VITE_ANTHROPIC_API_KEY para analisar com IA."
      );
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const activeIcds = hypotheses
        .filter((h) => h.status !== "discarded")
        .map((h) => `${h.label} (${h.icd10}) · ${h.confidence}%`);
      const patientContext = `${mockPatient.name}, ${mockPatient.sex === "F" ? "feminino" : "masculino"}, ${mockPatient.age} anos. Hipóteses ativas: ${activeIcds.join("; ") || "nenhuma"}.`;

      const analysis = await analyzeExamFile({
        file,
        panelName,
        patientContext,
      });
      onResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao analisar arquivo");
    } finally {
      setAnalyzing(false);
    }
  };

  const isResulted = status === "resulted";

  return (
    <li className="flex items-start gap-3 rounded-lg border border-black/[0.06] bg-surface p-3">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          isResulted
            ? "bg-clinical/10 text-clinical-700"
            : "bg-warning/10 text-warning"
        )}
      >
        {isResulted ? <CheckCircle2 size={14} /> : <FlaskConical size={14} />}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink-900">{panelName}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-label font-semibold",
              isResulted
                ? "bg-clinical/10 text-clinical-700"
                : "bg-warning/10 text-warning"
            )}
          >
            {isResulted ? "Com resultado" : "Aguardando"}
          </span>
        </div>
        {observation && (
          <p className="text-[12px] italic text-ink-600">{observation}</p>
        )}
        {isResulted && result ? (
          <p className="text-[13px] font-semibold text-clinical-700">{result}</p>
        ) : editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirm();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="ex: 0.04 ng/mL · normal"
              className={inputClass}
            />
            <button
              type="button"
              onClick={confirm}
              disabled={!value.trim()}
              className="rounded-md bg-clinical px-2 py-1 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              OK
            </button>
          </div>
        ) : analyzing ? (
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-clinical-700">
            <Loader2 size={12} className="animate-spin" /> Analisando arquivo com IA…
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 rounded-md text-[12px] font-semibold text-clinical-700 hover:underline"
            >
              <Clock size={11} /> Registrar manualmente
            </button>
            <span className="text-[11px] text-ink-400">ou</span>
            <button
              type="button"
              onClick={pickFile}
              className="flex items-center gap-1 rounded-md border border-clinical/30 bg-clinical/[0.04] px-2 py-0.5 text-[12px] font-semibold text-clinical-700 hover:border-clinical hover:bg-clinical/10"
            >
              <Sparkles size={11} /> Analisar foto / PDF com IA
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-danger">
            <AlertCircle size={10} /> {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover exame"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-surface-raised hover:text-danger"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
