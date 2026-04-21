import Anthropic from "@anthropic-ai/sdk";

/**
 * M7 — Voice Macros / Wake-word commands
 *
 * Ao dizer "Hipócrates, ..." o resto da fala é interpretado como comando.
 * O Claude classifica a intenção e retorna action estruturada.
 */

const WAKE_WORDS = [
  /^\s*hip[óo]crates[,.!:]?\s+/i,
  /^\s*assistente[,.!:]?\s+/i,
  /^\s*hipo[,.!:]?\s+/i,
];

/** Retorna o comando puro se a fala é ativada por wake word, senão null. */
export function extractCommand(raw: string): string | null {
  for (const rx of WAKE_WORDS) {
    if (rx.test(raw)) {
      return raw.replace(rx, "").trim();
    }
  }
  return null;
}

export type MacroAction =
  | {
      kind: "add_prescription";
      medication: string;
      dose?: string;
      frequency?: string;
      duration?: string;
    }
  | {
      kind: "request_exams";
      panels: string[];
    }
  | {
      kind: "mark_red_flag";
      label: string;
    }
  | {
      kind: "verify_assumption";
      icd10?: string;
      text: string;
      state: "verified" | "false";
    }
  | {
      kind: "check_item";
      label: string;
      result?: string;
    }
  | {
      kind: "unknown";
      raw: string;
    };

export interface MacroResult {
  action: MacroAction;
  confirmation: string;
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

export function isMacroConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const MACRO_SYSTEM = `Você interpreta comandos de voz em português falados por um médico durante a consulta.

Exemplos:
- "adicionar losartana 50mg 1x ao dia" → add_prescription
- "solicitar hemograma e troponina" → request_exams
- "marcar red flag de formigamento" → mark_red_flag
- "confirmar gestação negativa" → verify_assumption (state=verified)
- "contestar que paciente não usa AINE" → verify_assumption (state=false)
- "registrar PA 150 por 95" ou "pa aferida 150 por 95" → check_item label="PA em repouso" result="150/95"

Painéis de exames conhecidos: hemograma, troponina, glicemia, urina 1, ECG, TC crânio, angio-TC aorta, RX tórax, fundo de olho, doppler carótidas.

Se não conseguir classificar, retorne unknown com raw=texto original.

SEMPRE chame a tool classify_macro com a ação estruturada e uma confirmation curta em PT-BR pro médico (ex: "Prescrição de Losartana 50mg 1x/dia adicionada.").`;

const MACRO_TOOL: Anthropic.Tool = {
  name: "classify_macro",
  description: "Classifica um comando de voz médico em ação estruturada",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "object",
        description: "Ação estruturada",
        properties: {
          kind: {
            type: "string",
            enum: [
              "add_prescription",
              "request_exams",
              "mark_red_flag",
              "verify_assumption",
              "check_item",
              "unknown",
            ],
          },
          medication: { type: "string" },
          dose: { type: "string" },
          frequency: { type: "string" },
          duration: { type: "string" },
          panels: { type: "array", items: { type: "string" } },
          label: { type: "string" },
          icd10: { type: "string" },
          text: { type: "string" },
          state: { type: "string", enum: ["verified", "false"] },
          result: { type: "string" },
          raw: { type: "string" },
        },
        required: ["kind"],
      },
      confirmation: {
        type: "string",
        description: "Frase curta em PT-BR confirmando a ação ao médico",
      },
    },
    required: ["action", "confirmation"],
  },
};

export async function classifyMacro(command: string): Promise<MacroResult> {
  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: MACRO_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [MACRO_TOOL],
    tool_choice: { type: "tool", name: "classify_macro" },
    messages: [{ role: "user", content: `Comando do médico: "${command}"` }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("Resposta sem tool_use");
  return toolUse.input as MacroResult;
}
