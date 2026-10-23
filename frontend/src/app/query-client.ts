import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "@/shared/api";

const MAX_RETRIES = 1;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Never retry 4xx: a 403 or 404 won't fix itself.
      retry: (failureCount, error) =>
        !(isApiError(error) && error.isClientError) &&
        failureCount < MAX_RETRIES,
    },
  },
});
