import { useEffect, useState } from "react";
import {
  Calculator as CalcIcon,
  ArrowLeft,
  BookOpen,
  Sparkles,
} from "lucide-react";
import {
  calculators,
  autofillFields,
  getRangeFor,
  type Calculator,
  type CalculatorRange,
  type RiskColor,
} from "@/data/calculators";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { useSessionStore } from "@/store/sessionStore";
import { mockPatient } from "@/mocks/session";
import { cn } from "@/lib/cn";
import { Modal } from "../shared/Modal";

interface CalculatorsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CalculatorsModal({ open, onClose }: CalculatorsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  const selected = selectedId
    ? calculators.find((c) => c.id === selectedId) ?? null
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={selected ? selected.name : "Calculadoras e escalas clínicas"}
      description={
        selected
          ? selected.description
          : "Escalas pré-preenchidas a partir do caso atual — ajuste e veja a interpretação automaticamente."
      }
    >
      {selected ? (
        <CalculatorView calc={selected} onBack={() => setSelectedId(null)} />
      ) : (
        <CalculatorsList onSelect={setSelectedId} />
      )}
    </Modal>
  );
}

function CalculatorsList({ onSelect }: { onSelect: (id: string) => void }) {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const checklist = useSessionStore((s) => s.checklist);
  const ctx = {
    patient: mockPatient,
    hypotheses,
    checklist,
  };

  return (
    <ul className="flex flex-col gap-2">
      {calculators.map((c) => {
        const { checked, autoFilled } = autofillFields(c, ctx);
        const autoCount = Object.keys(autoFilled).length;
        const preScore = Object.entries(checked).reduce((acc, [id, v]) => {
          if (!v) return acc;
          const f = c.fields.find((f) => f.id === id);
          return acc + (f?.points ?? 0);
        }, 0);
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex w-full items-start gap-3 rounded-lg border border-black/[0.08] bg-surface p-3 text-left shadow-[var(--shadow-card-base)] transition-all hover:border-black/[0.14] hover:bg-surface-raised hover:shadow-[var(--shadow-card-raised)]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900/[0.04] text-ink-900">
                <CalcIcon size={15} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[14px] font-semibold text-ink-900">
                    {c.name}
                  </span>
                  <span className="font-mono text-label font-medium text-ink-400">
                    {c.specialty}
                  </span>
                </div>
                <p className="text-[12px] font-medium leading-snug text-ink-600">
                  {c.description}
                </p>
                {autoCount > 0 && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-clinical-700">
                    <Sparkles size={10} />
                    {autoCount} campo{autoCount === 1 ? "" : "s"} pré-preenchido
                    {autoCount === 1 ? "" : "s"} do caso · pontuação parcial:{" "}
                    <span className="font-mono">{preScore}</span>
                  </p>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CalculatorView({
  calc,
  onBack,
}: {
  calc: Calculator;
  onBack: () => void;
}) {
  const hypotheses = useSessionStore((s) => s.hypotheses);
  const checklist = useSessionStore((s) => s.checklist);

  const ctx = { patient: mockPatient, hypotheses, checklist };
  const { checked: initial, autoFilled } = (() => {
    const result = autofillFields(calc, ctx);
    return result;
  })();

  const [state, setState] = useState<Record<string, boolean>>(initial);

  useEffect(() => {
    // Reset when calculator changes
    setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc.id]);

  const score = calc.fields.reduce((acc, f) => {
    return acc + (state[f.id] ? f.points : 0);
  }, 0);

  const range = getRangeFor(calc, score);
  const guideline = calc.guidelineRef
    ? getGuidelineById(calc.guidelineRef)
    : null;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-7 w-fit items-center gap-1 rounded-md text-[12px] font-semibold text-ink-600 hover:bg-surface-raised hover:text-ink-900"
      >
        <ArrowLeft size={11} /> Voltar às calculadoras
      </button>

      <ul className="flex flex-col divide-y divide-black/[0.05] rounded-lg border border-black/[0.06] bg-surface">
        {calc.fields.map((f) => {
          const isAuto = autoFilled[f.id];
          const isChecked = state[f.id] ?? false;
          return (
            <li key={f.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-black/[0.015]",
                  isChecked && "bg-clinical/[0.02]"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    setState((s) => ({ ...s, [f.id]: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-clinical)]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-medium text-ink-900">
                      {f.label}
                    </span>
                    {isAuto && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-clinical/15 px-1.5 py-0.5 text-[9px] font-bold text-clinical-700">
                        <Sparkles size={8} /> auto
                      </span>
                    )}
                  </div>
                  {f.hint && (
                    <span className="text-[11px] italic text-ink-600">
                      {f.hint}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[12px] font-semibold text-ink-400">
                  +{f.points}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <RangeDisplay score={score} range={range} maxScore={sumMaxScore(calc)} />

      {guideline && (
        <div className="flex items-start gap-2 rounded-md border border-black/[0.06] bg-surface-raised p-2.5">
          <BookOpen size={12} className="mt-0.5 shrink-0 text-clinical" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-[11px] font-semibold text-clinical-700">
              {formatGuidelineHeader(guideline)} — {guideline.title}
            </span>
            <p className="text-[11px] leading-snug text-ink-600">
              {guideline.excerpt}
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] italic leading-snug text-ink-400">
        Campos <span className="text-clinical-700">auto</span> foram pré-marcados
        pela IA a partir do caso. Ajuste conforme necessário. Interpretação é
        suporte à decisão — não substitui julgamento clínico.
      </p>
    </div>
  );
}

function sumMaxScore(calc: Calculator): number {
  return calc.fields.reduce((acc, f) => acc + f.points, 0);
}

function RangeDisplay({
  score,
  range,
  maxScore,
}: {
  score: number;
  range: CalculatorRange;
  maxScore: number;
}) {
  const colorClass = colorToClass(range.color);

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border p-3",
        colorClass.border,
        colorClass.bg
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-label font-semibold text-ink-400">
          Pontuação
        </span>
        <span className="font-mono text-[11px] text-ink-400">
          max {maxScore}
        </span>
      </div>
      <div className="flex items-baseline gap-2.5">
        <span
          className={cn(
            "font-mono text-[36px] font-bold tabular-nums leading-none tracking-tight",
            colorClass.text
          )}
        >
          {score}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10.5px] font-bold ring-1 ring-inset",
            colorClass.pill
          )}
        >
          {range.label}
        </span>
      </div>
      <p className={cn("text-[13px] font-medium leading-snug", colorClass.text)}>
        {range.action}
      </p>
    </div>
  );
}

function colorToClass(c: RiskColor) {
  if (c === "danger") {
    return {
      border: "border-danger/30",
      bg: "bg-danger/[0.05]",
      text: "text-danger",
      pill: "bg-danger/15 text-danger ring-danger/25",
    };
  }
  if (c === "warn") {
    return {
      border: "border-warning/30",
      bg: "bg-warning/[0.05]",
      text: "text-warning",
      pill: "bg-warning/15 text-warning ring-warning/25",
    };
  }
  return {
    border: "border-clinical/25",
    bg: "bg-clinical/[0.05]",
    text: "text-clinical-700",
    pill: "bg-clinical/15 text-clinical-700 ring-clinical/25",
  };
}
