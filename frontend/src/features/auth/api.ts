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

const registeredUserSchema = z.object({
  email: z.string(),
  username: z.string(),
  track: z.string(),
});

export type RegisteredUser = z.infer<typeof registeredUserSchema>;

export type RegisterPayload = {
  email: string;
  password: string;
  username: string;
  track: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyVersion: string;
};

export function registerAccount(
  payload: RegisterPayload,
): Promise<RegisteredUser> {
  return api.post(
    "/auth/register/",
    {
      email: payload.email,
      password: payload.password,
      username: payload.username,
      track: payload.track,
      privacy_policy_accepted: payload.privacyPolicyAccepted,
      privacy_policy_version: payload.privacyPolicyVersion,
    },
    registeredUserSchema,
  );
}
