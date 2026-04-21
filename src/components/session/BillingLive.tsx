import { useEffect, useRef, useState } from "react";
import {
  Receipt,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { defaultConsultationTuss } from "@/data/tussCodes";
import { cn } from "@/lib/cn";

/**
 * M4 — Billing Live
 * Widget no rodapé da MainStage que mostra TUSS + CID + requisitos TISS em tempo
 * real. Médico vê enquanto consulta rola se já está "faturável" ou o que falta
 * completar. Ataca o moat do Amplimed — que só mostra billing post-consulta.
 */

// Valores médios de convênio (mock). Em produção, vem de tabela configurável.
const ESTIMATED_VALUE_BRL = 90;

/** Duração mínima de anamnese pra TISS cobrir (minutos). */
const MIN_ANAMNESE_MIN = 3;

export function BillingLive() {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const prescriptions = useSessionStore((s) => s.prescriptions);
  const transcript = useSessionStore((s) => s.transcript);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionStartedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, [sessionStartedAt]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const elapsedSec = sessionStartedAt
    ? Math.floor((now - sessionStartedAt) / 1000)
    : 0;
  const elapsedMin = Math.floor(elapsedSec / 60);

  const activeCids = hypotheses
    .filter((h) => h.status !== "discarded")
    .sort((a, b) => b.confidence - a.confidence);
  const primaryCid = activeCids[0];
  const secondaryCids = activeCids.slice(1, 3);

  const messageCount = transcript.filter((t) => t.kind === "message").length;

  const requirements = [
    {
      id: "duration",
      label: `Anamnese ≥ ${MIN_ANAMNESE_MIN} min`,
      met: elapsedMin >= MIN_ANAMNESE_MIN,
      hint: sessionStartedAt
        ? `Consulta em ${elapsedMin} min`
        : "Inicie a captura de áudio",
    },
    {
      id: "primary-cid",
      label: "CID primário definido",
      met: !!primaryCid,
      hint: primaryCid
        ? `${primaryCid.icd10} · ${primaryCid.label}`
        : "Aguarde a IA fechar a hipótese principal",
    },
    {
      id: "content",
      label: "Registro mínimo da consulta",
      met: messageCount >= 4,
      hint: `${messageCount} mensagem${messageCount === 1 ? "" : "s"} registrada${messageCount === 1 ? "" : "s"}`,
    },
    {
      id: "prescription",
      label: "Prescrição (opcional, + valor)",
      met: prescriptions.length > 0,
      hint:
        prescriptions.length > 0
          ? `${prescriptions.length} prescrição${prescriptions.length > 1 ? "ões" : ""}`
          : "Adicione uma prescrição se aplicável",
      optional: true,
    },
  ];

  const unmetRequired = requirements.filter((r) => !r.met && !r.optional);
  const ready = unmetRequired.length === 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
          ready
            ? "border-clinical/30 bg-clinical/[0.06] text-clinical-700 hover:bg-clinical/[0.1]"
            : "border-warning/30 bg-warning/[0.06] text-warning hover:bg-warning/[0.1]"
        )}
        title={
          ready
            ? `Consulta faturável · R$ ${ESTIMATED_VALUE_BRL} · TUSS ${defaultConsultationTuss.code}${primaryCid ? ` · CID ${primaryCid.icd10}` : ""}`
            : `${unmetRequired.length} requisito(s) TISS pendente(s) — clique pra ver`
        }
      >
        <Receipt size={14} />
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface ring-1",
            ready ? "ring-clinical/40" : "ring-warning/40"
          )}
          aria-hidden
        >
          {ready ? (
            <Check size={9} strokeWidth={3} className="text-clinical-700" />
          ) : (
            <AlertCircle size={9} className="text-warning" />
          )}
        </span>
        <ChevronDown
          size={9}
          className={cn(
            "absolute -bottom-1 text-ink-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full z-30 mt-2 w-[360px] overflow-hidden rounded-[16px] border border-black/[0.08] bg-surface shadow-2xl animate-pop-in"
        >
          <header className="border-b border-black/[0.06] bg-surface-raised px-4 py-3">
            <div className="flex items-center gap-2">
              <Receipt size={13} className="text-clinical-700" />
              <h4 className="text-[10px] font-bold uppercase tracking-ultra text-ink-900">
                Faturamento TISS · em tempo real
              </h4>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-ink-600">
              Valor estimado{" "}
              <span className="font-mono font-semibold text-ink-900">
                R$ {ESTIMATED_VALUE_BRL},00
              </span>{" "}
              (convênio médio)
            </p>
          </header>

          <div className="flex flex-col gap-2.5 px-4 py-3">
            {/* Codes */}
            <section>
              <h5 className="text-[9px] font-bold uppercase tracking-ultra text-ink-400">
                Códigos
              </h5>
              <ul className="mt-1.5 flex flex-col gap-1 text-[12px]">
                <li className="flex items-baseline justify-between">
                  <span className="text-ink-600">TUSS</span>
                  <span className="font-mono font-semibold text-ink-900">
                    {defaultConsultationTuss.code}{" "}
                    <span className="text-ink-400">·</span>{" "}
                    <span className="text-ink-600">
                      {defaultConsultationTuss.label}
                    </span>
                  </span>
                </li>
                {primaryCid && (
                  <li className="flex items-baseline justify-between">
                    <span className="text-ink-600">CID primário</span>
                    <span className="font-mono font-semibold text-ink-900">
                      {primaryCid.icd10}{" "}
                      <span className="text-ink-400">·</span>{" "}
                      <span className="text-ink-600">{primaryCid.label}</span>
                    </span>
                  </li>
                )}
                {secondaryCids.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-ink-600">
                      CID secundário {i + 1}
                    </span>
                    <span className="font-mono font-semibold text-ink-900">
                      {c.icd10}{" "}
                      <span className="text-ink-400">·</span>{" "}
                      <span className="text-ink-600">{c.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Requirements */}
            <section className="border-t border-black/[0.05] pt-2.5">
              <h5 className="text-[9px] font-bold uppercase tracking-ultra text-ink-400">
                Requisitos
              </h5>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {requirements.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-start gap-2 text-[11.5px]",
                      r.met ? "text-ink-900" : "text-ink-600"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full",
                        r.met
                          ? "bg-clinical-glow/20 text-clinical-700"
                          : r.optional
                            ? "bg-ink-400/15 text-ink-400"
                            : "bg-warning/15 text-warning"
                      )}
                    >
                      {r.met ? (
                        <Check size={9} strokeWidth={3} />
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {r.label}
                        {r.optional && (
                          <span className="ml-1 text-[9px] font-normal italic text-ink-400">
                            (opcional)
                          </span>
                        )}
                      </p>
                      <p className="text-[10.5px] leading-snug text-ink-400">
                        {r.hint}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {!ready && (
              <p className="rounded-[10px] bg-warning/[0.08] px-3 py-2 text-[11px] leading-snug text-warning">
                ⚠ Consulta ainda não está faturável. Complete os requisitos
                acima antes de fechar o atendimento no PEP.
              </p>
            )}
            {ready && (
              <p className="rounded-[10px] bg-clinical/[0.06] px-3 py-2 text-[11px] leading-snug text-clinical-700">
                ✓ Pronta pra faturamento TISS. Copie os códigos acima pro seu
                PEP (Amplimed, iClinic, Tasy, MV) ou use nosso FHIR Bundle via
                Exportar.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
