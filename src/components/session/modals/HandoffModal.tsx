import { useEffect, useState } from "react";
import {
  ClipboardCopy,
  Check,
  Printer,
  FileDown,
  Share2,
  AlertTriangle,
  Activity,
  HelpCircle,
  Pill,
  FlaskConical,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient, getRedFlagById } from "@/mocks/session";
import { mockUser } from "@/data/user";
import {
  getActiveRedFlag,
  getPendingChecklistCount,
} from "@/lib/sessionSelectors";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { stripCitationMarkers } from "../shared/CitedText";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface HandoffModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * M1 — Handoff / Passagem de Plantão
 * Snapshot 1-tela do caso pro médico que entra assumir em ~30s.
 * Aproveita toda a inteligência acumulada: hipóteses + assumptions +
 * red flags + checklist + prescrições + pendências + citations.
 */
export function HandoffModal({ open, onClose }: HandoffModalProps) {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const checklist = useSessionStore((s) => s.checklist);
  const transcript = useSessionStore((s) => s.transcript);
  const prescriptions = useSessionStore((s) => s.prescriptions);
  const exams = useSessionStore((s) => s.exams);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const soapSections = useSessionStore((s) => s.soapSections);
  const pushToast = useSessionStore((s) => s.pushToast);

  const [copied, setCopied] = useState(false);

  const elapsedMin = sessionStartedAt
    ? Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000))
    : null;

  const activeHypotheses = [...hypotheses]
    .filter((h) => h.status !== "discarded")
    .sort((a, b) => b.confidence - a.confidence);

  const principal = activeHypotheses[0];
  const redFlag = getActiveRedFlag(transcript);
  const redFlagDetails = redFlag ? getRedFlagById(redFlag.redFlagId) : null;
  const pendingCount = getPendingChecklistCount(checklist);
  const pendingExamResults = exams.filter((e) => e.status === "requested");
  const checkedItems = checklist.filter((c) => c.status === "checked");

  const allCitations = new Set<string>();
  for (const h of activeHypotheses) h.citations?.forEach((c) => allCitations.add(c));

  const chiefComplaint = deriveChiefComplaint(transcript);

  const markdown = buildHandoffMarkdown({
    patient: mockPatient,
    author: mockUser,
    elapsedMin,
    chiefComplaint,
    hypotheses: activeHypotheses,
    redFlag: redFlagDetails
      ? { label: redFlagDetails.label, severity: redFlagDetails.severity }
      : null,
    checkedItems,
    pendingCount,
    prescriptions,
    pendingExams: pendingExamResults.map((e) => e.panelName),
    soapAssessment: soapSections?.assessment ?? "",
    citations: Array.from(allCitations),
  });

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      pushToast({
        tone: "success",
        title: "Passagem copiada",
        description: "Markdown na área de transferência — cole onde precisar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast({
        tone: "danger",
        title: "Falha ao copiar",
        description: "Seu browser bloqueou o clipboard.",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = mockPatient.name.toLowerCase().replace(/\s+/g, "-");
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "");
    a.href = url;
    a.download = `handoff-${slug}-${ts}.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      tone: "success",
      title: "Passagem baixada",
      description: "Arquivo .md salvo.",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Passagem de plantão"
      description="Snapshot para o próximo médico ler em 30 segundos."
    >
      <div className="flex flex-col gap-4">
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-ink-900/90"
          >
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
            {copied ? "Copiado" : "Copiar markdown"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.1] bg-surface px-4 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-surface-raised"
          >
            <FileDown size={14} /> Baixar .md
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.1] bg-surface px-4 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-surface-raised"
          >
            <Printer size={14} /> Imprimir
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Compartilhar = copiar markdown pra colar no WhatsApp/email"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/[0.1] bg-surface px-4 text-[13px] font-semibold text-ink-900 transition-colors hover:bg-surface-raised"
          >
            <Share2 size={14} /> Compartilhar
          </button>
        </div>

        {/* Snapshot preview */}
        <article
          id="handoff-snapshot"
          className="flex flex-col gap-3 rounded-[20px] border border-black/[0.08] bg-surface p-5 print:border-0 print:p-0"
        >
          {/* Header */}
          <header className="flex items-start justify-between gap-3 border-b border-black/[0.06] pb-3">
            <div>
              <h3 className="text-[20px] font-bold tracking-tight text-ink-900">
                {mockPatient.name}
              </h3>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-400">
                {mockPatient.sex === "F" ? "Feminino" : "Masculino"} ·{" "}
                {mockPatient.age} anos · #{mockPatient.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-400">
                Consulta em andamento
              </p>
              <p className="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-ink-900">
                {elapsedMin ? `${elapsedMin} min` : "—"}
              </p>
            </div>
          </header>

          {/* Chief complaint */}
          {chiefComplaint && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">
                Queixa principal
              </h4>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-900">
                {chiefComplaint}
              </p>
            </section>
          )}

          {/* Red flag ativo */}
          {redFlagDetails && (
            <section className="rounded-[16px] border border-peach-border bg-peach px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-peach-text"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-ultra text-peach-text">
                    Red flag · severidade {redFlagDetails.severity}
                  </span>
                  <p className="mt-0.5 text-[13px] font-medium text-ink-900">
                    {redFlagDetails.label}
                  </p>
                  <p className="mt-1 text-[12px] leading-snug text-ink-600">
                    {redFlagDetails.conduct[0]}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Hipóteses ranqueadas */}
          {activeHypotheses.length > 0 && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">
                Hipóteses em curso
              </h4>
              <ul className="mt-2 flex flex-col gap-2">
                {activeHypotheses.map((h, i) => (
                  <li
                    key={h.id}
                    className="flex items-start gap-3 rounded-[12px] border border-black/[0.05] bg-surface-raised px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums",
                        i === 0
                          ? "bg-clinical text-white"
                          : "bg-ink-900/10 text-ink-600"
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-semibold text-ink-900">
                          {h.label}
                        </span>
                        <span className="font-mono text-[11px] font-medium text-ink-400">
                          {h.icd10}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              h.status === "active"
                                ? "bg-clinical-glow"
                                : "bg-warning"
                            )}
                            style={{ width: `${h.confidence}%` }}
                          />
                        </div>
                        <span className="font-mono text-[13px] font-bold tabular-nums text-ink-900">
                          {h.confidence}%
                        </span>
                        {h.delta !== 0 && (
                          <span
                            className={cn(
                              "font-mono text-[10px] font-semibold tabular-nums",
                              h.delta > 0 ? "text-clinical-700" : "text-danger"
                            )}
                          >
                            {h.delta > 0 ? "+" : ""}
                            {h.delta}
                          </span>
                        )}
                      </div>
                      {h.trigger && (
                        <p className="mt-1 text-[11px] italic leading-snug text-ink-600">
                          Última mudança: {h.trigger}
                        </p>
                      )}
                      {h.assumptions && h.assumptions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {h.assumptions
                            .filter((a) => a.state !== "false")
                            .slice(0, 3)
                            .map((a) => (
                              <span
                                key={a.id}
                                className="inline-flex items-center gap-1 rounded-full bg-ink-900/[0.04] px-1.5 py-0.5 text-[10px] text-ink-600"
                              >
                                <HelpCircle size={8} />
                                {a.text}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Já feito */}
          {(checkedItems.length > 0 || prescriptions.length > 0) && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">
                Já feito
              </h4>
              <ul className="mt-1 flex flex-col gap-1 text-[12px] text-ink-900">
                {checkedItems.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <Check
                      size={11}
                      className="mt-0.5 shrink-0 text-clinical-glow"
                      strokeWidth={3}
                    />
                    <span>
                      {c.label}
                      {c.result && (
                        <span className="ml-1 font-mono font-semibold text-clinical-700">
                          {c.result}
                          {c.resultUnit && ` ${c.resultUnit}`}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
                {prescriptions.map((p) => (
                  <li key={p.id} className="flex items-start gap-2">
                    <Pill size={11} className="mt-0.5 shrink-0 text-clinical" />
                    <span>
                      <span className="font-semibold">{p.medicationName}</span>{" "}
                      {p.dose} · {p.frequency}
                      {p.duration !== "—" && ` · ${p.duration}`}
                      {p.status === "conditional" && (
                        <span className="ml-1 rounded-full bg-warning/15 px-1.5 text-[9px] font-bold uppercase tracking-wide text-warning">
                          SE {p.condition}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Pendente */}
          {(pendingCount > 0 || pendingExamResults.length > 0) && (
            <section>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">
                Pendente
              </h4>
              <ul className="mt-1 flex flex-col gap-1 text-[12px] text-ink-900">
                {pendingExamResults.map((e) => (
                  <li key={e.id} className="flex items-start gap-2">
                    <FlaskConical
                      size={11}
                      className="mt-0.5 shrink-0 text-warning"
                    />
                    <span>
                      Aguardando resultado: <strong>{e.panelName}</strong>
                    </span>
                  </li>
                ))}
                {pendingCount > 0 && (
                  <li className="flex items-start gap-2">
                    <Activity
                      size={11}
                      className="mt-0.5 shrink-0 text-warning"
                    />
                    <span>
                      {pendingCount} aferição
                      {pendingCount > 1 ? "ões" : ""} do checklist
                      bayesiano
                    </span>
                  </li>
                )}
              </ul>
            </section>
          )}

          {/* Citations */}
          {allCitations.size > 0 && (
            <section className="border-t border-black/[0.05] pt-3">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">
                Diretrizes consultadas
              </h4>
              <ul className="mt-1 flex flex-col gap-0.5 text-[11px] text-ink-600">
                {Array.from(allCitations).map((id) => {
                  const g = getGuidelineById(id);
                  if (!g) return null;
                  return (
                    <li key={id} className="font-mono">
                      <span className="font-semibold text-clinical-700">
                        {formatGuidelineHeader(g)}
                      </span>{" "}
                      <span className="font-sans text-ink-900">— {g.title}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Autor + timestamp */}
          <footer className="mt-2 flex items-center justify-between border-t border-black/[0.05] pt-3 text-[10px] text-ink-400">
            <span>
              Gerado por {mockUser.name} · {mockUser.crm}
            </span>
            <span>{new Date().toLocaleString("pt-BR")}</span>
          </footer>
        </article>

        <p className="text-[11px] italic leading-snug text-ink-400">
          Esta passagem é apoio cognitivo — a responsabilidade clínica e legal
          pelas decisões é do médico que assume o caso.
        </p>
      </div>
    </Modal>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

interface HandoffMarkdownInput {
  patient: typeof mockPatient;
  author: typeof mockUser;
  elapsedMin: number | null;
  chiefComplaint: string;
  hypotheses: ReturnType<typeof useSessionStore.getState>["hypotheses"];
  redFlag: { label: string; severity: string } | null;
  checkedItems: ReturnType<typeof useSessionStore.getState>["checklist"];
  pendingCount: number;
  prescriptions: ReturnType<typeof useSessionStore.getState>["prescriptions"];
  pendingExams: string[];
  soapAssessment: string;
  citations: string[];
}

function buildHandoffMarkdown(i: HandoffMarkdownInput): string {
  const lines: string[] = [];
  const L = (s = "") => lines.push(s);

  L(`# Passagem de plantão — ${i.patient.name}`);
  L();
  L(
    `**${i.patient.sex === "F" ? "Feminino" : "Masculino"} · ${i.patient.age}a · #${i.patient.id}**  `
  );
  L(`Consulta em andamento: **${i.elapsedMin ?? "—"} min**`);
  L();

  if (i.chiefComplaint) {
    L(`## Queixa principal`);
    L(i.chiefComplaint);
    L();
  }

  if (i.redFlag) {
    L(`## ⚠️ Red flag ativo`);
    L(`**${i.redFlag.label}** · severidade ${i.redFlag.severity}`);
    L();
  }

  if (i.hypotheses.length > 0) {
    L(`## Hipóteses em curso`);
    i.hypotheses.forEach((h, idx) => {
      const prefix = idx === 0 ? "**(principal)**" : "";
      L(
        `${idx + 1}. ${prefix} **${h.label}** (${h.icd10}) — ${h.confidence}% ${h.delta > 0 ? `(+${h.delta})` : h.delta < 0 ? `(${h.delta})` : ""}`
      );
      if (h.trigger) L(`   - Última mudança: ${h.trigger}`);
      if (h.assumptions && h.assumptions.length > 0) {
        const active = h.assumptions.filter((a) => a.state !== "false");
        if (active.length > 0) {
          L(
            `   - Premissas: ${active.map((a) => `${a.text} (${a.state})`).join(", ")}`
          );
        }
      }
    });
    L();
  }

  if (i.checkedItems.length > 0 || i.prescriptions.length > 0) {
    L(`## Já feito`);
    i.checkedItems.forEach((c) => {
      L(
        `- ✓ ${c.label}${c.result ? ` — ${c.result}${c.resultUnit ? ` ${c.resultUnit}` : ""}` : ""}`
      );
    });
    i.prescriptions.forEach((p) => {
      L(
        `- 💊 ${p.medicationName} ${p.dose} · ${p.frequency}${p.duration !== "—" ? ` · ${p.duration}` : ""}${p.status === "conditional" ? ` (SE ${p.condition})` : ""}`
      );
    });
    L();
  }

  if (i.pendingCount > 0 || i.pendingExams.length > 0) {
    L(`## Pendente`);
    i.pendingExams.forEach((e) => L(`- ⏳ Aguardando resultado: ${e}`));
    if (i.pendingCount > 0) {
      L(
        `- 📋 ${i.pendingCount} aferição${i.pendingCount > 1 ? "ões" : ""} do checklist bayesiano`
      );
    }
    L();
  }

  if (i.soapAssessment) {
    L(`## Avaliação (SOAP)`);
    L(stripCitationMarkers(i.soapAssessment));
    L();
  }

  if (i.citations.length > 0) {
    L(`## Diretrizes consultadas`);
    i.citations.forEach((id) => {
      const g = getGuidelineById(id);
      if (!g) return;
      L(`- ${formatGuidelineHeader(g)} — ${g.title}`);
    });
    L();
  }

  L(`---`);
  L(`Gerado por ${i.author.name} · ${i.author.crm} · ${new Date().toLocaleString("pt-BR")}`);
  L();
  L(
    `*Esta passagem é apoio cognitivo — a responsabilidade clínica e legal pelas decisões é do médico que assume o caso.*`
  );

  return lines.join("\n");
}

function deriveChiefComplaint(
  transcript: ReturnType<typeof useSessionStore.getState>["transcript"]
): string {
  const firstPatient = transcript.find(
    (t) => t.kind === "message" && t.speaker === "patient"
  );
  if (firstPatient && firstPatient.kind === "message") {
    return firstPatient.text;
  }
  return "";
}
