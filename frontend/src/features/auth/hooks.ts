import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchPrivacyPolicy,
  fetchTracks,
  registerAccount,
  resendVerification,
  verifyEmail,
} from "./api";

export const authKeys = {
  privacyPolicy: ["auth", "privacy-policy"] as const,
  tracks: ["auth", "tracks"] as const,
};

export function usePrivacyPolicy() {
  return useQuery({
    queryKey: authKeys.privacyPolicy,
    queryFn: ({ signal }) => fetchPrivacyPolicy(signal),
    staleTime: 5 * 60_000,
  });
}

export function useTracks() {
  return useQuery({
    queryKey: authKeys.tracks,
    queryFn: ({ signal }) => fetchTracks(signal),
    staleTime: Infinity, // the list only changes with a new deployment
  });
}

export function useRegister() {
  return useMutation({ mutationFn: registerAccount });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: verifyEmail });
}

export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification });
}
