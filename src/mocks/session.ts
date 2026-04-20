import type {
  Hypothesis,
  ChecklistItem,
  ExamRecommendation,
  NextQuestionSuggestion,
  RedFlag,
  TranscriptItem,
} from "@/types/session";

export interface MockPatient {
  name: string;
  initials: string;
  age: number;
  sex: "F" | "M";
  id: string;
  tags: Array<"pregnant" | "pediatric" | "elderly" | "renal-failure" | "hepatic-failure">;
}

export const mockPatient: MockPatient = {
  name: "Maria Silva",
  initials: "MS",
  age: 58,
  sex: "F",
  id: "PT-00128",
  tags: [],
};

export const mockHypotheses: Hypothesis[] = [
  {
    id: "h1",
    label: "Crise hipertensiva",
    icd10: "I10",
    confidence: 68,
    status: "active",
    delta: 20,
    trigger: "PA aferida 150/95",
    sparkline: [
      { value: 20, label: "início da consulta" },
      { value: 38, label: "paciente mencionou formigamento" },
      { value: 48, label: "tontura postural confirmada" },
      { value: 68, label: "PA aferida 150/95" },
    ],
    assumptions: [
      {
        id: "a-h1-1",
        text: "Paciente não gestante",
        state: "assumed",
        source: "sbc-has-2020-crise",
      },
      {
        id: "a-h1-2",
        text: "Sem uso crônico de AINE",
        state: "assumed",
      },
      {
        id: "a-h1-3",
        text: "Sem anticoncepcional de alta dose",
        state: "assumed",
      },
      {
        id: "a-h1-4",
        text: "Sem histórico familiar direto de HAS",
        state: "assumed",
      },
    ],
  },
  {
    id: "h2",
    label: "Cefaleia tensional",
    icd10: "G44.2",
    confidence: 22,
    status: "investigating",
    delta: -8,
    trigger: "sem tensão cervical palpável",
    sparkline: [
      { value: 30, label: "início" },
      { value: 30, label: "relato de cefaleia frontal" },
      { value: 22, label: "palpação cervical sem tensão" },
    ],
    assumptions: [
      {
        id: "a-h2-1",
        text: "Sem sinais neurológicos focais",
        state: "assumed",
        source: "abn-cefaleia-2022",
      },
      {
        id: "a-h2-2",
        text: "Cefaleia bilateral, não pulsátil",
        state: "verified",
      },
    ],
  },
  {
    id: "h3",
    label: "Enxaqueca",
    icd10: "G43",
    confidence: 8,
    status: "discarded",
    delta: -17,
    trigger: "sem aura, sem fotofobia",
    sparkline: [
      { value: 25, label: "início" },
      { value: 18, label: "sem fotofobia" },
      { value: 8, label: "sem aura visual" },
    ],
    assumptions: [
      {
        id: "a-h3-1",
        text: "Sem fotofobia",
        state: "verified",
      },
      {
        id: "a-h3-2",
        text: "Sem aura visual ou sensitiva",
        state: "verified",
      },
    ],
  },
];

export const mockChecklist: ChecklistItem[] = [
  {
    id: "c1",
    label: "PA em repouso",
    resultPlaceholder: "___/___",
    resultUnit: "mmHg",
    impacts: [
      { icd10: "I10", hypothesisLabel: "Crise HAS", lrPositive: 2.5, source: "sbc-has-2020-crise" },
      { icd10: "G44.2", hypothesisLabel: "Cefaleia", lrPositive: 0.6, source: "nice-headache-2021" },
    ],
    status: "checked",
    result: "150/95",
  },
  {
    id: "c2",
    label: "Glicemia capilar",
    resultPlaceholder: "___",
    resultUnit: "mg/dL",
    impacts: [
      { hypothesisLabel: "Hipoglicemia", lrPositive: 14, source: "sbem-hipoglicemia-2019" },
      { icd10: "I10", hypothesisLabel: "Crise HAS", lrPositive: 0.7 },
    ],
    status: "pending",
  },
  {
    id: "c3",
    label: "Pulsos periféricos simétricos",
    impacts: [
      { hypothesisLabel: "Dissecção aórtica", lrPositive: 0.2, source: "sbc-aorta-2020" },
      { icd10: "I10", hypothesisLabel: "Crise HAS", lrPositive: 1.2 },
    ],
    status: "pending",
  },
  {
    id: "c4",
    label: "Fundo de olho",
    impacts: [
      { icd10: "I10", hypothesisLabel: "Crise HAS", lrPositive: 1.8, source: "sbc-has-2020-fo" },
      { hypothesisLabel: "Hipertensão maligna", lrPositive: 12, source: "sbc-has-2020-fo" },
    ],
    status: "pending",
  },
  {
    id: "c5",
    label: "ECG 12 derivações",
    impacts: [
      { hypothesisLabel: "SCA", lrPositive: 0.3, source: "sbc-sca-2021" },
      { icd10: "I10", hypothesisLabel: "Crise HAS", lrPositive: 1.3 },
    ],
    status: "pending",
  },
];

