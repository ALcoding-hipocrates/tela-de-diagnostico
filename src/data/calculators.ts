import type { ChecklistItem, Hypothesis } from "@/types/session";
import type { MockPatient } from "@/mocks/session";

export interface AutoFillContext {
  patient: Pick<MockPatient, "age" | "sex" | "tags">;
  hypotheses: Hypothesis[];
  checklist: ChecklistItem[];
}

export interface CalculatorField {
  id: string;
  label: string;
  hint?: string;
  points: number;
  autoFill?: (ctx: AutoFillContext) => boolean | undefined;
}

export type RiskColor = "safe" | "warn" | "danger";

export interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  color: RiskColor;
  action: string;
}

export interface Calculator {
  id: string;
  name: string;
  description: string;
  specialty: string;
  guidelineRef?: string;
  fields: CalculatorField[];
  ranges: CalculatorRange[];
}

const hasHypothesis = (icd10: string) => (ctx: AutoFillContext) =>
  ctx.hypotheses.some((h) => h.icd10 === icd10 && h.status !== "discarded");

export const calculators: Calculator[] = [
  {
    id: "cha2ds2-vasc",
    name: "CHA₂DS₂-VASc",
    description: "Risco de tromboembolismo em fibrilação atrial não-valvar",
    specialty: "Cardiologia",
    guidelineRef: "esc-af-2023",
    fields: [
      {
        id: "chf",
        label: "Insuficiência cardíaca / disfunção de VE",
        points: 1,
      },
      {
        id: "hta",
        label: "Hipertensão arterial",
        hint: "Auto-preenchido se Crise HAS ativa",
        points: 1,
        autoFill: hasHypothesis("I10"),
      },
      {
        id: "age75",
        label: "Idade ≥ 75 anos",
        points: 2,
        autoFill: (ctx) => ctx.patient.age >= 75,
      },
      { id: "dm", label: "Diabetes mellitus", points: 1 },
      { id: "stroke", label: "AVC / AIT / tromboembolismo prévio", points: 2 },
      {
        id: "vasc",
        label: "Doença vascular (IAM, DAC, DAP, placa aórtica)",
        points: 1,
      },
      {
        id: "age65",
        label: "Idade 65-74 anos",
        points: 1,
        autoFill: (ctx) => ctx.patient.age >= 65 && ctx.patient.age < 75,
      },
      {
        id: "sex",
        label: "Sexo feminino",
        points: 1,
        autoFill: (ctx) => ctx.patient.sex === "F",
      },
    ],
    ranges: [
      {
        min: 0,
        max: 0,
        label: "Muito baixo risco",
        color: "safe",
        action: "Sem anticoagulação",
      },
      {
        min: 1,
        max: 1,
        label: "Baixo risco",
        color: "warn",
        action: "Considerar anticoagulação (recomendada em homens)",
      },
      {
        min: 2,
        max: 9,
        label: "Risco elevado",
        color: "danger",
        action: "Anticoagulação oral recomendada (DOAC preferencial)",
      },
    ],
  },
  {
    id: "curb-65",
    name: "CURB-65",
    description: "Gravidade de pneumonia adquirida na comunidade",
    specialty: "Pneumologia / Emergência",
    guidelineRef: "sbpt-pneumonia-2018",
    fields: [
      {
        id: "confusion",
        label: "Confusão mental nova",
        hint: "AMTS ≤ 8 ou desorientação tempo/espaço/pessoa",
        points: 1,
      },
      { id: "urea", label: "Ureia > 50 mg/dL (ou 7 mmol/L)", points: 1 },
      { id: "rr", label: "Frequência respiratória ≥ 30 rpm", points: 1 },
      {
        id: "bp",
        label: "PA sistólica < 90 mmHg ou diastólica ≤ 60 mmHg",
        points: 1,
      },
      {
        id: "age",
        label: "Idade ≥ 65 anos",
        points: 1,
        autoFill: (ctx) => ctx.patient.age >= 65,
      },
    ],
    ranges: [
      {
        min: 0,
        max: 1,
        label: "Baixa gravidade",
        color: "safe",
        action: "Tratamento ambulatorial",
      },
      {
        min: 2,
        max: 2,
        label: "Gravidade intermediária",
        color: "warn",
        action: "Considerar internação hospitalar",
      },
      {
        min: 3,
        max: 5,
        label: "Gravidade alta",
        color: "danger",
        action: "Internação + avaliar UTI se ≥ 4",
      },
    ],
  },
  {
    id: "wells-tep",
    name: "Wells (TEP)",
    description: "Probabilidade pré-teste de tromboembolismo pulmonar",
    specialty: "Pneumologia / Emergência",
    fields: [
      {
        id: "dvt",
        label: "Sinais clínicos de TVP",
        hint: "Edema + dor à palpação da panturrilha",
        points: 3,
      },
      {
        id: "alt",
        label: "Diagnóstico alternativo menos provável que TEP",
        points: 3,
      },
      { id: "hr", label: "Frequência cardíaca > 100 bpm", points: 1 },
      {
        id: "immob",
        label: "Imobilização ≥ 3 dias ou cirurgia nas últimas 4 semanas",
        points: 1,
      },
      { id: "prev", label: "TEP ou TVP prévios", points: 1 },
      { id: "hemop", label: "Hemoptise", points: 1 },
      { id: "ca", label: "Câncer em tratamento nos últimos 6 meses", points: 1 },
    ],
    ranges: [
      {
        min: 0,
        max: 1,
        label: "Probabilidade baixa",
        color: "safe",
        action: "D-dímero — se negativo, TEP improvável",
      },
      {
        min: 2,
        max: 6,
        label: "Probabilidade intermediária",
        color: "warn",
        action: "Angio-TC de tórax",
      },
      {
        min: 7,
        max: 100,
        label: "Probabilidade alta",
        color: "danger",
        action: "Angio-TC imediata + considerar anticoagulação empírica",
      },
    ],
  },
  {
    id: "timi-nstemi",
    name: "TIMI (NSTE-ACS)",
    description: "Risco de eventos adversos em SCA sem supra-ST",
    specialty: "Cardiologia",
    guidelineRef: "sbc-sca-2021",
    fields: [
      {
        id: "age",
        label: "Idade ≥ 65 anos",
        points: 1,
        autoFill: (ctx) => ctx.patient.age >= 65,
      },
      {
        id: "risk",
        label: "≥ 3 fatores de risco para DAC",
        hint: "HAS, DM, dislipidemia, tabagismo, HF precoce",
        points: 1,
      },
      { id: "known", label: "Estenose coronariana conhecida ≥ 50%", points: 1 },
      {
        id: "aspirin",
        label: "Uso de AAS nos últimos 7 dias",
        points: 1,
      },
      { id: "angina", label: "≥ 2 episódios de angina nas últimas 24h", points: 1 },
      { id: "st", label: "Desvio de ST ≥ 0,5 mm", points: 1 },
      { id: "trop", label: "Elevação de biomarcadores (troponina/CK-MB)", points: 1 },
    ],
    ranges: [
      {
        min: 0,
        max: 2,
        label: "Risco baixo (≈ 4,7% a 8,3%)",
        color: "safe",
        action: "Conduta conservadora com AAS + clopidogrel + estatina",
      },
      {
        min: 3,
        max: 4,
        label: "Risco intermediário (≈ 13% a 19%)",
        color: "warn",
        action: "Estratégia invasiva em 24-72h",
      },
      {
        min: 5,
        max: 7,
        label: "Risco alto (≥ 26%)",
        color: "danger",
        action: "Cateterismo urgente (< 24h)",
      },
    ],
  },
  {
    id: "phq-9",
    name: "PHQ-9",
    description: "Rastreio de depressão nas últimas 2 semanas",
    specialty: "Psiquiatria / Atenção primária",
    guidelineRef: "abp-depressao-2022",
    fields: [
      { id: "q1", label: "Pouco interesse ou prazer em fazer as coisas", points: 3 },
      { id: "q2", label: "Sentir-se pra baixo, deprimido ou sem perspectiva", points: 3 },
      {
        id: "q3",
        label: "Dificuldade para dormir ou dormir demais",
        points: 3,
      },
      { id: "q4", label: "Sentir-se cansado ou com pouca energia", points: 3 },
      { id: "q5", label: "Falta de apetite ou comer demais", points: 3 },
      {
        id: "q6",
        label: "Sentir-se mal consigo mesmo ou culpado",
        points: 3,
      },
      { id: "q7", label: "Dificuldade para concentrar-se", points: 3 },
      {
        id: "q8",
        label: "Lentidão ou agitação psicomotora perceptível",
        points: 3,
      },
      {
        id: "q9",
        label: "Pensamentos de morte ou autoagressão",
        hint: "Qualquer resposta ≥ 1 ponto requer avaliação de risco de suicídio",
        points: 3,
      },
    ],
    ranges: [
      {
        min: 0,
        max: 4,
        label: "Sem depressão",
        color: "safe",
        action: "Rastreio negativo — reavaliar em 6-12 meses",
      },
      {
        min: 5,
        max: 9,
        label: "Depressão leve",
        color: "warn",
        action: "Monitorar — psicoterapia e reavaliação em 2-4 semanas",
      },
      {
        min: 10,
        max: 14,
        label: "Depressão moderada",
        color: "warn",
        action: "Psicoterapia + considerar antidepressivo",
      },
      {
        min: 15,
        max: 19,
        label: "Depressão moderadamente grave",
        color: "danger",
        action: "Antidepressivo + psicoterapia, seguimento próximo",
      },
      {
        min: 20,
        max: 27,
        label: "Depressão grave",
        color: "danger",
        action: "Tratamento imediato + considerar encaminhamento psiquiatria",
      },
    ],
  },
];

export function getCalculatorById(id: string): Calculator | undefined {
  return calculators.find((c) => c.id === id);
}

export function getRangeFor(calc: Calculator, score: number): CalculatorRange {
  return (
    calc.ranges.find((r) => score >= r.min && score <= r.max) ??
    calc.ranges[calc.ranges.length - 1]
  );
}

export function autofillFields(
  calc: Calculator,
  ctx: AutoFillContext
): { checked: Record<string, boolean>; autoFilled: Record<string, boolean> } {
  const checked: Record<string, boolean> = {};
  const autoFilled: Record<string, boolean> = {};
  for (const f of calc.fields) {
    if (!f.autoFill) continue;
    const v = f.autoFill(ctx);
    if (v === true) {
      checked[f.id] = true;
      autoFilled[f.id] = true;
    }
  }
  return { checked, autoFilled };
}
