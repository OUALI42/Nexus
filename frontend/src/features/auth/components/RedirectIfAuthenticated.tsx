import { Navigate, Outlet, useLocation } from "react-router";
import { z } from "zod";
import { FullPageStatus } from "@/shared/ui/FullPageStatus";
import { useSession } from "../hooks";
import { HOME_AFTER_LOGIN } from "../config";

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
    // Back to the page that required logging in, or "Mes casiers".
    const from =
      redirectStateSchema.safeParse(location.state).data?.from ??
      HOME_AFTER_LOGIN;
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
