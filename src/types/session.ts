export type HypothesisStatus = "active" | "investigating" | "discarded";

export interface SparklinePoint {
  value: number;
  label?: string;
}

export interface Hypothesis {
  id: string;
  label: string;
  icd10: string;
  confidence: number;
  status: HypothesisStatus;
  delta: number;
  trigger?: string;
  sparkline: SparklinePoint[];
  rationale?: string;
  citations?: string[];
}

export type RedFlagSeverity = "high" | "medium" | "low";

export interface RedFlag {
  id: string;
  label: string;
  severity: RedFlagSeverity;
  meaning: string;
  conduct: string[];
  reference?: string;
  triggerPhrases?: string[];
}

export interface PendingItem {
  id: string;
  label: string;
  blocksHypothesisId?: string;
}

export interface ChecklistImpact {
  icd10?: string;
  hypothesisLabel: string;
  lrPositive: number;
  source?: string;
}

export type ChecklistStatus = "pending" | "checked";

export interface ChecklistItem {
  id: string;
  label: string;
  resultPlaceholder?: string;
  resultUnit?: string;
  impacts: ChecklistImpact[];
  status: ChecklistStatus;
  result?: string;
}

export interface NextQuestionSuggestion {
  id: string;
  question: string;
  reason: string;
  impact: string;
}

export interface SoapSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export type CriticalMomentReason =
  | {
      type: "hypothesis-surge";
      hypothesisLabel: string;
      icd10?: string;
      from: number;
      to: number;
    }
  | {
      type: "high-severity-flag";
      redFlagId: string;
      label: string;
      trigger: string;
    };

export interface CriticalMoment {
  id: string;
  timestampSec: number;
  triggerMessageId?: string;
  reasons: CriticalMomentReason[];
}

export type ExamPriority = "urgent" | "routine" | "optional";

export interface ExamRecommendation {
  id: string;
  panelId?: string;
  panelName: string;
  priority: ExamPriority;
  rationale: string;
  linkedIcd10?: string;
  guidelineRef?: string;
}

export type ExamStatus = "requested" | "resulted";

export interface Exam {
  id: string;
  panelId: string;
  panelName: string;
  observation?: string;
  status: ExamStatus;
  result?: string;
  addedAt: number;
}

export type PrescriptionStatus = "new" | "maintained" | "conditional";

export interface Prescription {
  id: string;
  medicationId: string;
  medicationName: string;
  medicationClass: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  status: PrescriptionStatus;
  condition?: string;
  justification?: string;
  addedAt: number;
}

export type TranscriptSpeaker = "doctor" | "patient";

export interface TranscriptRedFlagRef {
  trigger: string;
  redFlagId: string;
}

export interface HypothesisShift {
  icd10?: string;
  hypothesisLabel: string;
  from: number;
  to: number;
  rationale?: string;
}

export type TranscriptItem =
  | {
      kind: "message";
      id: string;
      speaker: TranscriptSpeaker;
      text: string;
      timestampSec: number;
      redFlags?: TranscriptRedFlagRef[];
      autoLabeled?: boolean;
    }
  | {
      kind: "shift";
      id: string;
      shifts: HypothesisShift[];
      timestampSec: number;
    };
