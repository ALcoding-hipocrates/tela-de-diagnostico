import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface InfoPopoverProps {
  title: string;
  description: string;
  align?: "left" | "center" | "right";
  placement?: "top" | "bottom";
  className?: string;
}

export function InfoPopover({
  title,
  description,
  align = "center",
  placement = "bottom",
  className,
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const alignClass =
    align === "right"
      ? "right-0"
      : align === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  const placementClass =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`Sobre ${title}`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-black/[0.06] hover:text-ink-900"
      >
        <HelpCircle size={12} />
      </button>
      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute z-30 w-64 rounded-lg border border-black/10 bg-surface p-3 text-left shadow-xl",
            placementClass,
            alignClass
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-label font-semibold text-ink-400">
            {title}
          </h4>
          <p className="mt-1 text-[13px] font-medium leading-snug text-ink-900">
            {description}
          </p>
        </div>
      )}
    </span>
  );
}
