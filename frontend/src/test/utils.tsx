import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { createQueryClient } from "@/app/query-client";

/** Renders with a fresh QueryClient: no cache shared between tests, no retry. */
export function renderWithQueryClient(ui: ReactNode) {
  const queryClient = createQueryClient({ retry: false });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
