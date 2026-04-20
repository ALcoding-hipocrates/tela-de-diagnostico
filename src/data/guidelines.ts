export type GuidelineSource =
  | "SBC"
  | "ABN"
  | "SBEM"
  | "ESC"
  | "AHA"
  | "NICE"
  | "SBD"
  | "SBPT"
  | "ABP"
  | "FEBRASGO"
  | "SBIM";

export interface Guideline {
  id: string;
  source: GuidelineSource;
  year: number;
  section: string;
  title: string;
  conditions: string[];
  excerpt: string;
  authority: "diretriz" | "consenso" | "recomendação";
}

export const guidelines: Guideline[] = [
  {
    id: "sbc-has-2020-crise",
    source: "SBC",
    year: 2020,
    section: "§8",
    title: "Crise hipertensiva — estratificação",
    conditions: ["I10", "Crise HAS", "hipertensão"],
    excerpt:
      "Crise hipertensiva caracteriza-se por PA ≥ 180/120 mmHg. Urgência: sem lesão aguda de órgão-alvo. Emergência: com lesão aguda (AVC, IAM, dissecção, EAP). LR+ ≈ 2,8 para crise HAS em PA ≥ 180/110.",
    authority: "diretriz",
  },
  {
    id: "sbc-has-2020-afericao",
    source: "SBC",
    year: 2020,
    section: "§6",
    title: "Aferição de PA e investigação de órgão-alvo",
    conditions: ["I10", "hipertensão"],
    excerpt:
      "Aferir PA em 3 posições (deitado, sentado, em pé) se tontura postural. Investigar lesão de órgão-alvo: fundo de olho, ECG, creatinina, proteinúria.",
    authority: "diretriz",
  },
  {
    id: "sbc-has-2020-fo",
    source: "SBC",
    year: 2020,
    section: "§8",
    title: "Hipertensão maligna — fundo de olho",
    conditions: ["I10", "I67.4", "hipertensão maligna"],
    excerpt:
      "Retinopatia hipertensiva graus III-IV (hemorragias, exsudatos, papiledema) confirma hipertensão maligna. LR+ ≈ 12 quando papiledema presente.",
    authority: "diretriz",
  },
  {
    id: "sbc-sca-2021",
    source: "SBC",
    year: 2021,
    section: "§2",
    title: "Síndrome coronariana aguda — abordagem inicial",
    conditions: ["I21", "SCA", "dor torácica"],
    excerpt:
      "Em dor torácica com irradiação para braço/mandíbula/epigástrio, ECG 12 derivações em ≤10 min + troponina seriada. Escalas TIMI e GRACE estratificam risco.",
    authority: "diretriz",
  },
  {
    id: "sbc-aorta-2020",
    source: "SBC",
    year: 2020,
    section: "§3",
    title: "Dissecção aórtica — red flags",
    conditions: ["I71", "dissecção"],
    excerpt:
      "Dor torácica súbita intensa + diferença de PA entre braços > 20 mmHg + assimetria de pulsos sugere dissecção. Angio-TC imediata. LR+ ≈ 7 quando assimetria presente.",
    authority: "diretriz",
  },
  {
    id: "aha-stroke-2019",
    source: "AHA",
    year: 2019,
    section: "§3.4",
    title: "AVC agudo — avaliação",
    conditions: ["I63", "AVC", "formigamento", "parestesia"],
    excerpt:
      "Parestesia unilateral aguda é sinal focal neurológico. NIHSS + TC sem contraste em < 25 min. Janela tPA: 4,5h do início. Trombectomia: até 24h em casos selecionados.",
    authority: "diretriz",
  },
  {
    id: "abn-avc-2019",
    source: "ABN",
    year: 2019,
    section: "§5",
    title: "AVC — critérios de ativação",
    conditions: ["I63", "AVC"],
    excerpt:
      "Suspeita de AVC com déficit focal súbito ativa código AVC. Escala de Cincinnati (FAST) no pré-hospitalar. Em emergência, NIHSS completa.",
    authority: "diretriz",
  },
  {
    id: "sbem-hipoglicemia-2019",
    source: "SBEM",
    year: 2019,
    section: "§4",
    title: "Hipoglicemia — limiares clínicos",
    conditions: ["E16.2", "hipoglicemia"],
    excerpt:
      "Glicemia < 70 mg/dL define hipoglicemia em diabéticos; < 54 mg/dL é clinicamente significativa; < 40 mg/dL com sintomas autonômicos/neuroglicopênicos. LR+ ≈ 15 para hipoglicemia sintomática.",
    authority: "diretriz",
  },
  {
    id: "nice-headache-2021",
    source: "NICE",
    year: 2021,
    section: "CG150",
    title: "Cefaleia — red flags",
    conditions: ["G43", "G44", "cefaleia", "enxaqueca"],
    excerpt:
      "Red flags: cefaleia súbita intensa (thunderclap), cefaleia com sinais focais, piora progressiva, > 50 anos início recente. Excluir HSA com TC; se TC normal + alta suspeita, punção lombar.",
    authority: "recomendação",
  },
  {
    id: "aha-cea-2022",
    source: "AHA",
    year: 2022,
    section: "§7",
    title: "Cefaleia em emergência — triagem",
    conditions: ["G44", "R51", "cefaleia"],
    excerpt:
      "Em cefaleia aguda intensa, investigar HSA (thunderclap), meningite (febre + rigidez nucal), hipertensão grave e carotidínea. TC sem contraste é primeiro exame.",
    authority: "consenso",
  },
  {
    id: "esc-af-2023",
    source: "ESC",
    year: 2023,
    section: "§6",
    title: "Fibrilação atrial aguda",
    conditions: ["I48", "fibrilação"],
    excerpt:
      "FA aguda instável: cardioversão elétrica urgente. Estável: controle de frequência (beta-bloqueador ou BCC não di-hidropiridínico) + anticoagulação por CHA₂DS₂-VASc.",
    authority: "diretriz",
  },
  {
    id: "sbd-cad-2023",
    source: "SBD",
    year: 2023,
    section: "§7",
    title: "Cetoacidose diabética — critérios e manejo",
    conditions: ["E10.1", "E11.1", "cetoacidose", "CAD"],
    excerpt:
      "Tríade: glicemia > 250 mg/dL + pH < 7,3 ou HCO₃⁻ < 15 + cetonemia/cetonúria. Reposição volêmica com SF 0,9% + insulinoterapia EV + correção de K+. Identificar e tratar fator precipitante.",
    authority: "diretriz",
  },
  {
    id: "sbpt-asma-2020",
    source: "SBPT",
    year: 2020,
    section: "§4",
    title: "Exacerbação aguda de asma",
    conditions: ["J45", "asma"],
    excerpt:
      "Estratificar gravidade por PFE, SpO2 e dispneia. Leve/moderada: beta2-agonista inalatório + corticoide VO. Grave: oxigênio + nebulização contínua + corticoide EV + considerar sulfato de magnésio.",
    authority: "diretriz",
  },
  {
    id: "sbpt-dpoc-2021",
    source: "SBPT",
    year: 2021,
    section: "§5",
    title: "Exacerbação de DPOC",
    conditions: ["J44", "DPOC"],
    excerpt:
      "Critérios de Anthonisen: aumento de dispneia + volume de expectoração + purulência. Antibioticoterapia se 2+ critérios ou expectoração purulenta. Corticoide sistêmico por 5 dias.",
    authority: "diretriz",
  },
  {
    id: "sbpt-pneumonia-2018",
    source: "SBPT",
    year: 2018,
    section: "§3",
    title: "Pneumonia comunitária — estratificação",
    conditions: ["J18", "pneumonia"],
    excerpt:
      "Escore CURB-65 (Confusão, Ureia >50 mg/dL, FR ≥30, PAS <90 ou PAD ≤60, ≥65 anos). 0-1: ambulatorial. 2: internação curta. ≥3: considerar UTI.",
    authority: "diretriz",
  },
  {
    id: "sbim-anafilaxia-2021",
    source: "SBIM",
    year: 2021,
    section: "§2",
    title: "Anafilaxia — reconhecimento e tratamento",
    conditions: ["T78.2", "anafilaxia", "choque anafilático"],
    excerpt:
      "Envolvimento de ≥2 sistemas (cutâneo, respiratório, cardiovascular, gastrointestinal) após exposição a alérgeno provável. Adrenalina IM 0,3-0,5 mg (1:1000) na face anterolateral da coxa é 1ª linha.",
    authority: "diretriz",
  },
  {
    id: "abp-depressao-2022",
    source: "ABP",
    year: 2022,
    section: "§3",
    title: "Episódio depressivo maior — critérios diagnósticos",
    conditions: ["F32", "F33", "depressão"],
    excerpt:
      "DSM-5/CID-11: ≥5 sintomas por ≥2 semanas (humor deprimido OU anedonia obrigatório). PHQ-9 para rastreio: ≥10 sensibilidade alta. Avaliar risco de suicídio em TODOS os pacientes.",
    authority: "recomendação",
  },
  {
    id: "abp-suicidio-2021",
    source: "ABP",
    year: 2021,
    section: "§6",
    title: "Avaliação de risco de suicídio",
    conditions: ["X60-X84", "suicídio", "ideação suicida"],
    excerpt:
      "Investigar ideação, plano, intenção e meio. Fatores de risco: tentativa prévia, desesperança, isolamento, acesso a meios letais, dor física/psíquica intensa. Alto risco: internação involuntária se recusa.",
    authority: "recomendação",
  },
  {
    id: "sbc-tsv-2019",
    source: "SBC",
    year: 2019,
    section: "§4",
    title: "Taquicardia supraventricular — abordagem",
    conditions: ["I47.1", "taquicardia"],
    excerpt:
      "Instabilidade (hipotensão, IC, angina, alteração consciência): cardioversão elétrica sincronizada. Estável com QRS estreito: manobras vagais → adenosina 6 mg EV bolus rápido → 12 mg se refratário.",
    authority: "diretriz",
  },
  {
    id: "febrasgo-eclampsia-2020",
    source: "FEBRASGO",
    year: 2020,
    section: "§5",
    title: "Pré-eclâmpsia / eclâmpsia",
    conditions: ["O14", "O15", "pré-eclâmpsia", "eclâmpsia"],
    excerpt:
      "PA ≥140/90 após 20 sem + proteinúria OU sinais graves (PA ≥160/110, plaquetopenia, alteração hepática/renal, edema pulmonar, sintomas visuais). Sulfato de Mg EV é 1ª escolha para profilaxia/tratamento de convulsão.",
    authority: "diretriz",
  },
];

export function getGuidelineById(id: string): Guideline | undefined {
  return guidelines.find((g) => g.id === id);
}

export function formatGuidelineHeader(g: Guideline): string {
  return `${g.source} ${g.year} · ${g.section}`;
}

export function formatGuidelineLibrary(): string {
  return guidelines
    .map(
      (g) =>
        `[${g.id}]\n${g.source} ${g.year} · ${g.authority} · ${g.section} — ${g.title}\n> ${g.excerpt}`
    )
    .join("\n\n");
}
