import { useId, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/shared/lib/cx";

type InputProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode; // element inside the field, on the right
  children?: ReactNode; // content between the field and the error
};

export function Input({
  label,
  hint,
  error,
  trailing,
  children,
  id,
  required,
  className,
  "aria-describedby": extraDescribedBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy =
    [hint ? hintId : null, extraDescribedBy ?? null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-semibold">
        {label}
        {required && (
          <>
            {" "}
            <span className="font-normal text-fg-muted">(obligatoire)</span>
          </>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}

      <div className="relative">
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "min-h-12 w-full rounded-control border-2 border-control bg-surface px-3.5 text-base text-fg",
            "placeholder:text-fg-muted aria-invalid:border-danger",
            trailing ? "pr-14" : null,
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </div>
        )}
      </div>

      {children}

      {error && (
        <p
          id={errorId}
          className="flex items-center gap-1.5 text-sm font-semibold text-danger"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="size-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5v4M8 11v.5" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
