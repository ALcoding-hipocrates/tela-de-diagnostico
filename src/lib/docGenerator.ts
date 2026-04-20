import Anthropic from "@anthropic-ai/sdk";
import type {
  ChecklistItem,
  Exam,
  Hypothesis,
  Prescription,
  SoapSections,
  TranscriptItem,
} from "@/types/session";
import { mockPatient } from "@/mocks/session";
import { mockUser } from "@/data/user";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY não configurada");
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export function isDocGeneratorConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

export interface DocGenerationContext {
  transcript: TranscriptItem[];
  hypotheses: Hypothesis[];
  prescriptions: Prescription[];
  exams: Exam[];
  checklist: ChecklistItem[];
  soapSections: SoapSections | null;
}

const AVS_PROMPT = `Você gera resumos pós-consulta (AVS — after-visit summary) em linguagem acessível para pacientes brasileiros. Converta a transcrição clínica, hipóteses e conduta em um documento de orientação ao paciente.

Princípios:
- 2ª pessoa: use "você"
- Linguagem simples, evite jargão médico (quando usar, explique brevemente em parênteses)
- Frases curtas, tom acolhedor e informativo
- Traduza CID-10 para nomes leigos ("pressão alta" em vez de "hipertensão essencial I10")
- NÃO INVENTE dados — use só o que está no contexto

Estrutura exigida (use exatamente estas seções com markdown # :
# Resumo da sua consulta hoje
(1 parágrafo explicando o que foi conversado e o que foi observado)

# O que estamos investigando
(Hipóteses em linguagem leiga, o que significa cada uma e por que o médico está considerando)

# Medicamentos
(Se houver prescrição: nome, quando tomar, por quanto tempo. Se não houver, escreva "Nenhum medicamento foi prescrito nesta consulta.")

# Exames solicitados
(Se houver: nome do exame e motivo simplificado. Se não houver, omita a seção inteira.)

# Sinais de alerta — procure atendimento imediato se:
(Lista de sinais de piora baseada nos red flags e hipóteses. Linguagem direta. Se não há red flags ativos, inclua alertas gerais da(s) hipótese(s).)

# Próximos passos
(Quando retornar, quando agendar nova consulta, o que fazer até lá)

Formato: markdown simples (# para títulos, - para listas, **negrito** para destaque). ~300-500 palavras. Se uma seção não tem dados suficientes, omita-a.`;

const REFERRAL_PROMPT = `Você gera cartas de encaminhamento em formato brasileiro padrão para especialistas. Baseado na consulta, produza um documento formal e conciso.

Princípios:
- Linguagem formal, tom profissional
- Terminologia médica apropriada (CID-10, nomenclatura padrão)
- NÃO INVENTE — use só dados da consulta
- Infira a ESPECIALIDADE mais apropriada das hipóteses ativas (ex: Crise HAS + sinais focais → Neurologia; SCA → Cardiologia; Hipoglicemia recorrente → Endocrinologia)

Estrutura exigida (markdown # para títulos):

# Encaminhamento para [ESPECIALIDADE]

# Motivo do encaminhamento
(1-2 frases objetivas)

# Dados do paciente
(nome, sexo, idade, identificador)

# História da doença atual
(parágrafo corrido com evolução, sintomas e achados subjetivos)

# Exame físico
(achados relevantes: sinais vitais + achados específicos)

# Hipóteses diagnósticas
(lista com CID-10 e nível de confiança, em ordem de probabilidade)

# Condutas tomadas
(o que foi feito na consulta: prescrições, aferições, exames)

# Exames solicitados
(se houver — lista com motivos)

# Pergunta ao especialista
(objetivo específico do encaminhamento — investigação? manejo? procedimento?)

# Atenciosamente,
Dr. ${mockUser.name.replace(/^Dr\.?\s*/, "")}
${mockUser.crm}
${mockUser.specialty}

Formato: markdown simples. Omita seções sem dados suficientes.`;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatContext(ctx: DocGenerationContext): string {
  const lines: string[] = [];

  lines.push(`## Paciente`);
  lines.push(
    `${mockPatient.name}, ${mockPatient.sex === "F" ? "feminino" : "masculino"}, ${mockPatient.age} anos, ID #${mockPatient.id}`
  );

  const messages = ctx.transcript.filter((i) => i.kind === "message");
  if (messages.length > 0) {
    lines.push(`\n## Transcrição da consulta`);
    for (const item of messages) {
      if (item.kind !== "message") continue;
      const speaker = item.speaker === "doctor" ? "MÉDICO" : "PACIENTE";
      lines.push(`[${formatTime(item.timestampSec)}] ${speaker}: ${item.text}`);
    }
  }

  if (ctx.soapSections) {
    lines.push(`\n## Nota SOAP (rascunho)`);
    if (ctx.soapSections.subjective)
      lines.push(`Subjetivo: ${ctx.soapSections.subjective}`);
    if (ctx.soapSections.objective)
      lines.push(`Objetivo: ${ctx.soapSections.objective}`);
    if (ctx.soapSections.assessment)
      lines.push(`Avaliação: ${ctx.soapSections.assessment}`);
    if (ctx.soapSections.plan) lines.push(`Plano: ${ctx.soapSections.plan}`);
  }

  if (ctx.hypotheses.length > 0) {
    lines.push(`\n## Hipóteses diagnósticas`);
    for (const h of ctx.hypotheses) {
      lines.push(
        `- ${h.label} (${h.icd10}) — ${h.confidence}% — ${h.status} — ${h.rationale ?? h.trigger ?? ""}`
      );
    }
  }

  const checked = ctx.checklist.filter((c) => c.status === "checked");
  if (checked.length > 0) {
    lines.push(`\n## Achados registrados`);
    for (const c of checked) {
      let l = `- ${c.label}`;
      if (c.result) l += ` = ${c.result}${c.resultUnit ? " " + c.resultUnit : ""}`;
      lines.push(l);
    }
  }

  if (ctx.prescriptions.length > 0) {
    lines.push(`\n## Prescrições`);
    for (const p of ctx.prescriptions) {
      let l = `- ${p.medicationName} (${p.medicationClass}) ${p.dose} ${p.route} ${p.frequency}`;
      if (p.duration !== "—") l += ` · ${p.duration}`;
      l += ` [${p.status}]`;
      if (p.condition) l += ` — iniciar SE ${p.condition}`;
      if (p.justification) l += ` (${p.justification})`;
      lines.push(l);
    }
  }

  if (ctx.exams.length > 0) {
    lines.push(`\n## Exames`);
    for (const e of ctx.exams) {
      let l = `- ${e.panelName} [${e.status === "resulted" ? "com resultado" : "solicitado"}]`;
      if (e.observation) l += ` — ${e.observation}`;
      if (e.result) l += ` — resultado: ${e.result}`;
      lines.push(l);
    }
  }

  return lines.join("\n");
}

async function generate(
  prompt: string,
  ctx: DocGenerationContext,
  action: string
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: prompt,
    messages: [
      {
        role: "user",
        content: `${action}\n\nCONTEXTO DA CONSULTA:\n\n${formatContext(ctx)}`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Resposta sem conteúdo de texto");
  }
  return text.text;
}

export function generateAvs(ctx: DocGenerationContext): Promise<string> {
  return generate(
    AVS_PROMPT,
    ctx,
    "Gere a orientação pós-consulta para o paciente."
  );
}

export function generateReferral(ctx: DocGenerationContext): Promise<string> {
  return generate(
    REFERRAL_PROMPT,
    ctx,
    "Gere a carta de encaminhamento para especialista."
  );
}
