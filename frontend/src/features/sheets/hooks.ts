import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSheet,
  fetchLockerSheets,
  fetchSheet,
  updateSheet,
  type SheetPayload,
} from "./api";

export const sheetKeys = {
  all: ["sheets"] as const,
  list: (lockerId: number) => [...sheetKeys.all, "list", lockerId] as const,
  detail: (sheetId: number) => [...sheetKeys.all, "detail", sheetId] as const,
};

export function useLockerSheets(lockerId: number) {
  return useQuery({
    queryKey: sheetKeys.list(lockerId),
    queryFn: ({ signal }) => fetchLockerSheets(lockerId, signal),
  });
}

export function useSheet(sheetId: number) {
  return useQuery({
    queryKey: sheetKeys.detail(sheetId),
    queryFn: ({ signal }) => fetchSheet(sheetId, signal),
  });
}

export function useCreateSheet(lockerId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SheetPayload) => createSheet(lockerId, payload),
    onSuccess: (sheet) => {
      // The edit page opens next: no need to fetch what we just received.
      queryClient.setQueryData(sheetKeys.detail(sheet.id), sheet);
      void queryClient.invalidateQueries({
        queryKey: sheetKeys.list(lockerId),
      });
    },
  });
}

export function useUpdateSheet(sheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SheetPayload) => updateSheet(sheetId, payload),
    onSuccess: (sheet) => {
      queryClient.setQueryData(sheetKeys.detail(sheetId), sheet);
      void queryClient.invalidateQueries({
        queryKey: sheetKeys.list(sheet.lockerId),
      });
    },
  });
}
