import { z } from "zod";

import { api } from "@/shared/api";

const sheetSummarySchema = z
  .object({
    id: z.number(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((sheet) => ({
    id: sheet.id,
    title: sheet.title,
    createdAt: sheet.created_at,
    updatedAt: sheet.updated_at,
  }));

export type SheetSummary = z.output<typeof sheetSummarySchema>;

export function fetchLockerSheets(
  lockerId: number,
  signal?: AbortSignal,
): Promise<SheetSummary[]> {
  return api.get(
    `/lockers/${lockerId}/sheets/`,
    z.array(sheetSummarySchema),
    signal,
  );
}
