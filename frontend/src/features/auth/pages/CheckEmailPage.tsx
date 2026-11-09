import { Link, useLocation } from "react-router";
import { z } from "zod";
import { PageHeader } from "@/shared/ui/PageHeader";
import { ResendVerificationForm } from "../components/ResendVerificationForm";

const navigationStateSchema = z.object({ email: z.string() });

export function CheckEmailPage() {
  const location = useLocation();
  const email = navigationStateSchema.safeParse(location.state).data?.email;

  return (
    <>
      <PageHeader title="Vérifie ta boîte mail" />
      <div className="flex flex-col gap-4">
        <p>
          Nous avons envoyé un lien de confirmation{" "}
          {email ? (
            <>
              à <strong>{email}</strong>
            </>
          ) : (
            "à ton adresse e-mail"
          )}
          . Ouvre-le pour activer ton compte.
        </p>
        <p className="text-fg-muted">
          Le lien est valable 24 heures. Pense à vérifier tes courriers
          indésirables.
        </p>
        <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">Tu n'as rien reçu ?</h2>
          <ResendVerificationForm initialEmail={email} />
        </section>
        <Link
          to="/connexion"
          className="inline-flex min-h-tap items-center self-start"
        >
          Aller à la connexion
        </Link>
      </div>
    </>
  );
}
