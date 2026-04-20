import Anthropic from "@anthropic-ai/sdk";
import type { Hypothesis, TranscriptItem } from "@/types/session";
import { mockPatient } from "@/mocks/session";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY não configurada");
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export function isReasoningGeneratorConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const SYSTEM_PROMPT = `Você é um assistente médico que explica o raciocínio clínico da IA de forma didática para médicos e residentes brasileiros. Recebe uma hipótese diagnóstica com seu estado atual, histórico de evolução e contexto do caso. Produz uma explicação passo-a-passo de COMO a IA chegou nessa confiança — expondo a lógica bayesiana e clínica em linguagem acessível.

Princípios:
- PT-BR clínico, tom didático
- NÃO INVENTE dados. Use apenas o contexto fornecido.
- Termos técnicos (LR+, probabilidade posterior) explicados brevemente em parênteses
- Markdown: ### para seções, - para listas, **negrito** pra destaque
- ~300-500 palavras
- Se algum passo não tem dados suficientes, diga explicitamente

Estrutura obrigatória:

### 1. Sinal que disparou a hipótese
(Qual fala, aferição ou achado motivou inicialmente considerar essa hipótese — cite trecho do diálogo se possível)

### 2. Padrão clínico reconhecido
(Que síndrome/padrão se encaixa, com referência à diretriz quando aplicável)

### 3. Atualização da confiança
(Como cada evidência subsequente elevou/reduziu a probabilidade. Mostre LR+ aproximados e cálculo bayesiano simplificado quando fizer sentido)

### 4. Hipóteses alternativas consideradas
(Que outras possibilidades foram pesadas e por que foram menos prováveis ou descartadas)

### 5. Conclusão
(Por que EXATAMENTE o % atual, nem mais nem menos. Limites de incerteza.)`;

export interface ReasoningInput {
  hypothesis: Hypothesis;
  transcript: TranscriptItem[];
  otherHypotheses: Hypothesis[];
}

function formatContext(input: ReasoningInput): string {
  const { hypothesis: h, transcript, otherHypotheses } = input;
  const lines: string[] = [];

  lines.push(`## Hipótese em análise`);
  lines.push(
    `**${h.label}** (CID-10: ${h.icd10}) — confiança atual ${h.confidence}%, status ${h.status}`
  );
  if (h.trigger) lines.push(`Último gatilho: "${h.trigger}"`);
  if (h.rationale) lines.push(`Rationale da IA: ${h.rationale}`);

  lines.push(`\n## Evolução da confiança (sparkline)`);
  for (let i = 0; i < h.sparkline.length; i++) {
    const p = h.sparkline[i];
    const prev = i > 0 ? h.sparkline[i - 1] : null;
    const delta = prev ? p.value - prev.value : null;
    const deltaStr = delta !== null ? ` (${delta > 0 ? "+" : ""}${delta}%)` : "";
    lines.push(`- ${p.value}%${deltaStr} — ${p.label ?? "ajuste"}`);
  }

  if (h.citations && h.citations.length > 0) {
    lines.push(`\n## Diretrizes citadas`);
    for (const cid of h.citations) {
      const g = getGuidelineById(cid);
      if (g) {
        lines.push(`- ${formatGuidelineHeader(g)} — ${g.title}: ${g.excerpt}`);
      }
    }
  }

  if (otherHypotheses.length > 0) {
    lines.push(`\n## Outras hipóteses ativas no caso`);
    for (const o of otherHypotheses) {
      lines.push(
        `- ${o.label} (${o.icd10}) — ${o.confidence}% ${o.status}${o.rationale ? ": " + o.rationale : ""}`
      );
    }
  }

  lines.push(`\n## Paciente`);
  lines.push(
    `${mockPatient.name}, ${mockPatient.sex === "F" ? "feminino" : "masculino"}, ${mockPatient.age} anos`
  );

  const messages = transcript.filter((i) => i.kind === "message");
  if (messages.length > 0) {
    lines.push(`\n## Transcrição da consulta`);
    for (const m of messages) {
      if (m.kind !== "message") continue;
      const speaker = m.speaker === "doctor" ? "MÉDICO" : "PACIENTE";
      lines.push(`${speaker}: ${m.text}`);
    }
  }

  return lines.join("\n");
}

export async function generateReasoning(input: ReasoningInput): Promise<string> {
  const context = formatContext(input);
  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Explique em detalhes como a IA chegou a ${input.hypothesis.confidence}% de confiança para a hipótese "${input.hypothesis.label}".\n\nCONTEXTO:\n\n${context}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Resposta sem conteúdo de texto");
  }
  return text.text.trim();
}
