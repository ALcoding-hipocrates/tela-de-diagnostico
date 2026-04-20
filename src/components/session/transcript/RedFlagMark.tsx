import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { RedFlag } from "@/types/session";

interface RedFlagMarkProps {
  trigger: string;
  redFlag: RedFlag;
}

export function RedFlagMark({ trigger, redFlag }: RedFlagMarkProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Red flag: ${redFlag.label}`}
        className="cursor-pointer rounded bg-peach px-0.5 font-medium text-peach-text underline decoration-peach-text/40 decoration-solid decoration-[1.5px] underline-offset-[3px] transition-colors hover:bg-peach-border"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-20 mt-1.5 w-[360px] overflow-hidden rounded-[2rem] border border-peach-border bg-peach text-left shadow-xl animate-pop-in"
        >
          <header className="flex items-start gap-4 px-6 py-5">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-peach-text" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-ultra text-peach-text">
                Cardiovascular warning · {severityLabel(redFlag.severity)}
              </span>
              <h3 className="text-[15px] font-medium tracking-tight text-ink-900">
                {redFlag.label}
              </h3>
            </div>
          </header>

          <div className="border-t border-peach-border bg-surface p-6">
            <p className="text-[13px] font-light leading-relaxed text-ink-600">
              {redFlag.meaning}
            </p>

            <div className="mt-4">
              <span className="text-[9px] font-bold uppercase tracking-ultra text-ink-400">
                Conduta sugerida
              </span>
              <ol className="mt-2 list-decimal pl-5 text-[13px] font-light text-ink-900 marker:text-peach-text">
                {redFlag.conduct.map((c, i) => (
                  <li key={i} className="mt-1 leading-relaxed">
                    {c}
                  </li>
                ))}
              </ol>
            </div>

            {redFlag.reference && (
              <p className="mt-4 font-mono text-[10px] font-medium text-ink-400">
                {redFlag.reference}
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  );
}

function severityLabel(s: RedFlag["severity"]) {
  if (s === "high") return "alta";
  if (s === "medium") return "média";
  return "baixa";
}
