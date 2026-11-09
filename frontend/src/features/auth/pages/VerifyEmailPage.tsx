import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";

import { focusPageTitle } from "@/shared/a11y/focus";
import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";

import { ResendVerificationForm } from "../components/ResendVerificationForm";
import { useVerifyEmail } from "../hooks";

const LOGIN_LINK_CLASS = "inline-flex min-h-tap items-center self-start";

function LinkToLogin() {
  return (
    <Link to="/connexion" className={LOGIN_LINK_CLASS}>
      Aller à la connexion
    </Link>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verification = useVerifyEmail();

  // The button disappears: move the focus to the new title, which is announced.
  useEffect(() => {
    if (verification.isSuccess || verification.isError) {
      focusPageTitle();
    }
  }, [verification.isSuccess, verification.isError]);

  if (!token) {
    return (
      <>
        <PageHeader title="Lien incomplet" />
        <div className="flex flex-col gap-6">
          <p>
            Ce lien de vérification est incomplet. Vérifie que tu as copié toute
            l'adresse reçue par e-mail, ou demande un nouveau lien.
          </p>
          <ResendVerificationForm />
        </div>
      </>
    );
  }

  if (verification.isSuccess) {
    return (
      <>
        <PageHeader title="Adresse confirmée" />
        <div className="flex flex-col gap-6">
          <p>Ton compte est activé. Tu peux maintenant te connecter.</p>
          <LinkToLogin />
        </div>
      </>
    );
  }

  const error = verification.error;
  const code = isApiError(error) ? error.code : null;

  if (code === "token_used" && isApiError(error)) {
    return (
      <>
        <PageHeader title="Lien déjà utilisé" />
        <div className="flex flex-col gap-6">
          <p>{error.message}</p>
          <LinkToLogin />
        </div>
      </>
    );
  }

  if (
    (code === "token_expired" || code === "token_invalid") &&
    isApiError(error)
  ) {
    return (
      <>
        <PageHeader
          title={code === "token_expired" ? "Lien expiré" : "Lien invalide"}
        />
        <div className="flex flex-col gap-6">
          <p>{error.message}</p>
          <ResendVerificationForm />
        </div>
      </>
    );
  }

  // Waiting for the click, or an unexpected error (network...): offer to retry.
  return (
    <>
      <PageHeader title="Confirme ton adresse e-mail" />
      <div className="flex flex-col gap-6">
        {verification.isError && (
          <p
            role="alert"
            className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
          >
            {isApiError(error)
              ? error.message
              : "Une erreur inattendue est survenue."}{" "}
            Réessaie dans un instant.
          </p>
        )}
        <p>Clique sur le bouton pour activer ton compte Nexus.</p>
        <Button
          isLoading={verification.isPending}
          onClick={() => {
            verification.mutate(token);
          }}
        >
          Confirmer mon adresse
        </Button>
      </div>
    </>
  );
}
