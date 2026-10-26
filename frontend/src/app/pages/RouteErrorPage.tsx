import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function RouteErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : "Une erreur inattendue est survenue.";

  if (import.meta.env.DEV) {
    console.error(error);
  }

  return (
    <section>
      <h1>Oups</h1>
      <p>{message}</p>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  );
}
