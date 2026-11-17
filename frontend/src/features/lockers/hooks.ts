import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createLocker,
  fetchLocker,
  fetchLockerChoices,
  fetchLockers,
} from "./api";

export const lockerKeys = {
  all: ["lockers"] as const,
  list: () => [...lockerKeys.all, "list"] as const,
  detail: (id: number) => [...lockerKeys.all, "detail", id] as const,
  choices: () => [...lockerKeys.all, "choices"] as const,
};

export function useLockers() {
  return useQuery({
    queryKey: lockerKeys.list(),
    queryFn: ({ signal }) => fetchLockers(signal),
  });
}

export function useLocker(id: number) {
  return useQuery({
    queryKey: lockerKeys.detail(id),
    queryFn: ({ signal }) => fetchLocker(id, signal),
  });
}

export function useLockerChoices() {
  return useQuery({
    queryKey: lockerKeys.choices(),
    queryFn: ({ signal }) => fetchLockerChoices(signal),
    // The palette and icon list only change with a deployment.
    staleTime: Infinity,
  });
}

export function useCreateLocker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocker,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: lockerKeys.all }),
  });
}
