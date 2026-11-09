import { useId, type ComponentProps, type ReactNode } from "react";

import { cx } from "@/shared/lib/cx";

import { FieldError } from "./FieldError";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  children: ReactNode; // the label, may contain links
  error?: string;
};

export function Checkbox({
  children,
  error,
  id,
  className,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-tap items-start gap-3">
        <input
          type="checkbox"
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cx(
            "mt-0.5 size-[1.375rem] shrink-0 accent-primary",
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className="leading-snug">
          {children}
        </label>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
