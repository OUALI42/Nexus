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

const sheetSchema = z
  .object({
    id: z.number(),
    locker_id: z.number(),
    title: z.string(),
    content: z.string(),
    source: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((sheet) => ({
    id: sheet.id,
    lockerId: sheet.locker_id,
    title: sheet.title,
    content: sheet.content,
    source: sheet.source,
    createdAt: sheet.created_at,
    updatedAt: sheet.updated_at,
  }));

export type Sheet = z.output<typeof sheetSchema>;

export type SheetPayload = {
  title: string;
  content: string;
};

export function fetchSheet(
  sheetId: number,
  signal?: AbortSignal,
): Promise<Sheet> {
  return api.get(`/sheets/${sheetId}/`, sheetSchema, signal);
}

export function createSheet(
  lockerId: number,
  payload: SheetPayload,
): Promise<Sheet> {
  return api.post(`/lockers/${lockerId}/sheets/`, payload, sheetSchema);
}

export function updateSheet(
  sheetId: number,
  payload: SheetPayload,
): Promise<Sheet> {
  return api.patch(`/sheets/${sheetId}/`, payload, sheetSchema);
}
