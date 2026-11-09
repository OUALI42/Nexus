import { z } from "zod";

import { api } from "@/shared/api";

const privacyPolicySchema = z.object({
  version: z.string(),
});

export type PrivacyPolicy = z.infer<typeof privacyPolicySchema>;

export function fetchPrivacyPolicy(
  signal?: AbortSignal,
): Promise<PrivacyPolicy> {
  return api.get("/auth/privacy-policy/", privacyPolicySchema, signal);
}

const trackGroupsSchema = z.array(
  z.object({
    label: z.string(),
    options: z.array(z.object({ value: z.string(), label: z.string() })),
  }),
);

export type TrackGroup = z.infer<typeof trackGroupsSchema>[number];

export function fetchTracks(signal?: AbortSignal): Promise<TrackGroup[]> {
  return api.get("/auth/tracks/", trackGroupsSchema, signal);
}
