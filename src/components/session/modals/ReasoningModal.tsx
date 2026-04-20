import { useEffect, useState } from "react";
import {
  Brain,
  Loader2,
  Copy,
  Check,
  RefreshCcw,
  AlertCircle,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import type { Hypothesis } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import {
  generateReasoning,
  isReasoningGeneratorConfigured,
} from "@/lib/reasoningGenerator";
import { glossary } from "@/data/glossary";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface ReasoningModalProps {
  open: boolean;
  onClose: () => void;
  hypothesis: Hypothesis | null;
}

export function ReasoningModal({ open, onClose, hypothesis }: ReasoningModalProps) {
  const cache = useSessionStore((s) => s.reasoningCache);
  const setReasoning = useSessionStore((s) => s.setReasoning);
  const clearReasoning = useSessionStore((s) => s.clearReasoningFor);
  const allHypotheses = useSessionStore((s) => s.hypotheses);
  const transcript = useSessionStore((s) => s.transcript);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const cached = hypothesis ? cache[hypothesis.icd10] : undefined;

  const run = async (force = false) => {
    if (!hypothesis) return;
    if (!isReasoningGeneratorConfigured()) {
      setError(
        "API do Claude não configurada. Defina VITE_ANTHROPIC_API_KEY em .env.local."
      );
      return;
    }
    if (cached && !force) return;

    setLoading(true);
    setError(null);
    try {
      const text = await generateReasoning({
        hypothesis,
        transcript,
        otherHypotheses: allHypotheses.filter(
          (h) => h.icd10 !== hypothesis.icd10
        ),
      });
      setReasoning(hypothesis.icd10, text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !hypothesis) {
      setError(null);
      setLoading(false);
      setCopied(false);
      setGlossaryOpen(false);
      return;
    }
    if (!cached) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hypothesis]);

  const handleCopy = async () => {
    if (!cached) return;
    try {
      await navigator.clipboard.writeText(cached);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleRegen = () => {
    if (!hypothesis) return;
    clearReasoning(hypothesis.icd10);
    void run(true);
  };

  if (!hypothesis) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Raciocínio · ${hypothesis.label}`}
      description={`CID-10 ${hypothesis.icd10} · confiança atual ${hypothesis.confidence}%. Explicação passo-a-passo do raciocínio da IA.`}
    >
      {loading && !cached && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 size={24} className="animate-spin text-clinical" />
          <p className="text-[13px] font-medium text-ink-600">
            Gerando explicação clínica do raciocínio…
          </p>
          <p className="text-[11px] italic text-ink-400">
            Claude Opus 4.7 · 5-15 segundos
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-label font-semibold text-danger">
                Falha ao gerar raciocínio
              </h4>
              <p className="text-[13px] font-medium text-ink-900">{error}</p>
            </div>
          </div>
          {isReasoningGeneratorConfigured() && (
            <button
              type="button"
              onClick={() => void run(true)}
              className="flex h-8 w-fit items-center gap-1.5 rounded-md bg-clinical px-3 text-[12px] font-semibold text-white hover:bg-clinical-700"
            >
              <RefreshCcw size={12} /> Tentar de novo
            </button>
          )}
        </div>
      )}

      {cached && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-clinical/10 px-2.5 text-[11px] font-semibold text-clinical-700">
              <Brain size={12} /> Raciocínio IA
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold transition-colors",
                copied
                  ? "border-clinical/40 bg-clinical/5 text-clinical-700"
                  : "border-black/10 bg-surface text-ink-900 hover:border-clinical/30"
              )}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={handleRegen}
              disabled={loading}
              className="ml-auto flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold text-ink-600 hover:bg-surface-raised hover:text-ink-900"
              title="Regenerar"
            >
              {loading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <RefreshCcw size={11} />
              )}
              Regenerar
            </button>
          </div>

          <article className="rounded-lg border border-black/[0.06] bg-surface p-4">
            <MarkdownRender content={cached} />
          </article>

          <div className="mt-4 overflow-hidden rounded-lg border border-black/[0.06]">
            <button
              type="button"
              onClick={() => setGlossaryOpen((v) => !v)}
              aria-expanded={glossaryOpen}
              className="flex w-full items-center gap-2 bg-surface-raised px-3 py-2 text-left text-label font-semibold text-ink-600 hover:text-ink-900"
            >
              <BookOpen size={12} />
              Glossário de termos
              <span className="ml-auto font-mono font-medium text-ink-400">
                {glossary.length}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "transition-transform",
                  glossaryOpen && "rotate-180"
                )}
              />
            </button>
            {glossaryOpen && (
              <dl className="flex flex-col divide-y divide-black/5 bg-surface px-3 py-2">
                {glossary.map((g) => (
                  <div key={g.term} className="flex flex-col gap-0.5 py-2">
                    <dt className="text-[12px] font-semibold text-ink-900">
                      {g.term}
                    </dt>
                    <dd className="text-[12px] leading-snug text-ink-600">
                      {g.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <p className="mt-2 text-[11px] italic leading-snug text-ink-400">
            Explicação gerada pela IA. Útil pra revisão pedagógica ou auditoria
            do raciocínio — não substitui julgamento clínico.
          </p>
        </>
      )}
    </Modal>
  );
}

function MarkdownRender({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="mb-3 ml-4 flex list-disc flex-col gap-0.5 text-[13px] leading-relaxed text-ink-900 marker:text-ink-400"
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === "") {
      flushList();
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={i}
          className="mb-1 mt-3 text-[13px] font-semibold text-clinical-700"
        >
          {line.slice(4).trim()}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h4 key={i} className="mb-1 mt-2 text-[13px] font-semibold text-ink-900">
          {line.slice(3).trim()}
        </h4>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h3
          key={i}
          className="mb-1 mt-3 text-[14px] font-semibold text-ink-900"
        >
          {line.slice(2).trim()}
        </h3>
      );
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    flushList();
    elements.push(
      <p
        key={i}
        className="mb-2 text-[13px] font-medium leading-relaxed text-ink-900"
      >
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div>{elements}</div>;
}

function renderInline(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*(.+)\*\*$/);
    if (m) {
      return (
        <strong key={i} className="font-semibold">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
