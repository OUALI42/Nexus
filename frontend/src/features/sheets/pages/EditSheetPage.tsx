import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";

import { SheetForm } from "../components/SheetForm";
import { useSheet, useUpdateSheet } from "../hooks";

const BACK_LINK = "inline-flex min-h-tap items-center gap-2 self-start";

export function EditSheetPage() {
  const { sheetId } = useParams();
  const id = Number(sheetId);

  if (!Number.isInteger(id) || id <= 0) {
    return <SheetNotFound />;
  }
  return <EditSheetContent sheetId={id} />;
}

function SheetNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Fiche introuvable</h1>
      <p>Cette fiche n'existe pas ou n'est plus disponible.</p>
      <Link to="/casiers" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        Retour à mes casiers
      </Link>
    </div>
  );
}

function EditSheetContent({ sheetId }: { sheetId: number }) {
  const sheet = useSheet(sheetId);
  const updateSheet = useUpdateSheet(sheetId);

  if (isApiError(sheet.error) && sheet.error.status === 404) {
    return <SheetNotFound />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {sheet.data && (
        <Link to={`/casiers/${sheet.data.lockerId}`} className={BACK_LINK}>
          <ArrowLeft aria-hidden="true" className="size-5" />
          Retour au casier
        </Link>
      )}
      <h1 className="text-2xl font-bold">Modifier la fiche</h1>

      {sheet.isPending && <p role="status">Chargement de la fiche…</p>}

      {sheet.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>Impossible de charger cette fiche.</p>
          <Button
            onClick={() => {
              void sheet.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {sheet.data && (
        <SheetForm
          key={sheet.data.id}
          initialValues={{
            title: sheet.data.title,
            content: sheet.data.content,
          }}
          submitLabel="Enregistrer"
          save={(values) => updateSheet.mutateAsync(values)}
        />
      )}
    </div>
  );
}
