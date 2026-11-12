import { Link } from "react-router";

import { PageHeader } from "@/shared/ui/PageHeader";

export function ForgotPasswordPage() {
  return (
    <>
      <PageHeader title="Mot de passe oublié" />
      <div className="flex flex-col gap-4">
        <p>
          La réinitialisation du mot de passe arrive très bientôt. En attendant,
          contacte le support de Nexus.
        </p>
        <Link
          to="/connexion"
          className="inline-flex min-h-tap items-center self-start"
        >
          Retour à la connexion
        </Link>
      </div>
    </>
  );
}
