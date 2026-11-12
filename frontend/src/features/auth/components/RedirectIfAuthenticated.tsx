import { Navigate, Outlet, useLocation } from "react-router";
import { z } from "zod";

import { FullPageStatus } from "@/shared/ui/FullPageStatus";

import { useSession } from "../hooks";

// Internal paths only: "//evil.example" would leave the site.
const redirectStateSchema = z.object({
  from: z
    .string()
    .startsWith("/")
    .refine((path) => !path.startsWith("//")),
});

/** Login and sign-up pages make no sense once logged in. */
export function RedirectIfAuthenticated() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return <FullPageStatus>Chargement…</FullPageStatus>;
  }
  if (session.data?.authenticated) {
    // Back to the page that required logging in, or the dashboard.
    // RequireAuth then sends to the onboarding if it is not finished.
    const from =
      redirectStateSchema.safeParse(location.state).data?.from ?? "/";
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
