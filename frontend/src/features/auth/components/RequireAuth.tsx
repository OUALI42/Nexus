import { Navigate, Outlet, useLocation } from "react-router";

import { Button } from "@/shared/ui/Button";
import { FullPageStatus } from "@/shared/ui/FullPageStatus";

import { useSession } from "../hooks";

export const ONBOARDING_PATH = "/bienvenue";

export function RequireAuth() {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return <FullPageStatus>Chargement de ton espace…</FullPageStatus>;
  }

  if (session.isError) {
    // Unknown state (network down): do not send the user to the login page.
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p role="alert" className="font-semibold">
          Impossible de joindre le serveur. Vérifie ta connexion.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            void session.refetch();
          }}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const { authenticated, user } = session.data;
  if (!authenticated || !user) {
    // Remember the requested page to come back to it after logging in.
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const isOnboardingPage = location.pathname === ONBOARDING_PATH;
  if (user.needsOnboarding && !isOnboardingPage) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }
  if (!user.needsOnboarding && isOnboardingPage) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
