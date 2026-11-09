import { useState, type FormEvent } from "react";
import { z } from "zod";

import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

import { useResendVerification } from "../hooks";

const emailSchema = z.string().trim().pipe(z.email());

type ResendVerificationFormProps = {
  initialEmail?: string;
};

export function ResendVerificationForm({
  initialEmail = "",
}: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string>();
  const resend = useResendVerification();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError("Saisis une adresse e-mail valide, par exemple nom@exemple.fr.");
      return;
    }
    setError(undefined);
    resend.mutate(result.data);
  }

  if (resend.isSuccess) {
    return (
      <p
        // Replaces the focused button: keeps the keyboard focus on the result.
        ref={(node) => node?.focus()}
        tabIndex={-1}
        className="rounded-control bg-surface-muted p-4 focus:outline-none"
      >
        Si un compte non vérifié correspond à cette adresse, un nouveau lien
        vient d'être envoyé. Il est valable 24 heures.
      </p>
    );
  }

  const serverError = resend.isError
    ? isApiError(resend.error)
      ? resend.error.message
      : "Une erreur inattendue est survenue."
    : undefined;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
        }}
        error={error ?? serverError}
      />
      <Button type="submit" variant="outline" isLoading={resend.isPending}>
        Renvoyer le lien
      </Button>
    </form>
  );
}