export const mockExamRecommendations: ExamRecommendation[] = [
  {
    id: "tc-cranio-I10",
    panelId: "tc-cranio",
    panelName: "TC crânio sem contraste",
    priority: "urgent",
    rationale:
      "Paciente relatou formigamento unilateral — red flag para AVC. TC em ≤25min é padrão-ouro para triagem antes de considerar terapia.",
    linkedIcd10: "I10",
    guidelineRef: "aha-stroke-2019",
  },
  {
    id: "fundo-olho-I10",
    panelId: "fundo-olho",
    panelName: "Fundo de olho",
    priority: "routine",
    rationale:
      "Investigar retinopatia hipertensiva (graus III-IV, papiledema) para estratificar crise HAS e excluir hipertensão maligna.",
    linkedIcd10: "I10",
    guidelineRef: "sbc-has-2020-fo",
  },
  {
    id: "ecg-12d-I10",
    panelId: "ecg-12d",
    panelName: "ECG 12 derivações",
    priority: "routine",
    rationale:
      "Avaliar hipertrofia ventricular esquerda e excluir isquemia concomitante em paciente com PA elevada.",
    linkedIcd10: "I10",
    guidelineRef: "sbc-has-2020-afericao",
  },
  {
    id: "funcao-renal-I10",
    panelId: "funcao-renal",
    panelName: "Função renal",
    priority: "optional",
    rationale:
      "Lesão de órgão-alvo: creatinina, ureia e TFG estimada para estratificação da crise hipertensiva.",
    linkedIcd10: "I10",
    guidelineRef: "sbc-has-2020-afericao",
  },
];

export const mockNextQuestion: NextQuestionSuggestion = {
  id: "q1",
  kind: "nudge",
  question: "Idade da paciente confirmada?",
  reason:
    "Cefaleia + hipertensão após os 50 anos requer investigação diferente (afastar arterite temporal, tumor cerebral).",
  impact:
    "Sem a idade, não consigo afastar diagnósticos secundários críticos.",
  missingContext: {
    field: "Idade confirmada",
    severity: "critical",
    blocksHypothesisIcd10: "I67.4",
  },
};

export const mockRedFlags: RedFlag[] = [
  {
    id: "rf1",
    label: "Formigamento unilateral",
    severity: "high",
    meaning:
      "Parestesia unilateral aguda é sinal focal neurológico — investigar AVC isquêmico ou AIT.",
    conduct: [
      "Avaliar tempo de instalação (janela terapêutica)",
      "Escala NIHSS",
      "TC de crânio sem contraste",
    ],
    reference: "AHA/ASA Stroke Guidelines 2019 §3.4",
    triggerPhrases: ["formigamento", "parestesia", "dormência"],
  },
  {
    id: "rf2",
    label: "Tontura postural + HAS",
    severity: "medium",
    meaning:
      "Tontura ortostática em hipertenso pode indicar hipotensão postural secundária ou lesão de órgão-alvo.",
    conduct: [
      "Aferir PA em 3 posições",
      "Avaliar fundo de olho",
      "ECG",
    ],
    reference: "SBC Diretriz HAS 2020 §6",
    triggerPhrases: ["tontura postural", "tonto ao levantar"],
  },
  {
    id: "rf3",
    label: "Dor torácica irradiada",
    severity: "high",
    meaning:
      "Dor torácica com irradiação para braço, mandíbula ou epigástrio sugere SCA até prova em contrário.",
    conduct: [
      "ECG 12 derivações em até 10 min",
      "Troponina seriada",
      "Avaliar critérios TIMI/GRACE",
    ],
    reference: "Diretriz SBC SCA 2021 §2",
    triggerPhrases: ["dor no peito", "dor torácica", "aperto no peito"],
  },
];

export const mockTranscript: TranscriptItem[] = [
  {
    kind: "message",
    id: "m1",
    speaker: "doctor",
    text: "Bom dia, Maria. Como você está se sentindo hoje?",
    timestampSec: 5,
  },
  {
    kind: "message",
    id: "m2",
    speaker: "patient",
    text: "Doutora, faz uns 3 dias que estou com dor de cabeça forte e ontem senti formigamento no braço esquerdo.",
    timestampSec: 18,
    redFlags: [{ trigger: "formigamento", redFlagId: "rf1" }],
  },
  {
    kind: "shift",
    id: "s1",
    timestampSec: 20,
    shifts: [
      {
        icd10: "I10",
        hypothesisLabel: "Crise HAS",
        from: 20,
        to: 38,
        rationale: "Paciente mencionou formigamento unilateral — sinal focal neurológico que eleva suspeita de crise hipertensiva complicada.",
      },
    ],
  },
  {
    kind: "message",
    id: "m3",
    speaker: "doctor",
    text: "Entendi. E tontura, você sente? Aparece ao levantar?",
    timestampSec: 35,
  },
  {
    kind: "message",
    id: "m4",
    speaker: "patient",
    text: "Sim, quando levanto rápido da cama fico bem tonta.",
    timestampSec: 48,
  },
  {
    kind: "shift",
    id: "s2",
    timestampSec: 50,
    shifts: [
      {
        icd10: "I10",
        hypothesisLabel: "Crise HAS",
        from: 38,
        to: 48,
        rationale: "Tontura postural confirmada — compatível com hipertensão não controlada ou lesão de órgão-alvo.",
      },
    ],
  },
  {
    kind: "message",
    id: "m5",
    speaker: "doctor",
    text: "Vou aferir sua pressão agora.",
    timestampSec: 65,
  },
  {
    kind: "message",
    id: "m6",
    speaker: "doctor",
    text: "Sua pressão está 150 por 95.",
    timestampSec: 108,
  },
  {
    kind: "shift",
    id: "s3",
    timestampSec: 110,
    shifts: [
      {
        icd10: "I10",
        hypothesisLabel: "Crise HAS",
        from: 48,
        to: 68,
        rationale: "PA aferida 150/95 mmHg confirma elevação — principal marcador objetivo da crise hipertensiva.",
      },
      {
        icd10: "G44.2",
        hypothesisLabel: "Cefaleia",
        from: 30,
        to: 22,
        rationale: "Com PA elevada documentada, a cefaleia passa a ser melhor explicada pela hipertensão do que por etiologia tensional primária.",
      },
    ],
  },
];

export function getRedFlagById(id: string): RedFlag | undefined {
  return mockRedFlags.find((rf) => rf.id === id);
}
