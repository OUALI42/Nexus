import type { ReactNode } from "react";

type FieldErrorProps = {
  id: string;
  children: ReactNode;
};

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p
      id={id}
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
      {children}
    </p>
  );
}
