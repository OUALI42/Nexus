import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { getFieldErrors, isApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

import { authKeys, usePrivacyPolicy, useRegister, useTracks } from "../hooks";
import { registerFormSchema, type RegisterFormValues } from "../schemas";
import { PasswordInput } from "./PasswordInput";

type FieldName = keyof RegisterFormValues;
type FormErrors = Partial<Record<FieldName, string>>;

// Visual order: the first field in error receives the focus.
const FIELD_ORDER: FieldName[] = [
  "email",
  "password",
  "username",
  "track",
  "privacyPolicyAccepted",
];

const API_FIELDS: Record<string, FieldName> = {
  email: "email",
  password: "password",
  username: "username",
  track: "track",
  privacy_policy_accepted: "privacyPolicyAccepted",
  privacy_policy_version: "privacyPolicyAccepted",
};

const INITIAL_VALUES: RegisterFormValues = {
  email: "",
  password: "",
  username: "",
  track: "",
  privacyPolicyAccepted: false, // GDPR: never pre-checked
};

function validate(values: RegisterFormValues): FormErrors {
  const result = registerFormSchema.safeParse(values);
  if (result.success) {
    return {};
  }
  const { fieldErrors } = z.flattenError(result.error);
  const errors: FormErrors = {};
  for (const field of FIELD_ORDER) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      errors[field] = message;
    }
  }
  return errors;
}

export function RegisterForm() {
  const formId = useId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tracks = useTracks();
  const privacyPolicy = usePrivacyPolicy();
  const registration = useRegister();

  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const fieldId = (field: FieldName) => `${formId}-${field}`;

  function focusFirstError(fieldErrors: FormErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
    }
  }

  function update<K extends FieldName>(field: K, value: RegisterFormValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (wasSubmitted) {
      // Live re-validation of the edited field only: keeps server errors elsewhere.
      setErrors((current) => ({ ...current, [field]: validate(next)[field] }));
    }
  }

  function handleServerError(error: unknown) {
    const serverErrors = getFieldErrors(error);
    const mapped: FormErrors = {};
    for (const [apiField, message] of Object.entries(serverErrors)) {
      const field = API_FIELDS[apiField];
      if (field) {
        mapped[field] = message;
      }
    }

    if (serverErrors.privacy_policy_version) {
      // The policy changed: the user must read and accept the new version.
      setValues((current) => ({ ...current, privacyPolicyAccepted: false }));
      void queryClient.invalidateQueries({ queryKey: authKeys.privacyPolicy });
    }

    if (Object.keys(mapped).length > 0) {
      setErrors(mapped);
      focusFirstError(mapped);
    } else {
      setFormError(
        isApiError(error)
          ? error.message
          : "Une erreur inattendue est survenue.",
      );
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWasSubmitted(true);
    setFormError(null);

    const result = registerFormSchema.safeParse(values);
    if (!result.success) {
      const clientErrors = validate(values);
      setErrors(clientErrors);
      focusFirstError(clientErrors);
      return;
    }

    if (!privacyPolicy.data) {
      setFormError(
        "La politique de confidentialité n'a pas pu être chargée. Recharge la page.",
      );
      return;
    }

    setErrors({});
    registration.mutate(
      { ...result.data, privacyPolicyVersion: privacyPolicy.data.version },
      {
        onSuccess: (user) => {
          void navigate("/inscription/verification", {
            state: { email: user.email },
          });
        },
        onError: handleServerError,
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && (
        <p
          role="alert"
          className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
        >
          {formError}
        </p>
      )}

      <Input
        id={fieldId("email")}
        label="Adresse e-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={values.email}
        onChange={(event) => {
          update("email", event.target.value);
        }}
        error={errors.email}
      />

      <PasswordInput
        id={fieldId("password")}
        label="Mot de passe"
        hint="10 caractères minimum. Une phrase de passe est plus sûre et plus facile à retenir."
        autoComplete="new-password"
        required
        showStrength
        value={values.password}
        onChange={(event) => {
          update("password", event.target.value);
        }}
        error={errors.password}
      />

      <Input
        id={fieldId("username")}
        label="Nom d'utilisateur"
        hint="Ton pseudo dans Nexus : 3 à 30 caractères."
        autoComplete="nickname"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={values.username}
        onChange={(event) => {
          update("username", event.target.value);
        }}
        error={errors.username}
      />

      <Select
        id={fieldId("track")}
        label="Filière"
        required
        placeholder={
          tracks.isPending ? "Chargement des filières…" : "Choisis ta filière"
        }
        value={values.track}
        onChange={(event) => {
          update("track", event.target.value);
        }}
        error={
          errors.track ??
          (tracks.isError
            ? "Impossible de charger les filières. Recharge la page."
            : undefined)
        }
      >
        {tracks.data?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

      <Checkbox
        id={fieldId("privacyPolicyAccepted")}
        checked={values.privacyPolicyAccepted}
        onChange={(event) => {
          update("privacyPolicyAccepted", event.target.checked);
        }}
        error={errors.privacyPolicyAccepted}
      >
        J'accepte que mes données soient traitées pour faire fonctionner Nexus,
        y compris l'envoi de mes documents à l'IA, selon la{" "}
        <Link to="/confidentialite" target="_blank" rel="noopener">
          politique de confidentialité
          <ExternalLink aria-hidden="true" className="ml-1 inline size-4" />
          <span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
        </Link>
        .
      </Checkbox>

      <Button type="submit" isLoading={registration.isPending}>
        Créer mon compte
      </Button>

      <Link
        to="/connexion"
        className="inline-flex min-h-tap items-center self-start"
      >
        J'ai déjà un compte
      </Link>
    </form>
  );
}
