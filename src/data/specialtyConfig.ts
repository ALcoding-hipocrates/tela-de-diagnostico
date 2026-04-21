/**
 * M6 — Modo Especialidade
 *
 * Mapeia cada especialidade a:
 *  - Guidelines prioritários (filtragem/ordenação)
 *  - Calculadoras relevantes
 *  - CID-10 shortcuts comuns
 *  - Red flags específicas
 *  - Tom do SOAP
 */

export type SpecialtyId =
  | "general"
  | "cardiology"
  | "neurology"
  | "pediatrics"
  | "psychiatry"
  | "emergency";

export interface SpecialtyConfig {
  id: SpecialtyId;
  label: string;
  shortLabel: string; // pra exibir em pill
  description: string;
  icon: "Stethoscope" | "HeartPulse" | "Brain" | "Baby" | "Smile" | "Siren";
  /** IDs de guidelines (de @/data/guidelines) priorizados. */
  priorityGuidelineIds: string[];
  /** IDs de calculadoras (de @/data/calculators) priorizadas. */
  priorityCalculatorIds: string[];
  /** CID-10 shortcuts comuns. */
  commonCids: Array<{ code: string; label: string }>;
  /** Red flags da especialidade (textos pra detecção). */
  specialtyRedFlags: string[];
}

export const specialties: SpecialtyConfig[] = [
  {
    id: "general",
    label: "Clínica Geral",
    shortLabel: "Geral",
    description: "Ambulatório de adultos — cefaleia, HAS, DM, respiratórias.",
    icon: "Stethoscope",
    priorityGuidelineIds: [
      "sbc-has-2020-crise",
      "sbd-dm-2023-hipoglicemia",
      "nice-headache-2021",
    ],
    priorityCalculatorIds: ["chads-vasc", "curb-65", "phq-9"],
    commonCids: [
      { code: "I10", label: "Hipertensão essencial" },
      { code: "E11", label: "Diabetes tipo 2" },
      { code: "J45", label: "Asma" },
      { code: "F41.1", label: "Ansiedade generalizada" },
      { code: "R51", label: "Cefaleia" },
    ],
    specialtyRedFlags: [],
  },
  {
    id: "cardiology",
    label: "Cardiologia",
    shortLabel: "Cardio",
    description: "Dor torácica, arritmia, IC, doença coronariana.",
    icon: "HeartPulse",
    priorityGuidelineIds: [
      "sbc-has-2020-crise",
      "sbc-sca-2021",
      "esc-af-2020",
      "sbc-aorta-2020",
    ],
    priorityCalculatorIds: ["chads-vasc", "timi", "wells-tep"],
    commonCids: [
      { code: "I21", label: "Infarto agudo do miocárdio" },
      { code: "I20", label: "Angina pectoris" },
      { code: "I48", label: "Fibrilação atrial" },
      { code: "I25", label: "Doença isquêmica crônica" },
      { code: "I71", label: "Aneurisma/dissecção aórtica" },
    ],
    specialtyRedFlags: [
      "dor torácica irradiando",
      "dispneia súbita",
      "síncope",
      "dor lancinante nas costas",
    ],
  },
  {
    id: "neurology",
    label: "Neurologia",
    shortLabel: "Neuro",
    description: "Cefaleia, AVC, epilepsia, sinais focais.",
    icon: "Brain",
    priorityGuidelineIds: [
      "abn-avc-2022",
      "abn-cefaleia-2022",
      "nice-headache-2021",
    ],
    priorityCalculatorIds: [],
    commonCids: [
      { code: "I63", label: "Infarto cerebral" },
      { code: "I64", label: "AVC não especificado" },
      { code: "G43", label: "Enxaqueca" },
      { code: "G44.2", label: "Cefaleia tensional" },
      { code: "G45", label: "AIT" },
    ],
    specialtyRedFlags: [
      "fraqueza súbita",
      "fala arrastada",
      "visão dupla súbita",
      "cefaleia pior da vida",
      "convulsão",
    ],
  },
  {
    id: "pediatrics",
    label: "Pediatria",
    shortLabel: "Ped",
    description: "Consulta de criança/adolescente.",
    icon: "Baby",
    priorityGuidelineIds: [],
    priorityCalculatorIds: [],
    commonCids: [
      { code: "J18", label: "Pneumonia" },
      { code: "J45", label: "Asma" },
      { code: "R51", label: "Cefaleia" },
    ],
    specialtyRedFlags: [
      "febre sem foco em lactente",
      "rigidez de nuca",
      "letargia",
      "recusa alimentar prolongada",
    ],
  },
  {
    id: "psychiatry",
    label: "Psiquiatria",
    shortLabel: "Psiq",
    description: "Depressão, ansiedade, transtornos do humor.",
    icon: "Smile",
    priorityGuidelineIds: ["abp-depressao-2021"],
    priorityCalculatorIds: ["phq-9"],
    commonCids: [
      { code: "F32", label: "Episódio depressivo" },
      { code: "F33", label: "Depressão recorrente" },
      { code: "F41.1", label: "Ansiedade generalizada" },
    ],
    specialtyRedFlags: [
      "ideação suicida",
      "plano de suicídio",
      "autolesão",
      "surto psicótico",
    ],
  },
  {
    id: "emergency",
    label: "Emergência",
    shortLabel: "PS",
    description: "Pronto-socorro — triagem, estabilização.",
    icon: "Siren",
    priorityGuidelineIds: [
      "sbc-sca-2021",
      "abn-avc-2022",
      "sbc-has-2020-crise",
      "sbpt-tep-2021",
    ],
    priorityCalculatorIds: ["timi", "wells-tep", "curb-65"],
    commonCids: [
      { code: "I21", label: "IAM" },
      { code: "I63", label: "AVC isquêmico" },
      { code: "R07", label: "Dor torácica" },
      { code: "R55", label: "Síncope" },
      { code: "T78.2", label: "Choque anafilático" },
    ],
    specialtyRedFlags: [
      "rebaixamento de consciência",
      "choque",
      "dispneia grave",
      "hemorragia ativa",
    ],
  },
];

export function getSpecialty(id: SpecialtyId): SpecialtyConfig {
  return specialties.find((s) => s.id === id) ?? specialties[0];
}
