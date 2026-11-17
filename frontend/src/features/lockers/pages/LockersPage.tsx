import { Plus } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/shared/ui/Button";

import { LockerCard } from "../components/LockerCard";
import { useLockers } from "../hooks";

const NEW_LOCKER_LINK =
  "inline-flex min-h-tap items-center gap-2 self-start rounded-control px-4 font-semibold";

export function LockersPage() {
  const lockers = useLockers();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Mes casiers</h1>
        {lockers.data && lockers.data.length > 0 && (
          <Link to="/casiers/nouveau" className={NEW_LOCKER_LINK}>
            <Plus aria-hidden="true" className="size-5" />
            Nouveau casier
          </Link>
        )}
      </div>

      {lockers.isPending && <p role="status">Chargement de tes casiers…</p>}

      {lockers.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>Impossible de charger tes casiers.</p>
          <Button
            onClick={() => {
              void lockers.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {lockers.data?.length === 0 && (
        <section className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-6">
          <h2 className="text-lg font-bold">Tu n'as pas encore de casier</h2>
          <p>Crée un casier par matière pour y ranger tes cours.</p>
          <Link to="/casiers/nouveau" className={NEW_LOCKER_LINK}>
            <Plus aria-hidden="true" className="size-5" />
            Créer mon premier casier
          </Link>
        </section>
      )}

      {lockers.data && lockers.data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lockers.data.map((locker) => (
            <li key={locker.id}>
              <LockerCard locker={locker} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
