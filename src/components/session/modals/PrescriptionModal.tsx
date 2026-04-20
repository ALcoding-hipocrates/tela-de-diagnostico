import { useMemo, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Pill,
} from "lucide-react";
import type { Prescription, PrescriptionStatus } from "@/types/session";
import {
  medications,
  getMedicationById,
  getAlertsFor,
  type MedicationAlert,
  type Route,
} from "@/data/medications";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { Button } from "../shared/Button";
import {
  EmptyState,
  PrescriptionEmptyIllustration,
} from "../shared/EmptyState";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface PrescriptionModalProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  new: "Novo",
  maintained: "Mantido",
  conditional: "Condicional",
};

export function PrescriptionModal({ open, onClose }: PrescriptionModalProps) {
  const prescriptions = useSessionStore((s) => s.prescriptions);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prescrição médica"
      description="Alertas informativos de contraindicação e interação — responsabilidade clínica do profissional."
    >
      <PrescriptionForm />
      <div className="mt-5 border-t border-black/5 pt-4">
        <h3 className="text-label font-semibold text-ink-400">
          Prescrições da sessão
          <span className="ml-2 font-mono text-ink-600">{prescriptions.length}</span>
        </h3>
        {prescriptions.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              illustration={<PrescriptionEmptyIllustration />}
              title="Nenhuma prescrição adicionada"
              description="Use o formulário acima para prescrever. A IA checa interações, contraindicações e ajuste renal/hepático automaticamente."
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {prescriptions.map((p) => (
              <PrescriptionCard key={p.id} prescription={p} />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function PrescriptionForm() {
  const addPrescription = useSessionStore((s) => s.addPrescription);
  const pushToast = useSessionStore((s) => s.pushToast);

  const [medicationId, setMedicationId] = useState(medications[0].id);
  const med = getMedicationById(medicationId)!;

  const [dose, setDose] = useState(med.commonDose);
  const [route, setRoute] = useState<Route>(med.defaultRoute);
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus>("new");
  const [condition, setCondition] = useState("");
  const [justification, setJustification] = useState("");

  const onMedChange = (id: string) => {
    const m = getMedicationById(id);
    if (!m) return;
    setMedicationId(id);
    setDose(m.commonDose);
    setRoute(m.defaultRoute);
  };

  const canSubmit = medicationId && dose.trim() && frequency.trim();

  const submit = () => {
    if (!canSubmit) return;
    addPrescription({
      medicationId,
      medicationName: med.name,
      medicationClass: med.medClass,
      dose,
      route,
      frequency: frequency.trim(),
      duration: duration.trim() || "—",
      status,
      condition: status === "conditional" ? condition.trim() : undefined,
      justification: justification.trim() || undefined,
    });
    pushToast({
      tone: "success",
      title: "Prescrição adicionada",
      description: `${med.name} ${dose} · ${frequency.trim()}`,
    });
    setFrequency("");
    setDuration("");
    setCondition("");
    setJustification("");
    setStatus("new");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/[0.06] bg-surface-raised p-4">
      <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
        <Plus size={12} /> Nova prescrição
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Medicamento" span={2}>
          <select
            value={medicationId}
            onChange={(e) => onMedChange(e.target.value)}
            className="w-full rounded-md border border-black/10 bg-surface px-2.5 py-1.5 text-[14px] font-medium text-ink-900 focus:border-clinical/40 focus:outline-none focus:ring-2 focus:ring-clinical/25"
          >
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.medClass}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dose">
          <input
            type="text"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Via">
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value as Route)}
            className={inputClass}
          >
            {med.routes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Frequência">
          <input
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="ex: 8/8h"
            className={inputClass}
          />
        </Field>

        <Field label="Duração">
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="ex: 7 dias"
            className={inputClass}
          />
        </Field>

        <Field label="Status" span={2}>
          <div role="radiogroup" className="flex gap-2">
            {(Object.keys(STATUS_LABELS) as PrescriptionStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors",
                  status === s
                    ? "border-clinical bg-clinical/10 text-clinical-700"
                    : "border-black/10 bg-surface text-ink-600 hover:text-ink-900"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </Field>

        {status === "conditional" && (
          <Field label="Condição (iniciar SE…)" span={2}>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="ex: PA ≥ 140/90 confirmada"
              className={inputClass}
            />
          </Field>
        )}

        <Field label="Justificativa (opcional)" span={2}>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={2}
            className={cn(inputClass, "resize-none")}
            placeholder="ex: ESC 2023 §5.2 — anti-hipertensivo de 1ª linha"
          />
        </Field>
      </div>

      <Button
        variant="primary"
        onClick={submit}
        disabled={!canSubmit}
        leadingIcon={<Plus size={14} />}
        className="w-fit"
      >
        Adicionar
      </Button>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-black/10 bg-surface px-2.5 py-1.5 text-[14px] font-medium text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:border-clinical/40 focus:outline-none focus:ring-2 focus:ring-clinical/25";

function Field({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: 1 | 2;
}) {
  return (
    <div className={cn("flex flex-col gap-1", span === 2 && "col-span-2")}>
      <label className="text-label font-semibold text-ink-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  const removePrescription = useSessionStore((s) => s.removePrescription);
  const hypotheses = useSessionStore((s) => s.hypotheses);

  const alerts = useMemo(() => {
    const med = getMedicationById(prescription.medicationId);
    if (!med) return [];
    const activeIcd10s = hypotheses
      .filter((h) => h.status === "active" || h.status === "investigating")
      .map((h) => h.icd10);
    return getAlertsFor(med, {
      patientTags: mockPatient.tags,
      patientAge: mockPatient.age,
      activeIcd10s,
    });
  }, [prescription.medicationId, hypotheses]);

  return (
    <li className="rounded-lg border border-black/[0.06] bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-clinical/10 text-clinical-700">
            <Pill size={14} />
          </span>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-baseline gap-2">
              <h4 className="text-[14px] font-semibold text-ink-900">
                {prescription.medicationName}
              </h4>
              <StatusBadge status={prescription.status} />
            </div>
            <p className="text-label font-medium text-ink-400">
              {prescription.medicationClass}
            </p>
            <p className="mt-1.5 font-mono text-[13px] font-semibold text-ink-900">
              {prescription.dose} · {prescription.route} · {prescription.frequency}
              {prescription.duration !== "—" && ` · ${prescription.duration}`}
            </p>
            {prescription.status === "conditional" && prescription.condition && (
              <p className="mt-1 text-[13px] font-medium text-ink-600">
                <span className="font-semibold text-warning">SE</span>{" "}
                {prescription.condition}
              </p>
            )}
            {prescription.justification && (
              <p className="mt-1 text-[12px] italic text-ink-600">
                {prescription.justification}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => removePrescription(prescription.id)}
          aria-label="Remover prescrição"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-surface-raised hover:text-danger"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {alerts.map((alert, i) => (
            <AlertBadge key={i} alert={alert} />
          ))}
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const cfg = {
    new: { bg: "bg-clinical/10", text: "text-clinical-700" },
    maintained: { bg: "bg-ink-400/15", text: "text-ink-600" },
    conditional: { bg: "bg-warning/10", text: "text-warning" },
  }[status];
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-label font-semibold",
        cfg.bg,
        cfg.text
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function AlertBadge({ alert }: { alert: MedicationAlert }) {
  const isAbsolute = alert.severity === "absolute";
  const guideline = alert.reference ? getGuidelineById(alert.reference) : null;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-2.5 py-2",
        isAbsolute
          ? "border-danger/30 bg-danger/5"
          : "border-warning/30 bg-warning/5"
      )}
    >
      {isAbsolute ? (
        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-danger" />
      ) : (
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-warning" />
      )}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-label font-semibold",
            isAbsolute ? "text-danger" : "text-warning"
          )}
        >
          {isAbsolute ? "Contraindicação absoluta" : "Atenção · interação"}
        </span>
        <p className="text-[13px] font-medium leading-snug text-ink-900">
          {alert.message}
        </p>
        {guideline && (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-black/[0.06] bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-600">
            <BookOpen size={9} className="text-clinical" />
            {formatGuidelineHeader(guideline)}
          </span>
        )}
      </div>
    </div>
  );
}
