import {
  Pill,
  Clock,
  FlaskConical,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  PanelRight,
  Calculator,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { cn } from "@/lib/cn";
import { InfoPopover } from "./shared/InfoPopover";
import { TimelineModal } from "./modals/TimelineModal";
import { AiModal } from "./modals/AiModal";
import { PrescriptionModal } from "./modals/PrescriptionModal";
import { ExamsModal } from "./modals/ExamsModal";
import { ProtocolsModal } from "./modals/ProtocolsModal";
import { CalculatorsModal } from "./modals/CalculatorsModal";

export function BottomBar() {
  const drawerOpen = useSessionStore((s) => s.drawerOpen);
  const toggleDrawer = useSessionStore((s) => s.toggleDrawer);
  const activeModal = useSessionStore((s) => s.activeModal);
  const openModal = useSessionStore((s) => s.openModal);
  const closeModal = useSessionStore((s) => s.closeModal);
  const prescriptionCount = useSessionStore((s) => s.prescriptions.length);
  const examCount = useSessionStore((s) => s.exams.length);

  return (
    <>
      <footer className="grid h-16 shrink-0 grid-cols-3 items-center border-t border-black/5 bg-surface px-6">
        <nav className="flex items-center gap-1 justify-self-start" aria-label="Navegação principal">
          <NavItem
            icon={<Pill size={16} />}
            label="Prescrição"
            count={prescriptionCount}
            onClick={() => openModal("prescription")}
            infoAlign="left"
            info={{
              title: "Prescrição",
              description:
                "Prescrição médica estruturada com alertas informativos de contraindicação e interação, baseados nas hipóteses ativas e em diretrizes. Status Novo/Mantido/Condicional para prescrição condicionada a achado.",
            }}
          />
          <NavItem
            icon={<Clock size={16} />}
            label="Timeline"
            onClick={() => openModal("timeline")}
            info={{
              title: "Timeline",
              description:
                "Cronologia visual da consulta: mensagens, red flags detectadas, mudanças de hipóteses e resultados do checklist. Útil pra passagem de plantão e revisão do raciocínio.",
            }}
          />
          <NavItem
            icon={<FlaskConical size={16} />}
            label="Exames"
            count={examCount}
            onClick={() => openModal("exams")}
            info={{
              title: "Exames",
              description:
                "Solicitação e registro de resultados de exames (laboratório, imagem, ECG, fundo de olho). Exames solicitados aparecem no SOAP exportado e no FHIR Bundle.",
            }}
          />
          <NavItem
            icon={<Calculator size={16} />}
            label="Escalas"
            onClick={() => openModal("calculators")}
            info={{
              title: "Escalas clínicas",
              description:
                "Calculadoras e escores validados (CHA₂DS₂-VASc, CURB-65, Wells TEP, TIMI, PHQ-9) pré-preenchidos a partir do caso atual. Ajuste e veja a interpretação automaticamente.",
            }}
          />
        </nav>

        <div className="justify-self-center">
          <MicFab />
        </div>

        <div className="flex items-center gap-1 justify-self-end">
          <PanelButton open={drawerOpen} onClick={toggleDrawer} />
          <span className="mx-1 h-6 w-px bg-black/5" aria-hidden />
          <NavItem
            icon={<Sparkles size={16} />}
            label="IA"
            onClick={() => openModal("ai")}
            info={{
              title: "Assistente de IA",
              description:
                "Estado do raciocínio automatizado: modelo em uso, última análise, hipóteses calculadas e guidelines consultadas. Mostra o que a IA está fazendo em background.",
            }}
          />
          <NavItem
            icon={<BookOpen size={16} />}
            label="Protocolos"
            onClick={() => openModal("protocols")}
            infoAlign="right"
            info={{
              title: "Protocolos e diretrizes",
              description:
                "Biblioteca de guidelines consultáveis: SBC (cardiologia), ABN (neurologia), SBEM (endocrinologia), ESC, AHA e NICE. Filtráveis por fonte e busca livre por condição ou CID-10.",
            }}
          />
        </div>
      </footer>

      <TimelineModal open={activeModal === "timeline"} onClose={closeModal} />
      <AiModal open={activeModal === "ai"} onClose={closeModal} />
      <PrescriptionModal
        open={activeModal === "prescription"}
        onClose={closeModal}
      />
      <ExamsModal open={activeModal === "exams"} onClose={closeModal} />
      <ProtocolsModal
        open={activeModal === "protocols"}
        onClose={closeModal}
      />
      <CalculatorsModal
        open={activeModal === "calculators"}
        onClose={closeModal}
      />
    </>
  );
}

interface PanelButtonProps {
  open: boolean;
  onClick: () => void;
}

function PanelButton({ open, onClick }: PanelButtonProps) {
  return (
    <div className="flex items-center gap-0.5" data-tour="drawer">
      <button
        type="button"
        onClick={onClick}
        aria-label={open ? "Fechar painel de apoio cognitivo" : "Abrir painel de apoio cognitivo"}
        aria-pressed={open}
        className={cn(
          "relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-tight transition-colors",
          open
            ? "bg-clinical text-white hover:bg-clinical-700"
            : "border border-clinical/35 bg-transparent text-clinical-700 hover:border-clinical hover:bg-clinical/[0.06]"
        )}
      >
        <PanelRight size={15} />
        Painel
      </button>
      <InfoPopover
        title="Painel de apoio cognitivo"
        description="Hipóteses diagnósticas com CID-10 e sparklines anotadas, checklist bayesiano com razões de verossimilhança, próxima pergunta sugerida e guidelines consultados. É o coração do raciocínio clínico automatizado — abra para ver o que a IA está pensando."
        placement="top"
        align="center"
      />
    </div>
  );
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  info?: { title: string; description: string };
  infoAlign?: "left" | "center" | "right";
  count?: number;
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  info,
  infoAlign = "center",
  count,
}: NavItemProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-semibold transition-colors",
          active
            ? "bg-surface-raised text-ink-900"
            : "text-ink-600 hover:bg-surface-raised hover:text-ink-900"
        )}
      >
        {icon}
        {label}
        {count !== undefined && count > 0 && (
          <span className="font-mono text-[11px] font-semibold text-ink-400 tabular-nums">
            {count}
          </span>
        )}
      </button>
      {info && (
        <InfoPopover
          title={info.title}
          description={info.description}
          placement="top"
          align={infoAlign}
        />
      )}
    </div>
  );
}

function MicFab() {
  const { isRecording, isSupported, start, stop } = useSpeechRecognition();

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        data-tour="mic"
        title="Captura de áudio não suportada neste navegador. Use Chrome ou Edge."
        aria-label="Captura não suportada"
        className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full bg-ink-400/30 text-ink-600 shadow"
      >
        <MicOff size={20} />
      </button>
    );
  }

  const onClick = () => (isRecording ? stop() : start());

  return (
    <button
      type="button"
      onClick={onClick}
      data-tour="mic"
      aria-label={isRecording ? "Parar captura" : "Iniciar captura"}
      aria-pressed={isRecording}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors",
        isRecording
          ? "bg-danger hover:bg-danger/90"
          : "bg-clinical hover:bg-clinical-700"
      )}
    >
      <Mic size={20} />
    </button>
  );
}
