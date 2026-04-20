import jsPDF from "jspdf";
import { mockPatient } from "@/mocks/session";

const CLINICAL = "#0b7a3e";
const INK_900 = "#0f1419";
const INK_600 = "#475467";
const INK_400 = "#98a2b3";
const BORDER = "#e5e7eb";

const PAGE_W = 595.28;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

export interface DocPdfInput {
  kind: "avs" | "referral";
  title: string;
  content: string; // markdown-lite (# heading, - list, **bold** inline, blank line = paragraph break)
}

export function generateDocPdf(input: DocPdfInput): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" }) as Doc;

  let y = drawHeader(doc, input);
  y = drawPatientBlock(doc, y);
  drawContent(doc, input.content, y);
  drawFooterOnAllPages(doc, input);

  return doc.output("blob");
}

export function downloadDocPdf(input: DocPdfInput) {
  const blob = generateDocPdf(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date();
  const iso = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const slug = mockPatient.name.toLowerCase().replace(/\s+/g, "-");
  a.download = `${input.kind}-${slug}-${iso}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawHeader(doc: Doc, input: DocPdfInput): number {
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
  doc.text(
    input.kind === "avs"
      ? "Orientação pós-consulta · AVS"
      : "Encaminhamento médico",
    MARGIN + 24,
    MARGIN + 26
  );

  const d = new Date();
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  doc.setFontSize(10);
  doc.setTextColor(INK_600);
  doc.text(dateStr, PAGE_W - MARGIN, MARGIN + 12, { align: "right" });

  return MARGIN + 44;
}

function drawPatientBlock(doc: Doc, yStart: number): number {
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
  doc.text(mockPatient.name, MARGIN + 70, y2);

  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(INK_600);
  const meta = `${mockPatient.sex} · ${mockPatient.age}a · #${mockPatient.id}`;
  doc.text(meta, PAGE_W - MARGIN, y2, { align: "right" });

  const y3 = y2 + 12;
  doc.setDrawColor(BORDER);
  doc.line(MARGIN, y3, PAGE_W - MARGIN, y3);

  return y3 + 18;
}

function ensureSpace(doc: Doc, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 60) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawContent(doc: Doc, content: string, yStart: number): number {
  let y = yStart;
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === "") {
      y += 6;
      continue;
    }

    // H1 heading
    if (line.startsWith("# ")) {
      const text = line.slice(2).trim();
      y = ensureSpace(doc, y, 20);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(CLINICAL);
      doc.text(text, MARGIN, y);
      y += 14;
      continue;
    }

    // H2 heading
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      y = ensureSpace(doc, y, 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(INK_900);
      doc.text(text, MARGIN, y);
      y += 12;
      continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.slice(2).trim();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(INK_900);
      const wrapped = doc.splitTextToSize(text, CONTENT_W - 18);
      y = ensureSpace(doc, y, wrapped.length * 13);
      doc.setTextColor(INK_400);
      doc.text("•", MARGIN + 2, y);
      doc.setTextColor(INK_900);
      doc.text(wrapped, MARGIN + 14, y);
      y += wrapped.length * 13;
      continue;
    }

    // Paragraph
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(INK_900);
    const wrapped = doc.splitTextToSize(stripInlineMarkdown(line), CONTENT_W);
    y = ensureSpace(doc, y, wrapped.length * 13);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 13 + 2;
  }

  return y;
}

function stripInlineMarkdown(s: string): string {
  // Very light: remove ** pairs (we don't render bold inline yet to keep it simple)
  return s.replace(/\*\*(.+?)\*\*/g, "$1");
}

function drawFooterOnAllPages(doc: Doc, input: DocPdfInput) {
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
    const note =
      input.kind === "avs"
        ? "Gerado pelo Hipócrates.ai — apoio cognitivo ao médico. Documento de orientação; não substitui acompanhamento clínico."
        : "Gerado pelo Hipócrates.ai — apoio cognitivo ao médico. Responsabilidade clínica do profissional signatário.";
    doc.text(note, MARGIN, pageH - 34);
    doc.text(`Página ${i} de ${pageCount}`, PAGE_W - MARGIN, pageH - 34, {
      align: "right",
    });
  }
}
