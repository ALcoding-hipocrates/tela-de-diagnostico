import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import type {
  HypothesisShift,
  TranscriptRedFlagRef,
  TranscriptSpeaker,
} from "@/types/session";
import { getRedFlagById } from "@/mocks/session";
import { useSessionStore } from "@/store/sessionStore";
import { cn } from "@/lib/cn";
import { RedFlagMark } from "./RedFlagMark";
import { ShiftImpactPopover } from "./ShiftImpactPopover";

interface MessageRowProps {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
  timestampSec: number;
  redFlags?: TranscriptRedFlagRef[];
  autoLabeled?: boolean;
  triggeredShifts?: HypothesisShift[];
}

export function MessageRow({
  id,
  speaker,
  text,
  timestampSec,
  redFlags,
  autoLabeled,
  triggeredShifts,
}: MessageRowProps) {
  const toggleSpeaker = useSessionStore((s) => s.toggleMessageSpeaker);
  const isDoctor = speaker === "doctor";
  const hasShifts = triggeredShifts && triggeredShifts.length > 0;

  return (
    <div
      data-message-id={id}
      className="group grid grid-cols-[96px_1fr] gap-5 py-3 transition-colors hover:bg-black/[0.015]"
    >
      <div className="flex flex-col pt-[3px] leading-tight">
        <button
          type="button"
          onClick={() => toggleSpeaker(id)}
          title={
            autoLabeled
              ? "Rotulagem automática — clique pra corrigir"
              : "Clique pra trocar Méd/Pac"
          }
          className={cn(
            "-mx-1 flex w-fit items-center gap-1.5 rounded px-1 text-[13px] font-semibold tracking-tight transition-colors hover:bg-black/[0.04]",
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
          {autoLabeled && (
            <span
              className="text-[10px] font-medium text-ink-400"
              aria-label="rótulo automático"
            >
              auto
            </span>
          )}
        </button>
        <span className="mt-0.5 pl-3 font-mono text-[11px] tabular-nums text-ink-400">
          {formatTime(timestampSec)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-medium leading-[1.65] text-ink-900">
          <RichText text={text} redFlags={redFlags} />
          {hasShifts && (
            <>
              {" "}
              <ShiftImpactPopover
                shifts={triggeredShifts}
                align="left"
                label={`Esta fala causou ${triggeredShifts.length} mudança${triggeredShifts.length === 1 ? "" : "s"} no raciocínio — clique pra detalhes`}
              >
                <span
                  className="inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-clinical/10 px-2 py-0 text-[10px] font-semibold leading-[1.4] text-clinical-700 align-middle transition-colors hover:bg-clinical/15"
                  title="Esta fala alterou o raciocínio clínico"
                >
                  <Sparkles size={9} />
                  {triggeredShifts.length > 1
                    ? `${triggeredShifts.length} hipóteses`
                    : "afetou raciocínio"}
                </span>
              </ShiftImpactPopover>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function RichText({
  text,
  redFlags,
}: {
  text: string;
  redFlags?: TranscriptRedFlagRef[];
}) {
  if (!redFlags || redFlags.length === 0) return <>{text}</>;

  const pattern = redFlags.map((rf) => escapeRegex(rf.trigger)).join("|");
  const regex = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const match = redFlags.find(
          (rf) => rf.trigger.toLowerCase() === part.toLowerCase()
        );
        if (match) {
          const rf = getRedFlagById(match.redFlagId);
          if (rf) return <RedFlagMark key={i} trigger={part} redFlag={rf} />;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
