import { PageHeader } from "@/shared/ui/PageHeader";
import { LoginForm } from "../components/LoginForm";
import { useLocation } from "react-router";
import { z } from "zod";

const logoutStateSchema = z.object({
  reason: z.enum(["logout", "inactivity"]),
});

const NOTICES = {
  logout: "Tu as été déconnecté.",
  inactivity:
    "Tu as été déconnecté après une période d'inactivité, pour protéger ton compte.",
} as const;

export function LoginPage() {
  const location = useLocation();
  const reason = logoutStateSchema.safeParse(location.state).data?.reason;

  return (
    <>
      <PageHeader title="Connexion" />
      {reason && (
        <p
          role="status"
          className="mb-6 rounded-control bg-surface-muted p-4 font-semibold"
        >
          {NOTICES[reason]}
        </p>
      )}
      <LoginForm />
    </>
  );
}
