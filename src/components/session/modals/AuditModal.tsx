import { useMemo } from "react";
import {
  Shield,
  BookOpen,
  Activity,
  Check,
  HelpCircle,
  X as XIcon,
  Sparkles,
  FileDown,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient, getRedFlagById } from "@/mocks/session";
import { mockUser } from "@/data/user";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface AuditModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * M5 — Validation Trail / Audit Mode
 * Rastro completo de cada decisão do motor clínico. Pitch pra compliance,
 * auditoria de hospital, CFM, ANVISA. Ataca a caixa-preta do Charcot/Voa.
 */
export function AuditModal({ open, onClose }: AuditModalProps) {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const transcript = useSessionStore((s) => s.transcript);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const pushToast = useSessionStore((s) => s.pushToast);

  const stats = useMemo(() => {
    const allCitations = new Set<string>();
    let assumptionsTotal = 0;
    let assumptionsVerified = 0;
    let assumptionsFalse = 0;

    for (const h of hypotheses) {
      h.citations?.forEach((c) => allCitations.add(c));
      if (h.assumptions) {
        assumptionsTotal += h.assumptions.length;
        assumptionsVerified += h.assumptions.filter(
          (a) => a.state === "verified"
        ).length;
        assumptionsFalse += h.assumptions.filter(
          (a) => a.state === "false"
        ).length;
      }
    }

    const shifts = transcript
      .filter((t): t is Extract<typeof t, { kind: "shift" }> => t.kind === "shift")
      .flatMap((s) => s.shifts);

    const messageCount = transcript.filter((t) => t.kind === "message").length;
    const redFlagsRaw = transcript
      .filter((t) => t.kind === "message")
      .flatMap((t) => (t.kind === "message" ? t.redFlags ?? [] : []));
    const uniqueRedFlags = new Set(redFlagsRaw.map((r) => r.redFlagId));

    return {
      citations: Array.from(allCitations),
      assumptionsTotal,
      assumptionsVerified,
      assumptionsFalse,
      shifts,
      messageCount,
      redFlagCount: uniqueRedFlags.size,
      uniqueRedFlags: Array.from(uniqueRedFlags),
    };
  }, [hypotheses, transcript]);

  const sessionStartLabel = sessionStartedAt
    ? new Date(sessionStartedAt).toLocaleString("pt-BR")
    : "Sessão não iniciada";

  const elapsedMin = sessionStartedAt
    ? Math.max(1, Math.round((Date.now() - sessionStartedAt) / 60000))
    : 0;

  const downloadTrail = () => {
    const lines: string[] = [];
    lines.push(`# Trilha de auditoria — ${mockPatient.name}`);
    lines.push("");
    lines.push(
      `Paciente: ${mockPatient.name} (${mockPatient.sex}, ${mockPatient.age}a, #${mockPatient.id})`
    );
    lines.push(`Médico: ${mockUser.name} · ${mockUser.crm}`);
    lines.push(`Sessão iniciada: ${sessionStartLabel}`);
    lines.push(`Duração: ${elapsedMin} min · Modelo: claude-opus-4-7`);
    lines.push("");
    lines.push(`## Estatísticas`);
    lines.push(`- Mensagens processadas: ${stats.messageCount}`);
    lines.push(`- Hipóteses avaliadas: ${hypotheses.length}`);
    lines.push(`- Diretrizes consultadas: ${stats.citations.length}`);
    lines.push(
      `- Premissas declaradas: ${stats.assumptionsTotal} (verificadas: ${stats.assumptionsVerified} · contestadas: ${stats.assumptionsFalse})`
    );
    lines.push(`- Atualizações de confiança: ${stats.shifts.length}`);
    lines.push(`- Red flags detectadas: ${stats.redFlagCount}`);
    lines.push("");
    lines.push(`## Hipóteses — trajetória`);
    hypotheses.forEach((h) => {
      const first = h.sparkline[0]?.value ?? h.confidence;
      const last = h.sparkline[h.sparkline.length - 1]?.value ?? h.confidence;
      lines.push(`### ${h.label} (${h.icd10}) — ${h.status}`);
      lines.push(`Confiança: ${first}% → ${last}%`);
      h.sparkline.forEach((p, i) => {
        const prev = h.sparkline[i - 1]?.value;
        const d = prev !== undefined ? p.value - prev : 0;
        lines.push(
          `  - ${p.value}% ${d > 0 ? `(+${d})` : d < 0 ? `(${d})` : ""}: ${p.label ?? "—"}`
        );
      });
      if (h.assumptions && h.assumptions.length > 0) {
        lines.push(`Premissas:`);
        h.assumptions.forEach((a) => {
          lines.push(`  - [${a.state}] ${a.text}`);
        });
      }
      if (h.citations && h.citations.length > 0) {
        lines.push(`Citações:`);
        h.citations.forEach((cid) => {
          const g = getGuidelineById(cid);
          if (g) lines.push(`  - ${formatGuidelineHeader(g)} — ${g.title}`);
        });
      }
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = mockPatient.name.toLowerCase().replace(/\s+/g, "-");
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "");
    a.href = url;
    a.download = `auditoria-${slug}-${ts}.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({
      tone: "success",
      title: "Trilha exportada",
      description: "Arquivo .md de auditoria salvo.",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Auditoria de raciocínio"
      description="Rastro completo de cada decisão da IA nesta consulta — transparente, exportável."
    >
      <div className="flex flex-col gap-4">
        {/* Header tech */}
        <section className="rounded-[16px] border border-black/[0.08] bg-surface-raised px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-white">
              <Shield size={15} />
            </span>
            <div className="flex-1">
              <h4 className="text-[13px] font-semibold text-ink-900">
                Método bayesiano transparente
              </h4>
              <p className="mt-0.5 text-[11.5px] leading-snug text-ink-600">
                Claude Opus 4.7 com adaptive thinking · guidelines SBC · ABN ·
                SBEM · FEBRASGO · ESC · AHA · NICE · Cada atualização é
                registrada com evidência e fonte.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTrail}
              className="flex h-8 items-center gap-1.5 rounded-full border border-black/[0.1] bg-surface px-3 text-[11.5px] font-semibold text-ink-900 transition-colors hover:bg-surface-raised"
            >
              <FileDown size={12} /> Exportar
            </button>
          </div>
        </section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={<Activity size={12} />}
            label="Atualizações"
            value={stats.shifts.length}
            hint="hipóteses recalibradas"
          />
          <StatCard
            icon={<BookOpen size={12} />}
            label="Diretrizes"
            value={stats.citations.length}
            hint="consultadas"
          />
          <StatCard
            icon={<HelpCircle size={12} />}
            label="Premissas"
            value={`${stats.assumptionsVerified}/${stats.assumptionsTotal}`}
            hint="verificadas"
          />
          <StatCard
            icon={<Sparkles size={12} />}
            label="Red flags"
            value={stats.redFlagCount}
            hint="detectadas"
          />
        </section>

        {/* Hipóteses trajectory */}
        <section>
          <h4 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
            Trajetória de cada hipótese
          </h4>
          <ul className="mt-2 flex flex-col gap-2.5">
            {hypotheses.map((h) => {
              const first = h.sparkline[0]?.value ?? h.confidence;
              const last =
                h.sparkline[h.sparkline.length - 1]?.value ?? h.confidence;
              const delta = last - first;
              return (
                <li
                  key={h.id}
                  className="rounded-[12px] border border-black/[0.06] bg-surface px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink-900">
                      {h.label}{" "}
                      <span className="font-mono text-[11px] font-normal text-ink-400">
                        {h.icd10}
                      </span>
                    </span>
                    <span className="flex items-baseline gap-1 font-mono text-[11px] text-ink-600">
                      <span>{first}%</span>
                      <span>→</span>
                      <span className="font-semibold text-ink-900">{last}%</span>
                      {delta !== 0 && (
                        <span
                          className={cn(
                            "ml-1",
                            delta > 0 ? "text-clinical-700" : "text-danger"
                          )}
                        >
                          ({delta > 0 ? "+" : ""}
                          {delta})
                        </span>
                      )}
                    </span>
                  </div>

                  {h.sparkline.length > 1 && (
                    <ol className="mt-2 flex flex-col gap-0.5">
                      {h.sparkline.slice(1).map((p, i) => {
                        const prev = h.sparkline[i];
                        const d = p.value - prev.value;
                        return (
                          <li
                            key={i}
                            className="flex items-baseline gap-2 text-[11px]"
                          >
                            <span
                              className={cn(
                                "w-14 shrink-0 font-mono font-semibold tabular-nums",
                                d > 0
                                  ? "text-clinical-700"
                                  : d < 0
                                    ? "text-danger"
                                    : "text-ink-400"
                              )}
                            >
                              {d > 0 ? "+" : ""}
                              {d}%
                            </span>
                            <span className="flex-1 leading-snug text-ink-600">
                              {p.label ?? "ajuste automático"}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {h.assumptions && h.assumptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-black/[0.04] pt-2">
                      {h.assumptions.map((a) => {
                        const icon =
                          a.state === "verified" ? (
                            <Check size={9} strokeWidth={3} />
                          ) : a.state === "false" ? (
                            <XIcon size={9} strokeWidth={3} />
                          ) : (
                            <HelpCircle size={9} />
                          );
                        const tone =
                          a.state === "verified"
                            ? "bg-clinical-glow/20 text-clinical-700"
                            : a.state === "false"
                              ? "bg-danger/15 text-danger line-through"
                              : "bg-ink-900/[0.05] text-ink-600";
                        return (
                          <span
                            key={a.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                              tone
                            )}
                          >
                            {icon}
                            {a.text}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Citations */}
        {stats.citations.length > 0 && (
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
              Diretrizes citadas ({stats.citations.length})
            </h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {stats.citations.map((id) => {
                const g = getGuidelineById(id);
                if (!g) return null;
                return (
                  <li
                    key={id}
                    className="flex items-start gap-2 rounded-[10px] bg-surface-raised px-3 py-2 text-[11.5px]"
                  >
                    <BookOpen
                      size={11}
                      className="mt-0.5 shrink-0 text-clinical"
                    />
                    <div>
                      <span className="font-mono font-semibold text-clinical-700">
                        {formatGuidelineHeader(g)}
                      </span>{" "}
                      <span className="text-ink-900">— {g.title}</span>
                      <p className="mt-0.5 leading-snug text-ink-600">
                        {g.excerpt}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Red flags */}
        {stats.uniqueRedFlags.length > 0 && (
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
              Red flags detectadas
            </h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {stats.uniqueRedFlags.map((id) => {
                const rf = getRedFlagById(id);
                if (!rf) return null;
                return (
                  <li
                    key={id}
                    className="rounded-[10px] border border-peach-border bg-peach px-3 py-2 text-[11.5px]"
                  >
                    <span className="font-semibold text-peach-text">
                      {rf.label}
                    </span>
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wide text-peach-text/80">
                      · severidade {rf.severity}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="flex items-center justify-between border-t border-black/[0.05] pt-3 text-[10.5px] text-ink-400">
          <span>
            Sessão iniciada: <span className="font-mono">{sessionStartLabel}</span>
          </span>
          <span>
            Modelo: <span className="font-mono">claude-opus-4-7</span>
          </span>
        </footer>
      </div>
    </Modal>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[12px] border border-black/[0.06] bg-surface-raised px-3 py-2.5">
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-ultra text-ink-400">
        {icon} {label}
      </span>
      <span className="font-mono text-[20px] font-bold tabular-nums leading-none text-ink-900">
        {value}
      </span>
      <span className="text-[10px] leading-snug text-ink-600">{hint}</span>
    </div>
  );
}
