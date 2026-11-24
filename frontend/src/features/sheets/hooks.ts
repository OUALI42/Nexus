import { useQuery } from "@tanstack/react-query";

import { fetchLockerSheets } from "./api";

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
