import type {
  ChecklistItem,
  Hypothesis,
  NextQuestionSuggestion,
  Prescription,
  RedFlag,
  SoapSections,
  TranscriptItem,
  TranscriptSpeaker,
} from "@/types/session";
import { getRedFlagById, mockPatient, type MockPatient } from "@/mocks/session";

export interface SoapTranscriptLine {
  timestampSec: number;
  speaker: TranscriptSpeaker;
  text: string;
}

export interface SoapRedFlag {
  label: string;
  severity: RedFlag["severity"];
  trigger: string;
  reference?: string;
}

export interface SoapObjective {
  label: string;
  result?: string;
  unit?: string;
}

export interface SoapAssessment {
  label: string;
  icd10: string;
  confidence: number;
  status: "active" | "investigating" | "discarded";
  rationale?: string;
}

export interface SoapContent {
  patient: MockPatient;
  generatedAt: Date;
  durationSec: number;
  subjective: {
    transcript: SoapTranscriptLine[];
    redFlags: SoapRedFlag[];
  };
  objective: SoapObjective[];
  assessment: SoapAssessment[];
  plan: {
    nextQuestion: NextQuestionSuggestion | null;
    pendingItems: string[];
    prescriptions: Prescription[];
  };
  narrativeSections: SoapSections | null;
}

interface BuildSoapInput {
  transcript: TranscriptItem[];
  hypotheses: Hypothesis[];
  checklist: ChecklistItem[];
  nextQuestion: NextQuestionSuggestion | null;
  prescriptions: Prescription[];
  narrativeSections?: SoapSections | null;
}

export function buildSoap(input: BuildSoapInput): SoapContent {
  const transcriptLines: SoapTranscriptLine[] = input.transcript
    .filter(
      (i): i is Extract<TranscriptItem, { kind: "message" }> =>
        i.kind === "message"
    )
    .map((m) => ({
      timestampSec: m.timestampSec,
      speaker: m.speaker,
      text: m.text,
    }));

  const redFlagsSeen = new Map<string, SoapRedFlag>();
  for (const item of input.transcript) {
    if (item.kind !== "message" || !item.redFlags) continue;
    for (const ref of item.redFlags) {
      const rf = getRedFlagById(ref.redFlagId);
      if (!rf || redFlagsSeen.has(rf.id)) continue;
      redFlagsSeen.set(rf.id, {
        label: rf.label,
        severity: rf.severity,
        trigger: ref.trigger,
        reference: rf.reference,
      });
    }
  }

  const objective: SoapObjective[] = input.checklist
    .filter((i) => i.status === "checked")
    .map((i) => ({ label: i.label, result: i.result, unit: i.resultUnit }));

  const assessment: SoapAssessment[] = [...input.hypotheses]
    .sort((a, b) => b.confidence - a.confidence)
    .map((h) => ({
      label: h.label,
      icd10: h.icd10,
      confidence: h.confidence,
      status: h.status,
      rationale: h.rationale ?? h.trigger,
    }));

  const pendingItems = input.checklist
    .filter((i) => i.status === "pending")
    .map((i) => i.label);

  const lastTs = transcriptLines[transcriptLines.length - 1]?.timestampSec ?? 0;

  return {
    patient: mockPatient,
    generatedAt: new Date(),
    durationSec: lastTs,
    subjective: {
      transcript: transcriptLines,
      redFlags: Array.from(redFlagsSeen.values()),
    },
    objective,
    assessment,
    plan: {
      nextQuestion: input.nextQuestion,
      pendingItems,
      prescriptions: input.prescriptions,
    },
    narrativeSections: input.narrativeSections ?? null,
  };
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function soapFilename(content: SoapContent): string {
  const d = content.generatedAt;
  const iso = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  const slug = content.patient.name.toLowerCase().replace(/\s+/g, "-");
  return `soap-${slug}-${iso}.pdf`;
}
