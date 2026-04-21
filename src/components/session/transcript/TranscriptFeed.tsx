import { useEffect, useRef } from "react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length]);

  const showInterim = isRecording && interimText.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col divide-y divide-black/[0.04] px-6 py-6">
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
