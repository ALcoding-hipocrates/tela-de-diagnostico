import { useEffect, useRef, useState } from "react";
import {
  Stethoscope,
  Settings,
  UserCircle,
  FileDown,
  Loader2,
  Braces,
  UserRound,
  Send,
  ChevronDown,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import type { SoapSections } from "@/types/session";
import { cn } from "@/lib/cn";
import { InfoPopover } from "./shared/InfoPopover";
import { Kbd } from "./shared/Kbd";
import { Button } from "./shared/Button";
import { SettingsModal } from "./modals/SettingsModal";
import { AccountModal } from "./modals/AccountModal";
import { DocumentModal } from "./modals/DocumentModal";

function mergeSoap(
  ai: SoapSections | null,
  edits: Partial<SoapSections>
): SoapSections | null {
  if (!ai && Object.keys(edits).length === 0) return null;
  const base: SoapSections = ai ?? {
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  };
  return { ...base, ...edits };
}

export function TopBar() {
  const activeModal = useSessionStore((s) => s.activeModal);
  const openModal = useSessionStore((s) => s.openModal);
  const closeModal = useSessionStore((s) => s.closeModal);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/[0.06] bg-surface px-5">
        <div className="flex items-center gap-4">
          <Logo />
          <SessionBadge />
        </div>
        <PatientCard />
        <div className="flex items-center gap-2">
          <CommandTrigger onClick={() => openModal("commandPalette")} />
          <Timer />
          <div className="flex items-center gap-0.5" data-tour="export">
            <ExportMenu
              onAvs={() => openModal("avs")}
              onReferral={() => openModal("referral")}
            />
            <InfoPopover
              align="right"
              title="Exportar"
              description="Gere documentos a partir da consulta: nota SOAP em PDF, FHIR Bundle pra prontuários (Tasy/MV/iClinic/Amplimed), resumo pós-consulta pro paciente (AVS) ou carta de encaminhamento pra especialista."
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Configurações"
            title="Configurações"
            onClick={() => openModal("settings")}
            className="h-8 w-8 px-0"
          >
            <Settings size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Conta"
            title="Conta"
            onClick={() => openModal("account")}
            className="h-8 w-8 px-0"
          >
            <UserCircle size={16} />
          </Button>
        </div>
      </header>
      <SettingsModal open={activeModal === "settings"} onClose={closeModal} />
      <AccountModal open={activeModal === "account"} onClose={closeModal} />
      <DocumentModal
        open={activeModal === "avs"}
        onClose={closeModal}
        kind="avs"
      />
      <DocumentModal
        open={activeModal === "referral"}
        onClose={closeModal}
        kind="referral"
      />
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-clinical text-white">
        <Stethoscope size={16} />
      </div>
      <span className="text-[15px] font-bold tracking-tight text-ink-900">
        Hipócrates<span className="text-clinical">.ai</span>
      </span>
    </div>
  );
}

function SessionBadge() {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-clinical/10 px-2.5 py-1"
      aria-label="Sessão ativa"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinical opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clinical" />
      </span>
      <span className="text-[11px] font-semibold text-clinical-700">
        Sessão ativa
      </span>
    </div>
  );
}

function PatientCard() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/[0.08] bg-surface py-0.5 pl-0.5 pr-3">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[11px] font-bold text-white ring-1 ring-white"
        aria-hidden
      >
        {mockPatient.initials}
      </div>
      <div className="flex items-baseline gap-1.5 leading-tight">
        <span className="text-[13px] font-bold tracking-tight text-ink-900">
          {mockPatient.name}
        </span>
        <span className="text-[11px] font-medium text-ink-600">
          {mockPatient.sex === "F" ? "F" : "M"} · {mockPatient.age}a
        </span>
        <span className="h-2.5 w-px bg-ink-400/30" aria-hidden />
        <span className="font-mono text-[10.5px] text-ink-400">
          #{mockPatient.id}
        </span>
      </div>
    </div>
  );
}

function CommandTrigger({ onClick }: { onClick: () => void }) {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir paleta de comandos"
      title="Abrir paleta de comandos"
      className="group flex h-8 items-center gap-1.5 rounded-md border border-black/[0.08] bg-surface-raised px-2 text-[11.5px] font-medium text-ink-600 transition-colors hover:border-clinical/30 hover:text-ink-900"
    >
      <Search size={12} className="shrink-0 text-ink-400 group-hover:text-clinical-700" />
      <span>Buscar</span>
      <Kbd className="ml-0.5">{isMac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd>K</Kbd>
    </button>
  );
}

