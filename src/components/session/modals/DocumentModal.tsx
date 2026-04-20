import { useEffect, useState } from "react";
import {
  Loader2,
  Copy,
  Check,
  FileDown,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import {
  generateAvs,
  generateReferral,
  isDocGeneratorConfigured,
} from "@/lib/docGenerator";
import { downloadDocPdf } from "@/lib/docPdf";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

type DocKind = "avs" | "referral";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  kind: DocKind;
}

const META: Record<DocKind, { title: string; description: string; filename: string }> = {
  avs: {
    title: "Orientação ao paciente · AVS",
    description: "Resumo pós-consulta em linguagem simples, para entregar ao paciente.",
    filename: "orientacao-paciente",
  },
  referral: {
    title: "Carta de encaminhamento",
    description: "Documento formal para especialista — padrão brasileiro.",
    filename: "encaminhamento",
  },
};

export function DocumentModal({ open, onClose, kind }: DocumentModalProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!isDocGeneratorConfigured()) {
      setError(
        "A análise por IA não está configurada. Defina VITE_ANTHROPIC_API_KEY em .env.local para gerar o documento."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const s = useSessionStore.getState();
      const ctx = {
        transcript: s.transcript,
        hypotheses: s.hypotheses,
        prescriptions: s.prescriptions,
        exams: s.exams,
        checklist: s.checklist,
        soapSections: s.soapSections,
      };
      const fn = kind === "avs" ? generateAvs : generateReferral;
      const text = await fn(ctx);
      setContent(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setContent(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (content) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!content) return;
    downloadDocPdf({
      kind,
      title: META[kind].title,
      content,
    });
  };

  const meta = META[kind];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.title}
      description={meta.description}
    >
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Loader2 size={24} className="animate-spin text-clinical" />
          <p className="text-[13px] font-medium text-ink-600">
            Gerando documento a partir da consulta…
          </p>
          <p className="text-[11px] italic text-ink-400">
            Usando Claude Opus 4.7 · pode levar 5 a 15 segundos
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-label font-semibold text-danger">
                Falha ao gerar
              </h4>
              <p className="text-[13px] font-medium text-ink-900">{error}</p>
            </div>
          </div>
          {isDocGeneratorConfigured() && (
            <button
              type="button"
              onClick={generate}
              className="flex h-8 w-fit items-center gap-1.5 rounded-md bg-clinical px-3 text-[12px] font-semibold text-white hover:bg-clinical-700"
            >
              <RefreshCcw size={12} /> Tentar de novo
            </button>
          )}
        </div>
      )}

      {content && !loading && !error && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-8 items-center gap-1.5 rounded-md bg-clinical px-3 text-[12px] font-semibold text-white hover:bg-clinical-700"
            >
              <FileDown size={12} /> Baixar PDF
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md border px-3 text-[12px] font-semibold transition-colors",
                copied
                  ? "border-clinical/40 bg-clinical/5 text-clinical-700"
                  : "border-black/10 bg-surface text-ink-900 hover:border-clinical/30"
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copiado" : "Copiar texto"}
            </button>
            <button
              type="button"
              onClick={generate}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-md text-[12px] font-semibold text-ink-600 hover:bg-surface-raised hover:text-ink-900"
              title="Regenerar"
            >
              <RefreshCcw size={12} /> Regenerar
            </button>
          </div>

          <article className="rounded-lg border border-black/[0.06] bg-surface p-4">
            <MarkdownPreview content={content} />
          </article>

          <p className="mt-2 text-[11px] italic leading-snug text-ink-400">
            Rascunho gerado pela IA a partir da consulta. Revise antes de
            entregar {kind === "avs" ? "ao paciente" : "ao especialista"}.
          </p>
        </>
      )}
    </Modal>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="mb-3 ml-4 flex list-disc flex-col gap-1 text-[13px] leading-relaxed text-ink-900 marker:font-bold marker:text-clinical/70"
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{stripInline(item)}</li>
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

    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h3
          key={i}
          className="mb-1.5 mt-4 border-b border-clinical/10 pb-1 text-[14px] font-bold text-clinical-700"
        >
          {line.slice(2).trim()}
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
        {stripInline(line)}
      </p>
    );
  }
  flushList();

  return <div>{elements}</div>;
}

function stripInline(s: string): React.ReactNode {
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
