import { useEffect, useState } from "react";
import {
  Loader2,
  Copy,
  Check,
  FileDown,
  RefreshCcw,
  AlertCircle,
  MessageCircle,
  Mail,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import {
  generateAvs,
  generateReferral,
  isDocGeneratorConfigured,
} from "@/lib/docGenerator";
import { downloadDocPdf } from "@/lib/docPdf";
import { mockPatient } from "@/mocks/session";
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
  const pushToast = useSessionStore((s) => s.pushToast);
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

  const handleWhatsApp = () => {
    if (!content) return;
    const header =
      kind === "avs"
        ? `Olá ${mockPatient.name}! Segue o resumo da consulta de hoje:\n\n`
        : "";
    const text = header + content + "\n\n—\nHipócrates.ai";
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    pushToast({
      tone: "info",
      title: "WhatsApp aberto",
      description: "Selecione o contato do paciente pra enviar.",
    });
  };

  const handleEmail = () => {
    if (!content) return;
    const subject =
      kind === "avs"
        ? `Orientação pós-consulta — ${mockPatient.name}`
        : `Encaminhamento — ${mockPatient.name}`;
    const body = content + "\n\n—\nHipócrates.ai";
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex h-9 items-center gap-1.5 rounded-full bg-clinical px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-clinical-700"
            >
              <FileDown size={13} /> Baixar PDF
            </button>
            {kind === "avs" && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1EB555]"
                title="Enviar resumo pelo WhatsApp ao paciente"
              >
                <MessageCircle size={13} /> WhatsApp
              </button>
            )}
            <button
              type="button"
              onClick={handleEmail}
              className="flex h-9 items-center gap-1.5 rounded-full border border-black/[0.1] bg-surface px-4 text-[12.5px] font-semibold text-ink-900 transition-colors hover:bg-surface-raised"
              title="Abrir cliente de e-mail"
            >
              <Mail size={13} /> E-mail
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-4 text-[12.5px] font-semibold transition-colors",
                copied
                  ? "border-clinical/40 bg-clinical/5 text-clinical-700"
                  : "border-black/[0.1] bg-surface text-ink-900 hover:border-clinical/30"
              )}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copiado" : "Copiar texto"}
            </button>
            <button
              type="button"
              onClick={generate}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-full text-[12px] font-semibold text-ink-600 transition-colors hover:bg-surface-raised hover:text-ink-900"
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

/** Palavras-chave em headings que ativam o banner de alerta vermelho. */
const ALERT_KEYWORDS = [
  /alarm/i,
  /emerg[êe]ncia/i,
  /urg[êe]ncia/i,
  /procurar\s+m[ée]dic/i,
  /sinais?\s+de\s+piora/i,
  /quando\s+voltar/i,
];

function isAlertHeading(text: string): boolean {
  return ALERT_KEYWORDS.some((rx) => rx.test(text));
}

interface Section {
  heading: string;
  level: 1 | 2;
  isAlert: boolean;
  body: React.ReactNode[];
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  const preElements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const pushList = (target: React.ReactNode[], tone: "default" | "alert") => {
    if (listBuffer.length === 0) return;
    target.push(
      <ul
        key={`list-${target.length}-${Math.random()}`}
        className={cn(
          "mb-2 ml-5 flex list-disc flex-col gap-1 text-[14px] leading-relaxed marker:font-bold",
          tone === "alert"
            ? "text-peach-text marker:text-peach-text"
            : "text-ink-900 marker:text-clinical/70"
        )}
      >
        {listBuffer.map((item, i) => (
          <li key={i}>{stripInline(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  const currentBody = () => (current ? current.body : preElements);
  const currentTone = (): "default" | "alert" =>
    current?.isAlert ? "alert" : "default";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      pushList(currentBody(), currentTone());
      currentBody().push(<div key={`sp-${i}`} className="h-1" />);
      continue;
    }

    if (line.startsWith("# ") || line.startsWith("## ")) {
      pushList(currentBody(), currentTone());
      const level: 1 | 2 = line.startsWith("# ") ? 1 : 2;
      const headingText = line.replace(/^#+\s+/, "").trim();
      current = {
        heading: headingText,
        level,
        isAlert: isAlertHeading(headingText),
        body: [],
      };
      sections.push(current);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2).trim());
      continue;
    }

    pushList(currentBody(), currentTone());
    currentBody().push(
      <p
        key={i}
        className={cn(
          "mb-2 text-[14px] leading-relaxed",
          current?.isAlert
            ? "font-medium text-peach-text"
            : "font-medium text-ink-900"
        )}
      >
        {stripInline(line)}
      </p>
    );
  }
  pushList(currentBody(), currentTone());

  return (
    <div>
      {preElements}
      {sections.map((s, i) => (
        <SectionBlock key={i} section={s} />
      ))}
    </div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  if (section.isAlert) {
    return (
      <aside className="my-4 overflow-hidden rounded-[16px] border border-peach-border bg-peach">
        <header className="flex items-center gap-2 border-b border-peach-border/60 bg-peach-border/30 px-4 py-2.5">
          <AlertCircle size={14} className="text-peach-text" />
          <h4 className="text-[10.5px] font-bold uppercase tracking-ultra text-peach-text">
            {section.heading}
          </h4>
        </header>
        <div className="px-4 py-3">{section.body}</div>
      </aside>
    );
  }
  if (section.level === 1) {
    return (
      <section className="mb-3">
        <h3 className="mb-2 mt-4 border-b border-clinical/10 pb-1 text-[15px] font-bold text-clinical-700">
          {section.heading}
        </h3>
        {section.body}
      </section>
    );
  }
  return (
    <section className="mb-2">
      <h4 className="mb-1 mt-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink-600">
        {section.heading}
      </h4>
      {section.body}
    </section>
  );
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
