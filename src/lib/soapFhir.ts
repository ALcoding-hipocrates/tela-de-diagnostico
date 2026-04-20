import type {
  SoapContent,
  SoapAssessment,
  SoapObjective,
  SoapTranscriptLine,
} from "./soap";
import { formatTime, soapFilename } from "./soap";
import type { MockPatient } from "@/mocks/session";

interface FhirReference {
  reference: string;
  display?: string;
}

interface FhirCodeableConcept {
  coding?: Array<{ system?: string; code?: string; display?: string }>;
  text?: string;
}

interface FhirNarrative {
  status: "generated" | "extensions" | "additional" | "empty";
  div: string;
}

interface FhirBundleEntry {
  fullUrl: string;
  resource: FhirResource;
}

interface FhirResourceBase {
  resourceType: string;
  id?: string;
  text?: FhirNarrative;
}

type FhirResource =
  | FhirComposition
  | FhirPatient
  | FhirEncounter
  | FhirCondition
  | FhirObservation
  | FhirMedicationRequest;

interface FhirComposition extends FhirResourceBase {
  resourceType: "Composition";
  status: "preliminary" | "final" | "amended" | "entered-in-error";
  type: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  date: string;
  author: Array<{ display: string }>;
  title: string;
  section: Array<{
    title: string;
    text?: FhirNarrative;
    entry?: FhirReference[];
  }>;
}

interface FhirPatient extends FhirResourceBase {
  resourceType: "Patient";
  identifier?: Array<{ system?: string; value: string }>;
  name: Array<{ text: string }>;
  gender: "male" | "female" | "other" | "unknown";
  birthDate?: string;
}

interface FhirEncounter extends FhirResourceBase {
  resourceType: "Encounter";
  status:
    | "planned"
    | "in-progress"
    | "finished"
    | "cancelled"
    | "unknown";
  class: { system?: string; code: string; display?: string };
  subject: FhirReference;
  period: { start: string; end?: string };
}

interface FhirCondition extends FhirResourceBase {
  resourceType: "Condition";
  clinicalStatus: FhirCodeableConcept;
  verificationStatus: FhirCodeableConcept;
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  note?: Array<{ text: string }>;
}

interface FhirObservation extends FhirResourceBase {
  resourceType: "Observation";
  status: "final" | "amended" | "preliminary";
  code: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  effectiveDateTime: string;
  valueString?: string;
}

interface FhirMedicationRequest extends FhirResourceBase {
  resourceType: "MedicationRequest";
  status: "active" | "draft" | "on-hold";
  intent: "proposal" | "plan" | "order" | "original-order";
  medicationCodeableConcept: FhirCodeableConcept;
  subject: FhirReference;
  encounter?: FhirReference;
  authoredOn: string;
  dosageInstruction?: Array<{
    text: string;
    route?: FhirCodeableConcept;
  }>;
  note?: Array<{ text: string }>;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  type: "document";
  timestamp: string;
  entry: FhirBundleEntry[];
}

const ICD10_SYSTEM = "http://hl7.org/fhir/sid/icd-10";
const LOINC_SYSTEM = "http://loinc.org";
const V3_ACT_CODE = "http://terminology.hl7.org/CodeSystem/v3-ActCode";
const COND_CLINICAL = "http://terminology.hl7.org/CodeSystem/condition-clinical";
const COND_VER = "http://terminology.hl7.org/CodeSystem/condition-ver-status";

function uuid(): string {
  return `urn:uuid:${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function safe(s: string): string {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
}

function narrative(html: string): FhirNarrative {
  return {
    status: "generated",
    div: `<div xmlns="http://www.w3.org/1999/xhtml">${html}</div>`,
  };
}

function buildPatient(p: MockPatient, now: Date): FhirPatient {
  const birthYear = now.getFullYear() - p.age;
  return {
    resourceType: "Patient",
    id: p.id,
    identifier: [{ system: "urn:hipocrates:patient-id", value: p.id }],
    name: [{ text: p.name }],
    gender: p.sex === "F" ? "female" : "male",
    birthDate: String(birthYear),
    text: narrative(`<p>${safe(p.name)} · ${p.sex} · ${p.age} anos · #${safe(p.id)}</p>`),
  };
}

function buildEncounter(
  content: SoapContent,
  patientUrn: string,
  nowIso: string
): FhirEncounter {
  const startMs = content.generatedAt.getTime() - content.durationSec * 1000;
  return {
    resourceType: "Encounter",
    id: `enc-${content.generatedAt.getTime()}`,
    status: "finished",
    class: { system: V3_ACT_CODE, code: "AMB", display: "ambulatory" },
    subject: { reference: patientUrn, display: content.patient.name },
    period: { start: new Date(startMs).toISOString(), end: nowIso },
  };
}

function statusToClinical(s: SoapAssessment["status"]) {
  if (s === "active") return { code: "active", display: "Ativa" };
  if (s === "investigating") return { code: "active", display: "Investigando" };
  return { code: "inactive", display: "Descartada" };
}