function Timer() {
  const startedAt = useSessionStore((s) => s.sessionStartedAt);
  const isRecording = useSessionStore((s) => s.isRecording);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const label = startedAt ? formatElapsed(Math.floor((now - startedAt) / 1000)) : "--:--";

  return (
    <div
      className="mr-0.5 flex h-8 items-center gap-1.5 rounded-md bg-surface-raised px-2.5"
      title={startedAt ? "Tempo desde o início da captura" : "Sessão ainda não iniciada — clique no microfone"}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isRecording ? "bg-danger" : startedAt ? "bg-ink-400" : "bg-ink-400/40"
        )}
        aria-hidden
      />
      <span className="font-mono text-[13px] font-semibold text-ink-900">{label}</span>
    </div>
  );
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface ExportMenuProps {
  onAvs: () => void;
  onReferral: () => void;
}

function ExportMenu({ onAvs, onReferral }: ExportMenuProps) {
  const pushToast = useSessionStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const runDownload = async (
    key: string,
    loader: () => Promise<void>,
    toastTitle: string,
    toastDescription: string
  ) => {
    if (busy) return;
    setOpen(false);
    setBusy(key);
    try {
      await loader();
      pushToast({
        tone: "success",
        title: toastTitle,
        description: toastDescription,
      });
    } catch (e) {
      console.error(`${key} export failed:`, e);
      pushToast({
        tone: "danger",
        title: "Falha na exportação",
        description: "Tente novamente em instantes.",
      });
    } finally {
      setBusy(null);
    }
  };

  const handleSoapPdf = () =>
    runDownload(
      "pdf",
      async () => {
        const [{ buildSoap }, { downloadSoapPdf }] = await Promise.all([
          import("@/lib/soap"),
          import("@/lib/soapPdf"),
        ]);
        const s = useSessionStore.getState();
        downloadSoapPdf(
          buildSoap({
            transcript: s.transcript,
            hypotheses: s.hypotheses,
            checklist: s.checklist,
            nextQuestion: s.nextQuestion,
            prescriptions: s.prescriptions,
            narrativeSections: mergeSoap(s.soapSections, s.soapEdits),
          })
        );
      },
      "SOAP PDF exportado",
      "Arquivo salvo nos downloads."
    );

  const handleFhir = () =>
    runDownload(
      "fhir",
      async () => {
        const [{ buildSoap }, { downloadFhirBundle }] = await Promise.all([
          import("@/lib/soap"),
          import("@/lib/soapFhir"),
        ]);
        const s = useSessionStore.getState();
        downloadFhirBundle(
          buildSoap({
            transcript: s.transcript,
            hypotheses: s.hypotheses,
            checklist: s.checklist,
            nextQuestion: s.nextQuestion,
            prescriptions: s.prescriptions,
            narrativeSections: mergeSoap(s.soapSections, s.soapEdits),
          })
        );
      },
      "FHIR Bundle exportado",
      "JSON pronto pra importar no PEP."
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={!!busy}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md border border-black/[0.08] bg-surface-raised px-2.5 text-[12px] font-semibold transition-colors",
          busy
            ? "cursor-wait text-ink-400"
            : "text-ink-900 hover:border-clinical/30 hover:text-clinical-700"
        )}
      >
        {busy ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <FileDown size={14} />
        )}
        Exportar
        <ChevronDown
          size={13}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-[300px] overflow-hidden rounded-lg border border-black/10 bg-surface text-left shadow-xl"
        >
          <MenuItem
            icon={<FileDown size={14} />}
            label="SOAP · PDF"
            description="Nota clínica estruturada para auditoria e prontuários físicos."
            onClick={handleSoapPdf}
          />
          <MenuItem
            icon={<Braces size={14} />}
            label="PEP · FHIR Bundle"
            description="Padrão SMART on FHIR pra Tasy, MV, iClinic, Amplimed."
            onClick={handleFhir}
          />
          <MenuItem
            icon={<UserRound size={14} />}
            label="AVS · Paciente"
            description="Resumo pós-consulta em linguagem simples pro paciente."
            onClick={() => {
              setOpen(false);
              onAvs();
            }}
          />
          <MenuItem
            icon={<Send size={14} />}
            label="Encaminhamento"
            description="Carta formal pra especialista (formato BR padrão)."
            onClick={() => {
              setOpen(false);
              onReferral();
            }}
          />
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function MenuItem({ icon, label, description, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 border-b border-black/5 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-clinical/[0.04]"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-clinical/10 text-clinical-700">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-ink-900">{label}</span>
        <span className="text-[11px] leading-snug text-ink-600">
          {description}
        </span>
      </div>
    </button>
  );
}

