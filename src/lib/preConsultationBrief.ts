import Anthropic from "@anthropic-ai/sdk";
import { formatGuidelineLibrary } from "@/data/guidelines";

/**
 * M2 — Pre-Consultation Brief
 * Antes do paciente entrar, médico cola documentos (exames, histórico,
 * nota da recepção) e a IA gera um brief estruturado em segundos.
 */

export interface PreBriefInput {
  patientName: string;
  patientAge?: number;
  patientSex?: "F" | "M";
  rawNotes: string; // Tudo que o médico colou
}

export interface PreBriefOutput {
  summary: string; // 2-3 frases
  suspectedHypotheses: Array<{
    label: string;
    icd10?: string;
    rationale: string;
  }>;
  historicalRedFlags: string[];
  keyQuestions: string[];
  reconcileMedications: string[];
  raw: string; // markdown completo
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

export function isBriefConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const BRIEF_SYSTEM = `Você é um assistente clínico brasileiro. O médico vai iniciar uma consulta e colou notas prévias, resultados de exames recentes, prontuário anterior, etc. Sua tarefa: gerar um BRIEF estruturado pra preparar o médico em 30 segundos.

BIBLIOTECA DE GUIDELINES DISPONÍVEIS:

${formatGuidelineLibrary()}

Use CID-10 correto nas hipóteses quando possível.

Seja conservador — NÃO invente sinais/dados que não estão nas notas. Se o médico só colou pouca coisa, o brief será curto.

SEMPRE chame a ferramenta pre_brief com o output estruturado.`;

const BRIEF_TOOL: Anthropic.Tool = {
  name: "pre_brief",
  description: "Gera o brief pré-consulta estruturado",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "2-3 frases. Resumo do paciente + histórico imediato + por que está vindo hoje. Ex: 'Maria Silva, 58a, hipertensa em uso de Losartana. Consultou há 2 meses por cefaleia frontal. Hoje vem com queixa de aumento da dor + formigamento.'",
      },
      suspectedHypotheses: {
        type: "array",
        description:
          "1-3 hipóteses que a IA levanta com base nas notas antes mesmo da consulta começar. Cada uma com CID-10 e rationale breve.",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            icd10: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["label", "rationale"],
        },
      },
      historicalRedFlags: {
        type: "array",
        description:
          "Red flags já presentes nos dados prévios (ex: 'TEP há 6 meses', 'história de AVC'). Array vazio se não há.",
        items: { type: "string" },
      },
      keyQuestions: {
        type: "array",
        description:
          "3-5 perguntas críticas que o médico deve fazer logo de início pra direcionar a consulta. Curtas e diretas.",
        items: { type: "string" },
      },
      reconcileMedications: {
        type: "array",
        description:
          "Medicações a reconciliar (em uso, suspensas, a confirmar). Array vazio se não há dado suficiente.",
        items: { type: "string" },
      },
    },
    required: [
      "summary",
      "suspectedHypotheses",
      "historicalRedFlags",
      "keyQuestions",
      "reconcileMedications",
    ],
  },
};

export async function generatePreBrief(
  input: PreBriefInput
): Promise<PreBriefOutput> {
  const userContent = `Paciente: ${input.patientName}${input.patientAge ? `, ${input.patientAge} anos` : ""}${input.patientSex ? `, ${input.patientSex === "F" ? "feminino" : "masculino"}` : ""}

NOTAS PRÉVIAS COLADAS PELO MÉDICO:

${input.rawNotes.trim() || "(nenhuma nota colada — gere brief mínimo)"}

Gere o brief estruturado agora.`;

  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: BRIEF_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [BRIEF_TOOL],
    tool_choice: { type: "tool", name: "pre_brief" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("Resposta sem tool_use");

  const data = toolUse.input as Omit<PreBriefOutput, "raw">;

  // Build markdown summary
  const lines: string[] = [];
  lines.push(`## Brief pré-consulta`);
  lines.push("");
  lines.push(data.summary);
  lines.push("");

  if (data.suspectedHypotheses.length > 0) {
    lines.push("### Hipóteses possíveis");
    data.suspectedHypotheses.forEach((h) => {
      lines.push(
        `- **${h.label}**${h.icd10 ? ` (${h.icd10})` : ""} — ${h.rationale}`
      );
    });
    lines.push("");
  }

  if (data.historicalRedFlags.length > 0) {
    lines.push("### Red flags históricas");
    data.historicalRedFlags.forEach((r) => lines.push(`- ⚠ ${r}`));
    lines.push("");
  }

  if (data.keyQuestions.length > 0) {
    lines.push("### Perguntas-chave");
    data.keyQuestions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("");
  }

  if (data.reconcileMedications.length > 0) {
    lines.push("### Medicações a reconciliar");
    data.reconcileMedications.forEach((m) => lines.push(`- ${m}`));
  }

  return { ...data, raw: lines.join("\n") };
}
