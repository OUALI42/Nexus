import { useId, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/shared/lib/cx";
import { FieldError } from "./FieldError";

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

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
