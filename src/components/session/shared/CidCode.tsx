import { describeCid } from "@/data/cidDictionary";
import { cn } from "@/lib/cn";

interface CidCodeProps {
  code: string;
  className?: string;
}

export function CidCode({ code, className }: CidCodeProps) {
  const description = describeCid(code);
  return (
    <span
      title={description ? `${code} · ${description}` : code}
      className={cn(
        "font-mono tabular-nums",
        description && "cursor-help underline decoration-dotted decoration-ink-400/40 underline-offset-[3px]",
        className
      )}
    >
      {code}
    </span>
  );
}