function statusToVerification(s: SoapAssessment["status"]) {
  if (s === "active") return { code: "provisional", display: "Provisória" };
  if (s === "investigating") return { code: "differential", display: "Diferencial" };
  return { code: "refuted", display: "Descartada" };
}

function buildCondition(
  a: SoapAssessment,
  patientUrn: string,
  encounterUrn: string
): FhirCondition {
  const clinical = statusToClinical(a.status);
  const ver = statusToVerification(a.status);
  return {
    resourceType: "Condition",
    id: `cond-${a.icd10.replace(/\W/g, "")}-${Math.random().toString(16).slice(2, 8)}`,
    clinicalStatus: {
      coding: [{ system: COND_CLINICAL, code: clinical.code, display: clinical.display }],
    },
    verificationStatus: {
      coding: [{ system: COND_VER, code: ver.code, display: ver.display }],
    },
    code: {
      coding: [{ system: ICD10_SYSTEM, code: a.icd10, display: a.label }],
      text: a.label,
    },
    subject: { reference: patientUrn, display: "paciente" },
    encounter: { reference: encounterUrn },
    note: [
      {
        text: `Confiança estimada: ${a.confidence}%. ${a.rationale ? "Justificativa: " + a.rationale : ""}`.trim(),
      },
    ],
    text: narrative(
      `<p><strong>${safe(a.label)}</strong> (${safe(a.icd10)}) — ${a.confidence}% · ${ver.display}</p>`
    ),
  };
}

function buildMedicationRequest(
  rx: import("@/types/session").Prescription,
  patientUrn: string,
  encounterUrn: string
): FhirMedicationRequest {
  const intent =
    rx.status === "conditional" ? "proposal" : rx.status === "new" ? "order" : "plan";
  const dosageText = `${rx.dose} · ${rx.route} · ${rx.frequency}${rx.duration !== "—" ? " · " + rx.duration : ""}${rx.condition ? " (SE " + rx.condition + ")" : ""}`;
  const notes = [rx.justification].filter((n): n is string => !!n);
  return {
    resourceType: "MedicationRequest",
    id: `medreq-${rx.id}`,
    status: "active",
    intent,
    medicationCodeableConcept: {
      text: `${rx.medicationName} — ${rx.medicationClass}`,
    },
    subject: { reference: patientUrn, display: "paciente" },
    encounter: { reference: encounterUrn },
    authoredOn: new Date(rx.addedAt).toISOString(),
    dosageInstruction: [{ text: dosageText }],
    note: notes.length > 0 ? notes.map((text) => ({ text })) : undefined,
    text: narrative(
      `<p><strong>${safe(rx.medicationName)}</strong> — ${safe(dosageText)}</p>`
    ),
  };
}

function buildObservation(
  o: SoapObjective,
  patientUrn: string,
  encounterUrn: string,
  effectiveIso: string
): FhirObservation {
  const value = o.result
    ? `${o.result}${o.unit ? " " + o.unit : ""}`
    : "registrado";
  return {
    resourceType: "Observation",
    id: `obs-${o.label.toLowerCase().replace(/\W+/g, "-")}-${Math.random().toString(16).slice(2, 6)}`,
    status: "final",
    code: { text: o.label },
    subject: { reference: patientUrn },
    encounter: { reference: encounterUrn },
    effectiveDateTime: effectiveIso,
    valueString: value,
    text: narrative(`<p>${safe(o.label)}: <strong>${safe(value)}</strong></p>`),
  };
}

function transcriptNarrativeHtml(lines: SoapTranscriptLine[]): string {
  if (lines.length === 0) return "<p><em>Sem transcrição registrada.</em></p>";
  const rows = lines
    .map((l) => {
      const sp = l.speaker === "doctor" ? "MÉDICO" : "PACIENTE";
      return `<p><strong>[${formatTime(l.timestampSec)}] ${sp}:</strong> ${safe(l.text)}</p>`;
    })
    .join("");
  return rows;
}

function objectiveNarrativeHtml(items: SoapObjective[]): string {
  if (items.length === 0) return "<p><em>Nenhum achado registrado.</em></p>";
  const rows = items
    .map(
      (o) =>
        `<li>${safe(o.label)}: <strong>${safe(o.result ?? "✓")}${o.unit ? " " + safe(o.unit) : ""}</strong></li>`
    )
    .join("");
  return `<ul>${rows}</ul>`;
}

function assessmentNarrativeHtml(items: SoapAssessment[]): string {
  if (items.length === 0) return "<p><em>Nenhuma hipótese formulada.</em></p>";
  const rows = items
    .map(
      (a) =>
        `<li><strong>${safe(a.label)}</strong> (${safe(a.icd10)}) — ${a.confidence}% · ${safe(a.status)}${a.rationale ? ` — ${safe(a.rationale)}` : ""}</li>`
    )
    .join("");
  return `<ul>${rows}</ul>`;
}

