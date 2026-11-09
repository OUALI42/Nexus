import { PageHeader } from "@/shared/ui/PageHeader";

import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
  return (
    <>
      <PageHeader title="Créer mon compte" />
      <RegisterForm />
    </>
  );
}
