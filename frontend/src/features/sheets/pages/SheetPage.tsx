import "../sheet-content.css";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { dateLabel } from "@/features/lockers/format";
import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/toast/useToast";

import type { Sheet } from "../api";
import { SheetNotFound } from "../components/SheetNotFound";
import { useDeleteSheet, useSheet } from "../hooks";
import { sheetPaths } from "../paths";
import { safeSheetHtml } from "../safe-html";

const LINK = "inline-flex min-h-tap items-center gap-2 self-start";

export function SheetPage() {
  const { sheetId } = useParams();
  const id = Number(sheetId);

  if (!Number.isInteger(id) || id <= 0) {
    return <SheetNotFound />;
  }
  return <SheetContent sheetId={id} />;
}

function SheetContent({ sheetId }: { sheetId: number }) {
  const sheet = useSheet(sheetId);

  if (isApiError(sheet.error) && sheet.error.status === 404) {
    return <SheetNotFound />;
  }

  if (sheet.data) {
    return <SheetView sheet={sheet.data} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Fiche</h1>
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
    </div>
  );
}

function SheetView({ sheet }: { sheet: Sheet }) {
  const deleteSheet = useDeleteSheet(sheet.id);
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function closeConfirm() {
    setConfirmOpen(false);
    setDeleteError(null);
  }

  function confirmDelete() {
    setDeleteError(null);
    deleteSheet.mutate(undefined, {
      onSuccess: () => {
        toast.success("Fiche supprimée.");
        void navigate(`/casiers/${sheet.lockerId}`, { replace: true });
      },
      onError: (error) => {
        setDeleteError(
          isApiError(error)
            ? error.message
            : "Une erreur inattendue est survenue.",
        );
      },
    });
  }

  return (
    <article className="flex max-w-3xl flex-col gap-6">
      <Link to={`/casiers/${sheet.lockerId}`} className={LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        Retour au casier
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold break-words">{sheet.title}</h1>
        <p>Modifiée le {dateLabel(sheet.updatedAt)}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={sheetPaths.edit(sheet.id)}
            className={`${LINK} px-4 font-semibold`}
          >
            <Pencil aria-hidden="true" className="size-5" />
            Modifier
          </Link>
          <Button
            onClick={() => {
              setConfirmOpen(true);
            }}
          >
            <Trash2 aria-hidden="true" className="size-5" />
            Supprimer
          </Button>
        </div>
      </header>

      {sheet.content ? (
        <div
          className="sheet-content"
          // Sanitized by the server, then again here (defence in depth).
          dangerouslySetInnerHTML={{ __html: safeSheetHtml(sheet.content) }}
        />
      ) : (
        <p>Cette fiche est vide pour l'instant.</p>
      )}

      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        title="Supprimer cette fiche ?"
        description={`« ${sheet.title} » sera définitivement supprimée.`}
        footer={
          <>
            <Button onClick={closeConfirm}>Annuler</Button>
            <Button onClick={confirmDelete} isLoading={deleteSheet.isPending}>
              Supprimer définitivement
            </Button>
          </>
        }
      >
        {deleteError && (
          <p role="alert" className="font-semibold text-danger">
            {deleteError}
          </p>
        )}
      </Modal>
    </article>
  );
}
