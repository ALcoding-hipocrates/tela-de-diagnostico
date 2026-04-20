import type {
  ChecklistItem,
  Hypothesis,
  HypothesisShift,
  RedFlag,
  TranscriptItem,
} from "@/types/session";
import { getRedFlagById } from "@/mocks/session";

export function nextTimestamp(transcript: TranscriptItem[], offset = 10): number {
  const last = transcript[transcript.length - 1];
  return last ? last.timestampSec + offset : offset;
}

/**
 * Shifts imediatamente subsequentes a uma mensagem — os que aparecem antes
 * da próxima mensagem. Heurística: shifts logo após uma fala foram causados
 * por ela.
 */
export function shiftsAfterMessage(
  transcript: TranscriptItem[],
  messageId: string
): HypothesisShift[] {
  const idx = transcript.findIndex(
    (i) => i.kind === "message" && i.id === messageId
  );
  if (idx === -1) return [];
  const out: HypothesisShift[] = [];
  for (let i = idx + 1; i < transcript.length; i++) {
    const item = transcript[i];
    if (item.kind === "message") break;
    if (item.kind === "shift") out.push(...item.shifts);
  }
  return out;
}

const SEVERITY_RANK: Record<RedFlag["severity"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function getActiveRedFlag(
  transcript: TranscriptItem[]
): RedFlag | undefined {
  let best: RedFlag | undefined;
  for (const item of transcript) {
    if (item.kind !== "message" || !item.redFlags?.length) continue;
    for (const ref of item.redFlags) {
      const rf = getRedFlagById(ref.redFlagId);
      if (!rf) continue;
      if (!best || SEVERITY_RANK[rf.severity] > SEVERITY_RANK[best.severity]) {
        best = rf;
      }
    }
  }
  return best;
}

export function getPrincipalHypothesis(
  hypotheses: Hypothesis[]
): Hypothesis | undefined {
  const candidates = hypotheses.filter((h) => h.status !== "discarded");
  if (candidates.length === 0) return undefined;
  return candidates.reduce((top, h) =>
    h.confidence > top.confidence ? h : top
  );
}

const EVIDENCE_THRESHOLD = 50;

export function getUnknownHypothesesCount(hypotheses: Hypothesis[]): number {
  return hypotheses.filter(
    (h) => h.status !== "discarded" && h.confidence < EVIDENCE_THRESHOLD
  ).length;
}

export function getPendingChecklistCount(checklist: ChecklistItem[]): number {
  return checklist.filter((i) => i.status === "pending").length;
}
