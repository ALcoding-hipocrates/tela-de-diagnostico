import { useEffect, useRef, useState } from "react";
import {
  Stethoscope,
  HeartPulse,
  Brain,
  Baby,
  Smile,
  Siren,
  ChevronDown,
  Check,
} from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import {
  specialties,
  getSpecialty,
  type SpecialtyId,
} from "@/data/specialtyConfig";
import { cn } from "@/lib/cn";

const ICONS = {
  Stethoscope,
  HeartPulse,
  Brain,
  Baby,
  Smile,
  Siren,
} as const;

/**
 * M6 — Picker de especialidade. Filtra guidelines, calculadoras e red flags
 * pra o contexto clínico. Persiste em localStorage.
 */
export function SpecialtyPicker() {
  const specialty = useSessionStore((s) => s.specialty);
  const setSpecialty = useSessionStore((s) => s.setSpecialty);
  const pushToast = useSessionStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = getSpecialty(specialty);
  const Icon = ICONS[current.icon];

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

  const handlePick = (id: SpecialtyId) => {
    setSpecialty(id);
    setOpen(false);
    const s = getSpecialty(id);
    pushToast({
      tone: "info",
      title: `Modo ${s.label}`,
      description: s.description,
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-8 items-center gap-1.5 rounded-full border border-black/[0.08] bg-surface-raised px-2.5 text-[11.5px] font-semibold text-ink-900 transition-colors hover:border-clinical/30 hover:text-clinical-700"
        title={`Modo ${current.label} — ${current.description}`}
      >
        <Icon size={13} className="text-clinical-700" />
        <span>{current.shortLabel}</span>
        <ChevronDown
          size={11}
          className={cn("text-ink-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-40 mt-2 w-[280px] overflow-hidden rounded-[16px] border border-black/[0.08] bg-surface shadow-xl animate-pop-in"
        >
          <header className="border-b border-black/[0.05] px-4 py-3">
            <span className="text-[9px] font-bold uppercase tracking-ultra text-ink-400">
              Modo especialidade
            </span>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-600">
              Filtra diretrizes, calculadoras e red flags pelo contexto.
            </p>
          </header>
          <ul className="py-1">
            {specialties.map((s) => {
              const SI = ICONS[s.icon];
              const active = s.id === specialty;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(s.id)}
                    role="option"
                    aria-selected={active}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-4 py-2 text-left transition-colors",
                      active
                        ? "bg-clinical/[0.05]"
                        : "hover:bg-black/[0.02]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 shrink-0",
                        active ? "text-clinical-700" : "text-ink-600"
                      )}
                    >
                      <SI size={14} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            active ? "text-clinical-700" : "text-ink-900"
                          )}
                        >
                          {s.label}
                        </span>
                        {active && (
                          <Check size={12} className="text-clinical-700" />
                        )}
                      </div>
                      <p className="text-[11px] leading-snug text-ink-600">
                        {s.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
