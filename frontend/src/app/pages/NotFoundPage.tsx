import { Link } from "react-router";

import { PageHeader } from "@/shared/ui/PageHeader";

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <Link to="/">Retour au tableau de bord</Link>
    </>
  );
}
