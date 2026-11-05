import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routes } from "@/app/router";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { ToastProvider } from "@/shared/ui/toast/ToastProvider";

function AppTestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/** Renders the whole app (layout + routes) at the given path. */
export function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(
    <AppTestProviders>
      <RouterProvider router={router} />
    </AppTestProviders>,
  );
}

/** Renders a single component with the app providers. */
export function renderWithAppProviders(ui: ReactNode) {
  return render(<AppTestProviders>{ui}</AppTestProviders>);
}
