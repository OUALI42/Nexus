import { Link } from "react-router";

import { PageHeader } from "@/shared/ui/PageHeader";

export function LoginPage() {
  return (
    <>
      <PageHeader title="Connexion" />
      <p className="mb-6 text-fg-muted">
        La connexion arrive avec la prochaine story.
      </p>
      <Link to="/inscription">Créer un compte</Link>
    </>
  );
}
