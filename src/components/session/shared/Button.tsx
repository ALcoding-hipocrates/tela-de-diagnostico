import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  // Apple-style pill CTA: brand color solid fill, white text, rounded-full, flat.
  primary:
    "bg-clinical text-white hover:bg-clinical-700 active:bg-clinical-700 disabled:bg-ink-400/40",
  // Secondary pill: transparent with brand border, brand text.
  secondary:
    "bg-transparent text-clinical-700 border border-clinical/35 hover:border-clinical hover:bg-clinical/[0.04] active:bg-clinical/[0.08] disabled:text-ink-400 disabled:border-black/10",
  // Ghost: no chrome, neutral text with subtle hover.
  ghost:
    "bg-transparent text-ink-600 hover:bg-black/[0.04] hover:text-ink-900 active:bg-black/[0.06] disabled:text-ink-400/60",
  // Danger pill.
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 disabled:bg-ink-400/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[12px] gap-1.5",
  md: "h-9 px-4 text-[13px] gap-1.5",
  lg: "h-11 px-6 text-[15px] gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    leadingIcon,
    trailingIcon,
    className,
    children,
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
