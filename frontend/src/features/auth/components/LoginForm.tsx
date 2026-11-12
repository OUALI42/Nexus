import { useQueryClient } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { z } from "zod";

import { isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

import { authKeys, useLogin } from "../hooks";
import { PasswordInput } from "./PasswordInput";
import { ResendVerificationForm } from "./ResendVerificationForm";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(
      z.email({
        error: "Saisis une adresse e-mail valide, par exemple nom@exemple.fr.",
      }),
    ),
  // No length rule here: only the server knows if the password is right.
  password: z.string().min(1, { error: "Saisis ton mot de passe." }),
});

type LoginValues = z.input<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof LoginValues, string>>;
type FormError = { code: string; message: string };

export function LoginForm() {
  const formId = useId();
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const queryClient = useQueryClient();
  const login = useLogin();

  const [values, setValues] = useState<LoginValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);

  function update(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      const next: FieldErrors = {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      };
      setErrors(next);
      document.getElementById(next.email ? emailId : passwordId)?.focus();
      return;
    }

    setErrors({});
    login.mutate(result.data, {
      onSuccess: (session) => {
        // The route guards read the session and redirect.
        queryClient.setQueryData(authKeys.session, session);
      },
      onError: (error) => {
        setValues((current) => ({ ...current, password: "" }));
        setFormError(
          isApiError(error)
            ? { code: error.code, message: error.message }
            : {
                code: "unknown",
                message: "Une erreur inattendue est survenue.",
              },
        );
        document.getElementById(passwordId)?.focus();
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {formError && (
          <p
            role="alert"
            className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
          >
            {formError.message}
          </p>
        )}

        <Input
          id={emailId}
          label="Adresse e-mail"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          value={values.email}
          onChange={(event) => {
            update("email", event.target.value);
          }}
          error={errors.email}
        />

        <div className="flex flex-col gap-1">
          <PasswordInput
            id={passwordId}
            label="Mot de passe"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={(event) => {
              update("password", event.target.value);
            }}
            error={errors.password}
          />
          <Link
            to="/mot-de-passe-oublie"
            className="inline-flex min-h-tap items-center self-start"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" isLoading={login.isPending}>
          Se connecter
        </Button>

        <p>
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="inline-flex min-h-tap items-center"
          >
            Créer un compte
          </Link>
        </p>
      </form>

      {formError?.code === "email_not_verified" && (
        <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">
            Renvoyer le lien de confirmation
          </h2>
          <ResendVerificationForm initialEmail={values.email.trim()} />
        </section>
      )}
    </div>
  );
}
