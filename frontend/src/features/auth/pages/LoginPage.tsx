import { PageHeader } from "@/shared/ui/PageHeader";

import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  return (
    <>
      <PageHeader title="Connexion" />
      <LoginForm />
    </>
  );
}
