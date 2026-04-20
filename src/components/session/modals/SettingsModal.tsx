import { Brain, Volume2, RotateCcw, Cpu, Sparkles, Moon } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { isApiConfigured } from "@/lib/clinicalAi";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const analysisEnabled = useSessionStore((s) => s.analysisEnabled);
  const setAnalysisEnabled = useSessionStore((s) => s.setAnalysisEnabled);
  const soundAlertsEnabled = useSessionStore((s) => s.soundAlertsEnabled);
  const setSoundAlertsEnabled = useSessionStore((s) => s.setSoundAlertsEnabled);
  const darkMode = useSessionStore((s) => s.darkMode);
  const setDarkMode = useSessionStore((s) => s.setDarkMode);
  const resetSession = useSessionStore((s) => s.resetSession);
  const pushToast = useSessionStore((s) => s.pushToast);
  const apiConfigured = isApiConfigured();

  const handleReset = () => {
    const ok = window.confirm(
      "Limpar transcrição, hipóteses, checklist, exames e prescrições desta sessão? Essa ação não pode ser desfeita."
    );
    if (ok) {
      resetSession();
      pushToast({
        tone: "info",
        title: "Sessão reiniciada",
        description: "Transcrição, hipóteses e prescrições limpas.",
      });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações"
      description="Preferências de análise, alertas e gestão da sessão atual"
    >
      <div className="flex flex-col gap-5">
        <Section title="Análise por IA" icon={<Brain size={14} />}>
          <Toggle
            label="Ativar análise automática"
            description={
              apiConfigured
                ? "Claude Opus 4.7 re-analisa a transcrição a cada 2 novas mensagens. Atualiza hipóteses, citações e sugestões."
                : "API do Claude não configurada. Defina VITE_ANTHROPIC_API_KEY no .env.local pra ativar."
            }
            checked={analysisEnabled && apiConfigured}
            disabled={!apiConfigured}
            onChange={setAnalysisEnabled}
          />
          <ReadOnlyRow
            icon={<Cpu size={12} />}
            label="Modelo em uso"
            value={apiConfigured ? "claude-opus-4-7 · adaptive thinking" : "—"}
          />
        </Section>

        <Section title="Aparência" icon={<Moon size={14} />}>
          <Toggle
            label="Modo escuro (plantão noturno)"
            description="Paleta escura com verde clínico preservado. Reduz ofuscamento em ambientes pouco iluminados sem perder a hierarquia visual."
            checked={darkMode}
            onChange={setDarkMode}
          />
        </Section>

        <Section title="Alertas" icon={<Volume2 size={14} />}>
          <Toggle
            label="Som em red flags de severidade alta"
            description="Bipe sutil quando a IA detecta um sinal focal crítico (AVC, SCA, dissecção). Útil em plantão noturno com fadiga."
            checked={soundAlertsEnabled}
            onChange={setSoundAlertsEnabled}
          />
        </Section>

        <Section title="Sessão" icon={<RotateCcw size={14} />}>
          <Button
            variant="danger"
            onClick={handleReset}
            leadingIcon={<RotateCcw size={14} />}
            className="w-fit"
          >
            Iniciar nova consulta
          </Button>
          <p className="text-[12px] italic text-ink-600">
            Limpa transcrição, hipóteses, checklist (mantém itens), prescrições e exames.
          </p>
        </Section>

        <Section title="Ajuda" icon={<Sparkles size={14} />}>
          <Button
            variant="secondary"
            onClick={() => {
              try {
                localStorage.removeItem("hipocrates:tour-seen-v1");
                window.location.reload();
              } catch {
                /* ignore */
              }
            }}
            leadingIcon={<Sparkles size={14} />}
            className="w-fit border-clinical/30 bg-clinical/5 text-clinical-700 hover:border-clinical hover:bg-clinical/10 hover:text-clinical-700"
          >
            Reiniciar tour guiado
          </Button>
          <p className="text-[12px] italic text-ink-600">
            Mostra novamente a introdução aos principais recursos.
          </p>
        </Section>
      </div>
    </Modal>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
        {icon}
        {title}
      </h3>
      <div className="flex flex-col gap-3 rounded-lg border border-black/[0.06] bg-surface-raised p-3">
        {children}
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-clinical" : "bg-ink-400/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
      <div className="flex min-w-0 flex-col">
        <span className="text-[14px] font-semibold text-ink-900">{label}</span>
        {description && (
          <span className="text-[12px] font-medium leading-snug text-ink-600">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

function ReadOnlyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-black/5 pt-2">
      <span className="flex items-center gap-1.5 text-label font-semibold text-ink-400">
        {icon}
        {label}
      </span>
      <span className="font-mono text-[12px] font-medium text-ink-600">{value}</span>
    </div>
  );
}
