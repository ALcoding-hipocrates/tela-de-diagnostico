import { useState } from "react";
import {
  Pause,
  Play,
  Pencil,
  History,
  PhoneOff,
  Mic,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { TranscriptInput } from "./transcript/TranscriptInput";
import { cn } from "@/lib/cn";

/**
 * Floating pill bar no bottom-center. Estilo DeepScribe/Stitch.
 * Controles de gravação + ações rápidas + End Session em vermelho.
 */
export function FloatingControls() {
  const { isRecording, isSupported, start, stop } = useSpeechRecognition();
  const openModal = useSessionStore((s) => s.openModal);
  const resetSession = useSessionStore((s) => s.resetSession);
  const pushToast = useSessionStore((s) => s.pushToast);
  const [editMode, setEditMode] = useState(false);

  const handleEndSession = () => {
    if (
      window.confirm(
        "Encerrar esta sessão clínica? O rascunho da passagem será gerado."
      )
    ) {
      stop();
      openModal("handoff");
      pushToast({
        tone: "info",
        title: "Sessão encerrada",
        description: "Gere a passagem ou inicie nova consulta.",
      });
    }
  };

  const handleRecordToggle = () => {
    if (!isSupported) {
      pushToast({
        tone: "danger",
        title: "Captura não suportada",
        description: "Use Chrome ou Edge pra ativar o microfone.",
      });
      return;
    }
    isRecording ? stop() : start();
  };

  return (
    <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-30 flex flex-col items-center gap-3 px-6">
      {editMode && (
        <div className="pointer-events-auto w-full max-w-[560px] animate-pop-in">
          <TranscriptInput />
        </div>
      )}

      <div
        role="toolbar"
        aria-label="Controles da sessão"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-black/[0.06] bg-surface/80 p-1.5 shadow-[0_20px_50px_rgba(10,14,19,0.10)] backdrop-blur-xl"
      >
        <ControlButton
          icon={
            isRecording ? <Pause size={17} /> : <Play size={17} />
          }
          label={isRecording ? "Pausar captura" : "Iniciar captura"}
          onClick={handleRecordToggle}
          tone={isRecording ? "recording" : "default"}
        />
        <ControlButton
          icon={<Mic size={17} />}
          label="Microfone"
          active={isRecording}
          tone={isRecording ? "recording" : "default"}
          onClick={handleRecordToggle}
        />
        <ControlButton
          icon={<Pencil size={17} />}
          label="Editar texto manualmente"
          active={editMode}
          onClick={() => setEditMode((v) => !v)}
        />
        <ControlButton
          icon={<History size={17} />}
          label="Timeline"
          onClick={() => openModal("timeline")}
        />
        <ControlButton
          icon={<Sparkles size={17} />}
          label="Brief pré-consulta"
          onClick={() => openModal("preBrief")}
        />
        <ControlButton
          icon={<ClipboardList size={17} />}
          label="Passagem de plantão"
          onClick={() => openModal("handoff")}
        />

        <span
          aria-hidden
          className="mx-1.5 h-4 w-px bg-black/[0.08]"
        />

        <button
          type="button"
          onClick={handleEndSession}
          className="flex items-center gap-2 rounded-full bg-[#e64749] px-5 py-2 text-[12px] font-semibold tracking-tight text-white transition-colors hover:bg-[#c9393b]"
        >
          <PhoneOff size={14} />
          Encerrar
        </button>
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  tone?: "default" | "recording";
  onClick?: () => void;
}

function ControlButton({ icon, label, active, tone, onClick }: ControlButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
        tone === "recording"
          ? "bg-[#e64749]/10 text-[#e64749] hover:bg-[#e64749]/15"
          : active
            ? "bg-clinical/10 text-clinical-700 hover:bg-clinical/15"
            : "text-ink-600 hover:bg-black/[0.04] hover:text-ink-900"
      )}
    >
      {icon}
    </button>
  );
}
