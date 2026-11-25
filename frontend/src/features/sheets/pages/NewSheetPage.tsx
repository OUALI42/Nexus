import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { useLocker } from "@/features/lockers/hooks";
import { isApiError } from "@/shared/api";

import { SheetForm } from "../components/SheetForm";
import { useCreateSheet } from "../hooks";
import { sheetPaths } from "../paths";

const BACK_LINK = "inline-flex min-h-tap items-center gap-2 self-start";

export function NewSheetPage() {
  const { lockerId } = useParams();
  const id = Number(lockerId);

  if (!Number.isInteger(id) || id <= 0) {
    return <LockerNotFound />;
  }
  return <NewSheetContent lockerId={id} />;
}

function LockerNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Casier introuvable</h1>
      <Link to="/casiers" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        Retour à mes casiers
      </Link>
    </div>
  );
}

function NewSheetContent({ lockerId }: { lockerId: number }) {
  const locker = useLocker(lockerId);
  const createSheet = useCreateSheet(lockerId);
  const navigate = useNavigate();

  if (isApiError(locker.error) && locker.error.status === 404) {
    return <LockerNotFound />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link to={`/casiers/${lockerId}`} className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        {locker.data ? locker.data.name : "Retour au casier"}
      </Link>
      <h1 className="text-2xl font-bold">Nouvelle fiche</h1>
      <SheetForm
        initialValues={{ title: "", content: "" }}
        submitLabel="Enregistrer la fiche"
        save={async (values) => {
          const sheet = await createSheet.mutateAsync(values);
          // "replace": the Back button must not reopen an empty form.
          void navigate(sheetPaths.edit(sheet.id), { replace: true });
        }}
      />
    </div>
  );
}
