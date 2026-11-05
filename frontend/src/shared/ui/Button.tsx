import type { ComponentProps } from "react";

import { cx } from "@/shared/lib/cx";

type ButtonVariant = "primary" | "ai" | "outline" | "danger";
type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-bold " +
  "transition-[filter,transform] duration-150 " +
  "hover:brightness-110 active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:translate-y-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-linear-135 from-brand-from to-brand-to text-on-brand shadow-brand",
  ai: "bg-linear-135 from-brand-to to-ai-strong text-on-brand shadow-brand",
  outline: "border-2 border-primary bg-surface text-primary",
  danger: "bg-danger text-surface",
};

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-12 px-6 text-base", // 48px, as in the mockup
  sm: "min-h-tap px-4 text-sm", // 44px minimum
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {isLoading && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path d="M12 3a9 9 0 1 1-9 9" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}
