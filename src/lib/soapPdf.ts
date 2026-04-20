import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SoapContent, SoapAssessment } from "./soap";
import { formatTime, soapFilename } from "./soap";
import { defaultConsultationTuss } from "@/data/tussCodes";

const CLINICAL = "#0b7a3e";
const CLINICAL_700 = "#085f30";
const INK_900 = "#0f1419";
const INK_600 = "#475467";
const INK_400 = "#98a2b3";
const DANGER = "#be2e24";
const WARNING = "#8c6a08";
const BORDER = "#e5e7eb";

const PAGE_W = 595.28;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

export function generateSoapPdf(content: SoapContent): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" }) as Doc;

  let y = drawHeader(doc, content);
  y = drawPatientBlock(doc, content, y);
  y = drawSubjective(doc, content, y);
  y = drawObjective(doc, content, y);
  y = drawAssessment(doc, content, y);
  y = drawPlan(doc, content, y);
  drawBillingCodes(doc, content, y);

  drawFooterOnAllPages(doc);

  return doc.output("blob");
}

export function downloadSoapPdf(content: SoapContent) {
  const blob = generateSoapPdf(content);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = soapFilename(content);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawHeader(doc: Doc, content: SoapContent): number {
  doc.setFillColor(CLINICAL);
  doc.rect(MARGIN, MARGIN, 16, 16, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("H", MARGIN + 4, MARGIN + 12);

  doc.setTextColor(INK_900);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Hipócrates.ai", MARGIN + 24, MARGIN + 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(INK_600);
  doc.text("Nota Clínica · SOAP", MARGIN + 24, MARGIN + 26);

  const dateStr = formatDate(content.generatedAt);
  const timeStr = formatClock(content.generatedAt);
  doc.setFontSize(10);
  doc.setTextColor(INK_600);
  doc.text(dateStr, PAGE_W - MARGIN, MARGIN + 12, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(INK_400);
  doc.text(
    `${timeStr} · duração ${formatTime(content.durationSec)}`,
    PAGE_W - MARGIN,
    MARGIN + 26,
    { align: "right" }
  );

  return MARGIN + 44;
}

function drawPatientBlock(doc: Doc, content: SoapContent, yStart: number): number {
  const y = yStart + 8;
  doc.setDrawColor(BORDER);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  const y2 = y + 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(INK_400);
  doc.text("PACIENTE", MARGIN, y2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(INK_900);
  doc.text(content.patient.name, MARGIN + 70, y2);

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(INK_600);
  const meta = `${content.patient.sex} · ${content.patient.age}a · #${content.patient.id}`;
  doc.text(meta, PAGE_W - MARGIN, y2, { align: "right" });

  const y3 = y2 + 12;
  doc.setDrawColor(BORDER);
  doc.line(MARGIN, y3, PAGE_W - MARGIN, y3);

  return y3 + 18;
}

function sectionHeader(doc: Doc, letter: string, title: string, y: number): number {
  doc.setFillColor(CLINICAL);
  doc.circle(MARGIN + 8, y + 1, 8, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(letter, MARGIN + 8, y + 4, { align: "center" });

  doc.setTextColor(INK_900);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), MARGIN + 22, y + 4);

  return y + 20;
}

function ensureSpace(doc: Doc, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 60) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawSubjective(doc: Doc, content: SoapContent, yStart: number): number {
  let y = sectionHeader(doc, "S", "Subjetivo", yStart);

  if (content.subjective.redFlags.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK_400);
    doc.text("RED FLAGS IDENTIFICADAS", MARGIN, y);
    y += 12;

    for (const rf of content.subjective.redFlags) {
      y = ensureSpace(doc, y, 18);
      const color = rf.severity === "high" ? DANGER : WARNING;
      doc.setFillColor(color);
      doc.circle(MARGIN + 3, y - 3, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(INK_900);
      doc.text(rf.label, MARGIN + 10, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(INK_600);
      doc.text(`(gatilho: "${rf.trigger}")`, MARGIN + 10 + doc.getTextWidth(rf.label) + 6, y);

      if (rf.reference) {
        doc.setFont("courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(INK_400);
        doc.text(rf.reference, PAGE_W - MARGIN, y, { align: "right" });
      }
      y += 14;
    }
    y += 6;
  }

  y = ensureSpace(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(INK_400);
  doc.text("TRANSCRIÇÃO DA CONSULTA", MARGIN, y);
  y += 12;

  if (content.subjective.transcript.length === 0) {
    y = drawEmpty(doc, "Sem transcrição registrada.", y);
  } else {
    for (const line of content.subjective.transcript) {
      const speakerLabel = line.speaker === "doctor" ? "MÉDICO" : "PACIENTE";
      const ts = formatTime(line.timestampSec);
      const speakerColor = line.speaker === "doctor" ? CLINICAL_700 : INK_900;

      const textLines = doc.splitTextToSize(line.text, CONTENT_W - 90);
      const blockHeight = textLines.length * 12 + 2;
      y = ensureSpace(doc, y, blockHeight);

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(INK_400);
      doc.text(ts, MARGIN, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(speakerColor);
      doc.text(speakerLabel, MARGIN + 36, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(INK_900);
      doc.text(textLines, MARGIN + 90, y);

      y += blockHeight;
    }
  }

  return y + 10;
}

function drawObjective(doc: Doc, content: SoapContent, yStart: number): number {
  let y = ensureSpace(doc, yStart, 40);
  y = sectionHeader(doc, "O", "Objetivo", y);

  if (content.objective.length === 0) {
    y = drawEmpty(doc, "Nenhum achado registrado.", y);
    return y + 10;
  }

  const rows = content.objective.map((o) => [
    o.label,
    o.result ? `${o.result}${o.unit ? " " + o.unit : ""}` : "✓",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Achado / Aferição", "Resultado"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [11, 122, 62],
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: INK_900,
    },
    columnStyles: {
      1: { fontStyle: "bold", font: "courier", halign: "right" },
    },
    alternateRowStyles: { fillColor: "#f8f9fa" },
  });

  return (doc.lastAutoTable?.finalY ?? y) + 18;
}

function drawAssessment(doc: Doc, content: SoapContent, yStart: number): number {
  let y = ensureSpace(doc, yStart, 40);
  y = sectionHeader(doc, "A", "Avaliação", y);

  if (content.assessment.length === 0) {
    y = drawEmpty(doc, "Nenhuma hipótese formulada.", y);
    return y + 10;
  }

  const rows = content.assessment.map((a) => [
    a.label,
    a.icd10,
    `${a.confidence}%`,
    statusLabel(a.status),
    a.rationale ?? "—",
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Hipótese", "CID-10", "Confiança", "Estado", "Justificativa"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [11, 122, 62],
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: INK_900,
      valign: "top",
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 110 },
      1: { font: "courier", cellWidth: 50, halign: "center" },
      2: { font: "courier", fontStyle: "bold", cellWidth: 55, halign: "right" },
      3: { cellWidth: 70, fontSize: 8 },
      4: { textColor: INK_600 },
    },
    alternateRowStyles: { fillColor: "#f8f9fa" },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const a = content.assessment[data.row.index] as SoapAssessment | undefined;
      if (!a) return;
      if (data.column.index === 3) {
        if (a.status === "active") data.cell.styles.textColor = CLINICAL_700;
        else if (a.status === "investigating") data.cell.styles.textColor = WARNING;
        else data.cell.styles.textColor = INK_400;
      }
    },
  });

  return (doc.lastAutoTable?.finalY ?? y) + 18;
}

function drawPlan(doc: Doc, content: SoapContent, yStart: number): number {
  let y = ensureSpace(doc, yStart, 40);
  y = sectionHeader(doc, "P", "Plano", y);

  if (content.plan.nextQuestion) {
    y = ensureSpace(doc, y, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK_400);
    doc.text("PRÓXIMA PERGUNTA SUGERIDA", MARGIN, y);
    y += 12;

    const question = content.plan.nextQuestion.question;
    const qLines = doc.splitTextToSize(question, CONTENT_W - 12);
    y = ensureSpace(doc, y, qLines.length * 12 + 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(INK_900);
    doc.text(qLines, MARGIN, y);
    y += qLines.length * 12 + 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(INK_600);
    doc.text(`Razão: ${content.plan.nextQuestion.reason}`, MARGIN, y);
    y += 11;
    doc.setFont("courier", "normal");
    doc.text(`Impacto: ${content.plan.nextQuestion.impact}`, MARGIN, y);
    y += 18;
  }

  if (content.plan.prescriptions.length > 0) {
    y = ensureSpace(doc, y, content.plan.prescriptions.length * 22 + 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK_400);
    doc.text("PRESCRIÇÕES", MARGIN, y);
    y += 12;

    for (const rx of content.plan.prescriptions) {
      y = ensureSpace(doc, y, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(INK_900);
      doc.text(`•  ${rx.medicationName}`, MARGIN + 4, y);
      const statusTxt =
        rx.status === "new"
          ? "[Novo]"
          : rx.status === "maintained"
            ? "[Mantido]"
            : "[Condicional]";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(INK_600);
      doc.text(statusTxt, MARGIN + 4 + doc.getTextWidth(`•  ${rx.medicationName}`) + 6, y);
      y += 11;

      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(INK_900);
      const detail = `${rx.dose} · ${rx.route} · ${rx.frequency}${rx.duration !== "—" ? " · " + rx.duration : ""}`;
      doc.text(detail, MARGIN + 10, y);
      y += 10;

      if (rx.condition) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(WARNING);
        doc.text(`SE ${rx.condition}`, MARGIN + 10, y);
        y += 10;
      }
      if (rx.justification) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(INK_600);
        const lines = doc.splitTextToSize(rx.justification, CONTENT_W - 30);
        doc.text(lines, MARGIN + 10, y);
        y += lines.length * 10;
      }
      y += 4;
    }
  }

  if (content.plan.pendingItems.length > 0) {
    y = ensureSpace(doc, y, content.plan.pendingItems.length * 12 + 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(INK_400);
    doc.text("PENDÊNCIAS CLÍNICAS", MARGIN, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK_900);
    for (const item of content.plan.pendingItems) {
      doc.text(`•  ${item}`, MARGIN + 4, y);
      y += 12;
    }
  }

  if (
    !content.plan.nextQuestion &&
    content.plan.pendingItems.length === 0 &&
    content.plan.prescriptions.length === 0
  ) {
    y = drawEmpty(doc, "Nenhum plano definido.", y);
  }

  return y;
}

function drawBillingCodes(doc: Doc, content: SoapContent, yStart: number): number {
  const activeHypotheses = content.assessment.filter(
    (a) => a.status === "active" || a.status === "investigating"
  );
  if (activeHypotheses.length === 0) return yStart;

  let y = ensureSpace(doc, yStart + 10, 60);

  doc.setDrawColor(CLINICAL);
  doc.setLineWidth(1);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(CLINICAL_700);
  doc.text("CÓDIGOS PARA FATURAMENTO", MARGIN, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(INK_900);
  doc.text("Procedimento (TUSS):", MARGIN, y);
  doc.setFont("courier", "bold");
  doc.setTextColor(CLINICAL_700);
  doc.text(defaultConsultationTuss.code, MARGIN + 120, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(INK_600);
  doc.text(` — ${defaultConsultationTuss.label}`, MARGIN + 170, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(INK_900);
  doc.text("Diagnóstico (CID-10):", MARGIN, y);
  y += 10;

  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  for (const h of activeHypotheses) {
    y = ensureSpace(doc, y, 10);
    doc.setTextColor(CLINICAL_700);
    doc.text(h.icd10.padEnd(10), MARGIN + 12, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(INK_600);
    doc.text(h.label, MARGIN + 60, y);
    doc.setFont("courier", "bold");
    y += 10;
  }

  return y + 4;
}

function drawEmpty(doc: Doc, text: string, y: number): number {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(INK_400);
  doc.text(text, MARGIN, y);
  return y + 14;
}

function drawFooterOnAllPages(doc: Doc) {
  const pageCount = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(BORDER);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, pageH - 48, PAGE_W - MARGIN, pageH - 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(INK_400);
    doc.text(
      "Gerado com apoio cognitivo Hipócrates.ai — responsabilidade clínica do profissional.",
      MARGIN,
      pageH - 34
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      PAGE_W - MARGIN,
      pageH - 34,
      { align: "right" }
    );
  }
}

function statusLabel(s: SoapAssessment["status"]): string {
  if (s === "active") return "Ativa";
  if (s === "investigating") return "Investigando";
  return "Descartada";
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function formatClock(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
