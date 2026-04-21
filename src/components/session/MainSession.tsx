import { useEffect, useState } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { getSpecialty } from "@/data/specialtyConfig";
import { TranscriptFeed } from "./transcript/TranscriptFeed";
import { FloatingControls } from "./FloatingControls";
import { BillingLive } from "./BillingLive";
import { SpecialtyPicker } from "./SpecialtyPicker";
import { Mic } from "lucide-react";

/**
 * Área central — layout editorial estilo mockup Stitch.
 * Patient Hero no topo + transcript + floating controls bottom.
 */
export function MainSession() {
  const hasMessages = useSessionStore((s) =>
    s.transcript.some((i) => i.kind === "message")
  );

  return (
    <main
      className="relative flex h-full flex-1 flex-col overflow-hidden bg-surface"
      aria-label="Sessão clínica"
    >
      <div className="flex-1 overflow-y-auto">
        <PatientHero />
        {hasMessages ? <TranscriptFeed /> : <EmptyTranscript />}
      </div>

      <FloatingControls />
    </main>
  );
}

function PatientHero() {
  const startedAt = useSessionStore((s) => s.sessionStartedAt);
  const isRecording = useSessionStore((s) => s.isRecording);
  const specialtyId = useSessionStore((s) => s.specialty);
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
  const specialty = getSpecialty(specialtyId);

  return (
    <header className="mx-auto w-full max-w-3xl px-12 pb-6 pt-12">
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1">
          {/* Live session label */}
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-clinical-glow ${isRecording ? "animate-ping opacity-70" : "opacity-0"}`}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clinical-glow shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-ultra text-ink-400">
              {isRecording ? "Live clinical session" : "Sessão clínica"}
            </span>
          </div>

          {/* Patient name */}
          <h1 className="text-[32px] font-light tracking-tightest text-ink-900">
            {mockPatient.name}
          </h1>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-400">
            <span>{sexLabel}</span>
            <Dot />
            <span>{mockPatient.age} anos</span>
            <Dot />
            <span className="font-mono">#{mockPatient.id}</span>
            <Dot />
            <span>{specialty.label}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-end leading-tight">
          <span className="mb-1 text-[9px] font-medium uppercase tracking-[0.15em] text-ink-400">
            Duration
          </span>
          <span className="font-mono text-[13.5px] font-medium tabular-nums text-ink-900">
            {duration}
          </span>
        </div>
      </div>

      {/* Pill controls abaixo do hero */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SpecialtyPicker />
        <BillingLive />
      </div>
    </header>
  );
}

function Dot() {
  return <span className="h-0.5 w-0.5 rounded-full bg-ink-400/50" aria-hidden />;
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

function EmptyTranscript() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-12 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clinical/10 text-clinical-700">
        <Mic size={22} />
      </div>
      <h2 className="text-[15px] font-semibold tracking-tight text-ink-900">
        Pronto pra começar
      </h2>
      <p className="max-w-md text-[13.5px] font-light leading-relaxed text-ink-600">
        Clique no microfone abaixo pra iniciar captura, ou use o editor de texto.
        A IA analisa automaticamente após algumas mensagens.
      </p>
    </div>
  );
}