function planNarrativeHtml(content: SoapContent): string {
  const parts: string[] = [];
  if (content.plan.prescriptions.length > 0) {
    parts.push(
      `<p><strong>Prescrições:</strong></p><ul>${content.plan.prescriptions
        .map(
          (rx) =>
            `<li>${safe(rx.medicationName)} — ${safe(rx.dose)} · ${safe(rx.route)} · ${safe(rx.frequency)}${rx.duration !== "—" ? " · " + safe(rx.duration) : ""} [${safe(rx.status)}]${rx.condition ? " SE " + safe(rx.condition) : ""}</li>`
        )
        .join("")}</ul>`
    );
  }
  if (content.plan.nextQuestion) {
    const q = content.plan.nextQuestion;
    parts.push(
      `<p><strong>Próxima pergunta sugerida:</strong> ${safe(q.question)}</p>`,
      `<p><em>Razão:</em> ${safe(q.reason)}</p>`,
      `<p><em>Impacto:</em> ${safe(q.impact)}</p>`
    );
  }
  if (content.plan.pendingItems.length > 0) {
    parts.push(
      `<p><strong>Pendências:</strong></p><ul>${content.plan.pendingItems.map((i) => `<li>${safe(i)}</li>`).join("")}</ul>`
    );
  }
  if (content.subjective.redFlags.length > 0) {
    parts.push(
      `<p><strong>Red flags identificadas:</strong></p><ul>${content.subjective.redFlags
        .map((rf) => `<li>${safe(rf.label)} — severidade ${safe(rf.severity)}${rf.reference ? ` (${safe(rf.reference)})` : ""}</li>`)
        .join("")}</ul>`
    );
  }
  if (parts.length === 0) return "<p><em>Nenhum plano definido.</em></p>";
  return parts.join("");
}

export function buildFhirBundle(content: SoapContent): FhirBundle {
  const nowIso = content.generatedAt.toISOString();
  const patientUrn = uuid();
  const encounterUrn = uuid();

  const patient = buildPatient(content.patient, content.generatedAt);
  const encounter = buildEncounter(content, patientUrn, nowIso);
  const conditions = content.assessment.map((a) =>
    buildCondition(a, patientUrn, encounterUrn)
  );
  const observations = content.objective.map((o) =>
    buildObservation(o, patientUrn, encounterUrn, nowIso)
  );
  const medicationRequests = content.plan.prescriptions.map((rx) =>
    buildMedicationRequest(rx, patientUrn, encounterUrn)
  );

  const conditionUrns = conditions.map(() => uuid());
  const observationUrns = observations.map(() => uuid());
  const medReqUrns = medicationRequests.map(() => uuid());

  const composition: FhirComposition = {
    resourceType: "Composition",
    id: `comp-${content.generatedAt.getTime()}`,
    status: "final",
    type: {
      coding: [
        { system: LOINC_SYSTEM, code: "11488-4", display: "Consult note" },
      ],
      text: "Nota clínica · SOAP",
    },
    subject: { reference: patientUrn, display: content.patient.name },
    encounter: { reference: encounterUrn },
    date: nowIso,
    author: [{ display: "Hipócrates.ai — Assistente Clínico" }],
    title: "Nota Clínica · SOAP",
    section: [
      {
        title: "Subjetivo",
        text: narrative(transcriptNarrativeHtml(content.subjective.transcript)),
      },
      {
        title: "Objetivo",
        text: narrative(objectiveNarrativeHtml(content.objective)),
        entry: observationUrns.map((ref) => ({ reference: ref })),
      },
      {
        title: "Avaliação",
        text: narrative(assessmentNarrativeHtml(content.assessment)),
        entry: conditionUrns.map((ref) => ({ reference: ref })),
      },
      {
        title: "Plano",
        text: narrative(planNarrativeHtml(content)),
        entry: medReqUrns.map((ref) => ({ reference: ref })),
      },
    ],
  };

  const compositionUrn = uuid();

  return {
    resourceType: "Bundle",
    id: `bundle-${content.generatedAt.getTime()}`,
    type: "document",
    timestamp: nowIso,
    entry: [
      { fullUrl: compositionUrn, resource: composition },
      { fullUrl: patientUrn, resource: patient },
      { fullUrl: encounterUrn, resource: encounter },
      ...conditions.map((resource, i) => ({
        fullUrl: conditionUrns[i],
        resource,
      })),
      ...observations.map((resource, i) => ({
        fullUrl: observationUrns[i],
        resource,
      })),
      ...medicationRequests.map((resource, i) => ({
        fullUrl: medReqUrns[i],
        resource,
      })),
    ],
  };
}

export function downloadFhirBundle(content: SoapContent) {
  const bundle = buildFhirBundle(content);
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = soapFilename(content).replace(/\.pdf$/, ".fhir.json");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
