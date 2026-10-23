import { z } from "zod";

import { api } from "@/shared/api";

export const healthSchema = z.object({
  status: z.string(),
});

export type Health = z.infer<typeof healthSchema>;

export function fetchHealth(signal?: AbortSignal): Promise<Health> {
  return api.get("/health/", healthSchema, signal);
}
