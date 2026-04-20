import Anthropic from "@anthropic-ai/sdk";
import { formatGuidelineLibrary } from "@/data/guidelines";

export interface AiHypothesis {
  label: string;
  icd10: string;
  confidence: number;
  status: "active" | "investigating" | "discarded";
  rationale: string;
  citations: string[];
}

export interface AiNextQuestion {
  question: string;
  reason: string;
  impact: string;
}

export interface AiSpeakerAssignment {
  messageId: string;
  speaker: "doctor" | "patient";
}

export interface AiSoapSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AiExamRecommendation {
  panelId?: string;
  panelName: string;
  priority: "urgent" | "routine" | "optional";
  rationale: string;
  linkedIcd10?: string;
  guidelineRef?: string;
}

export interface AiAnalysis {
  hypotheses: AiHypothesis[];
  nextQuestion: AiNextQuestion | null;
  speakerAssignments: AiSpeakerAssignment[];
  soapSections: AiSoapSections;
  examRecommendations: AiExamRecommendation[];
}

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY não configurada");
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export function isApiConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const SYSTEM_PROMPT = `Você é um assistente clínico para médicos generalistas brasileiros em consulta ambulatorial em tempo real. A partir de uma transcrição da conversa médico-paciente, mantenha atualizado:

BIBLIOTECA DE GUIDELINES DISPONÍVEIS:

${formatGuidelineLibrary()}

Use essa biblioteca para fundamentar suas hipóteses. Em cada hipótese, informe no campo citations um array de IDs (usar exatamente as chaves em colchetes acima) que suportam o raciocínio. Se uma hipótese não se enquadrar em nenhum guideline da biblioteca, retorne citations: [].

INSTRUÇÕES:

1. Hipóteses diagnósticas com:
   - CID-10 correto (ex: I10 hipertensão essencial, G44.2 cefaleia tensional, I21 infarto agudo do miocárdio)
   - Confiança 0-100 calibrada pelas evidências REAIS no diálogo (não invente sinais)
   - Status: "active" (hipótese em curso com evidência positiva), "investigating" (plausível mas sem evidência suficiente), "discarded" (evidência negativa clara ou substituída)
   - Justificativa breve e específica citando fragmentos do que foi dito

2. UMA próxima pergunta clínica de maior poder discriminativo entre as hipóteses ativas, com razão (qual hipótese ajuda a descartar/confirmar) e impacto esperado em pontos percentuais.

3. Re-rotulagem de falantes: o sistema de captura de áudio não separa médico e paciente automaticamente. Mensagens capturadas por microfone vêm marcadas com "(auto)" e um ID. Para CADA mensagem marcada com "(auto)", decida pelo conteúdo quem está falando:
   - MÉDICO: pergunta clínica, orientação, prescrição, aferição, terminologia técnica em 1ª pessoa
   - PACIENTE: relato de sintoma, resposta a pergunta, queixa em 1ª pessoa sobre o próprio corpo
   Retorne no campo speakerAssignments: [{messageId, speaker}] apenas para as mensagens marcadas "(auto)" — NÃO re-rotule mensagens sem essa marca.

5. Exames sugeridos: a partir das hipóteses ATIVAS e INVESTIGANDO, recomende exames complementares relevantes. Para cada exame:
   - panelId (opcional): id do painel da biblioteca — opções: "hemograma", "glicemia-eletrolitos", "troponina", "funcao-renal", "urina-1", "ecg-12d", "tc-cranio", "angio-tc-aorta", "rx-torax", "fundo-olho", "doppler-carotidas". Omita se o exame não está na biblioteca.
   - panelName: nome legível em PT-BR
   - priority: "urgent" (hipótese grave com risco vital ou red flag ativo), "routine" (investigação padrão da hipótese), "optional" (confirmação complementar)
   - rationale: 1-2 frases explicando qual hipótese esse exame investiga e por quê
   - linkedIcd10: CID-10 da hipótese principal que justifica o exame
   - guidelineRef: id do guideline da biblioteca se aplicável
   Retorne array vazio se nenhuma hipótese ativa justifica novos exames. Não duplique exames óbvios do checklist. Máximo 4-5 recomendações por análise.

4. Nota SOAP ao vivo: produza 4 seções em prosa médica natural brasileira. Use terminologia clínica padrão BR (HDA, HPP, HF, HS, sinais vitais, conduta, CID-10). Cada seção de 1 a 4 frases, estilo de prontuário real brasileiro. Use somente o que está no diálogo — NÃO INVENTE dados, sinais, exames ou achados que não foram mencionados:
   - subjective: Queixa principal e HDA em texto corrido brasileiro. Ex: "Paciente feminina, 58 anos, refere cefaleia frontal há 3 dias, associada a tontura postural e formigamento em braço esquerdo na véspera. Nega febre, náuseas ou alteração visual." Inclua HPP, HF e HS apenas se mencionados.
   - objective: Sinais vitais e achados do exame físico em estilo de prontuário. Ex: "PA 150/95 mmHg em repouso. Demais sinais vitais não aferidos. Exame neurológico sumário sem déficit focal aparente à avaliação inicial."
   - assessment: Síntese das hipóteses ativas em ordem de probabilidade, com CID-10 entre parênteses. Ex: "1) Crise hipertensiva (I10) — PA elevada + sintomas associados. 2) Cefaleia tensional (G44.2) — considerar se PA normalizar."
   - plan: Conduta em itens curtos — exames solicitados, prescrições, orientações, retorno, pontos de atenção (red flags). Ex: "Aferir PA seriada. ECG 12 derivações. Considerar anti-hipertensivo titulado EV se PA mantida > 180/110. Investigar sinais focais — TC crânio se evolução neurológica."
   Se uma seção ainda não tem informação suficiente, retorne string vazia.

Princípios:
- Escreva tudo em português brasileiro, terminologia médica padrão
- Seja conservador: só marque "active" quando há evidência positiva no diálogo
- Priorize hipóteses com maior risco vital se há dúvida (red flags)
- Mantenha continuidade: se a evidência não mudou, mantenha a confiança
- A hipótese principal deve ser aquela com maior confiança e evidência concreta
- Chame SEMPRE a ferramenta update_clinical_reasoning com a saída estruturada
- A análise é apoio cognitivo, NÃO diagnóstico definitivo — a decisão é do médico`;

