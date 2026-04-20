import { useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin, ArrowRight, X } from "lucide-react";
import type { CriticalMoment, CriticalMomentReason } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";

interface Props {
  moments: CriticalMoment[];
}

export function CriticalMomentsSummarySlot({ moments }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useSessionStore((s) => s.dismissCriticalMoment);

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

  const handleGoTo = (messageId?: string) => {
    if (!messageId) return;
    const el = document.querySelector<HTMLElement>(
      `[data-message-id="${messageId}"]`
    );
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-danger/40", "rounded-md");
    setTimeout(
      () => el.classList.remove("ring-2", "ring-danger/40", "rounded-md"),
      1800
    );
    setOpen(false);
  };

  const count = moments.length;
  const countLabel = `${count} momento${count > 1 ? "s" : ""} crítico${count > 1 ? "s" : ""}`;

  return (
    <div ref={ref} className="relative flex max-w-[240px] min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Ver momentos críticos"
        className="flex min-w-0 items-center gap-2.5 rounded-md transition-colors hover:bg-danger/[0.06]"
      >
        <span
          className="shrink-0 text-danger animate-pulse"
          style={{ animationDuration: "2.4s" }}
        >
          <AlertTriangle size={16} />
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-[11.5px] font-medium text-ink-400">
            Red flag
          </span>
          <span className="mt-0.5 truncate text-[13.5px] font-semibold tracking-tight text-danger">
            {countLabel}
          </span>
        </div>
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-40 mt-2 w-[360px] rounded-lg border border-black/10 bg-surface text-left shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex items-center gap-1.5 border-b border-black/5 px-3 py-2.5">
            <AlertTriangle size={12} className="text-danger" />
            <h4 className="text-label font-semibold text-ink-900">
              Momentos críticos
            </h4>
            <span className="ml-auto font-mono text-label text-ink-400">
              {count}
            </span>
          </header>
          <ul className="flex max-h-[60vh] flex-col divide-y divide-black/5 overflow-y-auto">
            {moments.map((m) => (
              <li key={m.id} className="flex flex-col gap-1.5 px-3 py-3">
                <span className="font-mono text-[11px] text-ink-400">
                  às {formatTime(m.timestampSec)}
                </span>
                <ul className="flex flex-col gap-0.5">
                  {m.reasons.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-ink-900"
                    >
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-danger" />
                      <ReasonText reason={r} />
                    </li>
                  ))}
                </ul>
                <div className="mt-1 flex items-center gap-1.5">
                  {m.triggerMessageId && (
                    <button
                      type="button"
                      onClick={() => handleGoTo(m.triggerMessageId)}
                      className="flex h-6 items-center gap-1 rounded-md bg-danger px-2 text-[11px] font-semibold text-white hover:bg-danger/90"
                    >
                      <MapPin size={10} /> Ir ao turno
                      <ArrowRight size={10} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(m.id)}
                    className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-ink-600 hover:bg-surface-raised hover:text-ink-900"
                  >
                    <X size={10} /> Dispensar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReasonText({ reason }: { reason: CriticalMomentReason }) {
  if (reason.type === "hypothesis-surge") {
    const delta = reason.to - reason.from;
    const up = delta > 0;
    return (
      <span>
        Hipótese <strong className="font-semibold">{reason.hypothesisLabel}</strong>
        {reason.icd10 && (
          <span className="ml-1 font-mono text-[11px] text-ink-400">
            {reason.icd10}
          </span>
        )}{" "}
        <span className="font-mono">
          {reason.from}% → <span className="font-semibold">{reason.to}%</span>
        </span>{" "}
        <span
          className={cn(
            "font-mono font-semibold",
            up ? "text-clinical-700" : "text-danger"
          )}
        >
          ({up ? "+" : ""}
          {delta}%)
        </span>
      </span>
    );
  }
  return (
    <span>
      Red flag <strong className="font-semibold">{reason.label}</strong> — gatilho: "
      <em className="italic">{reason.trigger}</em>"
    </span>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
