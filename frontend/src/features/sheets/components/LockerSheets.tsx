import { NotebookPen, Plus } from "lucide-react";
import { Link } from "react-router";

import { dateLabel } from "@/features/lockers/format";
import { Button } from "@/shared/ui/Button";

import { useLockerSheets } from "../hooks";
import { sheetPaths } from "../paths";

const NEW_SHEET_LINK =
  "inline-flex min-h-tap items-center gap-2 rounded-control px-4 font-semibold";

export function LockerSheets({ lockerId }: { lockerId: number }) {
  const sheets = useLockerSheets(lockerId);

  return (
    <section aria-labelledby="sheets-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sheets-title" className="text-lg font-bold">
          Fiches
        </h2>
        <Link to={sheetPaths.create(lockerId)} className={NEW_SHEET_LINK}>
          <Plus aria-hidden="true" className="size-5" />
          Nouvelle fiche
        </Link>
      </div>

      {sheets.isPending && <p role="status">Chargement des fiches…</p>}

      {sheets.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>Impossible de charger les fiches.</p>
          <Button
            onClick={() => {
              void sheets.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {sheets.data?.length === 0 && (
        <p>Aucune fiche dans ce casier pour l'instant.</p>
      )}

      {sheets.data && sheets.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sheets.data.map((sheet) => (
            <li key={sheet.id}>
              <Link
                to={sheetPaths.read(sheet.id)}
                className="flex min-h-tap items-center gap-3 rounded-card border border-line bg-surface p-4 no-underline"
              >
                <NotebookPen aria-hidden="true" className="size-6 shrink-0" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-bold break-words">{sheet.title}</span>{" "}
                  <span>Modifiée le {dateLabel(sheet.updatedAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
