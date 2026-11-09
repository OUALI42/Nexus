import { Link } from "react-router";

import { PageHeader } from "@/shared/ui/PageHeader";

export function RegisterPage() {
  return (
    <>
      <PageHeader title="Créer mon compte" />
      <Link to="/connexion">J'ai déjà un compte</Link>
    </>
  );
}
