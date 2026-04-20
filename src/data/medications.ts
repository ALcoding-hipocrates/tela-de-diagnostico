export type Route = "VO" | "EV" | "IM" | "SC" | "SL" | "IN";
export type AlertSeverity = "absolute" | "relative";
export type PatientTag =
  | "pregnant"
  | "pediatric"
  | "elderly"
  | "renal-failure"
  | "hepatic-failure";

export interface MedicationAlert {
  severity: AlertSeverity;
  message: string;
  reference?: string;
}

interface AlertRule {
  activeIcd10?: string;
  patientTag?: PatientTag;
  minAge?: number;
  alert: MedicationAlert;
}

export interface Medication {
  id: string;
  name: string;
  medClass: string;
  commonDose: string;
  routes: Route[];
  defaultRoute: Route;
  alertRules: AlertRule[];
}

export const medications: Medication[] = [
  {
    id: "losartana",
    name: "Losartana",
    medClass: "BRA · Anti-hipertensivo",
    commonDose: "50 mg",
    routes: ["VO"],
    defaultRoute: "VO",
    alertRules: [
      {
        patientTag: "pregnant",
        alert: {
          severity: "absolute",
          message:
            "Contraindicado na gestação — FDA categoria D. Risco fetal comprovado.",
        },
      },
    ],
  },
  {
    id: "captopril",
    name: "Captopril",
    medClass: "IECA · Anti-hipertensivo",
    commonDose: "25 mg",
    routes: ["VO", "SL"],
    defaultRoute: "VO",
    alertRules: [
      {
        patientTag: "pregnant",
        alert: {
          severity: "absolute",
          message: "IECAs contraindicados na gestação",
        },
      },
      {
        patientTag: "renal-failure",
        alert: {
          severity: "relative",
          message: "Monitorar função renal e K+ sérico",
        },
      },
    ],
  },
  {
    id: "enalapril",
    name: "Enalapril",
    medClass: "IECA · Anti-hipertensivo",
    commonDose: "10 mg",
    routes: ["VO"],
    defaultRoute: "VO",
    alertRules: [
      {
        patientTag: "pregnant",
        alert: {
          severity: "absolute",
          message: "IECAs contraindicados na gestação",
        },
      },
    ],
  },
  {
    id: "nifedipina-sl",
    name: "Nifedipina SL",
    medClass: "BCC · Anti-hipertensivo",
    commonDose: "10 mg",
    routes: ["SL"],
    defaultRoute: "SL",
    alertRules: [
      {
        activeIcd10: "I10",
        alert: {
          severity: "relative",
          message:
            "Não recomendada em emergência hipertensiva — risco de queda abrupta da PA. Preferir anti-hipertensivos EV tituláveis.",
          reference: "sbc-has-2020-crise",
        },
      },
    ],
  },
  {
    id: "hidroclorotiazida",
    name: "Hidroclorotiazida",
    medClass: "Diurético tiazídico",
    commonDose: "25 mg",
    routes: ["VO"],
    defaultRoute: "VO",
    alertRules: [
      {
        minAge: 65,
        alert: {
          severity: "relative",
          message: "Em idosos: risco de hipocalemia e hiponatremia. Monitorar eletrólitos.",
        },
      },
    ],
  },
  {
    id: "aas-100",
    name: "AAS",
    medClass: "Antiagregante plaquetário",
    commonDose: "100 mg",
    routes: ["VO"],
    defaultRoute: "VO",
    alertRules: [
      {
        activeIcd10: "I71",
        alert: {
          severity: "absolute",
          message:
            "Contraindicado em suspeita de dissecção aórtica — risco de sangramento catastrófico",
          reference: "sbc-aorta-2020",
        },
      },
    ],
  },
  {
    id: "metoprolol",
    name: "Metoprolol",
    medClass: "Beta-bloqueador",
    commonDose: "25–50 mg",
    routes: ["VO", "EV"],
    defaultRoute: "VO",
    alertRules: [
      {
        alert: {
          severity: "relative",
          message:
            "Monitorar FC e bloqueio AV. Evitar em IC descompensada e asma grave.",
        },
      },
    ],
  },
  {
    id: "furosemida",
    name: "Furosemida",
    medClass: "Diurético de alça",
    commonDose: "20–40 mg",
    routes: ["VO", "EV"],
    defaultRoute: "VO",
    alertRules: [
      {
        minAge: 65,
        alert: {
          severity: "relative",
          message:
            "Em idosos: monitorar desidratação, função renal e eletrólitos (K+, Na+, Mg++)",
        },
      },
    ],
  },
  {
    id: "dipirona",
    name: "Dipirona",
    medClass: "Analgésico não-opioide",
    commonDose: "500 mg – 1 g",
    routes: ["VO", "EV", "IM"],
    defaultRoute: "VO",
    alertRules: [],
  },
];

export interface PrescriptionContext {
  patientTags: PatientTag[];
  patientAge: number;
  activeIcd10s: string[];
}

export function getAlertsFor(
  medication: Medication,
  ctx: PrescriptionContext
): MedicationAlert[] {
  const alerts: MedicationAlert[] = [];
  for (const rule of medication.alertRules) {
    const hasCondition =
      !!rule.activeIcd10 || !!rule.patientTag || rule.minAge !== undefined;

    if (!hasCondition) {
      alerts.push(rule.alert);
      continue;
    }

    let fires = true;
    if (rule.activeIcd10 && !ctx.activeIcd10s.includes(rule.activeIcd10)) fires = false;
    if (rule.patientTag && !ctx.patientTags.includes(rule.patientTag)) fires = false;
    if (rule.minAge !== undefined && ctx.patientAge < rule.minAge) fires = false;

    if (fires) alerts.push(rule.alert);
  }
  return alerts;
}

export function getMedicationById(id: string): Medication | undefined {
  return medications.find((m) => m.id === id);
}
