import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { authKeys } from "@/features/auth/hooks";
import { isApiError } from "@/shared/api";

const MAX_RETRIES = 1;

function handleUnauthenticated(error: unknown) {
  // The session expired server-side: refresh it, the route guards redirect.
  if (isApiError(error) && error.code === "not_authenticated") {
    void queryClient.invalidateQueries({ queryKey: authKeys.session });
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthenticated }),
  mutationCache: new MutationCache({ onError: handleUnauthenticated }),
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
