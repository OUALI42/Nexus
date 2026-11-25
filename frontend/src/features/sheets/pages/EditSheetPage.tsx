import { ArrowLeft, Eye } from "lucide-react";
import { Link, useParams } from "react-router";

import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";

import { SheetForm } from "../components/SheetForm";
import { useSheet, useUpdateSheet } from "../hooks";
import { SheetNotFound } from "../components/SheetNotFound";
import { sheetPaths } from "../paths";

const BACK_LINK = "inline-flex min-h-tap items-center gap-2 self-start";

export function EditSheetPage() {
  const { sheetId } = useParams();
  const id = Number(sheetId);

  if (!Number.isInteger(id) || id <= 0) {
    return <SheetNotFound />;
  }
  return <EditSheetContent sheetId={id} />;
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
        <div className="flex flex-wrap gap-4">
          <Link to={`/casiers/${sheet.data.lockerId}`} className={BACK_LINK}>
            <ArrowLeft aria-hidden="true" className="size-5" />
            Retour au casier
          </Link>
          <Link to={sheetPaths.read(sheet.data.id)} className={BACK_LINK}>
            <Eye aria-hidden="true" className="size-5" />
            Voir la fiche
          </Link>
        </div>
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
