import { Fragment, useMemo } from "react";
import { BookOpen } from "lucide-react";
import { getGuidelineById, formatGuidelineHeader } from "@/data/guidelines";
import { cn } from "@/lib/cn";

interface CitedTextProps {
  text: string;
  className?: string;
  /** If true, show a references list under the text. */
  showReferences?: boolean;
}

const MARKER = /\[\^([a-zA-Z0-9._-]+)\]/g;

interface Segment {
  type: "text" | "cite";
  value: string;
  /** Index in the ORDER the citations appeared (1-based). */
  citationIndex?: number;
}

interface ParsedText {
  segments: Segment[];
  /** Unique citation IDs in order of first appearance. */
  uniqueIds: string[];
}

function parseCitedText(text: string): ParsedText {
  const segments: Segment[] = [];
  const seen = new Map<string, number>(); // id -> citationIndex (1-based)
  const uniqueIds: string[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MARKER.lastIndex = 0;

  while ((match = MARKER.exec(text)) !== null) {
    const [full, id] = match;
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }
    let idx = seen.get(id);
    if (idx === undefined) {
      idx = uniqueIds.length + 1;
      seen.set(id, idx);
      uniqueIds.push(id);
    }
    segments.push({ type: "cite", value: id, citationIndex: idx });
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return { segments, uniqueIds };
}

/**
 * F3 — Renders text with inline `[^guide-id]` markers as clickable superscripts.
 * Each unique citation gets a consecutive index (¹, ², ³...). If `showReferences`
 * is true, lists the full guideline references below.
 */
export function CitedText({
  text,
  className,
  showReferences = true,
}: CitedTextProps) {
  const { segments, uniqueIds } = useMemo(() => parseCitedText(text), [text]);

  if (uniqueIds.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <>
      <span className={cn("whitespace-pre-wrap", className)}>
        {segments.map((s, i) => {
          if (s.type === "text") return <Fragment key={i}>{s.value}</Fragment>;
          return (
            <CitationMark
              key={i}
              id={s.value}
              index={s.citationIndex!}
            />
          );
        })}
      </span>

      {showReferences && (
        <ol className="mt-3 flex flex-col gap-1 border-t border-black/[0.05] pt-2">
          {uniqueIds.map((id, i) => {
            const g = getGuidelineById(id);
            return (
              <li
                key={id}
                className="flex items-start gap-1.5 text-[11px] leading-snug"
              >
                <span
                  aria-hidden
                  className="mt-[2px] shrink-0 font-mono text-[10px] font-semibold tabular-nums text-ink-400"
                >
                  {toSuperscript(i + 1)}
                </span>
                <BookOpen
                  size={10}
                  className="mt-0.5 shrink-0 text-clinical"
                />
                <span>
                  {g ? (
                    <>
                      <span className="font-mono font-semibold text-clinical-700">
                        {formatGuidelineHeader(g)}
                      </span>{" "}
                      <span className="text-ink-900">— {g.title}</span>
                    </>
                  ) : (
                    <span className="font-mono italic text-ink-400">
                      {id}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function CitationMark({ id, index }: { id: string; index: number }) {
  const g = getGuidelineById(id);
  const title = g
    ? `${formatGuidelineHeader(g)} — ${g.title}\n${g.excerpt}`
    : id;

  return (
    <sup
      title={title}
      className="mx-0.5 cursor-help select-none rounded bg-clinical/10 px-1 font-mono text-[9px] font-semibold text-clinical-700 align-super"
    >
      {toSuperscript(index)}
    </sup>
  );
}

const SUP_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

function toSuperscript(n: number): string {
  return String(n)
    .split("")
    .map((d) => SUP_DIGITS[parseInt(d, 10)] ?? d)
    .join("");
}

/** Strip `[^id]` markers, returning the text without citation markup. */
export function stripCitationMarkers(text: string): string {
  return text.replace(MARKER, "").replace(/\s+([,.;:])/g, "$1");
}
