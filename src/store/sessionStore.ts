import { create } from "zustand";
import type {
  AssumptionState,
  ChecklistItem,
  Exam,
  ExamRecommendation,
  Hypothesis,
  HypothesisShift,
  NextQuestionSuggestion,
  Prescription,
  SoapSections,
  TranscriptItem,
  TranscriptRedFlagRef,
  TranscriptSpeaker,
} from "@/types/session";
import {
  mockChecklist,
  mockExamRecommendations,
  mockHypotheses,
  mockNextQuestion,
  mockTranscript,
} from "@/mocks/session";
import { nextTimestamp } from "@/lib/sessionSelectors";
import { bayesianDelta } from "@/lib/bayesian";
import type { AiAnalysis } from "@/lib/clinicalAi";

export type AnalysisState = "idle" | "analyzing" | "error";

interface NewMessageInput {
  speaker: TranscriptSpeaker;
  text: string;
  timestampSec: number;
  redFlags?: TranscriptRedFlagRef[];
  autoLabeled?: boolean;
}

export type ModalId =
  | "prescription"
  | "timeline"
  | "ai"
  | "exams"
  | "protocols"
  | "calculators"
  | "settings"
  | "account"
  | "avs"
  | "referral"
  | "commandPalette";

export type ToastTone = "success" | "info" | "danger";

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface SessionState {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;

  activeModal: ModalId | null;
  openModal: (id: ModalId) => void;
  closeModal: () => void;

  hypotheses: Hypothesis[];
  checklist: ChecklistItem[];
  transcript: TranscriptItem[];
  nextQuestion: NextQuestionSuggestion | null;
  dismissedNextQuestionId: string | null;

  isRecording: boolean;
  interimText: string;
  setRecording: (v: boolean) => void;
  setInterim: (v: string) => void;

  analysisState: AnalysisState;
  setAnalysisState: (s: AnalysisState) => void;
  mergeAnalysis: (analysis: AiAnalysis) => void;

  soapSections: SoapSections | null;
  soapEdits: Partial<SoapSections>;
  setSoapEdit: (section: keyof SoapSections, text: string) => void;
  clearSoapEdit: (section: keyof SoapSections) => void;

  prescriptions: Prescription[];
  addPrescription: (input: Omit<Prescription, "id" | "addedAt">) => void;
  removePrescription: (id: string) => void;

  exams: Exam[];
  addExam: (input: Omit<Exam, "id" | "addedAt" | "status">) => void;
  setExamResult: (id: string, result: string) => void;
  removeExam: (id: string) => void;

  examRecommendations: ExamRecommendation[];
  dismissedRecommendationKeys: string[];
  dismissRecommendation: (id: string) => void;
  acceptRecommendation: (id: string) => void;

  dismissedCriticalMomentIds: string[];
  dismissCriticalMoment: (id: string) => void;

  reasoningCache: Record<string, string>;
  setReasoning: (icd10: string, text: string) => void;
  clearReasoningFor: (icd10: string) => void;

  sessionStartedAt: number | null;
  analysisEnabled: boolean;
  soundAlertsEnabled: boolean;
  darkMode: boolean;
  setAnalysisEnabled: (v: boolean) => void;
  setSoundAlertsEnabled: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  markSessionStarted: () => void;
  resetSession: () => void;

  addMessage: (input: NewMessageInput) => void;
  checkItem: (itemId: string, result?: string) => void;
  dismissNextQuestion: () => void;
  useNextQuestion: () => void;
  toggleMessageSpeaker: (messageId: string) => void;

  /** F1: altera estado de uma premissa de uma hipótese. */
  setAssumptionState: (
    icd10: string,
    assumptionId: string,
    state: AssumptionState
  ) => void;

  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function shortLabelFromIcd(label: string): string {
  return label.length > 22 ? label.slice(0, 22) + "…" : label;
}

export const useSessionStore = create<SessionState>((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),

  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  hypotheses: mockHypotheses,
  checklist: mockChecklist,
  transcript: mockTranscript,
  nextQuestion: mockNextQuestion,
  dismissedNextQuestionId: null,

  isRecording: false,
  interimText: "",
  setRecording: (v) => set({ isRecording: v }),
  setInterim: (v) => set({ interimText: v }),

  analysisState: "idle",
  setAnalysisState: (s) => set({ analysisState: s }),

  soapSections: null,
  soapEdits: {},
  setSoapEdit: (section, text) =>
    set((s) => ({ soapEdits: { ...s.soapEdits, [section]: text } })),
  clearSoapEdit: (section) =>
    set((s) => {
      const next = { ...s.soapEdits };
      delete next[section];
      return { soapEdits: next };
    }),

  prescriptions: [],
  addPrescription: (input) =>
    set((s) => ({
      prescriptions: [
        ...s.prescriptions,
        { ...input, id: `rx-${Date.now()}`, addedAt: Date.now() },
      ],
    })),
  removePrescription: (id) =>
    set((s) => ({
      prescriptions: s.prescriptions.filter((p) => p.id !== id),
    })),

  exams: [],
  addExam: (input) =>
    set((s) => ({
      exams: [
        ...s.exams,
        {
          ...input,
          id: `exam-${Date.now()}`,
          addedAt: Date.now(),
          status: "requested" as const,
        },
      ],
    })),
  setExamResult: (id, result) =>
    set((s) => ({
      exams: s.exams.map((e) =>
        e.id === id ? { ...e, status: "resulted" as const, result } : e
      ),
    })),
  removeExam: (id) =>
    set((s) => ({
      exams: s.exams.filter((e) => e.id !== id),
    })),

  dismissedCriticalMomentIds: [],
  dismissCriticalMoment: (id) =>
    set((s) =>
      s.dismissedCriticalMomentIds.includes(id)
        ? s
        : { dismissedCriticalMomentIds: [...s.dismissedCriticalMomentIds, id] }
    ),

  reasoningCache: {},
  setReasoning: (icd10, text) =>
    set((s) => ({ reasoningCache: { ...s.reasoningCache, [icd10]: text } })),
  clearReasoningFor: (icd10) =>
    set((s) => {
      const next = { ...s.reasoningCache };
      delete next[icd10];
      return { reasoningCache: next };
    }),

  examRecommendations: mockExamRecommendations,
  dismissedRecommendationKeys: [],
  dismissRecommendation: (id) =>
    set((s) => {
      const rec = s.examRecommendations.find((r) => r.id === id);
      if (!rec) return s;
      return {
        examRecommendations: s.examRecommendations.filter((r) => r.id !== id),
        dismissedRecommendationKeys: s.dismissedRecommendationKeys.includes(rec.id)
          ? s.dismissedRecommendationKeys
          : [...s.dismissedRecommendationKeys, rec.id],
      };
    }),
  acceptRecommendation: (id) =>
    set((s) => {
      const rec = s.examRecommendations.find((r) => r.id === id);
      if (!rec) return s;
      const panelId =
        rec.panelId ??
        `custom-${rec.panelName.toLowerCase().replace(/\s+/g, "-")}`;
      return {
        examRecommendations: s.examRecommendations.filter((r) => r.id !== id),
        dismissedRecommendationKeys: s.dismissedRecommendationKeys.includes(rec.id)
          ? s.dismissedRecommendationKeys
          : [...s.dismissedRecommendationKeys, rec.id],
        exams: [
          ...s.exams,
          {
            id: `exam-${Date.now()}`,
            panelId,
            panelName: rec.panelName,
            observation: rec.rationale,
            status: "requested" as const,
            addedAt: Date.now(),
          },
        ],
      };
    }),

  sessionStartedAt: null,
  analysisEnabled: true,
  soundAlertsEnabled: false,
  darkMode: (() => {
    try {
      return localStorage.getItem("hipocrates:dark-mode") === "1";
    } catch {
      return false;
    }
  })(),
  setAnalysisEnabled: (v) => set({ analysisEnabled: v }),
  setSoundAlertsEnabled: (v) => set({ soundAlertsEnabled: v }),
  setDarkMode: (v) => {
    try {
      localStorage.setItem("hipocrates:dark-mode", v ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ darkMode: v });
  },
  markSessionStarted: () =>
    set((s) => (s.sessionStartedAt ? s : { sessionStartedAt: Date.now() })),
  resetSession: () =>
    set((s) => ({
      transcript: [],
      hypotheses: [],
      checklist: s.checklist.map((i) => ({
        ...i,
        status: "pending" as const,
        result: undefined,
      })),
      prescriptions: [],
      exams: [],
      nextQuestion: null,
      dismissedNextQuestionId: null,
      interimText: "",
      analysisState: "idle",
      sessionStartedAt: null,
      soapSections: null,
      soapEdits: {},
      examRecommendations: [],
      dismissedRecommendationKeys: [],
      dismissedCriticalMomentIds: [],
      reasoningCache: {},
    })),

  mergeAnalysis: (analysis) =>
    set((s) => {
      const existingByIcd = new Map(s.hypotheses.map((h) => [h.icd10, h]));
      const shifts: HypothesisShift[] = [];

      const newHypotheses: Hypothesis[] = analysis.hypotheses.map((ai, idx) => {
        const prev = existingByIcd.get(ai.icd10);
        const from = prev?.confidence ?? 0;
        const to = clamp(ai.confidence);
        const delta = to - from;

        if (prev && delta !== 0) {
          shifts.push({
            icd10: ai.icd10,
            hypothesisLabel: shortLabelFromIcd(ai.label),
            from,
            to,
            rationale: ai.rationale,
          });
        }

        const sparklinePoint = { value: to, label: ai.rationale };
        const sparkline = prev
          ? [...prev.sparkline, sparklinePoint]
          : [{ value: to, label: "análise inicial" }, sparklinePoint];

        // F1: merge assumptions. A IA emite premissas novas; preservamos
        // state ("verified"/"false") que o médico setou em premissas equivalentes.
        const prevAssumptionByText = new Map(
          (prev?.assumptions ?? []).map((a) => [a.text.toLowerCase().trim(), a])
        );
        const mergedAssumptions = ai.assumptions
          ? ai.assumptions.map((aa, i) => {
              const existing = prevAssumptionByText.get(
                aa.text.toLowerCase().trim()
              );
              return {
                id: existing?.id ?? `a-${ai.icd10}-${i}-${Date.now()}`,
                text: aa.text,
                state: (existing?.state ?? "assumed") as AssumptionState,
                source: aa.source ?? existing?.source,
              };
            })
          : prev?.assumptions;

        return {
          id: prev?.id ?? `h-ai-${idx}-${Date.now()}`,
          label: ai.label,
          icd10: ai.icd10,
          confidence: to,
          status: ai.status,
          delta,
          trigger: ai.rationale,
          rationale: ai.rationale,
          sparkline,
          citations:
            ai.citations && ai.citations.length > 0
              ? ai.citations
              : prev?.citations,
          assumptions: mergedAssumptions,
        };
      });

      let newTranscript = s.transcript;

      if (analysis.speakerAssignments && analysis.speakerAssignments.length > 0) {
        const assignMap = new Map(
          analysis.speakerAssignments.map((a) => [a.messageId, a.speaker])
        );
        newTranscript = newTranscript.map((item) => {
          if (item.kind !== "message" || !item.autoLabeled) return item;
          const assigned = assignMap.get(item.id);
          if (!assigned) return item;
          return { ...item, speaker: assigned, autoLabeled: false };
        });
      }

      if (shifts.length > 0) {
        newTranscript = [
          ...newTranscript,
          {
            kind: "shift",
            id: `s-ai-${Date.now()}`,
            timestampSec: nextTimestamp(newTranscript, 3),
            shifts,
          },
        ];
      }

      const newNextQuestion: NextQuestionSuggestion | null = analysis.nextQuestion
        ? { id: `q-${Date.now()}`, ...analysis.nextQuestion }
        : null;

      const hasAnySoapText =
        analysis.soapSections &&
        (analysis.soapSections.subjective ||
          analysis.soapSections.objective ||
          analysis.soapSections.assessment ||
          analysis.soapSections.plan);

      const incomingRecs: ExamRecommendation[] = (
        analysis.examRecommendations ?? []
      ).map((r, i) => ({
        id: `${r.panelId ?? r.panelName.toLowerCase().replace(/\s+/g, "-")}-${r.linkedIcd10 ?? "_"}-${i}`,
        panelId: r.panelId,
        panelName: r.panelName,
        priority: r.priority,
        rationale: r.rationale,
        linkedIcd10: r.linkedIcd10,
        guidelineRef: r.guidelineRef,
      }));

      const existingIds = new Set(s.examRecommendations.map((r) => r.id));
      const alreadyOrderedPanelIds = new Set(
        s.exams.map((e) => e.panelId).filter(Boolean)
      );
      const newRecs = incomingRecs.filter(
        (r) =>
          !s.dismissedRecommendationKeys.includes(r.id) &&
          !existingIds.has(r.id) &&
          (!r.panelId || !alreadyOrderedPanelIds.has(r.panelId))
      );

      return {
        hypotheses: newHypotheses,
        transcript: newTranscript,
        nextQuestion: newNextQuestion,
        soapSections: hasAnySoapText ? analysis.soapSections : s.soapSections,
        examRecommendations:
          incomingRecs.length > 0
            ? [...s.examRecommendations, ...newRecs]
            : s.examRecommendations,
      };
    }),

  addMessage: (input) =>
    set((s) => ({
      transcript: [
        ...s.transcript,
        { kind: "message", id: `m-${Date.now()}`, ...input },
      ],
    })),

  checkItem: (itemId, result) =>
    set((s) => {
      const item = s.checklist.find((i) => i.id === itemId);
      if (!item || item.status === "checked") return s;

      const newChecklist = s.checklist.map((i) =>
        i.id === itemId ? { ...i, status: "checked" as const, result } : i
      );

      const trigger = result
        ? `${item.label} = ${result}${item.resultUnit ? ` ${item.resultUnit}` : ""}`
        : item.label;

      const shifts: HypothesisShift[] = [];
      const newHypotheses = s.hypotheses.map((h) => {
        const imp = item.impacts.find((i) => i.icd10 === h.icd10);
        if (!imp) return h;

        const from = h.confidence;
        const delta = bayesianDelta(from, imp.lrPositive);
        const to = clamp(from + delta);
        if (to === from) return h;

        shifts.push({
          icd10: h.icd10,
          hypothesisLabel: imp.hypothesisLabel,
          from,
          to,
          rationale: `Resultado de "${trigger}" atualizou ${imp.hypothesisLabel} via razão de verossimilhança.`,
        });

        return {
          ...h,
          confidence: to,
          delta: to - from,
          trigger,
          sparkline: [...h.sparkline, { value: to, label: trigger }],
        };
      });

      let newTranscript = s.transcript;
      if (shifts.length > 0) {
        newTranscript = [
          ...s.transcript,
          {
            kind: "shift",
            id: `s-${Date.now()}`,
            timestampSec: nextTimestamp(s.transcript, 5),
            shifts,
          },
        ];
      }

      return {
        checklist: newChecklist,
        hypotheses: newHypotheses,
        transcript: newTranscript,
      };
    }),

  dismissNextQuestion: () =>
    set((s) => ({ dismissedNextQuestionId: s.nextQuestion?.id ?? null })),

  useNextQuestion: () =>
    set((s) => {
      if (!s.nextQuestion) return s;
      return {
        transcript: [
          ...s.transcript,
          {
            kind: "message",
            id: `m-${Date.now()}`,
            speaker: "doctor",
            text: s.nextQuestion.question,
            timestampSec: nextTimestamp(s.transcript, 8),
          },
        ],
        dismissedNextQuestionId: s.nextQuestion.id,
      };
    }),

  toggleMessageSpeaker: (messageId) =>
    set((s) => ({
      transcript: s.transcript.map((item) => {
        if (item.kind !== "message" || item.id !== messageId) return item;
        return {
          ...item,
          speaker: item.speaker === "doctor" ? "patient" : "doctor",
          autoLabeled: false,
        };
      }),
    })),

  setAssumptionState: (icd10, assumptionId, newState) =>
    set((s) => ({
      hypotheses: s.hypotheses.map((h) => {
        if (h.icd10 !== icd10 || !h.assumptions) return h;
        return {
          ...h,
          assumptions: h.assumptions.map((a) =>
            a.id === assumptionId ? { ...a, state: newState } : a
          ),
        };
      }),
    })),

  toasts: [],
  pushToast: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...t, id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ],
    })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
