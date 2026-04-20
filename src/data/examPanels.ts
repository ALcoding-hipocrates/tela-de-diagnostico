export interface ExamPanel {
  id: string;
  name: string;
  category: "laboratório" | "imagem" | "cardiológico" | "neurológico" | "oftalmológico";
  description?: string;
}

export const examPanels: ExamPanel[] = [
  {
    id: "hemograma",
    name: "Hemograma completo",
    category: "laboratório",
    description: "Série vermelha, branca e plaquetas",
  },
  {
    id: "glicemia-eletrolitos",
    name: "Glicemia + eletrólitos",
    category: "laboratório",
    description: "Na+, K+, Cl-, glicose",
  },
  {
    id: "troponina",
    name: "Troponina seriada",
    category: "laboratório",
    description: "Admissão + 3h + 6h",
  },
  {
    id: "funcao-renal",
    name: "Função renal",
    category: "laboratório",
    description: "Creatinina, ureia, TFG estimada",
  },
  {
    id: "urina-1",
    name: "Urina tipo 1",
    category: "laboratório",
  },
  {
    id: "ecg-12d",
    name: "ECG 12 derivações",
    category: "cardiológico",
    description: "≤ 10 min em dor torácica",
  },
  {
    id: "tc-cranio",
    name: "TC crânio sem contraste",
    category: "imagem",
    description: "Primeira linha em cefaleia súbita e suspeita de AVC",
  },
  {
    id: "angio-tc-aorta",
    name: "Angio-TC de aorta",
    category: "imagem",
    description: "Suspeita de dissecção aórtica",
  },
  {
    id: "rx-torax",
    name: "RX de tórax",
    category: "imagem",
  },
  {
    id: "fundo-olho",
    name: "Fundo de olho",
    category: "oftalmológico",
    description: "Retinopatia hipertensiva / papiledema",
  },
  {
    id: "doppler-carotidas",
    name: "Doppler de carótidas",
    category: "neurológico",
  },
];

export function getExamPanelById(id: string): ExamPanel | undefined {
  return examPanels.find((p) => p.id === id);
}
