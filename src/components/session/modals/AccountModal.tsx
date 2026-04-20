import { LogOut, Mail, BadgeCheck, Activity } from "lucide-react";
import { mockUser } from "@/data/user";
import { useSessionStore } from "@/store/sessionStore";
import { Modal } from "../shared/Modal";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const transcript = useSessionStore((s) => s.transcript);
  const prescriptions = useSessionStore((s) => s.prescriptions);
  const exams = useSessionStore((s) => s.exams);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);

  const messages = transcript.filter((i) => i.kind === "message").length;
  const startDate = sessionStartedAt
    ? new Date(sessionStartedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "não iniciada";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conta"
      description="Perfil do profissional e resumo da sessão"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900 text-[20px] font-bold text-white ring-1 ring-white">
          {mockUser.initials}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[16px] font-semibold text-ink-900">
            {mockUser.name}
          </h3>
          <span className="flex items-center gap-1 text-[13px] font-medium text-ink-600">
            <BadgeCheck size={12} className="text-clinical" />
            {mockUser.specialty} · {mockUser.crm}
          </span>
          <span className="flex items-center gap-1 font-mono text-label text-ink-400">
            <Mail size={11} /> {mockUser.email}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/[0.08] pt-4">
        <Stat
          label="Mensagens na sessão"
          value={messages.toString()}
        />
        <Stat
          label="Início da captura"
          value={startDate}
        />
        <Stat
          label="Prescrições"
          value={prescriptions.length.toString()}
        />
        <Stat
          label="Exames solicitados"
          value={exams.length.toString()}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-black/[0.08] pt-4">
        <h4 className="flex items-center gap-1.5 text-label font-semibold text-ink-600">
          <Activity size={12} /> Plano
        </h4>
        <div className="flex items-center justify-between rounded-lg border border-black/[0.08] bg-surface-raised px-3 py-2">
          <span className="text-[13px] font-semibold text-ink-900">
            Hipócrates.ai · Profissional
          </span>
          <span className="font-mono text-label font-semibold text-clinical-700">
            Beta
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled
        title="Logout — em desenvolvimento"
        className="mt-5 flex h-9 w-fit cursor-not-allowed items-center gap-2 rounded-md border border-black/10 bg-surface px-3 text-[13px] font-semibold text-ink-400"
      >
        <LogOut size={14} /> Sair
      </button>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-black/[0.08] bg-surface-raised px-3 py-2.5">
      <span className="text-label font-semibold text-ink-600">
        {label}
      </span>
      <span className="font-mono text-[18px] font-bold tabular-nums text-ink-900">
        {value}
      </span>
    </div>
  );
}
