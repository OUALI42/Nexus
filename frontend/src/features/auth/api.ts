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

export function verifyEmail(token: string): Promise<undefined> {
  return api.post("/auth/verify-email/", { token }, z.undefined());
}

export function resendVerification(email: string): Promise<undefined> {
  return api.post("/auth/resend-verification/", { email }, z.undefined());
}

const sessionSchema = z
  .object({
    authenticated: z.boolean(),
    user: z
      .object({
        email: z.string(),
        username: z.string().nullable(),
        track: z.string().nullable(),
        plan: z.object({ code: z.string(), name: z.string() }).nullable(),
        needs_onboarding: z.boolean(),
      })
      .nullable(),
    idle_timeout: z.number(),
    idle_warning: z.number(),
  })
  .transform((session) => ({
    authenticated: session.authenticated,
    user: session.user && {
      email: session.user.email,
      username: session.user.username,
      track: session.user.track,
      plan: session.user.plan,
      needsOnboarding: session.user.needs_onboarding,
    },
    idleTimeout: session.idle_timeout,
    idleWarning: session.idle_warning,
  }));

export type Session = z.output<typeof sessionSchema>;

export function fetchSession(signal?: AbortSignal): Promise<Session> {
  return api.get("/auth/session/", sessionSchema, signal);
}

export function logIn(credentials: {
  email: string;
  password: string;
}): Promise<Session> {
  return api.post("/auth/login/", credentials, sessionSchema);
}

export function logOut(): Promise<undefined> {
  return api.post("/auth/logout/", undefined, z.undefined());
}

export function completeOnboarding(): Promise<undefined> {
  return api.post("/auth/onboarding/complete/", undefined, z.undefined());
}
