import { Check } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { z } from "zod";

import { isApiError } from "@/shared/api";
import { cx } from "@/shared/lib/cx";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

import type { LockerChoices } from "../api";
import { ChoiceRadioGroup } from "../components/ChoiceRadioGroup";
import { LockerBadge } from "../components/LockerBadge";
import { useCreateLocker, useLockerChoices } from "../hooks";
import { LockerIcon } from "../icons";

const lockerSchema = z.object({
  name: z.string().trim().min(1, { error: "Donne un nom à ton casier." }),
  color: z.string().min(1),
  icon: z.string().min(1),
});

type LockerValues = z.input<typeof lockerSchema>;
type Field = keyof LockerValues;
type FieldErrors = Partial<Record<Field, string>>;

function apiFieldError(error: unknown, field: Field): string | undefined {
  if (!isApiError(error)) return undefined;
  const messages = error.details?.[field];
  return Array.isArray(messages) && typeof messages[0] === "string"
    ? messages[0]
    : undefined;
}

export function NewLockerPage() {
  const choices = useLockerChoices();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Nouveau casier</h1>

      {choices.isPending && <p role="status">Chargement…</p>}

      {choices.isError && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>Impossible de charger le formulaire.</p>
          <Button
            onClick={() => {
              void choices.refetch();
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {choices.data && <NewLockerForm choices={choices.data} />}
    </div>
  );
}

function NewLockerForm({ choices }: { choices: LockerChoices }) {
  const formId = useId();
  const nameId = `${formId}-name`;
  const navigate = useNavigate();
  const createLocker = useCreateLocker();

  const [values, setValues] = useState<LockerValues>({
    name: "",
    color: choices.colors[0]?.value ?? "",
    icon: choices.icons[0]?.value ?? "folder",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = lockerSchema.safeParse(values);
    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setErrors({ name: fieldErrors.name?.[0] });
      document.getElementById(nameId)?.focus();
      return;
    }

    setErrors({});
    createLocker.mutate(result.data, {
      onSuccess: () => {
        void navigate("/casiers");
      },
      onError: (error) => {
        const next: FieldErrors = {
          name: apiFieldError(error, "name"),
          color: apiFieldError(error, "color"),
          icon: apiFieldError(error, "icon"),
        };
        if (next.name || next.color || next.icon) {
          setErrors(next);
          if (next.name) document.getElementById(nameId)?.focus();
          return;
        }
        setFormError(
          isApiError(error) ? error.message : "Une erreur inattendue est survenue.",
        );
      },
    });
  }

  const previewName = values.name.trim() || "Mon casier";

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      {formError && (
        <p
          role="alert"
          className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
        >
          {formError}
        </p>
      )}

      <Input
        id={nameId}
        label="Nom du casier"
        required
        autoComplete="off"
        value={values.name}
        onChange={(event) => {
          update("name", event.target.value);
        }}
        error={errors.name}
      />

      <ChoiceRadioGroup
        legend="Couleur"
        name="color"
        options={choices.colors}
        value={values.color}
        onChange={(value) => {
          update("color", value);
        }}
        error={errors.color}
        renderOption={(option, checked) => (
          <span
            className="flex size-11 items-center justify-center rounded-control text-white"
            style={{ backgroundColor: option.value }}
          >
            {checked && <Check aria-hidden="true" className="size-6" />}
          </span>
        )}
      />

      <ChoiceRadioGroup
        legend="Icône"
        name="icon"
        options={choices.icons}
        value={values.icon}
        onChange={(value) => {
          update("icon", value);
        }}
        error={errors.icon}
        renderOption={(option, checked) => {
          return (
            <span
              className={cx(
                "flex size-11 items-center justify-center rounded-control border-2",
                checked ? "border-transparent text-white" : "border-line",
              )}
              style={checked ? { backgroundColor: values.color } : undefined}
              >
              <LockerIcon name={option.value} className="size-6" />
            </span>
          );
        }}
      />

      <section aria-labelledby={`${formId}-preview`} className="flex flex-col gap-2">
        <h2 id={`${formId}-preview`} className="font-semibold">
          Aperçu
        </h2>
        <div
          className="flex items-center gap-4 rounded-card border border-line bg-surface p-4"
          style={{ borderLeftColor: values.color, borderLeftWidth: "6px" }}
        >
          <LockerBadge color={values.color} icon={values.icon} />
          <span className="font-bold">{previewName}</span>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={createLocker.isPending}>
          Créer le casier
        </Button>
        <Link to="/casiers" className="inline-flex min-h-tap items-center px-4">
          Annuler
        </Link>
      </div>
    </form>
  );
}
