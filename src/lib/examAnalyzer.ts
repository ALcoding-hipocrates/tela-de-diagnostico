import Anthropic from "@anthropic-ai/sdk";

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY não configurada");
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }
  return client;
}

export function isExamAnalyzerConfigured(): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

const EXAM_SYSTEM_PROMPT = `Você interpreta resultados de exames médicos a partir de imagens (fotos de papel, screenshots) ou PDFs de laudo.

Tarefa:
- Leia o exame fornecido
- Extraia os valores ou achados principais
- Produza UMA frase única e objetiva em PT-BR clínico que condense: (1) valores/achados principais, (2) avaliação breve (normal / alterado / necessita acompanhamento)

Formato de saída — APENAS a frase, sem preâmbulo, sem aspas:
[valores/achados] · [avaliação clínica breve]

Exemplos:
PA 150/95 mmHg · hipertensão grau 2, requer 2ª aferição em 7 dias (SBC 2020)
Glicemia capilar 65 mg/dL · hipoglicemia leve em paciente sintomático (SBEM 2019)
TC crânio sem contraste sem sinais de hemorragia, edema ou lesão focal aguda

Use terminologia clínica brasileira padrão. Considere o contexto do paciente.

Se o arquivo NÃO for um exame médico legível, responda exatamente:
Não foi possível interpretar este arquivo como exame médico.`;

interface ExamAnalysisInput {
  file: File;
  panelName: string;
  patientContext: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeExamFile({
  file,
  panelName,
  patientContext,
}: ExamAnalysisInput): Promise<string> {
  const base64 = await fileToBase64(file);
  const mediaType = file.type || "application/octet-stream";

  const isImage = mediaType.startsWith("image/");
  const isPdf = mediaType === "application/pdf";
  if (!isImage && !isPdf) {
    throw new Error("Tipo de arquivo não suportado (use PNG, JPG ou PDF)");
  }

  const fileBlock = isImage
    ? {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          data: base64,
        },
      }
    : {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64,
        },
      };

  const userText = `Exame solicitado: ${panelName}

Contexto do paciente:
${patientContext}

Interprete este resultado em UMA frase objetiva em PT-BR clínico, seguindo o formato exigido.`;

  const response = await getClient().messages.create({
    model: "claude-opus-4-7",
    max_tokens: 512,
    system: EXAM_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: userText }],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Resposta sem conteúdo de texto");
  }

  return text.text.trim();
}
