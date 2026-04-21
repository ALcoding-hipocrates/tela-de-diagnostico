import { useMemo } from "react";
import {
  AlertTriangle,
  FlaskConical,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import type {
  ChecklistItem,
  ExamPriority,
  ExamRecommendation,
} from "@/types/session";
import { useSessionStore } from "@/store/sessionStore";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { FeedbackThumbs } from "../shared/FeedbackThumbs";

const PRIORITY_ORDER: Record<ExamPriority, number> = {
  urgent: 0,
  routine: 1,
  optional: 3,
};
const CHECKLIST_ORDER = 2; // checklist entre routine e optional

export function PendingActionsSection() {
  const checklist = useSessionStore((s) => s.checklist);
  const examRecs = useSessionStore((s) => s.examRecommendations);
  const exams = useSessionStore((s) => s.exams);

  const visible = useMemo(() => {
    const pendingCheck = checklist.filter((i) => i.status === "pending");
    const ordered = new Set(
      exams.map((e) => e.panelId).filter(Boolean) as string[]
    );
    const visibleRecs = examRecs.filter(
      (r) => !r.panelId || !ordered.has(r.panelId)
    );

    type Sortable =
      | { kind: "exam"; data: ExamRecommendation; sort: number }
      | { kind: "check"; data: ChecklistItem; sort: number };
    const items: Sortable[] = [
      ...visibleRecs.map<Sortable>((r) => ({
        kind: "exam",
        data: r,
        sort: PRIORITY_ORDER[r.priority],
      })),
      ...pendingCheck.map<Sortable>((c) => ({
        kind: "check",
        data: c,
        sort: CHECKLIST_ORDER,
      })),
    ];
    return items.sort((a, b) => a.sort - b.sort);
  }, [checklist, examRecs, exams]);

  const urgentCount = visible.filter(
    (i) => i.kind === "exam" && i.data.priority === "urgent"
  ).length;

  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-baseline justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-ultra text-ink-400">
          Próximas ações
        </h3>
        <span className="font-mono text-label font-medium text-ink-400">
          {visible.length === 0
            ? "nenhuma"
            : `${visible.length}${urgentCount > 0 ? ` · ${urgentCount} urgente${urgentCount === 1 ? "" : "s"}` : ""}`}
        </span>
      </header>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 px-3 py-4 text-center text-[13px] italic text-ink-400">
          Nada pendente. Conforme o caso evolui, aferições e sugestões de exames
          aparecem aqui.
        </p>
      ) : (
        <ul className="divide-y divide-black/[0.05] rounded-lg border border-black/[0.06] bg-surface">
          {visible.map((item) =>
            item.kind === "exam" ? (
              <ExamRecItem key={item.data.id} rec={item.data} />
            ) : (
              <div key={item.data.id} className="px-3">
                <ChecklistItemRow item={item.data} />
              </div>
            )
          )}
        </ul>
      )}

      <p className="px-1 pt-0.5 text-[10px] leading-snug text-ink-400">
        Aferições (checkbox) alimentam o motor bayesiano · exames sugeridos
        vão pra aba Exames ao solicitar.
      </p>
    </section>
  );
}

function ExamRecItem({ rec }: { rec: ExamRecommendation }) {
  const accept = useSessionStore((s) => s.acceptRecommendation);
  const dismiss = useSessionStore((s) => s.dismissRecommendation);
  const hypothesis = useSessionStore((s) =>
    rec.linkedIcd10
      ? s.hypotheses.find((h) => h.icd10 === rec.linkedIcd10)
      : undefined
  );
  const guideline = rec.guidelineRef ? getGuidelineById(rec.guidelineRef) : null;
  const isUrgent = rec.priority === "urgent";

  return (
    <li className="group flex items-start gap-2.5 px-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 shrink-0",
          isUrgent ? "text-danger" : "text-ink-600"
        )}
      >
        {isUrgent ? <AlertTriangle size={14} /> : <FlaskConical size={14} />}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-ink-900">
            {rec.panelName}
          </span>
          {isUrgent && (
            <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[9px] font-bold text-danger">
              Urgente
            </span>
          )}
          {rec.priority === "optional" && (
            <span className="rounded-full bg-ink-400/20 px-1.5 py-0.5 text-[9px] font-bold text-ink-600">
              Opcional
            </span>
          )}
        </div>
        <p className="text-[12px] font-medium leading-snug text-ink-600">
          {rec.rationale}
        </p>
        {(hypothesis || guideline) && (
          <div className="flex flex-wrap items-center gap-1">
            {hypothesis && (
              <span className="font-mono text-[10px] font-medium text-ink-400">
                {hypothesis.icd10} · {hypothesis.label}
              </span>
            )}
            {guideline && (
              <span
                title={guideline.excerpt}
                className="inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-600"
              >
                <BookOpen size={8} className="text-clinical" />
                {formatGuidelineHeader(guideline)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <FeedbackThumbs
          target={{ kind: "exam-recommendation", recId: rec.id }}
          size="sm"
          hidden
        />
        <button
          type="button"
          onClick={() => accept(rec.id)}
          title="Solicitar"
          className="flex h-6 items-center gap-1 rounded-full bg-clinical px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-clinical-700"
        >
          <Check size={10} /> Solicitar
        </button>
        <button
          type="button"
          onClick={() => dismiss(rec.id)}
          aria-label="Dispensar"
          title="Dispensar"
          className="flex h-6 w-6 items-center justify-center rounded text-ink-400 hover:bg-surface-raised hover:text-ink-900"
        >
          <X size={11} />
        </button>
      </div>
    </li>
  );
}
