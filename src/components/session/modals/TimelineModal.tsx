import { AlertTriangle, MessageCircle, TrendingUp, Activity } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import { getRedFlagById } from "@/mocks/session";
import { formatTime } from "@/lib/soap";
import { Modal } from "../shared/Modal";

interface TimelineModalProps {
  open: boolean;
  onClose: () => void;
}

type Event =
  | { kind: "start"; timestampSec: number }
  | { kind: "message"; timestampSec: number; speaker: "doctor" | "patient"; text: string }
  | { kind: "shift"; timestampSec: number; label: string; from: number; to: number }
  | { kind: "redflag"; timestampSec: number; label: string; severity: "high" | "medium" | "low"; trigger: string };

export function TimelineModal({ open, onClose }: TimelineModalProps) {
  const transcript = useSessionStore((s) => s.transcript);

  const seenRedFlags = new Set<string>();
  const events: Event[] = [{ kind: "start", timestampSec: 0 }];

  for (const item of transcript) {
    if (item.kind === "message") {
      events.push({
        kind: "message",
        timestampSec: item.timestampSec,
        speaker: item.speaker,
        text: item.text,
      });
      if (item.redFlags) {
        for (const ref of item.redFlags) {
          if (seenRedFlags.has(ref.redFlagId)) continue;
          seenRedFlags.add(ref.redFlagId);
          const rf = getRedFlagById(ref.redFlagId);
          if (!rf) continue;
          events.push({
            kind: "redflag",
            timestampSec: item.timestampSec,
            label: rf.label,
            severity: rf.severity,
            trigger: ref.trigger,
          });
        }
      }
    } else if (item.kind === "shift") {
      for (const shift of item.shifts) {
        events.push({
          kind: "shift",
          timestampSec: item.timestampSec,
          label: shift.hypothesisLabel,
          from: shift.from,
          to: shift.to,
        });
      }
    }
  }

  events.sort((a, b) => a.timestampSec - b.timestampSec);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Timeline da consulta"
      description="Cronologia dos eventos clínicos da sessão atual"
    >
      <ol className="relative border-l-2 border-black/[0.1] pl-5">
        {events.map((e, i) => (
          <div
            key={i}
            className="border-b border-black/[0.04] py-3 last:border-b-0"
          >
            <TimelineEvent event={e} />
          </div>
        ))}
      </ol>
    </Modal>
  );
}

function TimelineEvent({ event }: { event: Event }) {
  const time = formatTime(event.timestampSec);
  if (event.kind === "start") {
    return (
      <li className="relative">
        <span className="absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-clinical text-white shadow-sm shadow-clinical/25 ring-2 ring-white">
          <Activity size={11} />
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-400">{time}</span>
          <span className="text-[13.5px] font-semibold text-ink-900">Início da consulta</span>
        </div>
      </li>
    );
  }
  if (event.kind === "message") {
    const isDoc = event.speaker === "doctor";
    return (
      <li className="relative">
        <span
          className={`absolute -left-[27px] h-3 w-3 rounded-full ring-2 ring-white ${isDoc ? "bg-clinical" : "bg-ink-600"}`}
          aria-hidden
        />
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-400">{time}</span>
          <span className={`text-[10.5px] font-bold ${isDoc ? "text-clinical-700" : "text-ink-900"}`}>
            {isDoc ? "Médico" : "Paciente"}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] font-medium text-ink-600 line-clamp-2">{event.text}</p>
      </li>
    );
  }
  if (event.kind === "shift") {
    const up = event.to > event.from;
    const delta = event.to - event.from;
    return (
      <li className="relative">
        <span className={`absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white ${up ? "bg-clinical/15" : "bg-danger/15"}`}>
          <TrendingUp size={10} className={up ? "text-clinical-700" : "text-danger"} />
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tabular-nums text-ink-400">{time}</span>
          <span className="text-[13px] font-medium text-ink-900">
            <span className="font-semibold">{event.label}</span>{" "}
            <span className="font-mono tabular-nums text-ink-400">{event.from}%</span>
            {" → "}
            <span className={`font-mono font-bold tabular-nums ${up ? "text-clinical-700" : "text-danger"}`}>
              {event.to}%
            </span>{" "}
            <span className={`font-mono text-[11px] font-semibold ${up ? "text-clinical-700/70" : "text-danger/70"}`}>
              ({up ? "+" : ""}
              {delta})
            </span>
          </span>
        </div>
      </li>
    );
  }
  return (
    <li className="relative">
      <span className="absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-danger shadow-sm shadow-danger/30 ring-2 ring-white">
        <AlertTriangle size={10} className="text-white" />
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] tabular-nums text-ink-400">{time}</span>
        <span className="text-[13.5px] font-semibold text-danger">
          Red flag: {event.label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-ink-600">
        Gatilho: "<em className="italic">{event.trigger}</em>" · severidade {event.severity}
      </p>
    </li>
  );
}
