import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { authKeys, useCompleteOnboarding, useSession } from "../hooks";
import { HOME_AFTER_LOGIN } from "../config";

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useSession();
  const completion = useCompleteOnboarding();

  function finish() {
    completion.mutate(undefined, {
      onSuccess: () => {
        void queryClient
          .invalidateQueries({ queryKey: authKeys.session })
          .then(() => navigate(HOME_AFTER_LOGIN, { replace: true }));
      },
    });
  }

  return (
    <>
      <PageHeader title="Bienvenue sur Nexus" />
      <div className="flex flex-col gap-6">
        <p>
          {data?.user?.username
            ? `Ravi de te voir, ${data.user.username} ! `
            : ""}
          Ton espace de révision est prêt. Tu pourras y déposer tes cours,
          générer des fiches et des QCM, et suivre ta progression.
        </p>
        {completion.isError && (
          <p role="alert" className="font-semibold text-danger">
            Une erreur est survenue. Réessaie dans un instant.
          </p>
        )}
        <Button isLoading={completion.isPending} onClick={finish}>
          Accéder à mes casiers
        </Button>
      </div>
    </>
  );
}
