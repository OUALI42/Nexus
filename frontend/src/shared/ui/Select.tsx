import { useId, type ComponentProps } from "react";

import { cx } from "@/shared/lib/cx";

import { FieldError } from "./FieldError";

type SelectProps = ComponentProps<"select"> & {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
};

export function Select({
  label,
  hint,
  error,
  placeholder,
  id,
  required,
  className,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="font-semibold">
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

      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          "min-h-12 w-full rounded-control border-2 border-control bg-surface px-3 text-base text-fg aria-invalid:border-danger",
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
