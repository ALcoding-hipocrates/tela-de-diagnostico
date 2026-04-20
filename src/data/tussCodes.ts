export interface TussCode {
  code: string;
  label: string;
  description?: string;
}

export const defaultConsultationTuss: TussCode = {
  code: "10101012",
  label: "Consulta em consultório",
  description: "Em horário normal ou preestabelecido",
};

export const commonTussCodes: TussCode[] = [
  defaultConsultationTuss,
  { code: "10101039", label: "Consulta ambulatorial" },
  { code: "10101047", label: "Consulta em pronto-socorro" },
  { code: "40901327", label: "Eletrocardiograma convencional" },
  { code: "40304361", label: "Fundoscopia" },
  { code: "40901319", label: "MAPA — monitorização ambulatorial de PA" },
  { code: "41001036", label: "Tomografia de crânio sem contraste" },
  { code: "40202127", label: "Angio-tomografia de aorta" },
  { code: "40202089", label: "Troponina" },
];

export function getTussByCode(code: string): TussCode | undefined {
  return commonTussCodes.find((t) => t.code === code);
}
