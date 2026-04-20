import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Kbd } from "./Kbd";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className="animate-pop-in relative z-10 flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-black/5 bg-surface shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] px-6 py-5">
          <div className="flex min-w-0 flex-col">
            <h2
              id="modal-title"
              className="text-[22px] font-bold tracking-tight text-ink-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[13px] leading-snug text-ink-600">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Kbd tone="muted" className="hidden sm:inline-flex">
              Esc
            </Kbd>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-surface-raised hover:text-ink-900"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
