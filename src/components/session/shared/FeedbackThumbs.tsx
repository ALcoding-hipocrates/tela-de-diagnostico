import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useSessionStore } from "@/store/sessionStore";
import type { FeedbackTarget, FeedbackVote } from "@/types/session";
import { cn } from "@/lib/cn";

interface FeedbackThumbsProps {
  target: FeedbackTarget;
  size?: "sm" | "md";
  /** Se true, mostra discreto (só no hover do container). */
  hidden?: boolean;
  className?: string;
}

/**
 * M10 — Discreto par de 👍/👎 pra feedback do médico em sugestões da IA.
 * Acumulado em localStorage, usado depois pra perfil clínico personalizado.
 */
export function FeedbackThumbs({
  target,
  size = "sm",
  hidden = false,
  className,
}: FeedbackThumbsProps) {
  const feedback = useSessionStore((s) => s.feedback);
  const recordFeedback = useSessionStore((s) => s.recordFeedback);
  const clearFeedback = useSessionStore((s) => s.clearFeedback);

  const current = feedback.find((f) => matchTarget(f.target, target));
  const vote: FeedbackVote | undefined = current?.vote;

  const handle = (v: FeedbackVote) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vote === v) {
      clearFeedback(target);
    } else {
      recordFeedback(target, v);
    }
  };

  const btnSize = size === "md" ? "h-7 w-7" : "h-6 w-6";
  const iconSize = size === "md" ? 13 : 11;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 transition-opacity",
        hidden && !vote && "opacity-0 group-hover:opacity-100",
        className
      )}
    >
      <button
        type="button"
        onClick={handle("up")}
        aria-label="Marcar como útil"
        title="Útil"
        aria-pressed={vote === "up"}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-colors",
          btnSize,
          vote === "up"
            ? "bg-clinical-glow/20 text-clinical-700"
            : "text-ink-400 hover:bg-black/[0.04] hover:text-ink-600"
        )}
      >
        <ThumbsUp size={iconSize} />
      </button>
      <button
        type="button"
        onClick={handle("down")}
        aria-label="Marcar como não útil"
        title="Não útil"
        aria-pressed={vote === "down"}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-colors",
          btnSize,
          vote === "down"
            ? "bg-danger/15 text-danger"
            : "text-ink-400 hover:bg-black/[0.04] hover:text-ink-600"
        )}
      >
        <ThumbsDown size={iconSize} />
      </button>
    </span>
  );
}

function matchTarget(a: FeedbackTarget, b: FeedbackTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "hypothesis" && b.kind === "hypothesis")
    return a.icd10 === b.icd10;
  if (a.kind === "next-question" && b.kind === "next-question")
    return a.questionId === b.questionId;
  if (a.kind === "exam-recommendation" && b.kind === "exam-recommendation")
    return a.recId === b.recId;
  return false;
}
