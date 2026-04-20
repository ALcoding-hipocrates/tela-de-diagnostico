import type {
  CriticalMoment,
  CriticalMomentReason,
  TranscriptItem,
} from "@/types/session";
import { getRedFlagById } from "@/mocks/session";

const SURGE_THRESHOLD = 20;

/**
 * Detecta momentos críticos da consulta combinando:
 * - Saltos de hipótese ≥ 20 pontos percentuais num único shift
 * - Red flags de alta severidade mencionadas pelo paciente
 *
 * Moments próximos em tempo (< 30s) e no mesmo triggerMessage são agrupados.
 */
export function detectCriticalMoments(
  transcript: TranscriptItem[]
): CriticalMoment[] {
  const raw: CriticalMoment[] = [];

  for (let i = 0; i < transcript.length; i++) {
    const item = transcript[i];

    if (item.kind === "shift") {
      for (const shift of item.shifts) {
        const delta = Math.abs(shift.to - shift.from);
        if (delta < SURGE_THRESHOLD) continue;

        const triggerMsg = findTriggeringMessage(transcript, i);
        const reason: CriticalMomentReason = {
          type: "hypothesis-surge",
          hypothesisLabel: shift.hypothesisLabel,
          icd10: shift.icd10,
          from: shift.from,
          to: shift.to,
        };
        raw.push({
          id: `moment-surge-${item.id}-${shift.icd10 ?? shift.hypothesisLabel}`,
          timestampSec: item.timestampSec,
          triggerMessageId: triggerMsg?.id,
          reasons: [reason],
        });
      }
    }

    if (item.kind === "message" && item.redFlags) {
      for (const ref of item.redFlags) {
        const rf = getRedFlagById(ref.redFlagId);
        if (!rf || rf.severity !== "high") continue;
        raw.push({
          id: `moment-flag-${item.id}-${rf.id}`,
          timestampSec: item.timestampSec,
          triggerMessageId: item.id,
          reasons: [
            {
              type: "high-severity-flag",
              redFlagId: rf.id,
              label: rf.label,
              trigger: ref.trigger,
            },
          ],
        });
      }
    }
  }

  return mergeAdjacent(raw);
}

function findTriggeringMessage(
  transcript: TranscriptItem[],
  shiftIndex: number
): Extract<TranscriptItem, { kind: "message" }> | null {
  for (let i = shiftIndex - 1; i >= 0; i--) {
    const item = transcript[i];
    if (item.kind === "message") return item;
  }
  return null;
}

/**
 * Combina moments na mesma mensagem trigger ou muito próximos
 * temporalmente — evita poluir com vários banners quase simultâneos.
 */
function mergeAdjacent(moments: CriticalMoment[]): CriticalMoment[] {
  if (moments.length === 0) return [];
  const sorted = [...moments].sort((a, b) => a.timestampSec - b.timestampSec);
  const out: CriticalMoment[] = [];

  for (const m of sorted) {
    const last = out[out.length - 1];
    const sameMessage =
      last &&
      m.triggerMessageId &&
      last.triggerMessageId === m.triggerMessageId;
    const veryClose = last && Math.abs(m.timestampSec - last.timestampSec) <= 30;

    if (last && (sameMessage || veryClose)) {
      last.reasons.push(...m.reasons);
      last.timestampSec = Math.max(last.timestampSec, m.timestampSec);
    } else {
      out.push({ ...m, reasons: [...m.reasons] });
    }
  }

  return out;
}
