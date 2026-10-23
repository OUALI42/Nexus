import { isApiError } from "@/shared/api";

import { useHealth } from "../hooks";

export function HealthStatus() {
  const { data, error, isPending } = useHealth();

  if (isPending) {
    return <p>Connexion à l'API…</p>;
  }

  if (error) {
    return (
      <p role="alert">
        API indisponible :{" "}
        {isApiError(error) ? error.message : "erreur inconnue"}
      </p>
    );
  }

  return <p>API : {data.status}</p>;
}
