import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Pencil,
  Copy,
  Check,
  RotateCcw,
  X,
  Receipt,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import type { SoapSections } from "@/types/session";
import { defaultConsultationTuss } from "@/data/tussCodes";
import { cn } from "@/lib/cn";

type SectionKey = keyof SoapSections;

export function SoapLivePanel() {
  const sections = useSessionStore((s) => s.soapSections);
  const edits = useSessionStore((s) => s.soapEdits);
  const analysisState = useSessionStore((s) => s.analysisState);
  const transcriptLen = useSessionStore(
    (s) => s.transcript.filter((i) => i.kind === "message").length
  );
  const hypotheses = useSessionStore((s) => s.hypotheses);

  const isGenerating = analysisState === "analyzing";

  if (!sections && transcriptLen === 0 && Object.keys(edits).length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-clinical/10 text-clinical-700">
            <FileText size={20} />
          </div>
          <h3 className="text-[14px] font-semibold text-ink-900">
            Nota SOAP ao vivo
          </h3>
          <p className="text-[13px] font-medium leading-snug text-ink-600">
            A nota aparece aqui conforme a IA analisa a transcrição. Clique no
            microfone para começar a captura.
          </p>
        </div>
      </div>
    );
  }

  const billingCodes = hypotheses
    .filter((h) => h.status === "active" || h.status === "investigating")
    .map((h) => ({ code: h.icd10, label: h.label }));

  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
          <FileText size={12} /> Nota SOAP ao vivo
        </h3>
        {isGenerating && (
          <span className="flex items-center gap-1 text-label font-medium text-clinical-700">
            <Loader2 size={11} className="animate-spin" />
            atualizando
          </span>
        )}
      </header>

      <p className="text-[11px] italic leading-snug text-ink-400">
        Rascunho gerado pela IA. Clique no lápis para editar cada seção. Edições
        são preservadas quando a IA atualiza.
      </p>

      <SoapSection
        sectionKey="subjective"
        letter="S"
        title="Subjetivo"
        aiText={sections?.subjective ?? ""}
        userText={edits.subjective}
        hint="Queixa principal, HDA, HPP, HF, HS quando mencionados."
      />
      <SoapSection
        sectionKey="objective"
        letter="O"
        title="Objetivo"
        aiText={sections?.objective ?? ""}
        userText={edits.objective}
        hint="Sinais vitais e achados de exame físico."
      />
      <SoapSection
        sectionKey="assessment"
        letter="A"
        title="Avaliação"
        aiText={sections?.assessment ?? ""}
        userText={edits.assessment}
        hint="Hipóteses diagnósticas com CID-10 em ordem de probabilidade."
        billingCodes={billingCodes}
      />
      <SoapSection
        sectionKey="plan"
        letter="P"
        title="Plano / Conduta"
        aiText={sections?.plan ?? ""}
        userText={edits.plan}
        hint="Exames, prescrições, orientações, retorno, pontos de atenção."
      />
    </div>
  );
}

interface SoapSectionProps {
  sectionKey: SectionKey;
  letter: string;
  title: string;
  aiText: string;
  userText?: string;
  hint: string;
  billingCodes?: Array<{ code: string; label: string }>;
}

function SoapSection({
  sectionKey,
  letter,
  title,
  aiText,
  userText,
  hint,
  billingCodes,
}: SoapSectionProps) {
  const setSoapEdit = useSessionStore((s) => s.setSoapEdit);
  const clearSoapEdit = useSessionStore((s) => s.clearSoapEdit);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const effectiveText = userText ?? aiText;
  const isEdited = userText !== undefined;
  const hasContent = effectiveText.trim().length > 0;

  useEffect(() => {
    if (editing) {
      setDraft(effectiveText);
      const t = setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          effectiveText.length,
          effectiveText.length
        );
      }, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed === aiText.trim()) {
      clearSoapEdit(sectionKey);
    } else {
      setSoapEdit(sectionKey, trimmed);
    }
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const restore = () => {
    clearSoapEdit(sectionKey);
    setEditing(false);
  };

  const copy = async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(effectiveText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clinical text-[11px] font-bold text-white">
            {letter}
          </span>
          <h4 className="text-[13px] font-semibold text-ink-900">
            {title}
          </h4>
          {isEdited && (
            <span
              className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning"
              title="Seção foi editada — atualizações da IA não sobrescrevem"
            >
              editado
            </span>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-0.5">
            {isEdited && (
              <button
                type="button"
                onClick={restore}
                aria-label="Restaurar versão da IA"
                title="Restaurar versão da IA"
                className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-black/[0.04] hover:text-ink-900"
              >
                <RotateCcw size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={copy}
              disabled={!hasContent}
              aria-label="Copiar seção"
              title={hasContent ? "Copiar para área de transferência" : "Sem conteúdo"}
              className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-black/[0.04] hover:text-ink-900 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {copied ? (
                <Check size={12} className="text-clinical" />
              ) : (
                <Copy size={12} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar seção"
              title="Editar"
              className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-black/[0.04] hover:text-ink-900"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>

      {billingCodes && billingCodes.length > 0 && (
        <div className="flex flex-col gap-1 rounded-md border border-clinical/20 bg-clinical/[0.03] px-2 py-1.5">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-clinical-700">
            <Receipt size={10} /> Pronto para faturamento
          </span>
          <div className="flex flex-wrap gap-1">
            <span
              title={`${defaultConsultationTuss.label} (TUSS)`}
              className="inline-flex items-center gap-1 rounded-full border border-clinical/30 bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-clinical-700"
            >
              <span className="text-ink-400">TUSS</span>
              {defaultConsultationTuss.code}
            </span>
            {billingCodes.map((b) => (
              <span
                key={b.code}
                title={`${b.label} (CID-10)`}
                className="inline-flex items-center gap-1 rounded-full border border-clinical/20 bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-clinical-700"
              >
                <span className="text-ink-400">CID</span>
                {b.code}
              </span>
            ))}
          </div>
        </div>
      )}

      {editing ? (
        <div className="flex flex-col gap-1.5 rounded-md border border-clinical/40 bg-surface p-2 ring-2 ring-clinical/15 transition-all focus-within:border-clinical focus-within:ring-clinical/25">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
            }}
            rows={4}
            className="w-full resize-none rounded bg-transparent text-[13px] font-medium leading-relaxed text-ink-900 placeholder:italic placeholder:text-ink-400 focus:outline-none"
            placeholder={hint}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] italic text-ink-400">
              ⌘/Ctrl + Enter para salvar · Esc para cancelar
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cancel}
                className="flex h-7 items-center gap-1 rounded px-2 text-[12px] font-semibold text-ink-600 hover:bg-surface-raised"
              >
                <X size={11} /> Cancelar
              </button>
              <button
                type="button"
                onClick={save}
                className="flex h-7 items-center gap-1 rounded bg-clinical px-2.5 text-[12px] font-semibold text-white hover:bg-clinical-700"
              >
                <Check size={11} /> Salvar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-md border px-3 py-2.5",
            hasContent
              ? isEdited
                ? "border-warning/20 bg-warning/[0.03]"
                : "border-black/[0.06] bg-surface"
              : "border-black/[0.06] bg-surface-raised"
          )}
        >
          {hasContent ? (
            <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-ink-900">
              {effectiveText}
            </p>
          ) : (
            <p className="text-[12px] italic leading-snug text-ink-400">{hint}</p>
          )}
        </div>
      )}
    </section>
  );
}
