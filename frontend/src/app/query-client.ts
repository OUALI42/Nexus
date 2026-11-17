import {
  MutationCache,
  QueryCache,
  QueryClient,
  type DefaultOptions,
} from "@tanstack/react-query";

import { authKeys } from "@/features/auth/hooks";
import { isApiError } from "@/shared/api";

const MAX_RETRIES = 1;

function handleUnauthenticated(client: QueryClient, error: unknown) {
  // The session expired server-side: refresh it, the route guards redirect.
  if (isApiError(error) && error.code === "not_authenticated") {
    void client.invalidateQueries({ queryKey: authKeys.session });
  }
}

/**
 * Single source of the query client setup, used by the app and by the tests:
 * the tests check the real behaviour, not a copy of it.
 */
export function createQueryClient(
  queryOverrides: DefaultOptions["queries"] = {},
): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        handleUnauthenticated(client, error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        handleUnauthenticated(client, error);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Never retry 4xx: a 403 or 404 won't fix itself.
        retry: (failureCount, error) =>
          !(isApiError(error) && error.isClientError) &&
          failureCount < MAX_RETRIES,
        ...queryOverrides,
      },
    },
  });
  return client;
}

export const queryClient = createQueryClient();
