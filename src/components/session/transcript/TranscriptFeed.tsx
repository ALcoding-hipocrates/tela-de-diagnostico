import { useEffect, useRef, useState } from "react";
import type { TranscriptSpeaker } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { shiftsAfterMessage } from "@/lib/sessionSelectors";
import { cn } from "@/lib/cn";
import { MessageRow } from "./MessageRow";
import { HypothesisShiftChip } from "./HypothesisShiftChip";

export function TranscriptFeed() {
  const transcript = useSessionStore((s) => s.transcript);
  const interimText = useSessionStore((s) => s.interimText);
  const isRecording = useSessionStore((s) => s.isRecording);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const examRecommendations = useSessionStore((s) => s.examRecommendations);
  const checklist = useSessionStore((s) => s.checklist);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length]);

  useEffect(() => {
    if (!sessionStartedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sessionStartedAt]);

  const showInterim = isRecording && interimText.trim().length > 0;
  const messageCount = transcript.filter((i) => i.kind === "message").length;
  const elapsedSec = sessionStartedAt
    ? Math.floor((now - sessionStartedAt) / 1000)
    : 0;
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60);
  const s = elapsedSec % 60;
  const elapsed = sessionStartedAt
    ? h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : "—";
  const totalActions =
    examRecommendations.length +
    checklist.filter((c) => c.status === "pending").length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col px-6 pb-6 pt-5">
        {/* Meta line — estilo mockup */}
        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
          <span className="h-px w-6 bg-ink-400/40" aria-hidden />
          <span>Consulta</span>
          <MetaDot />
          <span className="font-mono tabular-nums">{elapsed}</span>
          <MetaDot />
          <span>
            <span className="font-mono tabular-nums text-ink-900">
              {messageCount}
            </span>{" "}
            turnos
          </span>
          <MetaDot />
          <span>
            <span className="font-mono tabular-nums text-ink-900">
              {totalActions}
            </span>{" "}
            ações sugeridas pela IA
          </span>
        </div>

        <div className="flex flex-col divide-y divide-black/[0.04]">
        {transcript.map((item) =>
          item.kind === "message" ? (
            <MessageRow
              key={item.id}
              id={item.id}
              speaker={item.speaker}
              text={item.text}
              timestampSec={item.timestampSec}
              redFlags={item.redFlags}
              autoLabeled={item.autoLabeled}
              triggeredShifts={shiftsAfterMessage(transcript, item.id)}
              inconsistencies={item.inconsistencies}
            />
          ) : (
            <HypothesisShiftChip
              key={item.id}
              shifts={item.shifts}
              timestampSec={item.timestampSec}
            />
          )
        )}
        {showInterim && <InterimRow speaker="doctor" text={interimText} />}
        <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      className="h-0.5 w-0.5 rounded-full bg-ink-400/60"
    />
  );
}

interface InterimRowProps {
  speaker: TranscriptSpeaker;
  text: string;
}

function InterimRow({ speaker, text }: InterimRowProps) {
  const isDoctor = speaker === "doctor";
  return (
    <div className="grid grid-cols-[96px_1fr] gap-5 py-3">
      <div className="flex flex-col pt-[3px] leading-tight">
        <span
          className={cn(
            "flex w-fit items-center gap-1.5 text-[13px] font-semibold tracking-tight",
            isDoctor ? "text-clinical-700" : "text-ink-900"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
              isDoctor ? "bg-clinical" : "bg-ink-600"
            )}
          />
          {isDoctor ? "Médico" : "Paciente"}
        </span>
        <span className="mt-0.5 flex items-center gap-1 pl-3 font-mono text-[11px] text-ink-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
          </span>
          ao vivo
        </span>
      </div>
      <p className="text-[15px] font-medium italic leading-[1.65] text-ink-600">
        {text}
      </p>
    </div>
  );
}