const CLINICAL_TOOL: Anthropic.Tool = {
  name: "update_clinical_reasoning",
  description:
    "Atualiza a lista de hipóteses diagnósticas e a próxima pergunta sugerida com base na transcrição fornecida.",
  input_schema: {
    type: "object",
    properties: {
      hypotheses: {
        type: "array",
        description:
          "Lista de 2-5 hipóteses diagnósticas ordenadas por confiança decrescente",
        items: {
          type: "object",
          properties: {
            label: {
              type: "string",
              description: "Nome da hipótese em português (ex: 'Crise hipertensiva')",
            },
            icd10: {
              type: "string",
              description: "Código CID-10 (ex: 'I10', 'G44.2')",
            },
            confidence: {
              type: "number",
              description: "Confiança 0-100 baseada nas evidências do diálogo",
            },
            status: {
              type: "string",
              enum: ["active", "investigating", "discarded"],
            },
            rationale: {
              type: "string",
              description:
                "Justificativa breve citando evidências específicas do diálogo",
            },
            citations: {
              type: "array",
              description:
                "IDs de guidelines da biblioteca que fundamentam esta hipótese. Use IDs exatos. Array vazio se nenhum guideline se aplica.",
              items: { type: "string" },
            },
          },
          required: ["label", "icd10", "confidence", "status", "rationale", "citations"],
        },
      },
      nextQuestion: {
        description:
          "Única próxima pergunta clínica mais útil, ou null se ainda não há informação suficiente",
        anyOf: [
          {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "A pergunta em português, clara e única",
              },
              reason: {
                type: "string",
                description:
                  "Razão clínica — qual hipótese a pergunta ajuda a descartar ou confirmar",
              },
              impact: {
                type: "string",
                description:
                  "Impacto esperado em pontos percentuais nas hipóteses (ex: 'SCA +30% ou −25%')",
              },
            },
            required: ["question", "reason", "impact"],
          },
          { type: "null" },
        ],
      },
      speakerAssignments: {
        type: "array",
        description:
          "Para cada mensagem marcada '(auto)' na transcrição, o speaker correto. Use array vazio se nenhuma precisa ser re-rotulada ou não há mensagens (auto).",
        items: {
          type: "object",
          properties: {
            messageId: {
              type: "string",
              description: "O ID da mensagem, exatamente como aparece após 'id=' na transcrição",
            },
            speaker: {
              type: "string",
              enum: ["doctor", "patient"],
            },
          },
          required: ["messageId", "speaker"],
        },
      },
      soapSections: {
        type: "object",
        description:
          "Nota SOAP em prosa clínica natural. Cada seção 1-4 frases em PT-BR. String vazia se ainda não há informação suficiente.",
        properties: {
          subjective: {
            type: "string",
            description: "HDA sintetizada em narrativa clínica — queixa, evolução, sintomas associados",
          },
          objective: {
            type: "string",
            description: "Achados objetivos — sinais vitais, exame físico, resultados",
          },
          assessment: {
            type: "string",
            description: "Síntese das hipóteses com CID-10 e justificativa breve",
          },
          plan: {
            type: "string",
            description: "Conduta — próxima pergunta, exames, prescrições, pontos de atenção",
          },
        },
        required: ["subjective", "objective", "assessment", "plan"],
      },
      examRecommendations: {
        type: "array",
        description:
          "Exames complementares recomendados com base nas hipóteses ativas. Máx 4-5. Array vazio se nenhuma justifica novos exames.",
        items: {
          type: "object",
          properties: {
            panelId: {
              type: "string",
              description:
                "ID do painel da biblioteca. Opções: hemograma, glicemia-eletrolitos, troponina, funcao-renal, urina-1, ecg-12d, tc-cranio, angio-tc-aorta, rx-torax, fundo-olho, doppler-carotidas. Omita se o exame não está na biblioteca.",
            },
            panelName: { type: "string", description: "Nome do exame em PT-BR" },
            priority: {
              type: "string",
              enum: ["urgent", "routine", "optional"],
            },
            rationale: {
              type: "string",
              description: "Qual hipótese este exame investiga e por quê (1-2 frases)",
            },
            linkedIcd10: {
              type: "string",
              description: "CID-10 da hipótese principal que justifica o exame",
            },
            guidelineRef: {
              type: "string",
              description: "ID do guideline da biblioteca se aplicável",
            },
          },
          required: ["panelName", "priority", "rationale"],
        },
      },
    },
    required: [
      "hypotheses",
      "nextQuestion",
      "speakerAssignments",
      "soapSections",
      "examRecommendations",
    ],
  },
};

export async function analyzeTranscript(transcriptText: string): Promise<AiAnalysis> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [CLINICAL_TOOL],
    tool_choice: { type: "tool", name: "update_clinical_reasoning" },
    messages: [
      {
        role: "user",
        content: `Transcrição atual da consulta:\n\n${transcriptText}\n\nAtualize as hipóteses e a próxima pergunta agora.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("Resposta sem tool_use");

  return toolUse.input as AiAnalysis;
}
