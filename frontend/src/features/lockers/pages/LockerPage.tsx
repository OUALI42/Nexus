import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";

import { useSession } from "@/features/auth/hooks";
import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";

import { CourseList } from "../components/CourseList";
import { CourseUploader } from "../components/CourseUploader";
import { LockerBadge } from "../components/LockerBadge";
import { courseCountLabel } from "../format";
import { useCourses, useLocker } from "../hooks";

const BACK_LINK = "inline-flex min-h-tap items-center gap-2 self-start";

export function LockerPage() {
  const { lockerId } = useParams();
  const id = Number(lockerId);

  if (!Number.isInteger(id) || id <= 0) {
    return <LockerNotFound />;
  }
  return <LockerContent lockerId={id} />;
}

function LockerNotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Casier introuvable</h1>
      <p>Ce casier n'existe pas ou n'est plus disponible.</p>
      <Link to="/casiers" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        Retour à mes casiers
      </Link>
    </div>
  );
}

function LockerContent({ lockerId }: { lockerId: number }) {
  const locker = useLocker(lockerId);
  const courses = useCourses(lockerId);
  const session = useSession();

  if (isApiError(locker.error) && locker.error.status === 404) {
    return <LockerNotFound />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/casiers" className={BACK_LINK}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        Mes casiers
      </Link>

      {locker.isPending && (
        <>
          <h1 className="text-2xl font-bold">Casier</h1>
          <p role="status">Chargement du casier…</p>
        </>
      )}

      {locker.isError && (
        <>
          <h1 className="text-2xl font-bold">Casier</h1>
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>Impossible de charger ce casier.</p>
            <Button
              onClick={() => {
                void locker.refetch();
                void courses.refetch();
              }}
            >
              Réessayer
            </Button>
          </div>
        </>
      )}

      {locker.data && (
        <>
          <header className="flex items-center gap-4">
            <LockerBadge
              color={locker.data.color}
              icon={locker.data.icon}
              size="lg"
            />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold break-words">
                {locker.data.name}
              </h1>
              <p>{courseCountLabel(locker.data.courseCount)}</p>
            </div>
          </header>

          <CourseUploader
            lockerId={lockerId}
            maxFileSizeBytes={
              session.data?.user?.plan?.maxFileSizeBytes ?? null
            }
          />

          <section
            aria-labelledby="courses-title"
            className="flex flex-col gap-3"
          >
            <h2 id="courses-title" className="text-lg font-bold">
              Cours
            </h2>
            {courses.isPending && <p role="status">Chargement des cours…</p>}
            {courses.isError && (
              <p role="alert">Impossible de charger les cours.</p>
            )}
            {courses.data?.length === 0 && (
              <p>
                Aucun cours dans ce casier pour l'instant. Ajoute ton premier
                PDF.
              </p>
            )}
            {courses.data && courses.data.length > 0 && (
              <CourseList courses={courses.data} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
