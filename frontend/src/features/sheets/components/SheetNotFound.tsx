import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function SheetNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Fiche introuvable</h1>
      <p>Cette fiche n'existe pas ou n'est plus disponible.</p>
      <Link
        to="/casiers"
        className="inline-flex min-h-tap items-center gap-2 self-start"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        Retour à mes casiers
      </Link>
    </div>
  );
}
