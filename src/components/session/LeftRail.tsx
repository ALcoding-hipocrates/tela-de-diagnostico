import {
  Stethoscope,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  BarChart3,
  UserRound,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { mockUser } from "@/data/user";
import { cn } from "@/lib/cn";

/**
 * Left nav rail (96px) — estilo mockup Stitch / DeepScribe.
 * Sempre visível. Session é o estado ativo. Outros itens preservam modais.
 */
export function LeftRail() {
  const openModal = useSessionStore((s) => s.openModal);

  return (
    <aside className="flex w-[88px] shrink-0 flex-col items-center border-r border-black/[0.04] bg-surface py-6">
      {/* Logo */}
      <div className="mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white">
          <Stethoscope size={17} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-7">
        <NavIcon
          icon={<LayoutDashboard size={19} />}
          label="Dashboard (em breve)"
          disabled
        />
        <NavIcon
          icon={<CalendarDays size={19} />}
          label="Agenda (em breve)"
          disabled
        />
        <NavIcon
          icon={<ClipboardList size={19} />}
          label="Sessão atual"
          active
        />
        <NavIcon
          icon={<FolderOpen size={19} />}
          label="Documentos"
          onClick={() => openModal("handoff")}
        />
        <NavIcon
          icon={<BarChart3 size={19} />}
          label="Auditoria"
          onClick={() => openModal("audit")}
        />
      </nav>

      {/* User avatar (bottom) */}
      <button
        type="button"
        onClick={() => openModal("account")}
        aria-label="Conta"
        title={mockUser.name}
        className="mt-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-clinical/10 text-clinical-700 ring-1 ring-black/[0.08] transition-colors hover:ring-clinical/40"
      >
        <UserRound size={15} />
      </button>
    </aside>
  );
}

interface NavIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavIcon({ icon, label, active, disabled, onClick }: NavIconProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        active
          ? "text-ink-900"
          : disabled
            ? "cursor-not-allowed text-ink-400/40"
            : "text-ink-400 hover:bg-black/[0.04] hover:text-ink-900"
      )}
    >
      {icon}
      {active && (
        <span
          aria-hidden
          className="absolute -right-[14px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-ink-900"
        />
      )}
    </button>
  );
}
