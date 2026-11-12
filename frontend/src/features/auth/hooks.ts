import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  fetchPrivacyPolicy,
  fetchTracks,
  registerAccount,
  resendVerification,
  verifyEmail,
  completeOnboarding,
  fetchSession,
  logIn,
  logOut,
} from "./api";

export type LogoutReason = "logout" | "inactivity";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logOut,
    onSuccess: (_data, reason: LogoutReason = "logout") => {
      // Forget everything cached for this user (shared computers).
      queryClient.clear();
      void navigate("/connexion", { replace: true, state: { reason } });
    },
  });
}

export function useLogin() {
  return useMutation({ mutationFn: logIn });
}

export const authKeys = {
  privacyPolicy: ["auth", "privacy-policy"] as const,
  tracks: ["auth", "tracks"] as const,
  session: ["auth", "session"] as const,
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

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 60_000,
  });
}

export function useCompleteOnboarding() {
  return useMutation({ mutationFn: completeOnboarding });
}
