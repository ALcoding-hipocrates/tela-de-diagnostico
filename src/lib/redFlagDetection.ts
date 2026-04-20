import type { TranscriptRedFlagRef } from "@/types/session";
import { mockRedFlags } from "@/mocks/session";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function detectRedFlags(text: string): TranscriptRedFlagRef[] | undefined {
  const matches: TranscriptRedFlagRef[] = [];
  const seen = new Set<string>();
  for (const rf of mockRedFlags) {
    if (!rf.triggerPhrases?.length) continue;
    for (const phrase of rf.triggerPhrases) {
      const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
      const m = text.match(regex);
      if (m && !seen.has(rf.id)) {
        matches.push({ trigger: m[0], redFlagId: rf.id });
        seen.add(rf.id);
        break;
      }
    }
  }
  return matches.length > 0 ? matches : undefined;
}
