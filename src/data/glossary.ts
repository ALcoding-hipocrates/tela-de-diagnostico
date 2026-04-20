export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const glossary: GlossaryTerm[] = [
  {
    term: "LR+ (Likelihood Ratio Positive)",
    definition:
      "Razão de verossimilhança positiva. Quantas vezes mais provável que uma descoberta ocorra em pacientes COM a condição do que em pacientes sem. LR+ > 10 muda substancialmente a probabilidade; LR+ entre 2-5 é moderado.",
  },
  {
    term: "LR− (Likelihood Ratio Negative)",
    definition:
      "Razão de verossimilhança negativa. Quantas vezes mais provável uma descoberta estar AUSENTE em pacientes com a condição. LR− < 0,1 reduz substancialmente a probabilidade.",
  },
  {
    term: "Probabilidade pré-teste (prior)",
    definition:
      "Probabilidade estimada da hipótese antes de considerar uma nova descoberta. É a prevalência baseada nos dados já conhecidos do caso.",
  },
  {
    term: "Probabilidade pós-teste (posterior)",
    definition:
      "Probabilidade atualizada após aplicar uma nova descoberta via teorema de Bayes. Calculada como prior × LR (em odds), convertido de volta pra probabilidade.",
  },
  {
    term: "Odds",
    definition:
      "Razão entre probabilidade do evento e probabilidade do não-evento (p / 1-p). Matemática bayesiana opera em odds pra facilitar multiplicação.",
  },
  {
    term: "CID-10",
    definition:
      "Classificação Internacional de Doenças, 10ª revisão (OMS). Código alfanumérico padronizado usado em prontuários e faturamento no Brasil.",
  },
  {
    term: "Red flag",
    definition:
      "Sinal ou sintoma clínico que indica condição grave, exigindo investigação imediata. Ex: formigamento unilateral (AVC), dor torácica com irradiação (SCA).",
  },
  {
    term: "Sensibilidade",
    definition:
      "Probabilidade de um teste dar positivo em quem TEM a condição (verdadeiros positivos / todos com a condição).",
  },
  {
    term: "Especificidade",
    definition:
      "Probabilidade de um teste dar negativo em quem NÃO tem a condição (verdadeiros negativos / todos sem a condição).",
  },
  {
    term: "TUSS",
    definition:
      "Terminologia Unificada em Saúde Suplementar (ANS). Códigos obrigatórios pra faturamento de procedimentos em planos de saúde brasileiros.",
  },
];
