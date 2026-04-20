import { useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft } from "lucide-react";
import type { ChecklistItem, ChecklistImpact } from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { bayesianDelta } from "@/lib/bayesian";
import { getGuidelineById } from "@/data/guidelines";
import { cn } from "@/lib/cn";

interface ChecklistItemRowProps {
  item: ChecklistItem;
}

export function ChecklistItemRow({ item }: ChecklistItemRowProps) {
  const checkItem = useSessionStore((s) => s.checkItem);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const checked = item.status === "checked";
  const hasResultField = !!item.resultPlaceholder;

  // D7: flash verde quando item é marcado
  const prevChecked = useRef(checked);
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    if (!prevChecked.current && checked) {
      setFlashKey((k) => k + 1);
    }
    prevChecked.current = checked;
  }, [checked]);

  const onCheckboxClick = () => {
    if (checked) return;
    if (hasResultField) {
      setEditing(true);
    } else {
      checkItem(item.id);
    }
  };

  const confirm = () => {
    if (hasResultField && !value.trim()) return;
    checkItem(item.id, value.trim() || undefined);
    setEditing(false);
    setValue("");
  };

  return (
    <li
      key={`chk-${flashKey}`}
      className={cn(
        "flex items-start gap-3 rounded-md px-1 py-2",
        flashKey > 0 && "animate-row-flash"
      )}
    >
      <button
        type="button"
        onClick={onCheckboxClick}
        disabled={checked}
        aria-label={checked ? `${item.label} registrado` : `Marcar ${item.label}`}
        aria-checked={checked}
        role="checkbox"
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-clinical bg-clinical text-white"
            : "border-ink-400/50 bg-surface hover:border-clinical hover:bg-clinical/5",
          !checked && "cursor-pointer"
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-semibold text-ink-900">
            {item.label}
          </span>
          {editing ? (
            <InlineInput
              value={value}
              onChange={setValue}
              onConfirm={confirm}
              onCancel={() => {
                setEditing(false);
                setValue("");
              }}
              placeholder={item.resultPlaceholder}
              unit={item.resultUnit}
            />
          ) : checked && item.result ? (
            <span className="font-mono text-[13px] font-semibold text-clinical-700">
              {item.result}
              {item.resultUnit && (
                <span className="ml-1 text-ink-400">{item.resultUnit}</span>
              )}
            </span>
          ) : null}
        </div>
        <ImpactRow impacts={item.impacts} dimmed={checked} />
      </div>
    </li>
  );
}

interface InlineInputProps {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  placeholder?: string;
  unit?: string;
}

function InlineInput({
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
  unit,
}: InlineInputProps) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        placeholder={placeholder}
        className="w-24 rounded border border-clinical/40 bg-surface px-1.5 py-0.5 text-right font-mono text-[13px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:border-clinical focus:outline-none focus:ring-2 focus:ring-clinical/25"
      />
      {unit && (
        <span className="font-mono text-[12px] text-ink-400">{unit}</span>
      )}
      <button
        type="button"
        onClick={onConfirm}
        disabled={!value.trim()}
        aria-label="Confirmar resultado"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-clinical text-white transition-colors hover:bg-clinical-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CornerDownLeft size={12} />
      </button>
    </div>
  );
}

function ImpactRow({
  impacts,
  dimmed,
}: {
  impacts: ChecklistImpact[];
  dimmed: boolean;
}) {
  const hypotheses = useSessionStore((s) => s.hypotheses);

  return (
    <div className={cn("flex flex-wrap gap-x-2 gap-y-0.5", dimmed && "opacity-60")}>
      {impacts.map((imp, i) => {
        const h = imp.icd10 ? hypotheses.find((x) => x.icd10 === imp.icd10) : undefined;
        const liveDelta = h ? bayesianDelta(h.confidence, imp.lrPositive) : null;
        const sourceLabel = imp.source ? getGuidelineById(imp.source) : null;
        const tooltip = `LR+ ${imp.lrPositive}${sourceLabel ? ` · ${sourceLabel.source} ${sourceLabel.year}` : ""}`;

        return (
          <span
            key={i}
            title={tooltip}
            className="inline-flex items-baseline gap-1 font-mono text-label font-medium text-ink-600"
          >
            <span>{imp.hypothesisLabel}</span>
            {liveDelta !== null ? (
              <span className={liveDelta > 0 ? "text-clinical-700" : liveDelta < 0 ? "text-danger" : "text-ink-400"}>
                {liveDelta > 0 ? "+" : ""}
                {liveDelta}%
              </span>
            ) : (
              <span className="text-ink-400">LR+ {imp.lrPositive}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
