import { useEffect } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import type { ToastItem, ToastTone } from "@/store/sessionStore";
import { cn } from "@/lib/cn";

const TOAST_DURATION_MS = 3800;

const toneConfig: Record<
  ToastTone,
  { icon: typeof CheckCircle2; accent: string; bg: string; border: string }
> = {
  success: {
    icon: CheckCircle2,
    accent: "text-clinical-700",
    bg: "bg-clinical/[0.06]",
    border: "border-clinical/25",
  },
  info: {
    icon: Info,
    accent: "text-ink-900",
    bg: "bg-surface",
    border: "border-black/10",
  },
  danger: {
    icon: AlertTriangle,
    accent: "text-danger",
    bg: "bg-danger/[0.06]",
    border: "border-danger/25",
  },
};

export function ToastHost() {
  const toasts = useSessionStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-5 right-5 z-[100] flex max-w-[380px] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useSessionStore((s) => s.dismissToast);
  const cfg = toneConfig[toast.tone];
  const Icon = cfg.icon;

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-[var(--shadow-card-floating)] animate-pop-in",
        cfg.bg,
        cfg.border
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", cfg.accent)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-ink-900">{toast.title}</p>
        {toast.description && (
          <p className="text-[12px] leading-snug text-ink-600">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dispensar"
        className="shrink-0 rounded-md p-0.5 text-ink-400 transition-colors hover:bg-surface-raised hover:text-ink-900"
      >
        <X size={13} />
      </button>
    </div>
  );
}
