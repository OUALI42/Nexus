import { Navigate, Outlet } from "react-router";

import { FullPageStatus } from "@/shared/ui/FullPageStatus";

import { useSession } from "../hooks";

/** Login and sign-up pages make no sense once logged in. */
export function RedirectIfAuthenticated() {
  const session = useSession();

  if (session.isPending) {
    return <FullPageStatus>Chargement…</FullPageStatus>;
  }
  if (session.data?.authenticated) {
    // RequireAuth then sends to the onboarding if it is not finished.
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
