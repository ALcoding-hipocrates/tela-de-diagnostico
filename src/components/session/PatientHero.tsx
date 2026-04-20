import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";

export function PatientHero() {
  const startedAt = useSessionStore((s) => s.sessionStartedAt);
  const isRecording = useSessionStore((s) => s.isRecording);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const duration = startedAt
    ? formatElapsed(Math.floor((now - startedAt) / 1000))
    : "--:--";

  const sexLabel = mockPatient.sex === "F" ? "Feminino" : "Masculino";

  return (
    <header className="mx-auto w-full max-w-3xl px-8 pt-12 pb-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <span
              className="relative flex h-1.5 w-1.5"
              aria-hidden
            >
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-clinical-glow ${isRecording ? "animate-ping opacity-70" : "opacity-0"}`}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clinical-glow shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-ultra text-ink-400">
              {isRecording ? "Live clinical session" : "Sessão clínica"}
            </span>
          </div>

          <h1 className="text-[30px] font-light tracking-tightest text-ink-900">
            {mockPatient.name}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-400">
            <span>Queixa principal</span>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-400/50" />
            <span>Consulta presencial</span>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-400/50" />
            <span>{sexLabel}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-400/50" />
            <span>{mockPatient.age} anos</span>
          </div>
        </div>

        <div className="flex flex-col items-end leading-tight">
          <span className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
            Duração
          </span>
          <span className="font-mono text-[14px] font-medium tabular-nums text-ink-900">
            {duration}
          </span>
        </div>
      </div>
    </header>
  );
}

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
