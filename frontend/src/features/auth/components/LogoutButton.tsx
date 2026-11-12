import { LogOut } from "lucide-react";

import { cx } from "@/shared/lib/cx";
import { useToast } from "@/shared/ui/toast/useToast";

import { useLogout } from "../hooks";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const logout = useLogout();
  const toast = useToast();

  return (
    <button
      type="button"
      disabled={logout.isPending}
      aria-busy={logout.isPending || undefined}
      onClick={() => {
        logout.mutate("logout", {
          onError: () => {
            toast.error(
              "La déconnexion a échoué. Vérifie ta connexion et réessaie.",
            );
          },
        });
      }}
      className={cx(
        "flex min-h-tap w-full items-center gap-3 rounded-control px-3.5 font-semibold disabled:opacity-60",
        className,
      )}
    >
      <LogOut aria-hidden="true" className="size-5 shrink-0" />
      Se déconnecter
    </button>
  );
}
