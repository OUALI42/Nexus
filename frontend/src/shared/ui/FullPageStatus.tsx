import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type FullPageStatusProps = {
  children: ReactNode;
};

export function FullPageStatus({ children }: FullPageStatusProps) {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-3 p-6 text-fg-muted"
    >
      <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
      <p>{children}</p>
    </div>
  );
}
